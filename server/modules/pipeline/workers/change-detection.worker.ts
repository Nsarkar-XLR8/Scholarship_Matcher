import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { RedisService } from '../../../common/services/redis.service';
import { OpenSearchService } from '../../../common/services/opensearch.service';
import { RABBITMQ_QUEUES } from '../../../common/constants/queues.constant';
import * as crypto from 'crypto';

export interface ChangeDetectionPayload {
  programId: string;
  sourceUrl: string;
  scrapedHtmlContent: string;
}

@Injectable()
export class ChangeDetectionWorker implements OnModuleInit {
  private readonly logger = new Logger(ChangeDetectionWorker.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly openSearch: OpenSearchService
  ) {}

  async onModuleInit() {
    await this.rabbitmq.consumeQueue<ChangeDetectionPayload>(
      RABBITMQ_QUEUES.CHANGE_DETECTION,
      async (payload, eventId) => {
        await this.processTwoStageChangeDetection(payload, eventId);
      }
    );
  }

  async processTwoStageChangeDetection(payload: ChangeDetectionPayload, eventId: string) {
    const program = await this.prisma.program.findUnique({
      where: { id: payload.programId },
      include: {
        university: true,
        campus: { include: { country: true } },
        requirements: { where: { validTo: null } }, // Active requirement version
      },
    });

    if (!program) {
      this.logger.warn(`Program '${payload.programId}' not found during change detection. Skipping.`);
      return;
    }

    // ==========================================
    // STAGE A: CHEAP SHA-256 HASH DIFFING
    // ==========================================
    const newContentHash = crypto.createHash('sha256').update(payload.scrapedHtmlContent).digest('hex');

    // Fetch latest crawl log for university/URL
    const lastCrawl = await this.prisma.crawlLog.findFirst({
      where: { universityId: program.universityId, url: payload.sourceUrl },
      orderBy: { crawledAt: 'desc' },
    });

    const isHashChanged = !lastCrawl || lastCrawl.contentHash !== newContentHash;

    // Record Stage A crawl log
    await this.prisma.crawlLog.create({
      data: {
        universityId: program.universityId,
        url: payload.sourceUrl,
        contentHash: newContentHash,
        httpStatus: 200,
        changeDetected: isHashChanged,
      },
    });

    if (!isHashChanged) {
      this.logger.log(`[STAGE A - HASH UNCHANGED] Source URL '${payload.sourceUrl}' hash matched. Terminating early (0 DB mutations).`);
      return;
    }

    this.logger.log(`[STAGE A - HASH MISMATCH DETECTED] Content hash changed for program '${program.title}'. Triggering Stage B Structured Extraction.`);

    // ==========================================
    // STAGE B: EXTRACT & LEDGER EVENT SOURCING
    // ==========================================
    const extractedData = this.simulateStructuredExtraction(payload.scrapedHtmlContent, program.requirements[0]);
    const activeReq = program.requirements[0];

    // Check if extracted requirements differ from currently active requirement
    const hasRequirementChanged =
      !activeReq ||
      activeReq.minGpa !== extractedData.minGpa ||
      activeReq.minIelts !== extractedData.minIelts ||
      activeReq.minGre !== extractedData.minGre;

    if (!hasRequirementChanged) {
      this.logger.log(`[STAGE B - NO REQUIREMENT DIFF] Content changed but min requirements remain identical.`);
      return;
    }

    this.logger.log(`[STAGE B - REQUIREMENT DIFF CONFIRMED] Updating ProgramRequirement event-sourcing ledger atomically for '${program.title}'`);

    const now = new Date();

    // Execute atomic event-sourcing update via Prisma $transaction
    const newReq = await this.prisma.$transaction(async (tx) => {
      // 1. Close the old requirement version
      if (activeReq) {
        await tx.programRequirement.update({
          where: { id: activeReq.id },
          data: { validTo: now },
        });
      }

      // 2. Insert new versioned requirement row
      const created = await tx.programRequirement.create({
        data: {
          programId: program.id,
          minGpa: extractedData.minGpa,
          minGpaOriginal: extractedData.minGpa,
          gpaScale: 4.0,
          minIelts: extractedData.minIelts,
          minToefl: extractedData.minToefl,
          minGre: extractedData.minGre,
          requiresPapers: extractedData.requiresPapers,
          minPapersCount: extractedData.minPapersCount,
          sourceUrl: payload.sourceUrl,
          confidence: 'SCRAPED_UNVERIFIED',
          validFrom: now,
          validTo: null,
        },
      });

      // 3. Record Audit Log Ledger
      await tx.requirementAuditLog.create({
        data: {
          programId: program.id,
          oldRequirementId: activeReq?.id || null,
          newRequirementId: created.id,
          extractionDiffJson: {
            old: activeReq ? { minGpa: activeReq.minGpa, minIelts: activeReq.minIelts, minGre: activeReq.minGre } : null,
            new: { minGpa: created.minGpa, minIelts: created.minIelts, minGre: created.minGre },
            detectedAt: now.toISOString(),
          },
          performedBy: 'AUTOMATED_STAGE_B_PARSER',
        },
      });

      return created;
    });

    this.logger.log(`[LEDGER UPDATED] Successfully committed atomic ProgramRequirement transaction version '${newReq.id}' for program '${program.id}'`);

    // Synchronize document update to OpenSearch and invalidate caches
    try {
      await this.openSearch.indexProgramDocument({
        programId: program.id,
        title: program.title,
        fieldOfStudy: program.fieldOfStudy,
        degreeLevel: program.degreeLevel,
        universityId: program.university.id,
        universityName: program.university.name,
        countryIsoCode: program.campus?.country?.isoCode || 'GLOBAL',
        countryName: program.campus?.country?.name || 'International',
        minGpa: newReq.minGpa,
        minIelts: newReq.minIelts,
        minGre: newReq.minGre,
        tuitionFeeLocal: program.tuitionFeeLocal,
        currencyCode: program.currencyCode,
      });
      await this.redis.set(`program:${program.id}:outcomes`, null, 1);
    } catch (syncErr) {
      this.logger.warn(`Search/cache sync after change detection had non-fatal warning:`, syncErr.message);
    }
  }

  private simulateStructuredExtraction(html: string, currentReq?: any) {
    // In production, this calls OpenAI/Gemini JSON mode or structured Regex parser
    return {
      minGpa: currentReq ? currentReq.minGpa : 3.2,
      minIelts: currentReq ? currentReq.minIelts : 6.5,
      minToefl: currentReq ? currentReq.minToefl : 90,
      minGre: currentReq ? currentReq.minGre : 315,
      requiresPapers: currentReq ? currentReq.requiresPapers : false,
      minPapersCount: 0,
    };
  }
}

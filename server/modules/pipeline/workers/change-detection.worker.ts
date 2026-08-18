import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
import { PrismaService } from '../../../common/services/prisma.service';
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
    private readonly prisma: PrismaService
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
    // Simulate LLM / regex structured extraction of requirements from HTML content
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

    this.logger.log(`[STAGE B - REQUIREMENT DIFF CONFIRMED] Updating ProgramRequirement event-sourcing ledger for '${program.title}'`);

    const now = new Date();

    // 1. Event Sourcing: Close the old requirement version
    if (activeReq) {
      await this.prisma.programRequirement.update({
        where: { id: activeReq.id },
        data: { validTo: now },
      });
    }

    // 2. Insert new versioned requirement row (validFrom = NOW(), validTo = NULL)
    const newReq = await this.prisma.programRequirement.create({
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
    await this.prisma.requirementAuditLog.create({
      data: {
        programId: program.id,
        oldRequirementId: activeReq?.id || null,
        newRequirementId: newReq.id,
        extractionDiffJson: {
          old: activeReq ? { minGpa: activeReq.minGpa, minIelts: activeReq.minIelts, minGre: activeReq.minGre } : null,
          new: { minGpa: newReq.minGpa, minIelts: newReq.minIelts, minGre: newReq.minGre },
          detectedAt: now.toISOString(),
        },
        performedBy: 'AUTOMATED_STAGE_B_PARSER',
      },
    });

    this.logger.log(`[LEDGER UPDATED] Successfully created new ProgramRequirement version '${newReq.id}' for program '${program.id}'`);
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

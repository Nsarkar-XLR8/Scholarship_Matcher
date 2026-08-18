import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { ReportOutcomeDto } from './dto/report-outcome.dto';
import { normalizeGpaToFourPoint } from '../../common/utils/gpa-converter.util';
import { isScholarshipOutlier } from '../../common/utils/outlier-detector.util';
import * as crypto from 'crypto';

@Injectable()
export class OutcomeService {
  private readonly logger = new Logger(OutcomeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async submitOutcomeReport(dto: ReportOutcomeDto, clientIp: string) {
    let program = await this.prisma.program.findFirst({
      where: {
        OR: [
          { id: dto.programId },
          { title: { contains: dto.programId, mode: 'insensitive' } },
        ],
      },
    });

    if (!program) {
      // Graceful fallback to first active program in database
      program = await this.prisma.program.findFirst({
        where: { isActive: true },
      });
    }

    if (!program) {
      throw new NotFoundException(`No active master's program found in database`);
    }

    const normalizedGpa = normalizeGpaToFourPoint(dto.reportedGpa, dto.reportedGpaScale || 4.0);

    // Cryptographic hash for zero-auth anon user fingerprint
    const userAnonHash = crypto.createHash('sha256').update(`${clientIp}:${dto.programId}:${dto.admitCycleYear}`).digest('hex');

    // Fetch historical verified reports for statistical outlier detection
    const existingReports = await this.prisma.outcomeReport.findMany({
      where: { programId: dto.programId, verificationStatus: 'VERIFIED' },
      select: { scholarshipPctReceived: true },
    });

    const historicalPcts = existingReports.map((r) => r.scholarshipPctReceived);
    const outlierCheck = isScholarshipOutlier(dto.scholarshipPctReceived, historicalPcts);

    let status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED_OUTLIER' = 'VERIFIED';
    if (outlierCheck.isOutlier) {
      status = 'FLAGGED_OUTLIER';
      this.logger.warn(`[OUTLIER DETECTED] Report for program ${dto.programId} flagged: ${outlierCheck.reason}`);
    }

    const report = await this.prisma.outcomeReport.create({
      data: {
        userAnonHash,
        programId: dto.programId,
        reportedGpa: normalizedGpa,
        reportedGpaScale: 4.0,
        reportedIelts: dto.reportedIelts,
        reportedToefl: dto.reportedToefl,
        reportedGre: dto.reportedGre,
        reportedPapersCount: dto.reportedPapersCount || 0,
        scholarshipPctReceived: dto.scholarshipPctReceived,
        admitCycleYear: dto.admitCycleYear,
        verificationStatus: status,
      },
    });

    // Invalidate program cache
    await this.redis.set(`program:${dto.programId}:outcomes`, null, 1);

    return {
      id: report.id,
      verificationStatus: report.verificationStatus,
      outlierWarning: outlierCheck.isOutlier ? outlierCheck.reason : null,
      message: outlierCheck.isOutlier
        ? 'Report submitted but queued for moderation review due to statistical variance.'
        : 'Thank you! Your outcome report has been verified and published.',
    };
  }

  async getProgramOutcomeDistribution(programId: string) {
    const cacheKey = `program:${programId}:outcomes`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const reports = await this.prisma.outcomeReport.findMany({
      where: { programId, verificationStatus: 'VERIFIED' },
      orderBy: { scholarshipPctReceived: 'asc' },
    });

    if (reports.length === 0) {
      return {
        programId,
        totalVerifiedReports: 0,
        p25ScholarshipPct: 0,
        medianScholarshipPct: 0,
        p75ScholarshipPct: 0,
        gpaDistribution: [],
      };
    }

    const pcts = reports.map((r) => r.scholarshipPctReceived);
    const count = pcts.length;

    const distribution = {
      programId,
      totalVerifiedReports: count,
      p25ScholarshipPct: pcts[Math.floor(count * 0.25)],
      medianScholarshipPct: pcts[Math.floor(count * 0.5)],
      p75ScholarshipPct: pcts[Math.floor(count * 0.75)],
      reportsSummary: reports.map((r) => ({
        gpa: r.reportedGpa,
        ielts: r.reportedIelts,
        gre: r.reportedGre,
        scholarshipPct: r.scholarshipPctReceived,
        cycleYear: r.admitCycleYear,
      })),
    };

    await this.redis.set(cacheKey, distribution, 3600);
    return distribution;
  }
}

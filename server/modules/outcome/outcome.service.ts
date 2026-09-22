import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { ReportOutcomeDto } from './dto/report-outcome.dto';
import { OutcomeFilterDto } from './dto/outcome-filter.dto';
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

  /**
   * Submit an anonymous self-reported admission & scholarship outcome
   */
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
    const userAnonHash = crypto
      .createHash('sha256')
      .update(`${clientIp}:${program.id}:${dto.admitCycleYear}`)
      .digest('hex');

    // Fetch historical verified reports for statistical outlier detection
    const existingReports = await this.prisma.outcomeReport.findMany({
      where: { programId: program.id, verificationStatus: 'VERIFIED' },
      select: { scholarshipPctReceived: true },
    });

    const historicalPcts = existingReports.map((r) => r.scholarshipPctReceived);
    const outlierCheck = isScholarshipOutlier(dto.scholarshipPctReceived, historicalPcts);

    let status: 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED_OUTLIER' = 'VERIFIED';
    if (outlierCheck.isOutlier) {
      status = 'FLAGGED_OUTLIER';
      this.logger.warn(`[OUTLIER DETECTED] Report for program ${program.id} flagged: ${outlierCheck.reason}`);
    }

    const report = await this.prisma.outcomeReport.create({
      data: {
        userAnonHash,
        programId: program.id,
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

    // Invalidate Redis caches
    await this.redis.set(`program:${program.id}:outcomes`, null, 1);
    await this.redis.set('outcomes:stats', null, 1);
    await this.redis.set('outcomes:distributions:all', null, 1);

    return {
      id: report.id,
      verificationStatus: report.verificationStatus,
      outlierWarning: outlierCheck.isOutlier ? outlierCheck.reason : null,
      isOutlier: outlierCheck.isOutlier,
      message: outlierCheck.isOutlier
        ? 'Report submitted and queued for moderation review due to statistical variance (IQR/Z-Score).'
        : 'Thank you! Your outcome report has been verified and added to the crowdsourced ledger.',
    };
  }

  /**
   * Returns complete program yield distributions across all institutions with filters
   */
  async getAllProgramDistributions(dto?: OutcomeFilterDto) {
    const cacheKey = `outcomes:distributions:${JSON.stringify(dto || {})}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const programWhere: any = { isActive: true };

    if (dto?.countryIsoCode) {
      programWhere.campus = { country: { isoCode: dto.countryIsoCode.toUpperCase() } };
    }

    if (dto?.fieldOfStudy) {
      programWhere.fieldOfStudy = { contains: dto.fieldOfStudy, mode: 'insensitive' };
    }

    if (dto?.query) {
      const q = dto.query.trim();
      programWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { fieldOfStudy: { contains: q, mode: 'insensitive' } },
        { university: { name: { contains: q, mode: 'insensitive' } } },
        { campus: { country: { name: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const reportWhere: any = { verificationStatus: 'VERIFIED' };
    if (dto?.cycleYear) {
      reportWhere.admitCycleYear = dto.cycleYear;
    }

    // Eagerly load programs with reports
    const programs = await this.prisma.program.findMany({
      where: programWhere,
      include: {
        university: { select: { id: true, name: true, domain: true } },
        campus: { include: { country: true } },
        outcomeReports: {
          where: reportWhere,
          orderBy: { scholarshipPctReceived: 'asc' },
        },
        scholarshipRules: true,
      },
      orderBy: { title: 'asc' },
    });

    const distributions = programs
      .map((p) => {
        const reports = p.outcomeReports;
        const count = reports.length;

        if (count === 0) {
          // If no reports for this program yet, return baseline with 0 stats
          return {
            programId: p.id,
            programTitle: p.title,
            degreeLevel: p.degreeLevel,
            fieldOfStudy: p.fieldOfStudy,
            universityName: p.university.name,
            domain: p.university.domain,
            countryName: p.campus.country.name,
            countryIsoCode: p.campus.country.isoCode,
            tuitionFeeLocal: p.tuitionFeeLocal,
            currencyCode: p.currencyCode,
            officialScholarshipCount: p.scholarshipRules.length,
            stats: {
              totalVerifiedReports: 0,
              p25ScholarshipPct: 0,
              medianScholarshipPct: 0,
              p75ScholarshipPct: 0,
              avgAdmittedGpa: 0,
              minAdmittedGpa: 0,
              maxAdmittedGpa: 0,
              avgAdmittedIelts: null,
              avgAdmittedGre: null,
              mostCommonCycleYear: 2025,
            },
            recentReports: [],
          };
        }

        const pcts = reports.map((r) => r.scholarshipPctReceived);
        const gpas = reports.map((r) => r.reportedGpa);
        const ieltsList = reports.map((r) => r.reportedIelts).filter((x): x is number => x !== null && x !== undefined);
        const greList = reports.map((r) => r.reportedGre).filter((x): x is number => x !== null && x !== undefined);

        const avgGpa = Number((gpas.reduce((a, b) => a + b, 0) / count).toFixed(2));
        const minGpa = Math.min(...gpas);
        const maxGpa = Math.max(...gpas);
        const avgIelts = ieltsList.length > 0 ? Number((ieltsList.reduce((a, b) => a + b, 0) / ieltsList.length).toFixed(1)) : null;
        const avgGre = greList.length > 0 ? Math.round(greList.reduce((a, b) => a + b, 0) / greList.length) : null;

        const cycleYearCounts: Record<number, number> = {};
        for (const r of reports) {
          cycleYearCounts[r.admitCycleYear] = (cycleYearCounts[r.admitCycleYear] || 0) + 1;
        }
        const mostCommonCycleYear = Number(
          Object.keys(cycleYearCounts).reduce((a, b) => (cycleYearCounts[Number(a)] > cycleYearCounts[Number(b)] ? a : b), '2025')
        );

        const p25 = pcts[Math.floor(count * 0.25)] ?? pcts[0];
        const median = pcts[Math.floor(count * 0.5)] ?? pcts[0];
        const p75 = pcts[Math.floor(count * 0.75)] ?? pcts[count - 1];

        return {
          programId: p.id,
          programTitle: p.title,
          degreeLevel: p.degreeLevel,
          fieldOfStudy: p.fieldOfStudy,
          universityName: p.university.name,
          domain: p.university.domain,
          countryName: p.campus.country.name,
          countryIsoCode: p.campus.country.isoCode,
          tuitionFeeLocal: p.tuitionFeeLocal,
          currencyCode: p.currencyCode,
          officialScholarshipCount: p.scholarshipRules.length,
          stats: {
            totalVerifiedReports: count,
            p25ScholarshipPct: p25,
            medianScholarshipPct: median,
            p75ScholarshipPct: p75,
            avgAdmittedGpa: avgGpa,
            minAdmittedGpa: minGpa,
            maxAdmittedGpa: maxGpa,
            avgAdmittedIelts: avgIelts,
            avgAdmittedGre: avgGre,
            mostCommonCycleYear,
          },
          recentReports: reports.slice(-5).map((r) => ({
            gpa: r.reportedGpa,
            ielts: r.reportedIelts,
            gre: r.reportedGre,
            scholarshipPct: r.scholarshipPctReceived,
            cycleYear: r.admitCycleYear,
            createdAt: r.createdAt.toISOString(),
          })),
        };
      })
      .filter((item) => {
        if (dto?.minScholarshipPct !== undefined && dto.minScholarshipPct > 0) {
          return item.stats.medianScholarshipPct >= dto.minScholarshipPct;
        }
        return true;
      });

    const response = {
      total: distributions.length,
      items: distributions,
      generatedAt: new Date().toISOString(),
    };

    await this.redis.set(cacheKey, response, 1800); // 30 min TTL
    return response;
  }

  /**
   * Returns global macro platform yield KPI metrics
   */
  async getGlobalOutcomeStats() {
    const cacheKey = 'outcomes:stats';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const [verifiedCount, flaggedCount, allVerified] = await Promise.all([
      this.prisma.outcomeReport.count({ where: { verificationStatus: 'VERIFIED' } }),
      this.prisma.outcomeReport.count({ where: { verificationStatus: 'FLAGGED_OUTLIER' } }),
      this.prisma.outcomeReport.findMany({
        where: { verificationStatus: 'VERIFIED' },
        include: {
          program: {
            include: {
              campus: { include: { country: true } },
            },
          },
        },
      }),
    ]);

    const totalReports = verifiedCount + flaggedCount;
    const outlierRatePct = totalReports > 0 ? Number(((flaggedCount / totalReports) * 100).toFixed(1)) : 0.0;

    let globalMedianPct = 0;
    if (allVerified.length > 0) {
      const sortedPcts = allVerified.map((r) => r.scholarshipPctReceived).sort((a, b) => a - b);
      globalMedianPct = sortedPcts[Math.floor(sortedPcts.length * 0.5)] || 0;
    }

    // Country average yields
    const countryYieldMap: Record<string, { countryName: string; isoCode: string; totalYield: number; count: number }> = {};
    for (const r of allVerified) {
      const c = r.program.campus.country;
      if (!countryYieldMap[c.isoCode]) {
        countryYieldMap[c.isoCode] = { countryName: c.name, isoCode: c.isoCode, totalYield: 0, count: 0 };
      }
      countryYieldMap[c.isoCode].totalYield += r.scholarshipPctReceived;
      countryYieldMap[c.isoCode].count += 1;
    }

    const topYieldDestinations = Object.values(countryYieldMap)
      .map((c) => ({
        countryName: c.countryName,
        isoCode: c.isoCode,
        averageYieldPct: Math.round(c.totalYield / c.count),
        reportsCount: c.count,
      }))
      .sort((a, b) => b.averageYieldPct - a.averageYieldPct)
      .slice(0, 4);

    const stats = {
      totalVerifiedReports: verifiedCount,
      totalFlaggedOutliers: flaggedCount,
      outlierFilteredRatePct: outlierRatePct,
      globalMedianScholarshipPct: globalMedianPct,
      topYieldDestinations,
      generatedAt: new Date().toISOString(),
    };

    await this.redis.set(cacheKey, stats, 3600); // 1 hour TTL
    return stats;
  }

  /**
   * Returns distribution for a specific program
   */
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
        reportsSummary: [],
      };
    }

    const pcts = reports.map((r) => r.scholarshipPctReceived);
    const count = pcts.length;

    const distribution = {
      programId,
      totalVerifiedReports: count,
      p25ScholarshipPct: pcts[Math.floor(count * 0.25)] ?? pcts[0],
      medianScholarshipPct: pcts[Math.floor(count * 0.5)] ?? pcts[0],
      p75ScholarshipPct: pcts[Math.floor(count * 0.75)] ?? pcts[count - 1],
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

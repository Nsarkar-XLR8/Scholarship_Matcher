import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { MatchRequestDto } from './dto/match-request.dto';
import { normalizeGpaToFourPoint, calculateWorkExpCompensation } from '../../common/utils/gpa-converter.util';
import { getScoreRequirementsBreakdown, TestScoreRequirementsBreakdown, toeflToIelts, duolingoToIelts, pteToIelts } from '../../common/utils/language-test-converter.util';

export interface ApplicationMilestoneSchedule {
  languageTestBy: string;
  documentLegalizationBy: string;
  portalSubmissionWindow: string;
  expectedDecisionDate: string;
  visaAppointmentBy: string;
}

export interface MatchResultItem {
  programId: string;
  programTitle: string;
  fieldOfStudy: string;
  universityName: string;
  domain: string;
  officialWebsiteUrl?: string | null;
  sourceUrl?: string | null;
  officialSourceUrl?: string | null;
  officialSourceProvider?: string | null;
  applicationDeadline?: Date | null;
  intakeSeason?: string | null;
  milestones?: ApplicationMilestoneSchedule;
  campusName: string;
  countryName: string;
  countryIsoCode: string;
  tuitionFeeLocal: number;
  currencyCode: string;
  qualificationStatus: 'QUALIFIED' | 'REACH' | 'SAFETY';
  matchFitScorePct: number;
  requirements: {
    minGpa: number;
    minIelts: number | null;
    minToefl: number | null;
    minDuolingo: number | null;
    minPte: number | null;
    minGre: number | null;
    minGmat: number | null;
    workExpYearsRequired: number;
    requiresPapers: boolean;
    scoreBreakdown: TestScoreRequirementsBreakdown;
  };
  scholarshipOffer: {
    publishedRules: Array<{
      ruleId: string;
      title: string;
      scope: string;
      type: string;
      calculatedPct: number;
      confidence: string;
      description: string | null;
      sourceUrl: string;
      officialSourceUrl: string | null;
      officialSourceProvider: string | null;
    }>;
    crowdsourcedDistribution: {
      reportCount: number;
      p25ScholarshipPct: number;
      medianScholarshipPct: number;
      p75ScholarshipPct: number;
    } | null;
  };
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async evaluateStudentProfile(dto: MatchRequestDto): Promise<{
    normalizedGpa4Scale: number;
    effectiveGpa4Scale: number;
    workExperienceCompensation: {
      originalNormalizedGpa: number;
      effectiveGpa: number;
      gpaBoost: number;
      yearsExp: number;
      relevance: 'DIRECT' | 'ADJACENT' | 'GENERAL';
    };
    matches: MatchResultItem[];
  }> {
    const normalizedGpa = normalizeGpaToFourPoint(dto.gpa, dto.gpaScale || 4.0);

    // Calculate holistic work experience compensation for working professionals
    const workExpComp = calculateWorkExpCompensation(
      normalizedGpa,
      dto.workExpYears || 0,
      dto.workExpRelevance || 'DIRECT'
    );
    const effectiveGpa = workExpComp.effectiveGpa;

    // Standardize student's English proficiency score to equivalent IELTS band
    let effectiveStudentIelts = dto.ielts || null;
    if (!effectiveStudentIelts && dto.toefl) {
      effectiveStudentIelts = toeflToIelts(dto.toefl);
    }

    // 1. Fetch candidate programs matching field & active requirement versioning
    const programs = await this.prisma.program.findMany({
      where: {
        isActive: true,
        ...(dto.targetField && dto.targetField.trim().length > 0 && dto.targetField.toUpperCase() !== 'ALL'
          ? { fieldOfStudy: { contains: dto.targetField, mode: 'insensitive' } }
          : {}),
        ...(dto.preferredCountryIsoCodes?.length
          ? { campus: { country: { isoCode: { in: dto.preferredCountryIsoCodes.map((c) => c.toUpperCase()) } } } }
          : {}),
      },
      include: {
        university: {
          include: { primaryCountry: true },
        },
        campus: {
          include: { country: true },
        },
        requirements: {
          where: { validTo: null }, // Active requirement version
        },
        scholarshipRules: true,
        outcomeReports: {
          where: { verificationStatus: 'VERIFIED' },
        },
      },
    });

    // Batch pre-fetch all multi-scoped scholarship rules (COUNTRY, UNIVERSITY, GLOBAL) in a single step to eliminate N+1 queries
    const uniqueCountryIds = Array.from(new Set(programs.map((p) => p.campus.countryId).filter(Boolean)));
    const uniqueUniversityIds = Array.from(new Set(programs.map((p) => p.universityId).filter(Boolean)));

    const [countryScholarships, universityScholarships, globalScholarships] = await Promise.all([
      uniqueCountryIds.length > 0
        ? this.prisma.scholarshipRule.findMany({
            where: {
              countryId: { in: uniqueCountryIds },
              scope: 'COUNTRY',
            },
          })
        : [],
      uniqueUniversityIds.length > 0
        ? this.prisma.scholarshipRule.findMany({
            where: {
              universityId: { in: uniqueUniversityIds },
              scope: 'UNIVERSITY',
            },
          })
        : [],
      this.prisma.scholarshipRule.findMany({
        where: {
          scope: 'GLOBAL',
        },
      }),
    ]);

    const countryRulesMap = new Map<string, typeof countryScholarships>();
    for (const rule of countryScholarships) {
      if (rule.countryId) {
        const list = countryRulesMap.get(rule.countryId) || [];
        list.push(rule);
        countryRulesMap.set(rule.countryId, list);
      }
    }

    const universityRulesMap = new Map<string, typeof universityScholarships>();
    for (const rule of universityScholarships) {
      if (rule.universityId) {
        const list = universityRulesMap.get(rule.universityId) || [];
        list.push(rule);
        universityRulesMap.set(rule.universityId, list);
      }
    }

    const matches: MatchResultItem[] = [];

    for (const program of programs) {
      const activeReq = program.requirements[0];
      if (!activeReq) continue;

      // 2. Minimum requirement evaluation using effective GPA (with work experience boost)
      const reqMinGpa = activeReq.minGpa;
      const gpaDiff = effectiveGpa - reqMinGpa;

      const meetsGpa = gpaDiff >= -0.2; // Allow tolerance for REACH status

      // Language score cross-evaluation (IELTS, TOEFL, Duolingo, PTE)
      let meetsLanguage = true;
      if (activeReq.minIelts && effectiveStudentIelts) {
        meetsLanguage = effectiveStudentIelts >= activeReq.minIelts;
      } else if (activeReq.minToefl && dto.toefl) {
        meetsLanguage = dto.toefl >= activeReq.minToefl;
      }

      const meetsGre = !activeReq.minGre || !dto.gre || dto.gre >= activeReq.minGre;
      const meetsPapers = !activeReq.requiresPapers || (dto.papersCount || 0) >= activeReq.minPapersCount;

      if (!meetsGpa || !meetsLanguage) {
        continue; // Exclude severely unqualified programs
      }

      // Qualification classification
      let qualificationStatus: 'QUALIFIED' | 'REACH' | 'SAFETY' = 'QUALIFIED';
      if (gpaDiff >= 0.4) {
        qualificationStatus = 'SAFETY';
      } else if (gpaDiff < 0.0) {
        qualificationStatus = 'REACH';
      }

      // Match fit score calculation (0-100%)
      let fitScore = 70; // Baseline fit score
      fitScore += Math.min(20, Math.max(-20, Math.round(gpaDiff * 25)));
      if (dto.papersCount && dto.papersCount > 0) fitScore += Math.min(10, dto.papersCount * 5);
      if (dto.workExpYears && dto.workExpYears > 0) fitScore += Math.min(8, dto.workExpYears * 2);
      if (program.university.rankingQs && program.university.rankingQs <= 50) fitScore += 5;
      fitScore = Math.min(99, Math.max(40, fitScore));

      // 3. Multi-Scoped Scholarship Scope Resolution from Batch Maps
      const cRules = countryRulesMap.get(program.campus.countryId) || [];
      const uRules = universityRulesMap.get(program.universityId) || [];

      const allApplicableRules = [
        ...program.scholarshipRules,
        ...uRules,
        ...cRules,
        ...globalScholarships,
      ];

      const publishedRulesFormatted = allApplicableRules.map((rule) => {
        let calculatedPct = rule.fundingPctMin;

        // Formula tier evaluation
        if (rule.type === 'TIERED_FORMULA' && rule.tierCriteriaJson && Array.isArray(rule.tierCriteriaJson)) {
          const tiers = (rule.tierCriteriaJson as any[]).sort((a, b) => b.minGpa - a.minGpa);
          for (const tier of tiers) {
            if (effectiveGpa >= tier.minGpa) {
              calculatedPct = tier.fundingPct;
              break;
            }
          }
        }

        const rAny = rule as any;
        return {
          ruleId: rule.id,
          title: rule.title,
          scope: rule.scope,
          type: rule.type,
          calculatedPct,
          confidence: rule.confidence,
          description: rule.description,
          sourceUrl: rule.sourceUrl,
          officialSourceUrl: rAny.officialSourceUrl || rule.sourceUrl,
          officialSourceProvider: rAny.officialSourceProvider || 'OFFICIAL_GOVERNMENT_PORTAL',
        };
      });

      // 4. Crowdsourced outcomes distribution calculation
      let crowdsourcedDistribution = null;
      if (program.outcomeReports && program.outcomeReports.length > 0) {
        const pcts = program.outcomeReports.map((r) => r.scholarshipPctReceived).sort((a, b) => a - b);
        const count = pcts.length;
        crowdsourcedDistribution = {
          reportCount: count,
          p25ScholarshipPct: pcts[Math.floor(count * 0.25)],
          medianScholarshipPct: pcts[Math.floor(count * 0.5)],
          p75ScholarshipPct: pcts[Math.floor(count * 0.75)],
        };
      }

      const reqAny = activeReq as any;
      // Generate human-readable complete score requirements breakdown
      const scoreBreakdown = getScoreRequirementsBreakdown({
        minGpa: activeReq.minGpa,
        minGpaOriginal: activeReq.minGpaOriginal,
        gpaScaleName: reqAny.gpaScaleName,
        minIelts: activeReq.minIelts,
        minToefl: activeReq.minToefl,
        minDuolingo: reqAny.minDuolingo,
        minPte: reqAny.minPte,
        minGre: activeReq.minGre,
        minGmat: reqAny.minGmat,
        workExpYearsRequired: reqAny.workExpYearsRequired,
        minPapersCount: activeReq.minPapersCount,
      });

      const progAny = program as any;
      const officialWebsiteUrl = progAny.officialSourceUrl
        || (program.university.domain ? `https://${program.university.domain.replace(/^https?:\/\//i, '')}` : null);

      // Generate dynamic milestone schedule based on application deadline or default intake window
      const baseDeadlineDate = progAny.applicationDeadline
        ? new Date(progAny.applicationDeadline)
        : new Date(Date.now() + 180 * 86400000);

      const milestones: ApplicationMilestoneSchedule = {
        languageTestBy: new Date(baseDeadlineDate.getTime() - 90 * 86400000).toISOString().split('T')[0],
        documentLegalizationBy: new Date(baseDeadlineDate.getTime() - 60 * 86400000).toISOString().split('T')[0],
        portalSubmissionWindow: `${new Date(baseDeadlineDate.getTime() - 45 * 86400000).toISOString().split('T')[0]} to ${baseDeadlineDate.toISOString().split('T')[0]}`,
        expectedDecisionDate: new Date(baseDeadlineDate.getTime() + 45 * 86400000).toISOString().split('T')[0],
        visaAppointmentBy: new Date(baseDeadlineDate.getTime() + 75 * 86400000).toISOString().split('T')[0],
      };

      matches.push({
        programId: program.id,
        programTitle: program.title,
        fieldOfStudy: program.fieldOfStudy,
        universityName: program.university.name,
        domain: program.university.domain,
        officialWebsiteUrl,
        sourceUrl: program.sourceUrl,
        officialSourceUrl: progAny.officialSourceUrl || officialWebsiteUrl,
        officialSourceProvider: progAny.officialSourceProvider || 'OFFICIAL_UNIVERSITY_PORTAL',
        applicationDeadline: progAny.applicationDeadline,
        intakeSeason: progAny.intakeSeason,
        milestones,
        campusName: program.campus.name,
        countryName: program.campus.country.name,
        countryIsoCode: program.campus.country.isoCode,
        tuitionFeeLocal: program.tuitionFeeLocal,
        currencyCode: program.currencyCode,
        qualificationStatus,
        matchFitScorePct: fitScore,
        requirements: {
          minGpa: activeReq.minGpa,
          minIelts: activeReq.minIelts,
          minToefl: activeReq.minToefl,
          minDuolingo: reqAny.minDuolingo || null,
          minPte: reqAny.minPte || null,
          minGre: activeReq.minGre,
          minGmat: reqAny.minGmat || null,
          workExpYearsRequired: reqAny.workExpYearsRequired || 0,
          requiresPapers: activeReq.requiresPapers,
          scoreBreakdown,
        },
        scholarshipOffer: {
          publishedRules: publishedRulesFormatted,
          crowdsourcedDistribution,
        },
      });
    }

    // Sort by match fit score descending
    matches.sort((a, b) => b.matchFitScorePct - a.matchFitScorePct);

    return {
      normalizedGpa4Scale: normalizedGpa,
      effectiveGpa4Scale: effectiveGpa,
      workExperienceCompensation: workExpComp,
      matches,
    };
  }
}


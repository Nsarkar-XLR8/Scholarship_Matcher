import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { OpenSearchService } from '../../common/services/opensearch.service';
import { SearchRequestDto } from './dto/search-request.dto';
import { getScoreRequirementsBreakdown } from '../../common/utils/language-test-converter.util';

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly openSearch: OpenSearchService
  ) {}

  async onModuleInit() {
    await this.syncAllProgramsToOpenSearch();
  }

  async syncAllProgramsToOpenSearch() {
    const lockKey = 'lock:opensearch_init_sync';
    const isLocked = await this.redis.get<string>(lockKey);
    if (isLocked) {
      this.logger.log('OpenSearch initial sync already in progress or recently completed by another replica. Skipping.');
      return;
    }

    // Acquire lock for 5 minutes (300 seconds)
    await this.redis.set(lockKey, 'LOCKED', 300);

    try {
      const programs = await this.prisma.program.findMany({
        where: { isActive: true },
        include: {
          university: { select: { id: true, name: true, domain: true } },
          campus: { include: { country: true } },
          requirements: { where: { validTo: null } },
          scholarshipRules: true,
        },
      });

      const docs = programs.map((p) => {
        const pAny = p as any;
        const req = p.requirements[0];
        const reqAny = req as any;
        const scoreBreakdown = req ? getScoreRequirementsBreakdown({
          minGpa: req.minGpa,
          minGpaOriginal: req.minGpaOriginal,
          gpaScaleName: reqAny?.gpaScaleName,
          minIelts: req.minIelts,
          minToefl: req.minToefl,
          minDuolingo: reqAny?.minDuolingo,
          minPte: reqAny?.minPte,
          minGre: req.minGre,
          minGmat: reqAny?.minGmat,
          workExpYearsRequired: reqAny?.workExpYearsRequired,
          minPapersCount: req.minPapersCount,
        }) : null;

        const officialWebsiteUrl = pAny.officialSourceUrl || (p.university.domain ? `https://${p.university.domain.replace(/^https?:\/\//i, '')}` : null);

        return {
          programId: p.id,
          title: p.title,
          fieldOfStudy: p.fieldOfStudy,
          degreeLevel: p.degreeLevel,
          universityId: p.university.id,
          universityName: p.university.name,
          domain: p.university.domain,
          officialWebsiteUrl,
          sourceUrl: p.sourceUrl,
          officialSourceUrl: pAny.officialSourceUrl || officialWebsiteUrl,
          officialSourceProvider: pAny.officialSourceProvider || 'OFFICIAL_UNIVERSITY_PORTAL',
          applicationDeadline: pAny.applicationDeadline,
          intakeSeason: pAny.intakeSeason,
          countryIsoCode: p.campus.country.isoCode,
          countryName: p.campus.country.name,
          minGpa: req?.minGpa || 0.0,
          minIelts: req?.minIelts || null,
          minToefl: req?.minToefl || null,
          minDuolingo: reqAny?.minDuolingo || null,
          minPte: reqAny?.minPte || null,
          minGre: req?.minGre || null,
          minGmat: reqAny?.minGmat || null,
          workExpYearsRequired: reqAny?.workExpYearsRequired || 0,
          scoreBreakdownSummary: scoreBreakdown?.englishProficiency.summaryText || null,
          tuitionFeeLocal: p.tuitionFeeLocal,
          currencyCode: p.currencyCode,
          scholarshipRulesCount: p.scholarshipRules.length,
        };
      });

      await this.openSearch.bulkIndexProgramDocuments(docs);
    } catch (err) {
      this.logger.warn('Failed to auto-sync programs to OpenSearch:', err.message);
    }
  }

  async searchPrograms(dto: SearchRequestDto) {
    const cacheKey = `search:${JSON.stringify(dto)}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    // 1. Attempt high-speed OpenSearch faceted search
    const openSearchResult = await this.openSearch.searchPrograms(dto.query, {
      countryIsoCode: dto.countryIsoCode,
      fieldOfStudy: dto.fieldOfStudy,
      maxGpaRequirement: dto.maxGpaRequirement,
    });

    if (openSearchResult && openSearchResult.length > 0) {
      const response = {
        source: 'OPENSEARCH',
        total: openSearchResult.length,
        items: openSearchResult,
      };
      await this.redis.set(cacheKey, response, 1800); // 30 min cache TTL
      return response;
    }

    // 2. High-Precision PostgreSQL Relational Query Engine
    const where: any = { isActive: true };

    if (dto.query) {
      const queryTrimmed = dto.query.trim();
      const tokens = queryTrimmed.split(/\s+/).filter(Boolean);

      if (tokens.length === 1) {
        where.OR = [
          { title: { contains: queryTrimmed, mode: 'insensitive' } },
          { fieldOfStudy: { contains: queryTrimmed, mode: 'insensitive' } },
          { university: { name: { contains: queryTrimmed, mode: 'insensitive' } } },
          { campus: { country: { name: { contains: queryTrimmed, mode: 'insensitive' } } } },
          { campus: { country: { isoCode: { equals: queryTrimmed.toUpperCase() } } } },
        ];
      } else {
        // Multi-token AND search across fields
        where.AND = tokens.map((token) => ({
          OR: [
            { title: { contains: token, mode: 'insensitive' } },
            { fieldOfStudy: { contains: token, mode: 'insensitive' } },
            { university: { name: { contains: token, mode: 'insensitive' } } },
            { campus: { country: { name: { contains: token, mode: 'insensitive' } } } },
            { campus: { country: { isoCode: { equals: token.toUpperCase() } } } },
          ],
        }));
      }
    }

    if (dto.countryIsoCode) {
      where.campus = { country: { isoCode: dto.countryIsoCode.toUpperCase() } };
    }

    if (dto.fieldOfStudy) {
      where.fieldOfStudy = { contains: dto.fieldOfStudy, mode: 'insensitive' };
    }

    if (dto.degreeLevel) {
      where.degreeLevel = dto.degreeLevel;
    }

    const requirementConditions: any = { validTo: null };
    let hasReqFilter = false;

    if (dto.maxGpaRequirement) {
      requirementConditions.minGpa = { lte: dto.maxGpaRequirement };
      hasReqFilter = true;
    }

    if (dto.maxIeltsRequirement) {
      requirementConditions.OR = [
        { minIelts: null },
        { minIelts: { lte: dto.maxIeltsRequirement } },
      ];
      hasReqFilter = true;
    }

    if (hasReqFilter) {
      where.requirements = {
        some: requirementConditions,
      };
    }

    if (dto.hasVerifiedScholarshipOnly) {
      where.scholarshipRules = {
        some: {},
      };
    }

    // Dynamic Ordering
    let orderBy: any = { title: 'asc' };
    if (dto.sortBy === 'tuition_asc') {
      orderBy = { tuitionFeeLocal: 'asc' };
    } else if (dto.sortBy === 'tuition_desc') {
      orderBy = { tuitionFeeLocal: 'desc' };
    } else if (dto.sortBy === 'title_asc') {
      orderBy = { title: 'asc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        take: dto.limit || 50,
        skip: dto.offset || 0,
        include: {
          university: { select: { id: true, name: true, domain: true, rankingQs: true } },
          campus: { include: { country: true } },
          requirements: { where: { validTo: null } },
          scholarshipRules: true,
        },
        orderBy,
      }),
      this.prisma.program.count({ where }),
    ]);

    const response = {
      source: 'POSTGRESQL_FALLBACK',
      total,
      limit: dto.limit,
      offset: dto.offset,
      items: items.map((p) => {
        const pAny = p as any;
        const req = p.requirements[0];
        const reqAny = req as any;
        const scoreBreakdown = req ? getScoreRequirementsBreakdown({
          minGpa: req.minGpa,
          minGpaOriginal: req.minGpaOriginal,
          gpaScaleName: reqAny?.gpaScaleName,
          minIelts: req.minIelts,
          minToefl: req.minToefl,
          minDuolingo: reqAny?.minDuolingo,
          minPte: reqAny?.minPte,
          minGre: req.minGre,
          minGmat: reqAny?.minGmat,
          workExpYearsRequired: reqAny?.workExpYearsRequired,
          minPapersCount: req.minPapersCount,
        }) : null;

        const officialWebsiteUrl = pAny.officialSourceUrl || (p.university.domain ? `https://${p.university.domain.replace(/^https?:\/\//i, '')}` : null);

        return {
          programId: p.id,
          id: p.id,
          title: p.title,
          fieldOfStudy: p.fieldOfStudy,
          degreeLevel: p.degreeLevel,
          durationMonths: p.durationMonths,
          language: p.language,
          universityId: p.university.id,
          universityName: p.university.name,
          rankingQs: p.university.rankingQs,
          countryIsoCode: p.campus.country.isoCode,
          countryName: p.campus.country.name,
          campusName: p.campus.name,
          campusCity: p.campus.city,
          latitude: p.campus.latitude || 0.0,
          longitude: p.campus.longitude || 0.0,
          minGpa: req?.minGpa || 0.0,
          minIelts: req?.minIelts || null,
          minToefl: req?.minToefl || null,
          minDuolingo: reqAny?.minDuolingo || null,
          minPte: reqAny?.minPte || null,
          minGre: req?.minGre || null,
          minGmat: reqAny?.minGmat || null,
          workExpYearsRequired: reqAny?.workExpYearsRequired || 0,
          requirements: {
            minGpa: req?.minGpa || 0.0,
            minIelts: req?.minIelts || null,
            minToefl: req?.minToefl || null,
            minDuolingo: reqAny?.minDuolingo || null,
            minPte: reqAny?.minPte || null,
            minGre: req?.minGre || null,
            workExpYearsRequired: reqAny?.workExpYearsRequired || 0,
            requiresPapers: req?.requiresPapers || false,
            minMathEcts: reqAny?.minMathEcts || 0.0,
            minCsEcts: reqAny?.minCsEcts || 0.0,
            minTheoreticalEcts: reqAny?.minTheoreticalEcts || 0.0,
            acceptsMoiEnglishWaiver: reqAny?.acceptsMoiEnglishWaiver || false,
          },
          documentChecklist: {
            sopMaxWords: pAny.sopMaxWords || 1000,
            lorAcademicCount: pAny.lorAcademicCount || 2,
            lorProfessionalCount: pAny.lorProfessionalCount || 0,
            cvFormatRequired: pAny.cvFormatRequired || 'STANDARD',
            portfolioRequired: pAny.portfolioRequired || false,
          },
          scoreBreakdown,
          tuitionFeeLocal: p.tuitionFeeLocal,
          currencyCode: p.currencyCode,
          domain: p.university.domain,
          officialWebsiteUrl,
          sourceUrl: p.sourceUrl,
          officialSourceUrl: pAny.officialSourceUrl || officialWebsiteUrl,
          officialSourceProvider: pAny.officialSourceProvider || 'OFFICIAL_UNIVERSITY_PORTAL',
          applicationDeadline: pAny.applicationDeadline,
          intakeSeason: pAny.intakeSeason,
          scholarshipRulesCount: p.scholarshipRules.length,
          scholarshipRules: p.scholarshipRules.map((r) => ({
            id: r.id,
            title: r.title,
            scope: r.scope,
            type: r.type,
            coveragePct: r.fundingPctMax,
            fundingPctMax: r.fundingPctMax,
            fundingPctMin: r.fundingPctMin,
            officialSourceUrl: (r as any).officialSourceUrl || null,
          })),
        };
      }),
    };

    await this.redis.set(cacheKey, response, 1800);
    return response;
  }
}

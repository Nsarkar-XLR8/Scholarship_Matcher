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

    // 2. Fallback to PostgreSQL Relational Engine
    const where: any = { isActive: true };

    if (dto.query) {
      where.OR = [
        { title: { contains: dto.query, mode: 'insensitive' } },
        { fieldOfStudy: { contains: dto.query, mode: 'insensitive' } },
        { university: { name: { contains: dto.query, mode: 'insensitive' } } },
      ];
    }

    if (dto.countryIsoCode) {
      where.campus = { country: { isoCode: dto.countryIsoCode.toUpperCase() } };
    }

    if (dto.fieldOfStudy) {
      where.fieldOfStudy = { contains: dto.fieldOfStudy, mode: 'insensitive' };
    }

    if (dto.maxGpaRequirement) {
      where.requirements = {
        some: {
          validTo: null,
          minGpa: { lte: dto.maxGpaRequirement },
        },
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.program.findMany({
        where,
        take: dto.limit || 20,
        skip: dto.offset || 0,
        include: {
          university: { select: { id: true, name: true, domain: true } },
          campus: { include: { country: true } },
          requirements: { where: { validTo: null } },
          scholarshipRules: true,
        },
        orderBy: { title: 'asc' },
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
          title: p.title,
          fieldOfStudy: p.fieldOfStudy,
          degreeLevel: p.degreeLevel,
          universityId: p.university.id,
          universityName: p.university.name,
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
        };
      }),
    };

    await this.redis.set(cacheKey, response, 1800);
    return response;
  }
}

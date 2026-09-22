import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { GeographicTreeQueryDto } from './dto/geographic-tree-query.dto';

@Injectable()
export class TaxonomyService {
  private readonly logger = new Logger(TaxonomyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  /**
   * Returns complete UN M49 Geographic Tree (Continent -> Region -> Country)
   * Cached in Redis for 12 hours.
   */
  async getGeographicTree() {
    const cacheKey = 'taxonomy:tree';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const tree = await this.prisma.continent.findMany({
      include: {
        regions: {
          include: {
            countries: {
              select: {
                id: true,
                isoCode: true,
                iso3Code: true,
                name: true,
                currencyCode: true,
                avgTuitionMinUsd: true,
                avgTuitionMaxUsd: true,
                estMonthlyLivingCostUsd: true,
                dataCompletenessPct: true,
                _count: {
                  select: { universities: true },
                },
              },
            },
          },
        },
      },
    });

    await this.redis.set(cacheKey, tree, 43200); // 12 hours TTL
    return tree;
  }

  /**
   * High-Performance Aggregation: Complete UN M49 Global Geographic Program Tree
   * Returns Continents -> Regions -> Countries -> Universities -> Programs
   * with pre-calculated financial, visa, and scholarship metrics.
   */
  async getGeographicProgramsTree(dto?: GeographicTreeQueryDto) {
    const cacheKey = `taxonomy:programs_tree:${JSON.stringify(dto || {})}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    // Build filter conditions for programs
    const programWhere: any = { isActive: true };

    if (dto?.query) {
      const q = dto.query.trim();
      programWhere.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { fieldOfStudy: { contains: q, mode: 'insensitive' } },
        { university: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (dto?.fieldOfStudy) {
      programWhere.fieldOfStudy = { contains: dto.fieldOfStudy, mode: 'insensitive' };
    }

    if (dto?.degreeLevel) {
      programWhere.degreeLevel = dto.degreeLevel;
    }

    if (dto?.maxGpa) {
      programWhere.requirements = {
        some: {
          validTo: null,
          minGpa: { lte: dto.maxGpa },
        },
      };
    }

    if (dto?.hasScholarshipOnly) {
      programWhere.scholarshipRules = {
        some: {},
      };
    }

    // Query entire UN hierarchy with eager joins in a single optimized query
    const continents = await this.prisma.continent.findMany({
      where: dto?.continentCode ? { code: dto.continentCode.toUpperCase() } : undefined,
      include: {
        regions: {
          include: {
            countries: {
              where: dto?.countryIsoCode ? { isoCode: dto.countryIsoCode.toUpperCase() } : undefined,
              include: {
                workAndVisaProfile: true,
                campuses: {
                  include: {
                    university: {
                      select: {
                        id: true,
                        name: true,
                        domain: true,
                        rankingQs: true,
                      },
                    },
                    programs: {
                      where: programWhere,
                      include: {
                        requirements: { where: { validTo: null } },
                        scholarshipRules: true,
                      },
                      orderBy: { title: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    let totalGlobalPrograms = 0;
    let totalGlobalUniversities = 0;
    let totalGlobalCountries = 0;
    const globalUniversitySet = new Set<string>();

    const structuredContinents = continents.map((continent) => {
      let continentProgramsCount = 0;
      let continentMinTuitionUsd = Infinity;
      let continentMaxTuitionUsd = 0;
      let continentHasFullRide = false;
      const continentUniSet = new Set<string>();

      const structuredRegions = continent.regions.map((region) => {
        let regionProgramsCount = 0;

        const structuredCountries = region.countries.map((country) => {
          totalGlobalCountries++;

          // Aggregate programs from all campuses in this country
          const programList: any[] = [];
          const countryUniMap = new Map<string, any>();

          for (const campus of country.campuses) {
            const uni = campus.university;
            if (!countryUniMap.has(uni.id)) {
              countryUniMap.set(uni.id, {
                id: uni.id,
                name: uni.name,
                domain: uni.domain,
                rankingQs: uni.rankingQs,
                programs: [],
              });
            }
            continentUniSet.add(uni.id);
            globalUniversitySet.add(uni.id);

            for (const prog of campus.programs) {
              const req = prog.requirements[0];
              const pAny = prog as any;
              const formattedProg = {
                id: prog.id,
                title: prog.title,
                fieldOfStudy: prog.fieldOfStudy,
                degreeLevel: prog.degreeLevel,
                durationMonths: prog.durationMonths,
                language: prog.language,
                tuitionFeeLocal: prog.tuitionFeeLocal,
                currencyCode: prog.currencyCode,
                sourceUrl: prog.sourceUrl,
                officialSourceUrl: pAny.officialSourceUrl || (uni.domain ? `https://${uni.domain.replace(/^https?:\/\//i, '')}` : null),
                officialSourceProvider: pAny.officialSourceProvider || 'OFFICIAL_PORTAL',
                applicationDeadline: pAny.applicationDeadline,
                intakeSeason: pAny.intakeSeason,
                universityId: uni.id,
                universityName: uni.name,
                domain: uni.domain,
                campusName: campus.name,
                campusCity: campus.city,
                latitude: campus.latitude || 0.0,
                longitude: campus.longitude || 0.0,
                requirements: {
                  minGpa: req?.minGpa || 0.0,
                  minIelts: req?.minIelts ?? null,
                  minToefl: req?.minToefl ?? null,
                  minGre: req?.minGre ?? null,
                  workExpYearsRequired: (req as any)?.workExpYearsRequired || 0,
                  requiresPapers: req?.requiresPapers || false,
                  minMathEcts: (req as any)?.minMathEcts || 0.0,
                  minCsEcts: (req as any)?.minCsEcts || 0.0,
                  minTheoreticalEcts: (req as any)?.minTheoreticalEcts || 0.0,
                  acceptsMoiEnglishWaiver: (req as any)?.acceptsMoiEnglishWaiver || false,
                },
                documentChecklist: {
                  sopMaxWords: pAny.sopMaxWords || 1000,
                  lorAcademicCount: pAny.lorAcademicCount || 2,
                  lorProfessionalCount: pAny.lorProfessionalCount || 0,
                  cvFormatRequired: pAny.cvFormatRequired || 'STANDARD',
                  portfolioRequired: pAny.portfolioRequired || false,
                },
                scholarshipRules: prog.scholarshipRules.map((r) => ({
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

              programList.push(formattedProg);
              countryUniMap.get(uni.id).programs.push(formattedProg);

              if (prog.tuitionFeeLocal < continentMinTuitionUsd) continentMinTuitionUsd = prog.tuitionFeeLocal;
              if (prog.tuitionFeeLocal > continentMaxTuitionUsd) continentMaxTuitionUsd = prog.tuitionFeeLocal;
              if (prog.scholarshipRules.some((r) => r.fundingPctMax >= 100)) continentHasFullRide = true;
            }
          }

          const programCount = programList.length;
          regionProgramsCount += programCount;
          continentProgramsCount += programCount;
          totalGlobalPrograms += programCount;

          let maxCoverage = 0;
          let verifiedCount = 0;
          for (const p of programList) {
            for (const r of p.scholarshipRules) {
              verifiedCount++;
              if (r.coveragePct > maxCoverage) maxCoverage = r.coveragePct;
            }
          }

          const visaProfile = country.workAndVisaProfile;

          return {
            id: country.id,
            isoCode: country.isoCode,
            iso3Code: country.iso3Code,
            name: country.name,
            currencyCode: country.currencyCode,
            avgTuitionMinUsd: country.avgTuitionMinUsd,
            avgTuitionMaxUsd: country.avgTuitionMaxUsd,
            estMonthlyLivingCostUsd: country.estMonthlyLivingCostUsd,
            dataCompletenessPct: country.dataCompletenessPct,
            postStudyWorkVisa: {
              visaName: visaProfile?.postStudyWorkPermitName || 'Graduate Work Visa',
              durationMonths: visaProfile?.postStudyWorkMonths || 12,
              stayBackFormatted: `${visaProfile?.postStudyWorkMonths || 12} Months`,
              inStudyHoursPerWeek: visaProfile?.inStudyWorkHoursPerWeek || 20,
              pathwayToPermanentRes: visaProfile?.pathwayToPermanentRes || 'Standard Skilled Worker Route',
              medianGraduateSalaryUsd: visaProfile?.medianGraduateSalaryUsd || 50000,
              monthlyBlockedAccountLocal: (visaProfile as any)?.monthlyBlockedAccountLocal || 0,
              blockedAccountCurrency: (visaProfile as any)?.blockedAccountCurrency || country.currencyCode,
              proofOfFundsMonths: (visaProfile as any)?.proofOfFundsMonths || 12,
              requiresApsCertificate: (visaProfile as any)?.requiresApsCertificate || false,
              anabinRecognitionType: (visaProfile as any)?.anabinRecognitionType || 'H+',
              uniAssistVpdRequired: (visaProfile as any)?.uniAssistVpdRequired || false,
            },
            stats: {
              programCount,
              universityCount: countryUniMap.size,
              maxScholarshipCoveragePct: maxCoverage,
              verifiedScholarshipsCount: verifiedCount,
            },
            universities: Array.from(countryUniMap.values()),
            allPrograms: programList,
          };
        });

        return {
          id: region.id,
          code: region.code,
          name: region.name,
          totalPrograms: regionProgramsCount,
          countries: structuredCountries,
        };
      });

      return {
        id: continent.id,
        code: continent.code,
        name: continent.name,
        unM49Code: continent.unM49Code,
        stats: {
          totalPrograms: continentProgramsCount,
          totalUniversities: continentUniSet.size,
          countriesCount: continent.regions.reduce((acc, r) => acc + r.countries.length, 0),
          minTuitionUsd: continentMinTuitionUsd === Infinity ? 0 : continentMinTuitionUsd,
          maxTuitionUsd: continentMaxTuitionUsd,
          hasFullRideScholarships: continentHasFullRide,
        },
        regions: structuredRegions,
      };
    });

    totalGlobalUniversities = globalUniversitySet.size;

    const result = {
      continents: structuredContinents,
      metadata: {
        totalGlobalPrograms,
        totalGlobalUniversities,
        totalGlobalCountries,
        generatedAt: new Date().toISOString(),
        source: 'POSTGRESQL_AGGREGATION',
      },
    };

    await this.redis.set(cacheKey, result, 3600); // 1 hour TTL
    return result;
  }

  /**
   * Returns list of all supported countries with program counts & completeness stats
   */
  async getCountries() {
    const cacheKey = 'taxonomy:countries';
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const countries = await this.prisma.country.findMany({
      include: {
        region: {
          include: {
            continent: true,
          },
        },
        _count: {
          select: {
            universities: true,
            scholarshipRules: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, countries, 43200);
    return countries;
  }

  /**
   * Returns deep metadata for a single country (tuition ranges, living costs, completeness)
   */
  async getCountryByIsoCode(isoCode: string) {
    const country = await this.prisma.country.findUnique({
      where: { isoCode: isoCode.toUpperCase() },
      include: {
        region: {
          include: { continent: true },
        },
        workAndVisaProfile: true,
        universities: {
          include: {
            campuses: true,
            _count: { select: { programs: true } },
          },
        },
        scholarshipRules: true,
      },
    });

    return country;
  }
}

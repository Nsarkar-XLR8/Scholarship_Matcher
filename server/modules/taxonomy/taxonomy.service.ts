import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

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

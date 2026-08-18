import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@Injectable()
export class UniversityService {
  private readonly logger = new Logger(UniversityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  async getUniversities(countryIsoCode?: string, limit = 50, offset = 0) {
    const cacheKey = `universities:${countryIsoCode || 'all'}:${limit}:${offset}`;
    const cached = await this.redis.get<any>(cacheKey);
    if (cached) return cached;

    const where: any = {};
    if (countryIsoCode) {
      where.primaryCountry = { isoCode: countryIsoCode.toUpperCase() };
    }

    const [items, total] = await Promise.all([
      this.prisma.university.findMany({
        where,
        take: limit,
        skip: offset,
        include: {
          primaryCountry: true,
          campuses: {
            include: { country: true },
          },
          _count: {
            select: { programs: true, scholarshipRules: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.university.count({ where }),
    ]);

    const result = { items, total, limit, offset };
    await this.redis.set(cacheKey, result, 3600); // 1 hour TTL
    return result;
  }

  async getUniversityById(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: {
        primaryCountry: {
          include: { region: { include: { continent: true } } },
        },
        campuses: {
          include: { country: true },
        },
        scholarshipRules: true,
        programs: {
          include: {
            campus: { include: { country: true } },
            requirements: {
              where: { validTo: null }, // Only fetch active requirement version
            },
            scholarshipRules: true,
          },
        },
      },
    });

    if (!university) {
      throw new NotFoundException(`University with ID '${id}' not found`);
    }

    return university;
  }

  async getProgramById(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        university: {
          include: { primaryCountry: true },
        },
        campus: {
          include: { country: true },
        },
        requirements: {
          orderBy: { validFrom: 'desc' }, // History of requirement changes
        },
        scholarshipRules: true,
        outcomeReports: {
          where: { verificationStatus: 'VERIFIED' },
        },
      },
    });

    if (!program) {
      throw new NotFoundException(`Program with ID '${id}' not found`);
    }

    return program;
  }
}

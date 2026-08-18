import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';

@ApiTags('System & Health')
@Controller(['health', 'api/v1/health'])
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness & Readiness probe for Render / Docker / Load Balancers' })
  async checkHealth() {
    let dbStatus = 'HEALTHY';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'UNHEALTHY';
    }

    let redisStatus = 'HEALTHY';
    try {
      await this.redis.set('health_ping', 'ok', 10);
    } catch {
      redisStatus = 'DEGRADED_OR_OFFLINE';
    }

    return {
      status: dbStatus === 'HEALTHY' ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      components: {
        database: dbStatus,
        redisCache: redisStatus,
        service: 'Global Masters Scholarship Matcher API',
      },
    };
  }
}

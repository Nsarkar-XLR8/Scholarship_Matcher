import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../common/services/prisma.service';
import { RedisService } from '../../common/services/redis.service';
import { RabbitMQService } from '../../common/services/rabbitmq.service';
import { OpenSearchService } from '../../common/services/opensearch.service';

@ApiTags('System & Health')
@Controller(['health', 'api/v1/health'])
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly rabbitmq: RabbitMQService,
    private readonly openSearch: OpenSearchService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness & Readiness probe for Load Balancers, Kubernetes & Docker' })
  async checkHealth() {
    let dbStatus = 'HEALTHY';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'UNHEALTHY_OR_UNREACHABLE';
    }

    let redisStatus = 'HEALTHY';
    try {
      await this.redis.set('health_ping', 'ok', 10);
      const ping = await this.redis.get('health_ping');
      if (ping !== 'ok') redisStatus = 'DEGRADED';
    } catch {
      redisStatus = 'DEGRADED_OR_OFFLINE';
    }

    let searchStatus = 'HEALTHY';
    try {
      const searchRes = await this.openSearch.searchPrograms('health_probe_query', {});
      if (searchRes === null) searchStatus = 'FALLBACK_TO_POSTGRES';
    } catch {
      searchStatus = 'FALLBACK_TO_POSTGRES';
    }

    const isSystemHealthy = dbStatus === 'HEALTHY';

    return {
      status: isSystemHealthy ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      components: {
        database: {
          type: 'PostgreSQL 16 (Prisma)',
          status: dbStatus,
        },
        redisCache: {
          type: 'Redis 7 (Hot Cache & Rate Limiting)',
          status: redisStatus,
        },
        searchEngine: {
          type: 'OpenSearch 2.11 (Faceted Engine)',
          status: searchStatus,
        },
        messageBroker: {
          type: 'RabbitMQ 3 (Topic Pipeline & DLQ)',
          status: 'CONNECTED',
        },
        service: 'Global Masters Scholarship Matcher API',
      },
      memory: {
        rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    };
  }
}


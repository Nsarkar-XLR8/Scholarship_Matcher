import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaService } from './common/services/prisma.service';
import { RedisService } from './common/services/redis.service';
import { OpenSearchService } from './common/services/opensearch.service';
import { RabbitMQService } from './common/services/rabbitmq.service';

import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { UniversityModule } from './modules/university/university.module';
import { MatchingModule } from './modules/matching/matching.module';
import { SearchModule } from './modules/search/search.module';
import { OutcomeModule } from './modules/outcome/outcome.module';
import { CurrencyModule } from './modules/currency/currency.module';
import { PipelineModule } from './modules/pipeline/pipeline.module';
import { HealthModule } from './modules/health/health.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // 100 req/min rate limit per IP for zero-auth API protection
      },
    ]),
    HealthModule,
    TaxonomyModule,
    UniversityModule,
    MatchingModule,
    SearchModule,
    OutcomeModule,
    CurrencyModule,
    PipelineModule,
  ],
  providers: [
    PrismaService,
    RedisService,
    OpenSearchService,
    RabbitMQService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [
    PrismaService,
    RedisService,
    OpenSearchService,
    RabbitMQService,
  ],
})
export class AppModule {}

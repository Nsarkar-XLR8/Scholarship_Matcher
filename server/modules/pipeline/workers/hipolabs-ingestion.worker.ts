import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { RABBITMQ_QUEUES } from '../../../common/constants/queues.constant';
import axios from 'axios';

@Injectable()
export class HipolabsIngestionWorker implements OnModuleInit {
  private readonly logger = new Logger(HipolabsIngestionWorker.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    // Register RabbitMQ Consumer for Hipolabs University Sync
    await this.rabbitmq.consumeQueue<{ countryName: string }>(
      RABBITMQ_QUEUES.UNIVERSITY_SYNC,
      async (payload, eventId) => {
        await this.processUniversitySync(payload.countryName, eventId);
      }
    );
  }

  async processUniversitySync(countryName: string, eventId: string) {
    this.logger.log(`[HIPOLABS WORKER] Syncing universities for country '${countryName}' | EventId: ${eventId}`);

    try {
      const url = `${process.env.HIPOLABS_API_URL || 'http://universities.hipolabs.com'}/search?country=${encodeURIComponent(countryName)}`;
      const response = await axios.get(url, { timeout: 10000 });
      const rawUnis: any[] = response.data;

      const country = await this.prisma.country.findFirst({
        where: { name: { contains: countryName, mode: 'insensitive' } },
      });

      if (!country) {
        this.logger.warn(`Country '${countryName}' not found in taxonomy database. Skipping.`);
        return;
      }

      let insertedCount = 0;
      for (const uni of rawUnis) {
        if (!uni.domains || uni.domains.length === 0) continue;
        const primaryDomain = uni.domains[0];

        const existing = await this.prisma.university.findUnique({
          where: { domain: primaryDomain },
        });

        if (!existing) {
          const university = await this.prisma.university.create({
            data: {
              name: uni.name,
              domain: primaryDomain,
              primaryCountryId: country.id,
            },
          });

          // Create default main campus
          await this.prisma.campus.create({
            data: {
              universityId: university.id,
              countryId: country.id,
              name: 'Main Campus',
              city: uni['state-province'] || countryName,
            },
          });

          insertedCount++;
        }
      }

      this.logger.log(`[HIPOLABS SYNC COMPLETE] Successfully ingested ${insertedCount} new universities for '${countryName}'.`);
    } catch (error) {
      this.logger.error(`Hipolabs sync error for '${countryName}':`, error.message);
      throw error; // Re-throw to trigger RabbitMQ retry logic
    }
  }
}

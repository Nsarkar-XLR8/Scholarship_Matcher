import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { RabbitMQService } from '../../../common/services/rabbitmq.service';
import { PrismaService } from '../../../common/services/prisma.service';
import { RABBITMQ_QUEUES } from '../../../common/constants/queues.constant';
import axios from 'axios';

@Injectable()
export class OpenAlexEnrichmentWorker implements OnModuleInit {
  private readonly logger = new Logger(OpenAlexEnrichmentWorker.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    await this.rabbitmq.consumeQueue<{ universityId: string }>(
      RABBITMQ_QUEUES.OPENALEX_ENRICHMENT,
      async (payload, eventId) => {
        await this.enrichUniversityResearchData(payload.universityId, eventId);
      }
    );
  }

  async enrichUniversityResearchData(universityId: string, eventId: string) {
    const university = await this.prisma.university.findUnique({
      where: { id: universityId },
    });

    if (!university) return;

    this.logger.log(`[OPENALEX WORKER] Enriching research metadata for '${university.name}' | EventId: ${eventId}`);

    try {
      const url = `${process.env.OPENALEX_API_URL || 'https://api.openalex.org'}/institutions?search=${encodeURIComponent(university.name)}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (response.data?.results?.length > 0) {
        const topResult = response.data.results[0];
        const openAlexId = topResult.id.replace('https://openalex.org/', '');

        await this.prisma.university.update({
          where: { id: universityId },
          data: { openAlexId },
        });

        this.logger.log(`[OPENALEX ENRICHED] Linked OpenAlex ID '${openAlexId}' to university '${university.name}'`);
      }
    } catch (error) {
      this.logger.error(`OpenAlex enrichment failed for university '${university.id}':`, error.message);
      throw error;
    }
  }
}

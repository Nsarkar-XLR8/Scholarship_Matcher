import { Module } from '@nestjs/common';
import { HipolabsIngestionWorker } from './workers/hipolabs-ingestion.worker';
import { OpenAlexEnrichmentWorker } from './workers/openalex-enrichment.worker';
import { ChangeDetectionWorker } from './workers/change-detection.worker';

@Module({
  providers: [
    HipolabsIngestionWorker,
    OpenAlexEnrichmentWorker,
    ChangeDetectionWorker,
  ],
  exports: [
    HipolabsIngestionWorker,
    OpenAlexEnrichmentWorker,
    ChangeDetectionWorker,
  ],
})
export class PipelineModule {}

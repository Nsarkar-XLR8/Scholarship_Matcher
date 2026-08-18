export const RABBITMQ_QUEUES = {
  UNIVERSITY_SYNC: 'university_sync_queue',
  OPENALEX_ENRICHMENT: 'openalex_enrichment_queue',
  CHANGE_DETECTION: 'change_detection_queue',
  DLQ: 'dead_letter_queue',
} as const;

export const RABBITMQ_EXCHANGES = {
  DATA_PIPELINE: 'data_pipeline_exchange',
  DLX: 'dead_letter_exchange',
} as const;

export const RABBITMQ_ROUTING_KEYS = {
  UNIVERSITY_SYNC: 'pipeline.university.sync',
  OPENALEX_ENRICHMENT: 'pipeline.openalex.enrich',
  CHANGE_DETECTION: 'pipeline.change.detect',
  DLQ: 'pipeline.deadletter',
} as const;

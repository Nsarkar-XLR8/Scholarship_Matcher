import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper, AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage } from 'amqplib';
import { RedisService } from './redis.service';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_ROUTING_KEYS } from '../constants/queues.constant';
import * as crypto from 'crypto';

export interface RabbitMQEvent<T = any> {
  eventId: string;
  eventType: string;
  timestamp: string;
  payload: T;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: AmqpConnectionManager | null = null;
  private channelWrapper: ChannelWrapper | null = null;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit() {
    try {
      const url = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';
      this.connection = amqp.connect([url]);

      this.connection.on('connect', () => {
        this.logger.log('✅ RabbitMQ broker connection established.');
      });

      this.connection.on('disconnect', (err) => {
        this.logger.warn('⚠️ RabbitMQ disconnected, attempting automatic reconnect...', err?.err?.message);
      });

      this.channelWrapper = this.connection.createChannel({
        json: true,
        setup: async (channel: ConfirmChannel) => {
          // 1. Declare Dead Letter Exchange & Queue
          await channel.assertExchange(RABBITMQ_EXCHANGES.DLX, 'direct', { durable: true });
          await channel.assertQueue(RABBITMQ_QUEUES.DLQ, { durable: true });
          await channel.bindQueue(RABBITMQ_QUEUES.DLQ, RABBITMQ_EXCHANGES.DLX, RABBITMQ_ROUTING_KEYS.DLQ);

          // 2. Declare Data Pipeline Topic Exchange
          await channel.assertExchange(RABBITMQ_EXCHANGES.DATA_PIPELINE, 'topic', { durable: true });

          // 3. Declare Queues with Dead Letter Exchange configuration
          const queueOptions = {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DLX,
              'x-dead-letter-routing-key': RABBITMQ_ROUTING_KEYS.DLQ,
            },
          };

          await channel.assertQueue(RABBITMQ_QUEUES.UNIVERSITY_SYNC, queueOptions);
          await channel.bindQueue(RABBITMQ_QUEUES.UNIVERSITY_SYNC, RABBITMQ_EXCHANGES.DATA_PIPELINE, RABBITMQ_ROUTING_KEYS.UNIVERSITY_SYNC);

          await channel.assertQueue(RABBITMQ_QUEUES.OPENALEX_ENRICHMENT, queueOptions);
          await channel.bindQueue(RABBITMQ_QUEUES.OPENALEX_ENRICHMENT, RABBITMQ_EXCHANGES.DATA_PIPELINE, RABBITMQ_ROUTING_KEYS.OPENALEX_ENRICHMENT);

          await channel.assertQueue(RABBITMQ_QUEUES.CHANGE_DETECTION, queueOptions);
          await channel.bindQueue(RABBITMQ_QUEUES.CHANGE_DETECTION, RABBITMQ_EXCHANGES.DATA_PIPELINE, RABBITMQ_ROUTING_KEYS.CHANGE_DETECTION);

          this.logger.log('✅ RabbitMQ Topology (Exchanges, Queues, DLQ, Routing Keys) asserted.');
        },
      });
    } catch (error) {
      this.logger.warn('⚠️ RabbitMQ broker unavailable, running in degraded background worker mode:', error.message);
    }
  }

  async onModuleDestroy() {
    if (this.channelWrapper) {
      await this.channelWrapper.close();
    }
    if (this.connection) {
      await this.connection.close();
      this.logger.log('🔌 RabbitMQ connection gracefully closed.');
    }
  }

  /**
   * Publishes an event to RabbitMQ with an explicit eventId for idempotency
   */
  async publishEvent<T>(exchange: string, routingKey: string, eventType: string, payload: T, customEventId?: string): Promise<boolean> {
    if (!this.channelWrapper) {
      this.logger.warn(`RabbitMQ offline: skipped publishing event '${eventType}'`);
      return false;
    }

    const eventId = customEventId || crypto.randomUUID();
    const event: RabbitMQEvent<T> = {
      eventId,
      eventType,
      timestamp: new Date().toISOString(),
      payload,
    };

    try {
      await this.channelWrapper.publish(exchange, routingKey, event, {
        persistent: true,
        headers: { 'x-event-id': eventId, 'x-retry-count': 0 },
      });
      this.logger.log(`Published RabbitMQ Event [${eventType}] ID: ${eventId} -> Key: ${routingKey}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to publish RabbitMQ event [${eventType}]:`, error.message);
      return false;
    }
  }

  /**
   * Consumes messages with IDEMPOTENCY and DLQ protection
   */
  async consumeQueue<T>(
    queueName: string,
    handler: (payload: T, eventId: string) => Promise<void>,
    maxRetries = 3
  ): Promise<void> {
    if (!this.channelWrapper) return;

    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.prefetch(5); // Process up to 5 concurrent messages per worker

      await channel.consume(queueName, async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        let event: RabbitMQEvent<T>;
        try {
          event = JSON.parse(msg.content.toString());
        } catch (parseError) {
          this.logger.error(`Malformed JSON message on queue ${queueName}. Sending to DLQ.`, parseError.message);
          channel.nack(msg, false, false); // Route malformed message directly to DLQ
          return;
        }

        const eventId = event.eventId || msg.properties.headers?.['x-event-id'] || crypto.createHash('sha256').update(msg.content).digest('hex');

        // 1. IDEMPOTENCY CHECK
        const alreadyProcessed = await this.redisService.isEventProcessed(eventId);
        if (alreadyProcessed) {
          this.logger.warn(`[IDEMPOTENT SKIP] Event ID ${eventId} was already processed. Acknowledging message.`);
          channel.ack(msg);
          return;
        }

        // 2. RETRY COUNT CHECK
        const currentRetries = (msg.properties.headers?.['x-retry-count'] || 0) as number;

        try {
          this.logger.log(`[PROCESSING] Queue: ${queueName} | Event: ${event.eventType} | ID: ${eventId} (Attempt ${currentRetries + 1})`);
          
          await handler(event.payload, eventId);

          // 3. MARK PROCESSED & ACKNOWLEDGE ON SUCCESS
          await this.redisService.markEventProcessed(eventId);
          channel.ack(msg);
          this.logger.log(`[SUCCESS ACK] Event ID ${eventId} completed and acknowledged.`);
        } catch (handlerError) {
          this.logger.error(`[HANDLER ERROR] Event ID ${eventId} failed on attempt ${currentRetries + 1}:`, handlerError.message);

          if (currentRetries < maxRetries) {
            // Re-queue with incremented retry count
            this.logger.warn(`Re-queueing Event ID ${eventId} for retry ${currentRetries + 1}/${maxRetries}`);
            channel.ack(msg); // Ack old message to prevent duplication
            
            // Re-publish to same queue with incremented retry header
            await this.channelWrapper?.publish('', queueName, event, {
              persistent: true,
              headers: { ...msg.properties.headers, 'x-retry-count': currentRetries + 1 },
            });
          } else {
            // Exceeded retries -> NACK without re-queue (routes to DLQ)
            this.logger.error(`Exceeded max retries (${maxRetries}) for Event ID ${eventId}. Moving to Dead Letter Queue (DLQ).`);
            channel.nack(msg, false, false);
          }
        }
      });
    });
  }
}

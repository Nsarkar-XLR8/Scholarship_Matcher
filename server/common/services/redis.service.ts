import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  async onModuleInit() {
    try {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      
      this.client = new Redis({
        host,
        port,
        retryStrategy: (times) => Math.min(times * 100, 3000),
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.client.connect();
      this.logger.log('✅ Redis client connected.');
    } catch (error) {
      this.logger.warn('⚠️ Redis not available, running in fallback in-memory mode:', error.message);
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('🔌 Redis connection closed.');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Redis GET error for key ${key}:`, error.message);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(`Redis SET error for key ${key}:`, error.message);
    }
  }

  /**
   * Idempotency Check for RabbitMQ Event Processing
   * Returns true if event was ALREADY processed.
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    if (!this.client) return false;
    try {
      const key = `processed_event:${eventId}`;
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Idempotency check error for event ${eventId}:`, error.message);
      return false;
    }
  }

  /**
   * Marks RabbitMQ Event as Processed with TTL (7 days default)
   */
  async markEventProcessed(eventId: string, ttlSeconds = 604800): Promise<void> {
    if (!this.client) return;
    try {
      const key = `processed_event:${eventId}`;
      await this.client.set(key, 'PROCESSED', 'EX', ttlSeconds);
    } catch (error) {
      this.logger.error(`Mark event processed error for event ${eventId}:`, error.message);
    }
  }

  /**
   * Rate limiting helper for IP fingerprint throttling
   */
  async checkRateLimit(ipFingerprint: string, limit = 60, windowSeconds = 60): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.client) return { allowed: true, remaining: limit };
    try {
      const key = `ratelimit:${ipFingerprint}`;
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
      };
    } catch (error) {
      return { allowed: true, remaining: limit };
    }
  }
}

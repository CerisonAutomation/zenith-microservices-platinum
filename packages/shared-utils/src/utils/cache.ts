import Redis from 'ioredis';
import { logger } from './logger';

export class CacheService {
  private static instance: CacheService;
  private client: Redis;

  private constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.client.on('error', (err: Error) => {
      logger.error('Redis connection error', err);
    });
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Cache get error', error as Error, { key });
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setex(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Cache set error', error as Error, { key, ttl });
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Cache delete error', error as Error, { key });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', error as Error, { key });
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      logger.error('Cache expire error', error as Error, { key, ttl });
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      logger.error('Cache increment error', error as Error, { key });
      return 0;
    }
  }

  // Hash operations
  async hget(hash: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(hash, field);
    } catch (error) {
      logger.error('Cache hget error', error as Error, { hash, field });
      return null;
    }
  }

  async hset(hash: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hset(hash, field, value);
    } catch (error) {
      logger.error('Cache hset error', error as Error, { hash, field });
    }
  }

  async hgetall(hash: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(hash);
    } catch (error) {
      logger.error('Cache hgetall error', error as Error, { hash });
      return {};
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<void> {
    try {
      await this.client.lpush(key, ...values);
    } catch (error) {
      logger.error('Cache lpush error', error as Error, { key, valueCount: values.length });
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      logger.error('Cache rpop error', error as Error, { key });
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error('Cache llen error', error as Error, { key });
      return 0;
    }
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

export const cache = CacheService.getInstance();
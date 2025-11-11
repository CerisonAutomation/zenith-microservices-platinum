import Redis from 'ioredis';

export class CacheService {
  private static instance: CacheService;
  private client: Redis;

  private constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.client.on('error', (err: any) => {
      console.error('Redis connection error:', err);
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
      console.error('Cache get error:', error);
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
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      console.error('Cache expire error:', error);
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  // Hash operations
  async hget(hash: string, field: string): Promise<string | null> {
    try {
      return await this.client.hget(hash, field);
    } catch (error) {
      console.error('Cache hget error:', error);
      return null;
    }
  }

  async hset(hash: string, field: string, value: string): Promise<void> {
    try {
      await this.client.hset(hash, field, value);
    } catch (error) {
      console.error('Cache hset error:', error);
    }
  }

  async hgetall(hash: string): Promise<Record<string, string>> {
    try {
      return await this.client.hgetall(hash);
    } catch (error) {
      console.error('Cache hgetall error:', error);
      return {};
    }
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<void> {
    try {
      await this.client.lpush(key, ...values);
    } catch (error) {
      console.error('Cache lpush error:', error);
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.client.rpop(key);
    } catch (error) {
      console.error('Cache rpop error:', error);
      return null;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      console.error('Cache llen error:', error);
      return 0;
    }
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

export const cache = CacheService.getInstance();
import { Request, Response, NextFunction, Router } from 'express';
import { MetricsResponse } from '../types';

/**
 * Metrics storage
 */
class MetricsStore {
  private startTime: number = Date.now();
  private requestCount: number = 0;
  private successCount: number = 0;
  private failCount: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  incrementRequests(): void {
    this.requestCount++;
  }

  incrementSuccess(): void {
    this.successCount++;
  }

  incrementFail(): void {
    this.failCount++;
  }

  incrementCacheHits(): void {
    this.cacheHits++;
  }

  incrementCacheMisses(): void {
    this.cacheMisses++;
  }

  getMetrics(cacheKeys: number): MetricsResponse {
    const hitRate = this.cacheHits + this.cacheMisses > 0
      ? ((this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100).toFixed(2)
      : '0.00';

    return {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: {
        rss: Math.floor(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
        external: Math.floor(process.memoryUsage().external / 1024 / 1024),
      },
      requests: {
        total: this.requestCount,
        successful: this.successCount,
        failed: this.failCount,
      },
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        keys: cacheKeys,
        hitRate: `${hitRate}%`,
      },
    };
  }
}

export const metrics = new MetricsStore();

/**
 * Metrics middleware
 */
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  metrics.incrementRequests();

  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.incrementSuccess();
    } else if (res.statusCode >= 400) {
      metrics.incrementFail();
    }
  });

  next();
};

/**
 * Metrics router
 */
export const metricsRouter = Router();

metricsRouter.get('/', (req: Request, res: Response) => {
  // Get cache keys count from cache service if available
  const cacheKeys = (req.app.locals.cacheKeys as number) || 0;
  res.json(metrics.getMetrics(cacheKeys));
});

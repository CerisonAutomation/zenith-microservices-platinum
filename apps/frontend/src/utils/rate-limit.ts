/**
 * Rate limiting utility using in-memory Map with periodic cleanup
 * For production, consider using Vercel KV or Upstash Redis
 */

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens per interval
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private tokenCache = new Map<string, number[]>();
  private lastCleanup = Date.now();
  private readonly CLEANUP_INTERVAL = 60000; // Clean up every minute

  async limit(
    identifier: string,
    config: RateLimitConfig = {
      interval: 60000, // 1 minute
      uniqueTokenPerInterval: 10
    }
  ): Promise<RateLimitResult> {
    // Periodic cleanup to prevent memory leaks
    this.cleanup(config.interval);

    const now = Date.now();
    const tokenCount = this.tokenCache.get(identifier) || [];

    // Filter out timestamps outside the current window
    const tokensInWindow = tokenCount.filter(
      timestamp => now - timestamp < config.interval
    );

    const isRateLimited = tokensInWindow.length >= config.uniqueTokenPerInterval;

    if (!isRateLimited) {
      tokensInWindow.push(now);
      this.tokenCache.set(identifier, tokensInWindow);
    }

    const oldestToken = tokensInWindow[0] || now;
    const reset = oldestToken + config.interval;

    return {
      success: !isRateLimited,
      limit: config.uniqueTokenPerInterval,
      remaining: Math.max(0, config.uniqueTokenPerInterval - tokensInWindow.length),
      reset
    };
  }

  private cleanup(interval: number) {
    const now = Date.now();

    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      for (const [identifier, timestamps] of this.tokenCache.entries()) {
        const validTimestamps = timestamps.filter(
          timestamp => now - timestamp < interval
        );

        if (validTimestamps.length === 0) {
          this.tokenCache.delete(identifier);
        } else {
          this.tokenCache.set(identifier, validTimestamps);
        }
      }

      this.lastCleanup = now;
    }
  }

  clear(identifier: string) {
    this.tokenCache.delete(identifier);
  }

  reset() {
    this.tokenCache.clear();
    this.lastCleanup = Date.now();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RateLimitConfig = {
  // AI endpoints - more restrictive due to cost
  ai: {
    interval: 60000, // 1 minute
    uniqueTokenPerInterval: 5 // 5 requests per minute
  },
  // Chat endpoints - moderate limits
  chat: {
    interval: 60000,
    uniqueTokenPerInterval: 20 // 20 messages per minute
  },
  // API endpoints - standard limits
  api: {
    interval: 60000,
    uniqueTokenPerInterval: 30 // 30 requests per minute
  },
  // Payment endpoints - strict limits
  payment: {
    interval: 3600000, // 1 hour
    uniqueTokenPerInterval: 10 // 10 checkout attempts per hour
  }
} as const;

/**
 * Apply rate limiting to an API request
 * Returns response headers with rate limit info
 */
export async function rateLimit(
  request: Request,
  config: RateLimitConfig
): Promise<{ success: boolean; headers: Headers; result: RateLimitResult }> {
  // Get identifier from request (IP, user ID, or API key)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  const identifier = `${ip}-${request.url}`;

  const result = await rateLimiter.limit(identifier, config);

  // Create response headers
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());

  return { success: result.success, headers, result };
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.reset.toString()
      }
    }
  );
}

export default rateLimiter;

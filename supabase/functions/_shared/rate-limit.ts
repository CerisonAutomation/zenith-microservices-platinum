/**
 * SECURITY FIX #8: Rate Limiting for Supabase Edge Functions
 *
 * This module provides rate limiting for Supabase Edge Functions
 * using Deno KV (built-in key-value store)
 */

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Rate limiter using Deno KV
 */
export async function rateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    // Open Deno KV database
    const kv = await Deno.openKv()
    const key = ['rate_limit', identifier]

    // Get current count and reset time
    const result = await kv.get<{ count: number; resetTime: number }>(key)
    const now = Date.now()

    if (!result.value || result.value.resetTime <= now) {
      // Initialize or reset
      const resetTime = now + windowMs
      await kv.set(key, { count: 1, resetTime }, {
        expireIn: windowMs,
      })

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime,
      }
    }

    // Increment count
    const newCount = result.value.count + 1
    await kv.set(key, {
      count: newCount,
      resetTime: result.value.resetTime,
    }, {
      expireIn: result.value.resetTime - now,
    })

    const allowed = newCount <= maxRequests
    const remaining = Math.max(0, maxRequests - newCount)

    return {
      allowed,
      remaining,
      resetTime: result.value.resetTime,
    }
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: 0,
      resetTime: Date.now() + windowMs,
    }
  }
}

/**
 * Get identifier from request
 */
export function getIdentifier(req: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from headers
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'

  return `ip:${ip}`
}

/**
 * Apply rate limit to a request
 */
export async function applyRateLimit(
  req: Request,
  maxRequests: number,
  windowMs: number,
  userId?: string
): Promise<Response | null> {
  const identifier = getIdentifier(req, userId)
  const result = await rateLimit(identifier, maxRequests, windowMs)

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        resetTime: new Date(result.resetTime).toISOString(),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(maxRequests),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': String(result.resetTime),
          'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
        },
      }
    )
  }

  return null
}

/**
 * Pre-configured rate limits
 */
export const rateLimits = {
  // General API: 100 requests per minute
  api: { maxRequests: 100, windowMs: 60 * 1000 },

  // Auth: 5 attempts per 15 minutes
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },

  // AI operations: 10 per minute (expensive)
  ai: { maxRequests: 10, windowMs: 60 * 1000 },

  // Video call creation: 5 per hour
  videoCalls: { maxRequests: 5, windowMs: 60 * 60 * 1000 },
}

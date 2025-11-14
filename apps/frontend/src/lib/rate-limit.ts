/**
 * Rate Limiting for API Routes
 *
 * Prevents API abuse and controls costs
 * Uses simple in-memory storage (upgrade to Redis for production)
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

interface RateLimitInfo {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production)
const store = new Map<string, RateLimitInfo>()

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // AI endpoints - moderate limits
  '/api/ai/chat': {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  '/api/ai/conversation-starters': {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
  '/api/ai/moderate': {
    windowMs: 60 * 1000,
    maxRequests: 20, // Higher for safety checks
  },
  '/api/ai/smart-replies': {
    windowMs: 60 * 1000,
    maxRequests: 10,
  },

  // Default rate limit
  default: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
}

/**
 * Check if request should be rate limited
 * @param identifier Unique identifier (IP, user ID, etc.)
 * @param endpoint API endpoint path
 * @returns Whether request is allowed
 */
export function checkRateLimit(
  identifier: string,
  endpoint: string
): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.default
  const key = `${identifier}:${endpoint}`
  const now = Date.now()

  let info = store.get(key)

  // Create new entry or reset if window expired
  if (!info || now > info.resetTime) {
    info = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  // Increment counter
  info.count++
  store.set(key, info)

  const allowed = info.count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - info.count)

  return {
    allowed,
    remaining,
    resetTime: info.resetTime,
  }
}

/**
 * Get identifier from request
 * @param request Request object
 * @returns Identifier string
 */
export function getIdentifier(request: Request): string {
  // Try to get user ID from auth (implement based on your auth system)
  // For now, use IP address

  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  return ip.split(',')[0].trim()
}

/**
 * Middleware function to apply rate limiting
 * @param request Request object
 * @param endpoint API endpoint path
 * @returns Response if rate limited, null otherwise
 */
export function applyRateLimit(
  request: Request,
  endpoint: string
): Response | null {
  const identifier = getIdentifier(request)
  const result = checkRateLimit(identifier, endpoint)

  if (!result.allowed) {
    return Response.json(
      {
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': RATE_LIMITS[endpoint]?.maxRequests.toString() || '30',
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetTime.toString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return null
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, info] of store.entries()) {
    if (now > info.resetTime) {
      store.delete(key)
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, 5 * 60 * 1000)
}

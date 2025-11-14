import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from './src/utils/supabase/middleware'

const rateLimitMap = new Map<string, { count: number; startTime: number }>()
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60 * 1000 // Clean up every 5 minutes

// Periodic cleanup to prevent memory leaks
function cleanupRateLimitMap(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now - data.startTime > windowMs) {
        rateLimitMap.delete(ip)
      }
    }
    lastCleanup = now
  }
}

export async function middleware(request: NextRequest) {
  // IMPORTANT: Update Supabase session first (handles auth token refresh)
  let response = await updateSession(request)

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // Rate Limiting
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? '127.0.0.1'
  const limit = 100 // requests per minute
  const windowMs = 60000

  // Periodic cleanup to prevent memory leaks
  cleanupRateLimitMap(windowMs)

  const current = rateLimitMap.get(ip) || { count: 0, startTime: Date.now() }

  if (Date.now() - current.startTime > windowMs) {
    rateLimitMap.set(ip, { count: 1, startTime: Date.now() })
  } else if (current.count >= limit) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  } else {
    rateLimitMap.set(ip, { ...current, count: current.count + 1 })
  }

  // Content Security Policy
  // NOTE: If you need inline scripts/styles, use nonce-based CSP instead of 'unsafe-inline'
  const csp = [
    "default-src 'self'",
    "script-src 'self' https://*.supabase.co https://js.stripe.com",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
    "frame-src https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimitMap = new Map<string, { count: number; startTime: number }>()

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

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
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; ')

  response.headers.set('Content-Security-Policy', csp)

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/auth/:path*',
    '/chat/:path*',
    '/explore/:path*',
    '/profile/:path*'
  ]
}
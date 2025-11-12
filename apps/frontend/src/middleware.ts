/**
 * Next.js Middleware - Security, Rate Limiting, CSRF
 * RUNS ON EVERY REQUEST - CRITICAL FOR SECURITY
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// CSRF token store (in production, use encrypted cookies + Redis)
const csrfTokens = new Set<string>();

/**
 * Rate limiting - Prevents DDoS and brute force attacks
 */
function rateLimit(request: NextRequest): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  // Clean up old entries
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }

  // Check rate limit
  const key = `${ip}:${request.nextUrl.pathname}`;
  const limit = rateLimitStore.get(key);

  if (!limit) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + 60 * 1000, // 1 minute window
    });
    return true;
  }

  if (limit.count >= getLimit(request.nextUrl.pathname)) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Get rate limit based on endpoint
 */
function getLimit(pathname: string): number {
  // Auth endpoints: 5 requests per minute
  if (pathname.startsWith('/api/auth')) {
    return 5;
  }

  // Upload endpoints: 10 requests per minute
  if (pathname.startsWith('/api/upload')) {
    return 10;
  }

  // Payment endpoints: 3 requests per minute
  if (pathname.startsWith('/api/payment')) {
    return 3;
  }

  // Default: 60 requests per minute
  return 60;
}

/**
 * CSRF Protection - Prevents cross-site request forgery
 */
function validateCSRF(request: NextRequest): boolean {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  // Get CSRF token from header
  const csrfToken = request.headers.get('x-csrf-token');

  if (!csrfToken || !csrfTokens.has(csrfToken)) {
    return false;
  }

  return true;
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const token = randomBytes(32).toString('hex');
  csrfTokens.add(token);

  // Auto-expire after 1 hour
  setTimeout(() => csrfTokens.delete(token), 60 * 60 * 1000);

  return token;
}

/**
 * Security Headers
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com",
      "frame-src 'self' https://js.stripe.com",
    ].join('; ')
  );

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self), payment=(self)'
  );

  return response;
}

/**
 * Main Middleware
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rate Limiting
  if (!rateLimit(request)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    });
  }

  // CSRF Protection for API routes
  if (pathname.startsWith('/api') && !validateCSRF(request)) {
    return new NextResponse('CSRF Token Invalid', {
      status: 403,
    });
  }

  // Continue with security headers
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// Configure which routes use middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

/**
 * API Helper utilities following Vercel best practices
 * Standardized response formats, error handling, and utilities
 */

import { NextResponse } from 'next/server';

/**
 * Standard API success response
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Standard API error response
 */
export function apiError(message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details && process.env.NODE_ENV === 'development' ? { details } : {})
    },
    { status }
  );
}

/**
 * Validation error response
 */
export function apiValidationError(errors: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      validation_errors: errors
    },
    { status: 400 }
  );
}

/**
 * Unauthorized error response
 */
export function apiUnauthorized(message = 'Unauthorized') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * Not found error response
 */
export function apiNotFound(resource = 'Resource') {
  return NextResponse.json(
    { success: false, error: `${resource} not found` },
    { status: 404 }
  );
}

/**
 * Rate limit error response with proper headers
 */
export function apiRateLimitError(retryAfter: number) {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests',
      retry_after: retryAfter
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString()
      }
    }
  );
}

/**
 * Validate required environment variables
 * Throws error if any are missing
 */
export function validateEnv(vars: string[]): void {
  const missing = vars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Safe error message extraction
 * Prevents leaking sensitive info in production
 */
export function getSafeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
  // In production, return generic message
  return 'An unexpected error occurred';
}

/**
 * Check if code is running in Edge runtime
 */
export function isEdgeRuntime(): boolean {
  return typeof EdgeRuntime !== 'undefined';
}

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

/**
 * CORS headers for API routes
 */
export function getCORSHeaders(origin?: string | null): HeadersInit {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const isAllowed = origin && allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Handle OPTIONS requests for CORS
 */
export function handleCORS(request: Request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCORSHeaders(request.headers.get('origin'))
    });
  }
  return null;
}

import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

/**
 * Next.js Middleware for Authentication & Session Management
 *
 * This middleware:
 * 1. Refreshes Supabase auth sessions automatically
 * 2. Handles auth token rotation
 * 3. Can protect routes (currently commented out for flexibility)
 *
 * Runs on every request before reaching the page
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

/**
 * Configure which routes this middleware runs on
 *
 * Current config: Runs on all routes except static assets
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

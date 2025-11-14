import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

/**
 * Middleware Supabase client for session management
 * Handles cookie-based authentication in Next.js middleware
 *
 * This is the recommended approach for:
 * - Refreshing expired auth tokens
 * - Protecting routes based on auth status
 * - Reading user sessions in middleware
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Skip auth check if Supabase not configured (demo mode)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    })
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        // SECURITY FIX #15: Ensure cookies have proper security flags
        const secureOptions = {
          ...options,
          httpOnly: true, // SECURITY: Prevent JavaScript access to prevent XSS
          secure: process.env.NODE_ENV === 'production', // SECURITY: Only send over HTTPS in production
          sameSite: 'lax' as const, // SECURITY: CSRF protection
        }

        // Set cookie in request for subsequent middleware/route handlers
        request.cookies.set({
          name,
          value,
          ...secureOptions,
        })

        // Also set in response so browser receives the cookie
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value,
          ...secureOptions,
        })
      },
      remove(name: string, options: CookieOptions) {
        // Remove from request
        request.cookies.set({
          name,
          value: '',
          ...options,
        })
        // Also remove from response
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

  // Refresh session if expired - required for Server Components
  // This will automatically refresh the session if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // SECURITY FIX #2: Route protection enabled to prevent unauthorized access
  // Protect sensitive routes that require authentication
  const protectedRoutes = ['/profile', '/messages', '/favorites', '/wallet']
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    // SECURITY: Redirect unauthenticated users to login
    // Preserve the intended destination for post-login redirect
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

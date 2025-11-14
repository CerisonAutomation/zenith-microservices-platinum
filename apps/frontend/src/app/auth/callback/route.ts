import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

/**
 * Auth Callback Route Handler
 *
 * This route handler is called by Supabase Auth after:
 * - OAuth sign-in (Google, Facebook, Apple, etc.)
 * - Email confirmation links
 * - Password reset links
 * - Magic link authentication
 *
 * It exchanges the auth code for a session and redirects the user appropriately.
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase (e.g., user cancelled OAuth)
  if (error) {
    // SECURITY FIX #9: Don't log error details (may contain tokens/codes)
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth callback error occurred')
    }
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || '')}`, requestUrl.origin)
    )
  }

  if (code) {
    const supabase = await createClient()

    if (!supabase) {
      console.error('Supabase client not available in auth callback')
      return NextResponse.redirect(new URL('/auth/error?error=config', requestUrl.origin))
    }

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      // SECURITY FIX #9: Don't log session exchange errors (contain auth codes)
      if (process.env.NODE_ENV === 'development') {
        console.error('Error exchanging code for session')
      }
      return NextResponse.redirect(
        new URL(`/auth/error?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    // URL to redirect to after sign in process completes
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'

    if (isLocalEnv) {
      // In development, redirect to localhost
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    } else if (forwardedHost) {
      // In production with forwarded host (e.g., Vercel)
      return NextResponse.redirect(new URL(next, `https://${forwardedHost}`))
    } else {
      // Fallback
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // No code present, redirect to home or error
  console.warn('No code present in auth callback')
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}

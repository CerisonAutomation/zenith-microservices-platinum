import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

interface CookieOptions {
  maxAge?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
  domain?: string;
}

/**
 * Client-side Supabase client for use in Client Components
 * Uses @supabase/ssr for proper SSR support with Next.js App Router
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not configured. Running in demo mode.')
    // Return a minimal mock client for demo mode
    return null
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // Client-side cookie access
        if (typeof document === 'undefined') return undefined
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
      },
      set(name: string, value: string, options: CookieOptions) {
        // Client-side cookie setting
        if (typeof document === 'undefined') return

        // SECURITY FIX #15: Add security flags to cookies
        // Note: httpOnly cannot be set from JavaScript (requires server-side)
        // httpOnly cookies are set by the server in middleware and API routes
        let cookie = `${name}=${value}`
        if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
        if (options?.path) cookie += `; path=${options.path || '/'}`

        // SECURITY: Always set SameSite to Lax for CSRF protection
        cookie += `; samesite=${options?.sameSite || 'lax'}`

        // SECURITY: Always set Secure flag in production
        if (process.env.NODE_ENV === 'production' || options?.secure) {
          cookie += '; secure'
        }

        document.cookie = cookie
      },
      remove(name: string, options: CookieOptions) {
        // Client-side cookie removal
        if (typeof document === 'undefined') return
        document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`
      },
    },
  })
}

/**
 * Check if Supabase is properly configured
 */
export const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(url && key && url !== 'https://placeholder.supabase.co' && key !== 'placeholder-key')
}

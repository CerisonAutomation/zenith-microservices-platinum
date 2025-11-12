import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

/**
 * Server-side Supabase client for use in:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 *
 * This client properly handles cookies for SSR authentication
 *
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not configured. Server functions will not work.')
    return null
  }

  const cookieStore = cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        const cookie = await cookieStore
        return cookie.get(name)?.value
      },
      async set(name: string, value: string, options: CookieOptions) {
        try {
          const cookie = await cookieStore
          cookie.set({ name, value, ...options })
        } catch (error) {
          // Handle errors in Server Components where cookies can't be set
          console.error('Failed to set cookie in Server Component:', error)
        }
      },
      async remove(name: string, options: CookieOptions) {
        try {
          const cookie = await cookieStore
          cookie.set({ name, value: '', ...options })
        } catch (error) {
          // Handle errors in Server Components where cookies can't be removed
          console.error('Failed to remove cookie in Server Component:', error)
        }
      },
    },
  })
}

/**
 * Get the current user session from server-side
 * Returns null if no session exists
 */
export async function getSession() {
  const supabase = await createClient()
  if (!supabase) return null

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Get the current authenticated user from server-side
 * Returns null if no user is authenticated
 */
export async function getUser() {
  const supabase = await createClient()
  if (!supabase) return null

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated() {
  const session = await getSession()
  return Boolean(session)
}

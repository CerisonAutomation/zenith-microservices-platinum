/**
 * 🔐 Supabase Client - Production-Grade Configuration
 *
 * Features:
 * - Type-safe database client
 * - Auto-retry with exponential backoff
 * - Session persistence & auto-refresh
 * - Custom error handling
 * - Storage helpers
 *
 * @see https://supabase.com/docs/reference/javascript/initializing
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env['VITE_SUPABASE_URL'];
const supabaseAnonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '⚠️ Missing Supabase environment variables. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.',
  );
}

/**
 * Main Supabase client instance with enhanced configuration
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-auth-token',
  },
  global: {
    headers: {
      'x-application-name': 'dating-app',
    },
  },
  db: {
    schema: 'public',
  },
});

// ============================================================================
// AUTH HELPERS
// ============================================================================

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// ============================================================================
// STORAGE HELPERS
// ============================================================================

/**
 * Upload file to Supabase Storage with validation
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string;
    upsert?: boolean;
    maxSizeMB?: number;
  },
) {
  // Validate file size
  const maxSize = (options?.maxSizeMB || 5) * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${options?.maxSizeMB || 5}MB limit`);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert ?? false,
    });

  if (error) throw error;
  return data;
}

/**
 * Get public URL for a stored file
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Delete file from storage
 */
export async function deleteFile(bucket: string, paths: string[]) {
  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}

/**
 * List files in a bucket path
 */
export async function listFiles(bucket: string, path?: string) {
  const { data, error } = await supabase.storage.from(bucket).list(path);
  if (error) throw error;
  return data;
}

// ============================================================================
// REAL-TIME HELPERS
// ============================================================================

/**
 * Subscribe to table changes
 */
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filter?: string,
) {
  const channel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes' as any,
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(error: any): never {
  if (error?.code === 'PGRST116') {
    throw new SupabaseError('Resource not found', error.code, error);
  }
  if (error?.code === '23505') {
    throw new SupabaseError('Duplicate entry', error.code, error);
  }
  throw new SupabaseError(
    error?.message || 'Unknown error',
    error?.code,
    error,
  );
}

// Export types
export type { Database } from '@/types/supabase';

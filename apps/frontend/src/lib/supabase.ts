import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'zenith-auth-token',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application': 'zenith-dating-app',
    },
  },
})

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder-key'
}

// Storage helpers
export const uploadFile = async (bucket: string, path: string, file: File) => {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error
  return data
}

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

// Real-time subscription helpers
export const subscribeToChannel = (channel: string, callback: (payload: any) => void) => {
  return supabase
    .channel(channel)
    .on('postgres_changes', { event: '*', schema: 'public' }, callback)
    .subscribe()
}

export const subscribeToMessages = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`messages:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`,
    }, callback)
    .subscribe()
}

export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, callback)
    .subscribe()
}

// Type-safe query helpers
export const getUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export const getProfiles = async (filters?: { minAge?: number; maxAge?: number; gender?: string; interests?: string[] }) => {
  let query = supabase.from('profiles').select('*')

  if (filters?.minAge) query = query.gte('age', filters.minAge)
  if (filters?.maxAge) query = query.lte('age', filters.maxAge)
  if (filters?.gender) query = query.eq('gender', filters.gender)

  const { data, error } = await query.limit(50)

  if (error) throw error
  return data
}

export const getMatches = async (userId: string) => {
  const { data, error } = await supabase
    .from('matches')
    .select('*, profile:profiles(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getFavorites = async (userId: string) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*, profile:profiles(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, other_user:profiles(*), last_message:messages(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export const getMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export const sendMessage = async (conversationId: string, senderId: string, content: string) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export default supabase

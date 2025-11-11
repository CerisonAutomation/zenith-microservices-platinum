/**
 * 🗄️ Supabase Database Types
 * 
 * Auto-generated types for type-safe database queries
 * 
 * To regenerate:
 * npm run types:supabase
 * 
 * @see https://supabase.com/docs/guides/api/generating-types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number
          bio: string | null
          photo_url: string | null
          verified: boolean
          online: boolean
          location_lat: number | null
          location_lng: number | null
          city: string | null
          country: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          age: number
          bio?: string | null
          photo_url?: string | null
          verified?: boolean
          online?: boolean
          location_lat?: number | null
          location_lng?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number
          bio?: string | null
          photo_url?: string | null
          verified?: boolean
          online?: boolean
          location_lat?: number | null
          location_lng?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          profile_id: string
          user_id: string
          date: string
          time: string
          location_name: string
          location_address: string
          location_lat: number
          location_lng: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          meeting_type: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          user_id: string
          date: string
          time: string
          location_name: string
          location_address: string
          location_lat: number
          location_lng: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          meeting_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          user_id?: string
          date?: string
          time?: string
          location_name?: string
          location_address?: string
          location_lat?: number
          location_lng?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          meeting_type?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

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
          created_at: string
          updated_at: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          age: number | null
          gender: string | null
          location_text: string | null
          location: unknown | null // PostGIS geography
          interests: string[] | null
          is_online: boolean
          last_seen: string | null
          role: string
          is_active: boolean
          is_verified: boolean
          verification_token: string | null
          reset_token: string | null
          reset_token_expires: string | null
          last_login: string | null
          login_attempts: number
          locked_until: string | null
          two_factor_enabled: boolean
          two_factor_secret: string | null
          search_vector: string | null
          compatibility_score: number
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          age?: number | null
          gender?: string | null
          location_text?: string | null
          location?: unknown | null
          interests?: string[] | null
          is_online?: boolean
          last_seen?: string | null
          role?: string
          is_active?: boolean
          is_verified?: boolean
          verification_token?: string | null
          reset_token?: string | null
          reset_token_expires?: string | null
          last_login?: string | null
          login_attempts?: number
          locked_until?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          search_vector?: string | null
          compatibility_score?: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          age?: number | null
          gender?: string | null
          location_text?: string | null
          location?: unknown | null
          interests?: string[] | null
          is_online?: boolean
          last_seen?: string | null
          role?: string
          is_active?: boolean
          is_verified?: boolean
          verification_token?: string | null
          reset_token?: string | null
          reset_token_expires?: string | null
          last_login?: string | null
          login_attempts?: number
          locked_until?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          search_vector?: string | null
          compatibility_score?: number
        }
      }
      matches: {
        Row: {
          id: string
          created_at: string
          user_id: string
          matched_user_id: string
          status: string
          compatibility_score: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          matched_user_id: string
          status?: string
          compatibility_score?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          matched_user_id?: string
          status?: string
          compatibility_score?: number | null
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          match_id: string | null
          sender_id: string
          receiver_id: string
          content: string | null
          message_type: string
          attachment_url: string | null
          attachment_metadata: Json | null
          is_read: boolean
          read_at: string | null
          is_delivered: boolean
          delivered_at: string | null
          reply_to_message_id: string | null
          reactions: Json
          conversation_id: string | null
          search_vector: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          match_id?: string | null
          sender_id: string
          receiver_id: string
          content?: string | null
          message_type?: string
          attachment_url?: string | null
          attachment_metadata?: Json | null
          is_read?: boolean
          read_at?: string | null
          is_delivered?: boolean
          delivered_at?: string | null
          reply_to_message_id?: string | null
          reactions?: Json
          conversation_id?: string | null
          search_vector?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          match_id?: string | null
          sender_id?: string
          receiver_id?: string
          content?: string | null
          message_type?: string
          attachment_url?: string | null
          attachment_metadata?: Json | null
          is_read?: boolean
          read_at?: string | null
          is_delivered?: boolean
          delivered_at?: string | null
          reply_to_message_id?: string | null
          reactions?: Json
          conversation_id?: string | null
          search_vector?: string | null
        }
      }
      favorites: {
        Row: {
          id: string
          created_at: string
          user_id: string
          profile_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          profile_id: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          profile_id?: string
        }
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          profile_id: string
          date: string
          time: string | null
          status: string
          location_name: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          meeting_type: string | null
          notes: string | null
          kinks: string[] | null
          roles: string[] | null
          booking_preferences: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          profile_id: string
          date: string
          time?: string | null
          status?: string
          location_name?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          meeting_type?: string | null
          notes?: string | null
          kinks?: string[] | null
          roles?: string[] | null
          booking_preferences?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          profile_id?: string
          date?: string
          time?: string | null
          status?: string
          location_name?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          meeting_type?: string | null
          notes?: string | null
          kinks?: string[] | null
          roles?: string[] | null
          booking_preferences?: Json | null
        }
      }
      notifications: {
        Row: {
          id: string
          created_at: string
          user_id: string
          type: string
          title: string
          message: string
          is_read: boolean
          data: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          type: string
          title: string
          message: string
          is_read?: boolean
          data?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          is_read?: boolean
          data?: Json | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          plan_name: string
          plan_type: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          plan_name: string
          plan_type: string
          status?: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          plan_name?: string
          plan_type?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
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
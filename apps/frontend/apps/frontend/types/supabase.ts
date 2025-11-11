/**
 * 🗄️ SUPABASE DATABASE TYPE DEFINITIONS
 * Auto-generated types from Supabase schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          avatar: string | null;
          bio: string | null;
          age: number | null;
          gender: string | null;
          location: Json | null;
          preferences: Json | null;
          kinks: string[] | null;
          roles: string[] | null;
          tribes: string[] | null;
          photos: string[] | null;
          verified: boolean;
          premium: boolean;
          online: boolean;
          last_seen: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          avatar?: string | null;
          bio?: string | null;
          age?: number | null;
          gender?: string | null;
          location?: Json | null;
          preferences?: Json | null;
          kinks?: string[] | null;
          roles?: string[] | null;
          tribes?: string[] | null;
          photos?: string[] | null;
          verified?: boolean;
          premium?: boolean;
          online?: boolean;
          last_seen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          avatar?: string | null;
          bio?: string | null;
          age?: number | null;
          gender?: string | null;
          location?: Json | null;
          preferences?: Json | null;
          kinks?: string[] | null;
          roles?: string[] | null;
          tribes?: string[] | null;
          photos?: string[] | null;
          verified?: boolean;
          premium?: boolean;
          online?: boolean;
          last_seen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          type: string;
          read: boolean;
          delivered: boolean;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          type?: string;
          read?: boolean;
          delivered?: boolean;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          type?: string;
          read?: boolean;
          delivered?: boolean;
          timestamp?: string;
          created_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          requester_id: string;
          provider_id: string;
          type: string;
          date: string;
          time: string;
          location: string | null;
          notes: string | null;
          status: string;
          kinks: string[] | null;
          roles: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          provider_id: string;
          type: string;
          date: string;
          time: string;
          location?: string | null;
          notes?: string | null;
          status?: string;
          kinks?: string[] | null;
          roles?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          requester_id?: string;
          provider_id?: string;
          type?: string;
          date?: string;
          time?: string;
          location?: string | null;
          notes?: string | null;
          status?: string;
          kinks?: string[] | null;
          roles?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

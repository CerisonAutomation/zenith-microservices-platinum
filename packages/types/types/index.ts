import type { Database } from './supabase';

export type { Database };

// Type aliases for commonly used types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update'];

// Extended types for frontend use
export interface ExtendedProfile {
  id: string;
  created_at?: string;
  updated_at?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string | null;
  bio?: string;
  age?: number | null;
  gender?: string | null;
  is_online?: boolean;
  last_seen?: string | null;
  name?: string; // Alias for full_name
  distance?: string;
  online?: boolean;
  photo?: string;
  photos?: string[];
  verified?: boolean;
  location?: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  } | null;
  availability?: {
    meetNow?: boolean;
    schedule?: any[];
    weekdays?: string[];
    weekends?: boolean;
  };
  membership?: {
    tier: string;
    expiresAt?: Date;
  };
  stats?: {
    views: number;
    favorites: number;
    matches: number;
    responseRate: number;
  };
  verification?: {
    email: boolean;
    phone: boolean;
    photo: boolean;
    identity: boolean;
  };
  kinks?: string[];
  interests?: string[];
  preferences?: {
    ageRange: [number, number];
    distance: number;
    gender?: string[];
    lookingFor?: string[];
    kinks?: string[];
    roles?: string[];
    bookingPreferences?: any;
    tribes?: string[];
  };
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type?: 'text' | 'image' | 'system';
  profile?: ExtendedProfile;
}

export interface Booking {
  id: string;
  userId: string;
  profileId: string;
  providerId?: string;
  serviceType: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  profile?: ExtendedProfile;
  time?: string;
  location?: string;
  createdAt?: Date;
  kinks?: string[];
  roles?: string[];
  bookingPreferences?: any;
}

export interface ExtendedNotification extends Omit<Notification, 'created_at' | 'is_read'> {
  timestamp: Date;
  read: boolean;
  profileId?: string;
}
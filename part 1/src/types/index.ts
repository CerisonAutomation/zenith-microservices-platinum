/**
 * Core Type Definitions for Zenith Dating App
 */

// ═══════════════════════════════════════════════════════════════════════════════
// USER & PROFILE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Profile {
  id: string;
  user_id?: string;
  name: string;
  age: number;
  bio?: string;
  photo: string;
  photos?: string[];
  location?: string;
  distance?: number;
  interests?: string[];
  occupation?: string;
  education?: string;
  height?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'other';
  looking_for?: 'male' | 'female' | 'everyone';
  relationship_type?: 'casual' | 'serious' | 'friendship' | 'unsure';
  verified?: boolean;
  premium?: boolean;
  online?: boolean;
  last_active?: Date | string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type MessageType = 'text' | 'image' | 'voice' | 'emoji' | 'system';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type?: MessageType;
  profile?: Profile;
  isOptimistic?: boolean;
  sendError?: string;
  status?: 'sent' | 'delivered' | 'read';
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Conversation {
  id: string;
  user_id: string;
  other_user_id: string;
  last_message?: Message;
  last_message_at?: Date | string;
  unread_count?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type NotificationType =
  | 'match'
  | 'message'
  | 'like'
  | 'favorite'
  | 'profile_view'
  | 'booking'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  metadata?: {
    profile_id?: string;
    profile_photo?: string;
    profile_name?: string;
    [key: string]: any;
  };
  created_at: Date | string;
  updated_at?: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface BookingLocation {
  name: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Booking {
  id: string;
  user_id: string;
  profile_id: string;
  profile?: Profile;
  date: Date | string;
  time: string;
  location: string | BookingLocation;
  status: BookingStatus;
  notes?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MATCH & INTERACTION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Match {
  id: string;
  user_id: string;
  matched_user_id: string;
  profile?: Profile;
  matched_at: Date | string;
  conversation_id?: string;
  created_at?: Date | string;
}

export interface Favorite {
  id: string;
  user_id: string;
  profile_id: string;
  profile?: Profile;
  created_at: Date | string;
}

export interface Like {
  id: string;
  user_id: string;
  profile_id: string;
  created_at: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION & PAYMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SubscriptionTier = 'free' | 'premium' | 'platinum';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired';
  current_period_start: Date | string;
  current_period_end: Date | string;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILTER & SEARCH TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface SearchFilters {
  minAge?: number;
  maxAge?: number;
  distance?: number;
  gender?: string;
  interests?: string[];
  relationshipType?: string;
  verified?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

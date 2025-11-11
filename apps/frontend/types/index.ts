/**
 * 🎯 ZENITH TYPE DEFINITIONS
 * Comprehensive type definitions for the entire application
 */

import type { Database } from './supabase';

// ═══════════════════════════════════════════════════════════════════════════════
// USER & PROFILE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Profile {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
  bio?: string;
  age?: number;
  gender?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    coordinates?: [number, number];
  };
  preferences?: {
    ageRange?: [number, number];
    distance?: number;
    genders?: string[];
  };
  kinks?: string[];
  roles?: string[];
  tribes?: string[];
  photos?: string[];
  verified?: boolean;
  premium?: boolean;
  online?: boolean;
  lastSeen?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface User {
  id: string;
  email: string;
  profile?: Profile;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio';
  read?: boolean;
  delivered?: boolean;
  timestamp: Date | string;
  createdAt?: Date | string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Conversation {
  id: string;
  participants: Profile[];
  lastMessage?: Message;
  unreadCount?: number;
  updatedAt?: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Booking {
  id: string;
  requesterId: string;
  providerId: string;
  type: 'coffee' | 'dinner' | 'drinks' | 'activity' | 'video' | 'phone';
  date: Date | string;
  time: string;
  location?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  kinks?: string[];
  roles?: string[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
  requester?: Profile;
  provider?: Profile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISCOVERY & FILTER TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DiscoveryFilters {
  ageRange?: [number, number];
  distance?: number;
  genders?: string[];
  kinks?: string[];
  roles?: string[];
  tribes?: string[];
  verified?: boolean;
  premium?: boolean;
  online?: boolean;
}

export interface SearchParams extends DiscoveryFilters {
  query?: string;
  page?: number;
  limit?: number;
  sortBy?: 'distance' | 'lastActive' | 'popular' | 'newest';
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION & PAYMENT TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium' | 'elite';
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodStart?: Date | string;
  currentPeriodEnd?: Date | string;
  cancelAtPeriodEnd?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  type: 'subscription' | 'booking' | 'gift';
  createdAt?: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API RESPONSE TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH & SESSION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'booking' | 'match' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Date | string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT DATABASE TYPE
// ═══════════════════════════════════════════════════════════════════════════════

export type { Database };

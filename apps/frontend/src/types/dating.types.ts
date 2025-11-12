/**
 * Dating App Type Definitions
 */

import type {
  UserMode,
  BodyType,
  KinkIntensity,
  KinkActivity,
  Position,
  SafetyPreference,
  RelationshipGoal,
  ReportReason,
} from '../config/dating-app.config';

// User Profile Extensions
export interface DatingProfile {
  id: string;
  userId: string;
  userMode: UserMode;

  // Basic Info
  username: string;
  displayName: string;
  age: number;
  bio: string;
  location: {
    city: string;
    state?: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  // Physical Attributes
  bodyType: BodyType[];
  height?: number; // in cm
  weight?: number; // in kg
  ethnicity?: string[];

  // Photos & Media
  photos: ProfilePhoto[];
  hiddenAlbums?: HiddenAlbum[];
  videoIntro?: string; // URL to video

  // Preferences & Kinks
  preferences: UserPreferences;
  kinks: {
    intensity: KinkIntensity[];
    activities: KinkActivity[];
    position: Position;
    safety: SafetyPreference[];
  };

  // Relationship
  relationshipGoals: RelationshipGoal[];
  lookingFor: BodyType[];
  ageRange: {
    min: number;
    max: number;
  };

  // Verification & Trust
  verified: {
    email: boolean;
    phone: boolean;
    photo: boolean;
    id: boolean;
  };

  // Premium Status
  isPremium: boolean;
  premiumExpiry?: Date;

  // Stats & Activity
  stats: {
    responseRate: number; // 0-100
    averageResponseTime?: number; // in minutes
    lastActive: Date;
    joinDate: Date;
    profileViews: number;
    totalMatches: number;
  };

  // Availability (for Become a Boyfriend mode)
  availability?: BoyfrienAvailability;

  // Safety & Moderation
  reports: number;
  bans: Ban[];
  blockedUsers: string[];
}

export interface ProfilePhoto {
  id: string;
  url: string;
  thumbnailUrl: string;
  order: number;
  isPublic: boolean; // false = hidden album
  isVerificationPhoto: boolean;
  uploadedAt: Date;
}

export interface HiddenAlbum {
  id: string;
  name: string;
  photos: ProfilePhoto[];
  requiresPremium: boolean;
  sharedWith: string[]; // User IDs who can access
}

export interface UserPreferences {
  maxDistance: number; // in km
  showOnlineOnly: boolean;
  showVerifiedOnly: boolean;
  notifications: {
    matches: boolean;
    messages: boolean;
    likes: boolean;
    bookings: boolean;
  };
  privacy: {
    showDistance: boolean;
    showOnlineStatus: boolean;
    allowIncognito: boolean;
    hideFromStraight: boolean;
  };
}

export interface Boyfriend Availability {
  hourlyRate?: number;
  currency: string;
  availableDays: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  availableHours: {
    start: string; // HH:mm format
    end: string;
  };
  services: string[];
  location: {
    willTravel: boolean;
    maxTravelDistance?: number;
    canHost: boolean;
  };
}

// Authentication Types
export interface SignUpData {
  // Step 1: Mode Selection
  userMode: UserMode;

  // Step 2: Age Gate
  ageConfirmed: boolean;
  termsAccepted: boolean;
  privacyAccepted: boolean;

  // Step 3: Username & Email
  username: string;
  email: string;
  emailConfirmed?: boolean;

  // Step 4: Password (isolated page)
  password: string;
  passwordAttempts: number;

  // Step 5: OAuth Alternative
  googleAuth?: {
    token: string;
    email: string;
  };

  // Step 6: Magic Link Alternative
  magicLink?: {
    token: string;
    expiresAt: Date;
  };

  // Step 7: Profile Setup
  displayName: string;
  age: number;
  photos: File[];
  bio: string;
}

export interface SignInData {
  // Priority 1: Magic Link
  magicLink?: string;

  // Priority 2: Google OAuth
  googleToken?: string;

  // Priority 3: Email/Password
  email?: string;
  password?: string;

  // First-time password creation
  requiresPasswordCreation?: boolean;
}

export interface PasswordRequirements {
  minLength: 6;
  requiresUppercase: boolean;
  requiresLowercase: boolean;
  requiresNumber: boolean;
  requiresSpecialChar: boolean;
  maxAttempts: 2;
}

// Matching & Discovery
export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  matchedAt: Date;
  initiatedBy: string; // userId who liked first
  conversationId?: string;
  unmatched: boolean;
}

export interface Swipe {
  id: string;
  userId: string;
  targetUserId: string;
  type: 'like' | 'pass' | 'super_like';
  createdAt: Date;
}

export interface SwipeSession {
  userId: string;
  swipesToday: number;
  lastSwipeAt: Date;
  remainingSwipes: number; // -1 for unlimited (premium)
}

// Messaging
export interface Conversation {
  id: string;
  participants: string[];
  matchId: string;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'location' | 'booking_request';
  readAt?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// Booking System
export interface Booking {
  id: string;
  clientId: string; // Looking for Boyfriend user
  boyfriendId: string; // Become a Boyfriend user
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'disputed';

  date: Date;
  duration: number; // in hours
  location: {
    type: 'host' | 'travel' | 'public';
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  pricing: {
    baseRate: number;
    duration: number;
    total: number;
    currency: string;
  };

  services: string[];
  notes?: string;

  // Safety & Verification
  requiresIDVerification: boolean;
  requiresDeposit: boolean;
  depositAmount?: number;
  depositPaid: boolean;

  // Reviews
  clientReview?: Review;
  boyfriendReview?: Review;

  // Timestamps
  createdAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number; // 1-5
  comment?: string;
  wouldRecommend: boolean;
  tags: string[]; // "punctual", "respectful", "great_conversation", etc.
  createdAt: Date;
}

// Abuse & Safety
export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: ReportReason;
  description: string;
  evidence?: {
    screenshots: string[];
    conversationId?: string;
    bookingId?: string;
  };
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Ban {
  id: string;
  userId: string;
  reason: string;
  reportId?: string;
  duration: number; // days, -1 for permanent
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
  appealable: boolean;
}

// Premium & Payments
export interface Subscription {
  id: string;
  userId: string;
  plan: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod: {
    type: 'card' | 'paypal' | 'google_pay' | 'apple_pay';
    last4?: string;
  };
  price: number;
  currency: string;
}

// GDPR & Privacy
export interface GDPRRequest {
  id: string;
  userId: string;
  type: 'data_export' | 'data_deletion' | 'rectification' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string; // for data exports
}

export interface ConsentRecord {
  userId: string;
  marketing: boolean;
  analytics: boolean;
  cookies: boolean;
  dataSharingThirdParty: boolean;
  grantedAt: Date;
  updatedAt: Date;
  ipAddress: string;
}

// Grid View
export interface GridViewFilter {
  bodyTypes?: BodyType[];
  ageRange?: { min: number; max: number };
  distance?: number;
  onlineOnly?: boolean;
  verifiedOnly?: boolean;
  kinks?: {
    intensity?: KinkIntensity[];
    activities?: KinkActivity[];
    positions?: Position[];
  };
  availability?: {
    startDate?: Date;
    endDate?: Date;
  };
}

export interface GridViewProfile {
  id: string;
  photos: string[]; // URLs
  name: string;
  age: number;
  distance: string;
  online: boolean;
  verified: boolean;
  bodyType: BodyType[];
  availability?: string;
  isPremium: boolean;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: 'match' | 'message' | 'like' | 'super_like' | 'booking' | 'review' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: Date;
}

// Analytics & Tracking
export interface UserActivity {
  userId: string;
  action: 'profile_view' | 'swipe' | 'message' | 'booking' | 'report' | 'block';
  targetId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

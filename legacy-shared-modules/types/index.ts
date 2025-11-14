export interface Profile {
  id: string;
  name: string;
  age: number;
  distance: string;
  online: boolean;
  photo: string;
  photos?: string[];
  bio: string;
  verified: boolean;
  location?: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
  availability?: {
    meetNow: boolean;
    schedule: TimeSlot[];
  };
  membership?: {
    tier: 'free' | 'premium' | 'elite';
    expiresAt?: Date;
  };
  preferences?: {
    ageRange: [number, number];
    distance: number;
    tribes: string[];
    lookingFor: string[];
    kinks?: string[];
    roles?: string[];
    bookingPreferences?: {
      preferredMeetingTypes: string[];
      availability: string[];
      budgetRange: [number, number];
      communicationStyle: string[];
      safetyPreferences: string[];
      specialRequests: string[];
    };
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
}

export interface TimeSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Booking {
  id: string;
  profileId: string;
  profile?: Profile;
  userId?: string;
  date: Date;
  time: string;
  timeSlot?: TimeSlot;
  location:
    | {
        name: string;
        address: string;
        lat: number;
        lng: number;
      }
    | string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meetingType?: 'coffee' | 'dinner' | 'drinks' | 'activity' | 'custom';
  notes?: string;
  createdAt: Date;
  kinks?: string[];
  roles?: string[];
  bookingPreferences?: {
    preferredMeetingTypes: string[];
    availability: string[];
    budgetRange: [number, number];
    communicationStyle: string[];
    safetyPreferences: string[];
    specialRequests: string[];
  };
}

export interface Subscription {
  id: string;
  userId: string;
  tier: 'premium' | 'elite';
  status: 'active' | 'cancelled' | 'expired';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
}

export interface Wallet {
  id: string;
  balance: number;
  currency: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

export type MessageType = 'text' | 'image' | 'voice' | 'emoji' | 'system';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type?: MessageType;
  isOptimistic?: boolean;
  sendError?: string;
  profile?: Profile;
}

export interface Notification {
  id: string;
  type: 'match' | 'message' | 'booking' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  profileId?: string;
  actionUrl?: string;
}

/**
 * 🎭 Mock Data for Development & Testing
 *
 * Production note: Replace with actual Supabase queries in production
 */

import type { Profile, Message, Booking, Notification } from '@/types';

export const mockProfiles: Profile[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    age: 28,
    distance: '2.5 km',
    online: true,
    photo: 'https://i.pravatar.cc/300?img=12',
    photos: [
      'https://i.pravatar.cc/600?img=12',
      'https://i.pravatar.cc/600?img=13',
      'https://i.pravatar.cc/600?img=14',
    ],
    bio: 'Adventure seeker, coffee enthusiast, and weekend hiker. Looking for someone to explore the city with.',
    verified: true,
    location: {
      lat: 40.7128,
      lng: -74.006,
      city: 'New York',
      country: 'USA',
    },
    availability: {
      meetNow: true,
      schedule: [],
    },
    membership: {
      tier: 'premium',
    },
    stats: {
      views: 1247,
      favorites: 89,
      matches: 34,
      responseRate: 92,
    },
    verification: {
      email: true,
      phone: true,
      photo: true,
      identity: false,
    },
    preferences: {
      ageRange: [25, 35],
      distance: 10,
      tribes: ['adventure', 'foodie', 'fitness'],
      lookingFor: ['long-term', 'casual'],
      kinks: ['BDSM', 'roleplay', 'sensory play'],
      roles: ['switch', 'dominant'],
      bookingPreferences: {
        preferredMeetingTypes: ['dinner', 'activity', 'custom'],
        availability: ['weekends', 'evenings'],
        budgetRange: [50, 200],
        communicationStyle: ['direct', 'playful'],
        safetyPreferences: ['public first meeting', 'verified only'],
        specialRequests: ['no pressure', 'clear boundaries'],
      },
    },
  },
  {
    id: '2',
    name: 'Jordan Chen',
    age: 26,
    distance: '4.2 km',
    online: false,
    photo: 'https://i.pravatar.cc/300?img=15',
    photos: [
      'https://i.pravatar.cc/600?img=15',
      'https://i.pravatar.cc/600?img=16',
    ],
    bio: "Foodie, gym enthusiast, and dog lover. Let's grab brunch!",
    verified: true,
    location: {
      lat: 40.758,
      lng: -73.9855,
      city: 'New York',
      country: 'USA',
    },
    membership: {
      tier: 'elite',
    },
    stats: {
      views: 2341,
      favorites: 156,
      matches: 67,
      responseRate: 88,
    },
    verification: {
      email: true,
      phone: true,
      photo: true,
      identity: true,
    },
    preferences: {
      ageRange: [24, 32],
      distance: 15,
      tribes: ['foodie', 'wellness', 'travel'],
      lookingFor: ['serious', 'friendship'],
      kinks: ['vanilla', 'romantic', 'sensual'],
      roles: ['submissive', 'pleaser'],
      bookingPreferences: {
        preferredMeetingTypes: ['coffee', 'brunch', 'drinks'],
        availability: ['weekends', 'afternoons'],
        budgetRange: [30, 150],
        communicationStyle: ['respectful', 'romantic'],
        safetyPreferences: ['verified profiles', 'video chat first'],
        specialRequests: ['slow pace', 'emotional connection'],
      },
    },
  },
  {
    id: '3',
    name: 'Sam Martinez',
    age: 30,
    distance: '1.8 km',
    online: true,
    photo: 'https://i.pravatar.cc/300?img=18',
    photos: [
      'https://i.pravatar.cc/600?img=18',
      'https://i.pravatar.cc/600?img=19',
      'https://i.pravatar.cc/600?img=20',
      'https://i.pravatar.cc/600?img=21',
    ],
    bio: 'Artist and musician. Love live shows and good conversations.',
    verified: false,
    location: {
      lat: 40.7589,
      lng: -73.9851,
      city: 'New York',
      country: 'USA',
    },
    membership: {
      tier: 'free',
    },
    stats: {
      views: 567,
      favorites: 34,
      matches: 12,
      responseRate: 75,
    },
    verification: {
      email: true,
      phone: false,
      photo: false,
      identity: false,
    },
    preferences: {
      ageRange: [28, 40],
      distance: 20,
      tribes: ['creative', 'music', 'art'],
      lookingFor: ['casual', 'fun'],
      kinks: ['experimental', 'kink-friendly', 'open-minded'],
      roles: ['explorer', 'curious'],
      bookingPreferences: {
        preferredMeetingTypes: ['activity', 'custom', 'drinks'],
        availability: ['evenings', 'late night'],
        budgetRange: [20, 100],
        communicationStyle: ['creative', 'spontaneous'],
        safetyPreferences: ['mutual consent', 'clear communication'],
        specialRequests: ['be yourself', 'no expectations'],
      },
    },
  },
];

export const mockMessages: Message[] = [
  {
    id: 'm1',
    senderId: '1',
    receiverId: 'current-user',
    content: "Hey! How's your day going?",
    timestamp: new Date(Date.now() - 3600000),
    read: true,
    profile: mockProfiles[0]!,
  },
  {
    id: 'm2',
    senderId: '2',
    receiverId: 'current-user',
    content: 'Still up for coffee this weekend?',
    timestamp: new Date(Date.now() - 7200000),
    read: false,
    profile: mockProfiles[1]!,
  },
  {
    id: 'm3',
    senderId: '3',
    receiverId: 'current-user',
    content: 'Thanks for the great evening!',
    timestamp: new Date(Date.now() - 86400000),
    read: true,
    profile: mockProfiles[2]!,
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    profileId: '1',
    profile: mockProfiles[0]!,
    date: new Date(Date.now() + 86400000),
    time: '19:00',
    location: 'Central Park Cafe',
    status: 'confirmed',
    createdAt: new Date(Date.now() - 172800000),
    kinks: ['BDSM', 'roleplay', 'sensory play'],
    roles: ['switch', 'dominant'],
    bookingPreferences: {
      preferredMeetingTypes: ['dinner', 'activity', 'custom'],
      availability: ['weekends', 'evenings'],
      budgetRange: [50, 200],
      communicationStyle: ['direct', 'playful'],
      safetyPreferences: ['public first meeting', 'verified only'],
      specialRequests: ['no pressure', 'clear boundaries'],
    },
  },
  {
    id: 'b2',
    profileId: '2',
    profile: mockProfiles[1]!,
    date: new Date(Date.now() + 259200000),
    time: '11:00',
    location: 'Brooklyn Brunch Spot',
    status: 'pending',
    createdAt: new Date(Date.now() - 86400000),
    kinks: ['vanilla', 'romantic', 'sensual'],
    roles: ['submissive', 'pleaser'],
    bookingPreferences: {
      preferredMeetingTypes: ['coffee', 'brunch', 'drinks'],
      availability: ['weekends', 'afternoons'],
      budgetRange: [30, 150],
      communicationStyle: ['respectful', 'romantic'],
      safetyPreferences: ['verified profiles', 'video chat first'],
      specialRequests: ['slow pace', 'emotional connection'],
    },
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'match',
    title: 'New Match!',
    message: 'You matched with Alex Rivera',
    timestamp: new Date(Date.now() - 3600000),
    read: false,
    profileId: '1',
  },
  {
    id: 'n2',
    type: 'message',
    title: 'New Message',
    message: 'Jordan Chen sent you a message',
    timestamp: new Date(Date.now() - 7200000),
    read: false,
    profileId: '2',
  },
  {
    id: 'n3',
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your date with Alex Rivera is confirmed',
    timestamp: new Date(Date.now() - 172800000),
    read: true,
    profileId: '1',
  },
];

export const mockCurrentUser: Profile = {
  id: 'current-user',
  name: 'You',
  age: 27,
  distance: '0 km',
  online: true,
  photo: 'https://i.pravatar.cc/300?img=50',
  photos: [
    'https://i.pravatar.cc/600?img=50',
    'https://i.pravatar.cc/600?img=51',
    'https://i.pravatar.cc/600?img=52',
  ],
  bio: 'Living life to the fullest! Love traveling, photography, and meeting new people.',
  verified: true,
  location: {
    lat: 40.7128,
    lng: -74.006,
    city: 'New York',
    country: 'USA',
  },
  membership: {
    tier: 'premium',
    expiresAt: new Date(Date.now() + 2592000000),
  },
  preferences: {
    ageRange: [24, 35],
    distance: 10,
    tribes: ['adventure', 'foodie', 'fitness'],
    lookingFor: ['dating', 'friendship'],
  },
  stats: {
    views: 3456,
    favorites: 234,
    matches: 89,
    responseRate: 95,
  },
  verification: {
    email: true,
    phone: true,
    photo: true,
    identity: true,
  },
};

// Helper to simulate API delay
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

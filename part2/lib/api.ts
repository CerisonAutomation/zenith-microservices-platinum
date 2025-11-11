/**
 * 📡 Mock API Service Layer - Development Mode
 * 
 * For local development and testing.
 * Replace with real Supabase calls in production.
 */

import type { Profile, Message, Booking } from '@/types';
import { mockProfiles, mockMessages, mockBookings, mockNotifications, delay } from './mockData';

export const profilesApi = {
  async getProfiles() {
    await delay(300);
    return mockProfiles;
  },

  async getProfile(id: string) {
    await delay(200);
    return mockProfiles.find(p => p.id === id) || mockProfiles[0];
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    await delay(300);
    const profile = mockProfiles.find(p => p.id === userId);
    return profile ? { ...profile, ...updates } : mockProfiles[0];
  },

  async toggleFavorite(_userId: string, _profileId: string) {
    await delay(200);
    return true;
  },

  async getFavorites(_userId: string) {
    await delay(300);
    return mockProfiles.slice(0, 3);
  },
};

export const messagesApi = {
  async getConversations(_userId: string) {
    await delay(300);
    return mockMessages;
  },

  async getMessages(userId: string, otherUserId: string) {
    await delay(300);
    return mockMessages.filter(m => 
      (m.senderId === userId && m.receiverId === otherUserId) ||
      (m.senderId === otherUserId && m.receiverId === userId)
    );
  },

  async sendMessage(senderId: string, receiverId: string, content: string) {
    await delay(200);
    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId,
      receiverId,
      content,
      timestamp: new Date(),
      read: false,
    };
    return newMessage;
  },

  async markAsRead(_messageId: string) {
    await delay(150);
    return true;
  },
};

export const bookingsApi = {
  async getBookings(_userId: string) {
    await delay(300);
    return mockBookings;
  },

  async createBooking(booking: Omit<Booking, 'id' | 'createdAt'>) {
    await delay(300);
    const newBooking: Booking = {
      ...booking,
      id: `b${Date.now()}`,
      createdAt: new Date(),
    };
    return newBooking;
  },

  async updateBookingStatus(bookingId: string, status: Booking['status']) {
    await delay(200);
    const booking = mockBookings.find(b => b.id === bookingId);
    return booking ? { ...booking, status } : mockBookings[0];
  },

  async cancelBooking(bookingId: string) {
    return this.updateBookingStatus(bookingId, 'cancelled');
  },
};

export const notificationsApi = {
  async getNotifications(_userId: string, limit = 50) {
    await delay(300);
    return mockNotifications.slice(0, limit);
  },

  async markAsRead(_notificationId: string) {
    await delay(150);
    return true;
  },

  async markAllAsRead(_userId: string) {
    await delay(200);
    return true;
  },
};

export const api = {
  profiles: profilesApi,
  messages: messagesApi,
  bookings: bookingsApi,
  notifications: notificationsApi,
};

export default api;

/**
 * 🌐 Application Context
 *
 * Global state management for:
 * - User profiles
 * - Notifications
 * - App settings
 * - Real-time updates
 */

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  supabase,
  isSupabaseConfigured,
  subscribeToNotifications,
  getUser,
  getProfiles
} from '@/lib/supabase';
import {
  userService,
  notificationService,
  discoveryService
} from '@/lib/api';
import { mockUser, mockNotifications, mockProfiles } from '@/lib/mockData';

interface Profile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio?: string;
  age: number;
  gender: string;
  location: string;
  interests: string[];
  isPremium: boolean;
  verified: boolean;
  [key: string]: unknown;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  avatar?: string;
  [key: string]: unknown;
}

interface AppContextType {
  currentProfile: Profile | null;
  profiles: Profile[];
  notifications: Notification[];
  unreadCount: number;
  isDemoMode: boolean;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  refreshProfile: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Load user profile and data
  useEffect(() => {
    const initData = async () => {
      const configured = isSupabaseConfigured();
      setIsDemoMode(!configured);

      if (user) {
        if (!configured) {
          // Demo mode: use mock data
          console.log('🎭 AppContext: Using mock data in demo mode');
          setCurrentProfile(mockUser as Profile);
          setProfiles(mockProfiles as Profile[]);
          setNotifications(mockNotifications as Notification[]);
        } else {
          // Production mode: load from backend
          console.log('🔐 AppContext: Loading data from backend');
          await loadUserProfile();
          await loadProfiles();
          await loadNotifications();

          // Subscribe to real-time notifications
          const channel = subscribeToNotifications(user.id, (payload) => {
            console.log('📬 New notification:', payload);
            if (payload.new) {
              setNotifications((prev) => [payload.new as Notification, ...prev]);
            }
          });

          return () => {
            channel.unsubscribe();
          };
        }
      } else {
        setCurrentProfile(null);
        setProfiles([]);
        setNotifications([]);
      }
    };

    initData();
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // Try API service first, fall back to Supabase
      try {
        const data = await userService.getProfile();
        setCurrentProfile(data as Profile);
      } catch (apiError) {
        console.log('API service unavailable, trying Supabase directly');
        const data = await getUser(user.id);
        setCurrentProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to mock data on error
      console.log('Falling back to mock profile data');
      setCurrentProfile(mockUser as any);
    }
  };

  const loadProfiles = async () => {
    try {
      // Try API service first, fall back to Supabase
      try {
        const data = await discoveryService.getProfiles();
        setProfiles(data as Profile[]);
      } catch (apiError) {
        console.log('API service unavailable, trying Supabase directly');
        const data = await getProfiles();
        setProfiles(data as Profile[]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      // Fallback to mock data on error
      console.log('Falling back to mock profiles data');
      setProfiles(mockProfiles as any);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // Try API service first, fall back to Supabase
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data as Notification[]);
      } catch (apiError) {
        console.log('API service unavailable, trying Supabase directly');
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setNotifications(data as Notification[]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to mock data on error
      console.log('Falling back to mock notifications data');
      setNotifications(mockNotifications as any);
    }
  };

  const refreshProfile = async () => {
    if (!isDemoMode) {
      await loadUserProfile();
    }
  };

  const refreshProfiles = async () => {
    if (!isDemoMode) {
      await loadProfiles();
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !currentProfile) return;

    if (isDemoMode) {
      console.log('🎭 Demo mode: Profile update simulated');
      setCurrentProfile({ ...currentProfile, ...updates });
      return;
    }

    try {
      // Try API service first, fall back to Supabase
      try {
        const data = await userService.updateProfile(updates);
        setCurrentProfile(data as Profile);
      } catch (apiError) {
        console.log('API service unavailable, trying Supabase directly');
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        setCurrentProfile(data as Profile);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );

    if (!isDemoMode) {
      try {
        await notificationService.markAsRead(id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const markAllNotificationsAsRead = async () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );

    if (!isDemoMode && user) {
      try {
        await notificationService.markAllAsRead();
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = {
    currentProfile,
    profiles,
    notifications,
    unreadCount,
    isDemoMode,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshProfile,
    refreshProfiles,
    updateProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

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
import { supabase, subscribeToTable } from '@/lib/supabase';
import { Profile, Notification, ProfileUpdate, NotificationUpdate } from '@/types';
import { mockCurrentUser, mockNotifications } from '@/lib/mockData';

interface AppContextType {
  currentProfile: Profile | null;
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load user profile
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadNotifications();
      
      // Subscribe to real-time notifications
      const unsubscribe = subscribeToTable(
        'notifications',
        (payload) => {
          if (payload.new) {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        },
        `user_id=eq.${user.id}`
      );

      return unsubscribe;
    } else {
      setCurrentProfile(null);
      setNotifications([]);
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .single();
      
      // if (error) throw error;
      // setCurrentProfile(data);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setCurrentProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      // TODO: Replace with actual Supabase query
      // const { data, error } = await supabase
      //   .from('notifications')
      //   .select('*')
      //   .eq('user_id', user.id)
      //   .order('created_at', { ascending: false })
      //   .limit(50);
      
      // if (error) throw error;
      // setNotifications(data);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  const updateProfile = async (updates: ProfileUpdate) => {
    if (!user || !currentProfile) return;

    try {
      // TODO: Replace with actual Supabase mutation
      // const { data, error } = await supabase
      //   .from('profiles')
      //   .update(updates)
      //   .eq('user_id', user.id)
      //   .select()
      //   .single();
      
      // if (error) throw error;
      // setCurrentProfile(data);

      const { data, error } = await (supabase as any)
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      setCurrentProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, is_read: true } : notif
      )
    );

    (supabase as any)
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .then();
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, is_read: true }))
    );

    // TODO: Update in Supabase
    // if (user) {
    //   supabase
    //     .from('notifications')
    //     .update({ is_read: true })
    //     .eq('user_id', user.id)
    //     .then();
    // }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const value = {
    currentProfile,
    notifications,
    unreadCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshProfile,
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

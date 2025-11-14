/**
 * 🌐 Application Context
 * 
 * Global state management for:
 * - User profiles
 * - Notifications
 * - App settings
 * - Real-time updates
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase, subscribeToTable } from '@/lib/supabase';
import { Profile, Notification } from '@/types';
import { mockCurrentUser, mockNotifications } from '@/lib/mockData';

interface AppContextType {
  currentProfile: Profile | null;
  notifications: Notification[];
  unreadCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
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
      return undefined;
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If profile doesn't exist yet, use mock data as fallback
        console.warn('Profile not found in database, using mock data:', error);
        setCurrentProfile({ ...mockCurrentUser, id: user.id, user_id: user.id });
        return;
      }

      // Map database fields to Profile type
      const profile: Profile = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        age: data.age,
        bio: data.bio,
        photo: data.photo,
        photos: data.photos,
        location: data.location,
        distance: data.distance,
        interests: data.interests,
        occupation: data.occupation,
        education: data.education,
        height: data.height,
        gender: data.gender,
        looking_for: data.looking_for,
        relationship_type: data.relationship_type,
        verified: data.verified,
        premium: data.premium,
        online: data.online,
        last_active: data.last_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setCurrentProfile(profile);
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to mock data on error
      setCurrentProfile({ ...mockCurrentUser, id: user.id, user_id: user.id });
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // If notifications table doesn't exist or is empty, use mock data
        console.warn('Notifications not found in database, using mock data:', error);
        setNotifications(mockNotifications);
        return;
      }

      // Map database fields to Notification type
      const notifications: Notification[] = (data || []).map((notif: any) => ({
        id: notif.id,
        user_id: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        read: notif.read,
        action_url: notif.action_url,
        metadata: notif.metadata,
        created_at: notif.created_at,
        updated_at: notif.updated_at,
      }));

      setNotifications(notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Fallback to mock data on error
      setNotifications(mockNotifications);
    }
  };

  const refreshProfile = async () => {
    await loadUserProfile();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !currentProfile) return;

    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile in database:', error);
        // Still update local state even if database update fails
        setCurrentProfile({ ...currentProfile, ...updates });
        throw error;
      }

      // Map database response to Profile type
      const profile: Profile = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        age: data.age,
        bio: data.bio,
        photo: data.photo,
        photos: data.photos,
        location: data.location,
        distance: data.distance,
        interests: data.interests,
        occupation: data.occupation,
        education: data.education,
        height: data.height,
        gender: data.gender,
        looking_for: data.looking_for,
        relationship_type: data.relationship_type,
        verified: data.verified,
        premium: data.premium,
        online: data.online,
        last_active: data.last_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setCurrentProfile(profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const markNotificationAsRead = async (id: string) => {
    // Update local state immediately for better UX
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );

    // Update in Supabase
    try {
      const { error } = await (supabase as any)
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Error marking notification as read:', error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    // Update local state immediately for better UX
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );

    // Update in Supabase
    if (user) {
      try {
        const { error } = await (supabase as any)
          .from('notifications')
          .update({ read: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (error) {
          console.error('Error marking all notifications as read:', error);
        }
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

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

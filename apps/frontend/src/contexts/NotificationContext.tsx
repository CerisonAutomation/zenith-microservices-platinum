/**
 * 🔔 NOTIFICATION CONTEXT
 * Real-time notification system with persistence and categorization
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { safeGetItem, safeSetItem } from '@/lib/safeStorage';
import { useToast } from '@/components/ui/use-toast';

export enum NotificationType {
  MESSAGE = 'message',
  MATCH = 'match',
  LIKE = 'like',
  SUPER_LIKE = 'super_like',
  BOOKING = 'booking',
  TRIAL_EXPIRING = 'trial_expiring',
  SUBSCRIPTION = 'subscription',
  PROFILE_VIEW = 'profile_view',
  SYSTEM = 'system',
  ACHIEVEMENT = 'achievement',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  getByType: (type: NotificationType) => Notification[];
  getUnreadByType: (type: NotificationType) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const MAX_NOTIFICATIONS = 100; // Keep last 100 notifications

export function NotificationProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { toast } = useToast();

  // Load notifications from storage on mount
  useEffect(() => {
    if (!userId) return;

    const storageKey = `zenith_notifications_${userId}`;
    const result = safeGetItem<Notification[]>(storageKey);

    if (result.success && result.data) {
      // Convert dates back from strings
      const loaded = result.data.map(n => ({
        ...n,
        createdAt: new Date(n.createdAt),
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
      }));

      // Filter out expired notifications
      const now = new Date();
      const valid = loaded.filter(n => !n.expiresAt || n.expiresAt > now);

      setNotifications(valid);
      console.log(`✅ Loaded ${valid.length} notifications for user ${userId}`);
    }
  }, [userId]);

  // Save notifications to storage whenever they change
  useEffect(() => {
    if (!userId || notifications.length === 0) return;

    const storageKey = `zenith_notifications_${userId}`;

    // Keep only recent notifications to avoid storage bloat
    const toSave = notifications.slice(0, MAX_NOTIFICATIONS);

    safeSetItem(storageKey, toSave);
  }, [notifications, userId]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS));

    // Show toast for high/urgent priority notifications
    if (notification.priority === NotificationPriority.HIGH || notification.priority === NotificationPriority.URGENT) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === NotificationPriority.URGENT ? 'destructive' : 'default',
      });
    }

    console.log(`🔔 New ${notification.type} notification:`, notification.title);
  }, [toast]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const getByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  const getUnreadByType = useCallback((type: NotificationType) => {
    return notifications.filter(n => n.type === type && !n.read);
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    getByType,
    getUnreadByType,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

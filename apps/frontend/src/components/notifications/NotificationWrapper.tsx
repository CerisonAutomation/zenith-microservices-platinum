/**
 * 🔔 NOTIFICATION WRAPPER
 * Provides notification system to entire app with user context
 */

'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import NotificationBell from './NotificationBell';

export function NotificationWrapper({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <NotificationProvider userId={user?.id}>
      {children}
      {/* Notification Bell - Always visible when user is logged in */}
      {user && (
        <div className="fixed top-4 right-4 z-40">
          <NotificationBell />
        </div>
      )}
    </NotificationProvider>
  );
}

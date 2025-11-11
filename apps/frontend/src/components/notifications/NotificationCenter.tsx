/**
 * 🔔 NOTIFICATION CENTER
 * Beautiful notification panel with filtering and actions
 */

'use client';

import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, Heart, MessageCircle, Calendar, Sparkles, User, AlertCircle, Trophy } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, NotificationType, NotificationPriority, type Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const notificationIcons: Record<NotificationType, any> = {
  [NotificationType.MESSAGE]: MessageCircle,
  [NotificationType.MATCH]: Heart,
  [NotificationType.LIKE]: Heart,
  [NotificationType.SUPER_LIKE]: Sparkles,
  [NotificationType.BOOKING]: Calendar,
  [NotificationType.TRIAL_EXPIRING]: AlertCircle,
  [NotificationType.SUBSCRIPTION]: Sparkles,
  [NotificationType.PROFILE_VIEW]: User,
  [NotificationType.SYSTEM]: Bell,
  [NotificationType.ACHIEVEMENT]: Trophy,
};

const priorityColors: Record<NotificationPriority, string> = {
  [NotificationPriority.LOW]: 'bg-gray-500',
  [NotificationPriority.MEDIUM]: 'bg-blue-500',
  [NotificationPriority.HIGH]: 'bg-amber-500',
  [NotificationPriority.URGENT]: 'bg-red-500',
};

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications;

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.actionUrl) {
      // Navigate to action URL
      window.location.href = notification.actionUrl;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 backdrop-blur-xl border-l border-white/10 shadow-2xl z-50 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold text-white">Notifications</h2>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/10"
            >
              ✕
            </Button>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')} className="w-full">
            <TabsList className="w-full bg-white/5">
              <TabsTrigger value="all" className="flex-1">
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex-1">
                Unread ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {notifications.length > 0 && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="flex-1 bg-white/5 border-white/20 text-white hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1 p-4">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Bell className="w-16 h-16 text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </h3>
              <p className="text-sm text-gray-500">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : "We'll notify you when something happens"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const priorityColor = priorityColors[notification.priority];

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      notification.read
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full ${priorityColor} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-white text-sm line-clamp-1">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                          )}
                        </div>

                        <p className="text-sm text-gray-300 line-clamp-2 mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                          </span>

                          {notification.actionLabel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-purple-400 hover:text-purple-300 h-6 px-2"
                            >
                              {notification.actionLabel}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 text-gray-400 hover:text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6 text-gray-400 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}

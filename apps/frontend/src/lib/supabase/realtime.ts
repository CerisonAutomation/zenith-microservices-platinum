/**
 * ============================================
 * ADVANCED REAL-TIME SUBSCRIPTIONS
 * ============================================
 * Optimized real-time functionality for Supabase
 * - Type-safe subscriptions
 * - Automatic reconnection
 * - Memory leak prevention
 * - Performance optimizations
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

// ============================================
// SUBSCRIPTION MANAGER
// ============================================

class SubscriptionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  /**
   * Subscribe to database changes
   */
  subscribe<T extends TableName>(
    table: T,
    filter?: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
    },
    callback: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void
  ): () => void {
    const supabase = createClient();
    if (!supabase) {
      console.warn('Supabase client not available for real-time subscription');
      return () => {};
    }

    const channelName = `${table}_${filter?.event || 'all'}_${filter?.filter || 'all'}`;

    // Return existing channel if already subscribed
    if (this.channels.has(channelName)) {
      return () => this.unsubscribe(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as const,
        {
          event: filter?.event || '*',
          schema: 'public',
          table: table as string,
          filter: filter?.filter,
        },
        callback as any
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Subscribed to ${channelName}`);
          this.reconnectAttempts.set(channelName, 0);
        } else if (status === 'CHANNEL_ERROR') {
          this.handleReconnect(channelName, table, filter, callback);
        }
      });

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Unsubscribe from channel
   */
  private async unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.unsubscribe();
      this.channels.delete(channelName);
      this.reconnectAttempts.delete(channelName);
      console.log(`🔌 Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect<T extends TableName>(
    channelName: string,
    table: T,
    filter: any,
    callback: any
  ) {
    const attempts = this.reconnectAttempts.get(channelName) || 0;

    if (attempts < this.maxReconnectAttempts) {
      console.log(`🔄 Attempting to reconnect ${channelName} (${attempts + 1}/${this.maxReconnectAttempts})`);
      this.reconnectAttempts.set(channelName, attempts + 1);

      setTimeout(() => {
        this.unsubscribe(channelName);
        this.subscribe(table, filter, callback);
      }, Math.min(1000 * Math.pow(2, attempts), 10000)); // Exponential backoff
    } else {
      console.error(`❌ Max reconnection attempts reached for ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll() {
    const promises = Array.from(this.channels.keys()).map((channelName) =>
      this.unsubscribe(channelName)
    );
    await Promise.all(promises);
  }
}

// Global subscription manager instance
const subscriptionManager = new SubscriptionManager();

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Subscribe to new messages for a user
 */
export function subscribeToMessages(
  userId: string,
  callback: (message: Tables['messages']['Row']) => void
): () => void {
  return subscriptionManager.subscribe(
    'messages',
    {
      event: 'INSERT',
      filter: `receiver_id=eq.${userId}`,
    },
    (payload) => {
      callback(payload.new as Tables['messages']['Row']);
    }
  );
}

/**
 * Subscribe to conversation updates
 */
export function subscribeToConversation(
  conversationId: string,
  callback: (message: Tables['messages']['Row']) => void
): () => void {
  return subscriptionManager.subscribe(
    'messages',
    {
      event: 'INSERT',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      callback(payload.new as Tables['messages']['Row']);
    }
  );
}

/**
 * Subscribe to matches for a user
 */
export function subscribeToMatches(
  userId: string,
  callback: (match: Tables['matches']['Row']) => void
): () => void {
  return subscriptionManager.subscribe(
    'matches',
    {
      event: 'INSERT',
    },
    (payload) => {
      const match = payload.new as Tables['matches']['Row'];
      // Only notify if this user is part of the match
      if (match.user1_id === userId || match.user2_id === userId) {
        callback(match);
      }
    }
  );
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: Tables['notifications']['Row']) => void
): () => void {
  return subscriptionManager.subscribe(
    'notifications',
    {
      event: 'INSERT',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      callback(payload.new as Tables['notifications']['Row']);
    }
  );
}

/**
 * Subscribe to user online status
 */
export function subscribeToUserStatus(
  userId: string,
  callback: (user: Pick<Tables['users']['Row'], 'last_seen_at' | 'id'>) => void
): () => void {
  return subscriptionManager.subscribe(
    'users',
    {
      event: 'UPDATE',
      filter: `id=eq.${userId}`,
    },
    (payload) => {
      const user = payload.new as Tables['users']['Row'];
      callback({
        id: user.id,
        last_seen_at: user.last_seen_at,
      });
    }
  );
}

/**
 * Subscribe to typing indicators (using presence)
 */
export function subscribeToTypingStatus(
  conversationId: string,
  onUserTyping: (userId: string, isTyping: boolean) => void
): () => void {
  const supabase = createClient();
  if (!supabase) return () => {};

  const channelName = `typing:${conversationId}`;
  const channel = supabase.channel(channelName);

  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      Object.entries(state).forEach(([userId, presence]) => {
        const isTyping = (presence[0] as any)?.typing || false;
        onUserTyping(userId, isTyping);
      });
    })
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Broadcast typing status
 */
export async function broadcastTyping(conversationId: string, isTyping: boolean): Promise<void> {
  const supabase = createClient();
  if (!supabase) return;

  const channelName = `typing:${conversationId}`;
  const channel = supabase.channel(channelName);

  await channel.subscribe();
  await channel.track({ typing: isTyping });
}

/**
 * Subscribe to read receipts
 */
export function subscribeToReadReceipts(
  conversationId: string,
  callback: (message: Tables['messages']['Row']) => void
): () => void {
  return subscriptionManager.subscribe(
    'messages',
    {
      event: 'UPDATE',
      filter: `conversation_id=eq.${conversationId}`,
    },
    (payload) => {
      const message = payload.new as Tables['messages']['Row'];
      if (message.is_read) {
        callback(message);
      }
    }
  );
}

/**
 * Cleanup all subscriptions (call on component unmount)
 */
export async function cleanupSubscriptions(): Promise<void> {
  await subscriptionManager.unsubscribeAll();
}

/**
 * React hook for real-time subscriptions
 */
export function useRealtimeSubscription<T extends TableName>(
  table: T,
  filter: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string;
  },
  callback: (payload: RealtimePostgresChangesPayload<Tables[T]['Row']>) => void,
  deps: React.DependencyList = []
): void {
  const { useEffect } = require('react');

  useEffect(() => {
    const unsubscribe = subscriptionManager.subscribe(table, filter, callback);

    return () => {
      unsubscribe();
    };
  }, deps);
}

// ============================================
// PRESENCE CHANNEL (FOR ONLINE STATUS)
// ============================================

/**
 * Join presence channel to show online status
 */
export async function joinPresenceChannel(userId: string): Promise<() => void> {
  const supabase = createClient();
  if (!supabase) return () => {};

  const channel = supabase.channel('online-users');

  await channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      console.log('Online users:', Object.keys(state).length);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
        });
      }
    });

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Get online users
 */
export function getOnlineUsers(): string[] {
  const supabase = createClient();
  if (!supabase) return [];

  const channel = supabase.channel('online-users');
  const state = channel.presenceState();

  return Object.keys(state);
}

export default subscriptionManager;

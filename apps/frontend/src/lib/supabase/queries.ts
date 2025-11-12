/**
 * ============================================
 * TYPE-SAFE QUERY BUILDERS
 * ============================================
 * Production-grade database queries with:
 * - Full type safety
 * - Query optimization
 * - Error handling
 * - Caching integration
 */

import { createClient } from '@/utils/supabase/client';
import { createClient as createServerClient } from '@/utils/supabase/server';
import type { Database } from '@/types/supabase';

type Tables = Database['public']['Tables'];

// ============================================
// QUERY CACHE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Clear entries matching pattern
    Array.from(this.cache.keys()).forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  invalidate(keys: string[]): void {
    keys.forEach((key) => this.cache.delete(key));
  }
}

const queryCache = new QueryCache();

// ============================================
// USER QUERIES
// ============================================

export const userQueries = {
  /**
   * Get user by ID
   */
  async getById(userId: string, useCache: boolean = true) {
    const cacheKey = `user:${userId}`;

    if (useCache) {
      const cached = queryCache.get<Tables['users']['Row']>(cacheKey);
      if (cached) return cached;
    }

    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    queryCache.set(cacheKey, data, 300000); // Cache for 5 minutes
    return data;
  },

  /**
   * Get user profile with all relations
   */
  async getFullProfile(userId: string) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        profile:profiles(*),
        photos(*, id, url, is_primary, position),
        preferences(*)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update user profile
   */
  async update(userId: string, updates: Partial<Tables['users']['Update']>) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate cache
    queryCache.clear(`user:${userId}`);

    return data;
  },

  /**
   * Search users by name
   */
  async searchByName(query: string, limit: number = 20) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, avatar_url, is_verified')
      .ilike('full_name', `%${query}%`)
      .eq('is_active', true)
      .eq('is_banned', false)
      .limit(limit);

    if (error) throw error;
    return data;
  },
};

// ============================================
// MATCH QUERIES
// ============================================

export const matchQueries = {
  /**
   * Get all matches for a user
   */
  async getMatches(userId: string) {
    const cacheKey = `matches:${userId}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:users!matches_user1_id_fkey(*),
        user2:users!matches_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .order('matched_at', { ascending: false });

    if (error) throw error;

    queryCache.set(cacheKey, data, 60000); // Cache for 1 minute
    return data;
  },

  /**
   * Get potential matches based on preferences
   */
  async getPotentialMatches(userId: string, limit: number = 20) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase.rpc('get_potential_matches', {
      for_user_id: userId,
      limit_count: limit,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Create a swipe/like
   */
  async createSwipe(
    userId: string,
    targetUserId: string,
    action: 'like' | 'dislike' | 'superlike'
  ) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('swipes')
      .insert({
        user_id: userId,
        target_user_id: targetUserId,
        action,
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate matches cache
    queryCache.clear(`matches:${userId}`);

    return data;
  },
};

// ============================================
// MESSAGE QUERIES
// ============================================

export const messageQueries = {
  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  },

  /**
   * Send message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    contentType: 'text' | 'image' | 'gif' | 'voice' = 'text'
  ) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        content_type: contentType,
      })
      .select()
      .single();

    if (error) throw error;

    // Invalidate conversations cache
    queryCache.clear(`conversations:${senderId}`);
    queryCache.clear(`conversations:${receiverId}`);

    return data;
  },

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get unread message count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },
};

// ============================================
// CONVERSATION QUERIES
// ============================================

export const conversationQueries = {
  /**
   * Get user conversations
   */
  async getConversations(userId: string) {
    const cacheKey = `conversations:${userId}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user1:users!conversations_user1_id_fkey(*),
        user2:users!conversations_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    queryCache.set(cacheKey, data, 30000); // Cache for 30 seconds
    return data;
  },

  /**
   * Get or create conversation between two users
   */
  async getOrCreate(user1Id: string, user2Id: string) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    // Sort IDs to match constraint
    const [userId1, userId2] = [user1Id, user2Id].sort();

    // Try to get existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('user1_id', userId1)
      .eq('user2_id', userId2)
      .single();

    if (existing) return existing;

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user1_id: userId1,
        user2_id: userId2,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  },
};

// ============================================
// NOTIFICATION QUERIES
// ============================================

export const notificationQueries = {
  /**
   * Get user notifications
   */
  async getNotifications(userId: string, limit: number = 50) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  },
};

// ============================================
// STATISTICS QUERIES
// ============================================

export const statsQueries = {
  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const cacheKey = `stats:${userId}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase.rpc('get_user_stats', {
      for_user_id: userId,
    });

    if (error) throw error;

    queryCache.set(cacheKey, data, 120000); // Cache for 2 minutes
    return data;
  },
};

// ============================================
// BATCH OPERATIONS
// ============================================

export const batchQueries = {
  /**
   * Get multiple users by IDs
   */
  async getUsersByIds(userIds: string[]) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds);

    if (error) throw error;
    return data;
  },

  /**
   * Mark multiple messages as read
   */
  async markMessagesAsRead(messageIds: string[]) {
    const supabase = createClient();
    if (!supabase) throw new Error('Supabase client not available');

    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', messageIds);

    if (error) throw error;
  },
};

// ============================================
// EXPORT
// ============================================

export { queryCache };

export default {
  users: userQueries,
  matches: matchQueries,
  messages: messageQueries,
  conversations: conversationQueries,
  notifications: notificationQueries,
  stats: statsQueries,
  batch: batchQueries,
  cache: queryCache,
};

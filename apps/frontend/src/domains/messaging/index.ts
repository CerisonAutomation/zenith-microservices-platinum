/**
 * 💬 Messaging Domain
 * Business logic for real-time messaging and chat functionality
 */

import type { Message } from '@/types';
import { messagesApi } from '@/lib/api';
import {
  supabaseCircuitBreaker,
  withCircuitBreaker,
} from '@/lib/circuitBreaker';
import { supabase } from '@/lib/supabase';

export class MessagingDomain {
  private static realtimeSubscription: any = null;

  /**
   * Get conversation list for user
   */
  static async getConversations(userId: string): Promise<Message[]> {
    return withCircuitBreaker(
      supabaseCircuitBreaker,
      () => messagesApi.getConversations(userId),
      () => [], // Fallback: empty array
    );
  }

  /**
   * Get messages for specific conversation
   */
  static async getConversationMessages(
    userId: string,
    otherUserId: string,
  ): Promise<Message[]> {
    return withCircuitBreaker(
      supabaseCircuitBreaker,
      () => messagesApi.getMessages(userId, otherUserId),
      () => [], // Fallback: empty array
    );
  }

  /**
   * Send message with validation
   */
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string,
  ): Promise<Message> {
    // Validate message
    this.validateMessage(content);

    const message = await withCircuitBreaker(supabaseCircuitBreaker, () =>
      messagesApi.sendMessage(senderId, receiverId, content),
    );

    // Emit domain event
    this.emitMessageEvent(MESSAGING_EVENTS.MESSAGE_SENT, message);

    return message;
  }

  /**
   * Mark message as read
   */
  static async markMessageAsRead(messageId: string): Promise<void> {
    await withCircuitBreaker(supabaseCircuitBreaker, () =>
      messagesApi.markAsRead(messageId),
    );

    this.emitMessageEvent(MESSAGING_EVENTS.MESSAGE_READ, { messageId });
  }

  /**
   * Start real-time messaging subscription
   */
  static startRealtimeMessaging(
    userId: string,
    onMessage: (message: Message) => void,
  ): void {
    if (this.realtimeSubscription) {
      this.stopRealtimeMessaging();
    }

    this.realtimeSubscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage: Message = {
            id: payload.new['id'],
            senderId: payload.new['sender_id'],
            receiverId: payload.new['receiver_id'],
            content: payload.new['content'],
            timestamp: new Date(payload.new['created_at']),
            read: false,
          };
          onMessage(newMessage);
          this.emitMessageEvent(MESSAGING_EVENTS.MESSAGE_RECEIVED, newMessage);
        },
      )
      .subscribe();
  }

  /**
   * Stop real-time messaging subscription
   */
  static stopRealtimeMessaging(): void {
    if (this.realtimeSubscription) {
      supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
  }

  /**
   * Get unread message count
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const conversations = await this.getConversations(userId);
      return conversations.filter(
        (msg) => !msg.read && msg.receiverId === userId,
      ).length;
    } catch {
      return 0; // Fallback on error
    }
  }

  /**
   * Validate message content
   */
  private static validateMessage(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Message cannot be empty');
    }

    if (content.length > 1000) {
      throw new Error('Message must be less than 1000 characters');
    }

    // Basic content filtering (could be enhanced with AI/ML)
    const blockedWords = ['spam', 'scam', 'inappropriate']; // Add more as needed
    const lowerContent = content.toLowerCase();
    const hasBlockedWords = blockedWords.some((word) =>
      lowerContent.includes(word),
    );

    if (hasBlockedWords) {
      throw new Error('Message contains inappropriate content');
    }
  }

  /**
   * Emit domain events
   */
  private static emitMessageEvent(event: MessagingEvent, data: any): void {
    // In a real app, this would use an event bus or message broker
    console.log(`Messaging Event: ${event}`, data);

    // For now, dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

// Domain events
export const MESSAGING_EVENTS = {
  MESSAGE_SENT: 'messaging.message.sent',
  MESSAGE_RECEIVED: 'messaging.message.received',
  MESSAGE_READ: 'messaging.message.read',
  CONVERSATION_STARTED: 'messaging.conversation.started',
} as const;

export type MessagingEvent =
  (typeof MESSAGING_EVENTS)[keyof typeof MESSAGING_EVENTS];

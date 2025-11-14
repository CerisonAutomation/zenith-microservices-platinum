/**
 * Messaging Domain - Business logic for messaging features
 */

import { supabase } from '@/lib/supabase';
import type { Message, Profile } from '@/types';

export class MessagingDomain {
  /**
   * Get all conversations for a user
   * Returns the most recent message from each unique conversation partner
   */
  static async getConversations(userId: string): Promise<Message[]> {
    try {
      // Get all messages where user is sender or receiver
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner and get most recent message
      const conversationMap = new Map<string, any>();

      messages?.forEach((msg: any) => {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const partnerProfile = msg.sender_id === userId ? msg.receiver : msg.sender;

        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            timestamp: new Date(msg.created_at),
            read: msg.read || false,
            type: 'text',
            profile: {
              id: partnerProfile.id,
              user_id: partnerProfile.user_id,
              name: partnerProfile.name,
              age: partnerProfile.age,
              photo: partnerProfile.photo,
              bio: partnerProfile.bio,
              location: partnerProfile.location,
              interests: partnerProfile.interests,
              verified: partnerProfile.verified,
              premium: partnerProfile.premium,
              online: partnerProfile.online,
            },
          });
        }
      });

      return Array.from(conversationMap.values());
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  /**
   * Get all messages in a conversation between two users
   */
  static async getConversationMessages(
    userId: string,
    partnerId: string
  ): Promise<Message[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;

      return messages?.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        read: msg.read || false,
        type: 'text',
        profile: msg.sender_id === userId ? undefined : {
          id: msg.sender.id,
          user_id: msg.sender.user_id,
          name: msg.sender.name,
          age: msg.sender.age,
          photo: msg.sender.photo,
          bio: msg.sender.bio,
          location: msg.sender.location,
          interests: msg.sender.interests,
          verified: msg.sender.verified,
          premium: msg.sender.premium,
          online: msg.sender.online,
        },
      })) || [];
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  }

  /**
   * Mark a message as read
   */
  static async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  /**
   * Send a new message
   */
  static async sendMessage(
    senderId: string,
    receiverId: string,
    content: string
  ): Promise<Message> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content,
          read: false,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        content: data.content,
        timestamp: new Date(data.created_at),
        read: data.read || false,
        type: 'text',
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Get unread message count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }
}

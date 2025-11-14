import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';

interface ReadReceipt {
  message_id: string;
  user_id: string;
  read_at: string;
}

interface MessageReadStatus {
  messageId: string;
  isRead: boolean;
  readBy: Array<{
    userId: string;
    readAt: string;
  }>;
}

export function useReadReceipts(conversationId: string) {
  const [receipts, setReceipts] = useState<Map<string, ReadReceipt[]>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch all read receipts for the conversation
  const fetchReceipts = useCallback(async () => {
    try {
      // First get all messages in conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId);

      if (!messages || messages.length === 0) {
        setReceipts(new Map());
        setLoading(false);
        return;
      }

      const messageIds = messages.map((m) => m.id);

      // Get all read receipts for these messages
      const { data: readData } = await supabase
        .from('message_reads')
        .select('message_id, user_id, read_at')
        .in('message_id', messageIds);

      if (readData) {
        const receiptsMap = new Map<string, ReadReceipt[]>();
        readData.forEach((receipt: ReadReceipt) => {
          const existing = receiptsMap.get(receipt.message_id) || [];
          receiptsMap.set(receipt.message_id, [...existing, receipt]);
        });
        setReceipts(receiptsMap);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch read receipts:', error);
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    fetchReceipts();

    // Subscribe to new read receipts
    const channel = supabase
      .channel(`read-receipts:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
          filter: `message_id=in.(select id from messages where conversation_id='${conversationId}')`
        },
        (payload) => {
          const newReceipt = payload.new as ReadReceipt;
          setReceipts((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(newReceipt.message_id) || [];
            newMap.set(newReceipt.message_id, [...existing, newReceipt]);
            return newMap;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchReceipts]);

  // Mark a specific message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { error } = await supabase
        .from('message_reads')
        .insert({
          message_id: messageId,
          user_id: user.user.id
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        console.error('Failed to mark message as read:', error);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  // Mark all messages in conversation as read
  const markConversationAsRead = useCallback(async () => {
    try {
      const { error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId
      });

      if (error) {
        console.error('Failed to mark conversation as read:', error);
      } else {
        // Refresh receipts after marking all as read
        fetchReceipts();
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, [conversationId, fetchReceipts]);

  // Get read status for a specific message
  const getMessageReadStatus = useCallback((messageId: string): MessageReadStatus => {
    const messageReceipts = receipts.get(messageId) || [];
    return {
      messageId,
      isRead: messageReceipts.length > 0,
      readBy: messageReceipts.map((r) => ({
        userId: r.user_id,
        readAt: r.read_at
      }))
    };
  }, [receipts]);

  // Get unread count for conversation
  const getUnreadCount = useCallback(async () => {
    const { data } = await supabase.rpc('get_unread_count', {
      p_conversation_id: conversationId
    });

    return data?.[0]?.unread_count || 0;
  }, [conversationId]);

  return {
    receipts,
    loading,
    markAsRead,
    markConversationAsRead,
    getMessageReadStatus,
    getUnreadCount
  };
}

// Hook for monitoring unread counts across all conversations
export function useUnreadCounts() {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const { data } = await supabase.rpc('get_unread_count');

      if (data) {
        const countsMap = new Map<string, number>();
        let total = 0;

        data.forEach((item: { conversation_id: string; unread_count: number }) => {
          countsMap.set(item.conversation_id, item.unread_count);
          total += item.unread_count;
        });

        setUnreadCounts(countsMap);
        setTotalUnread(total);
      }
    };

    fetchUnreadCounts();

    // Subscribe to new messages to update counts
    const channel = supabase
      .channel('unread-counts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads'
        },
        () => {
          fetchUnreadCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    unreadCounts,
    totalUnread
  };
}

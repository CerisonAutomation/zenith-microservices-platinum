import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface TypingUser {
  userId: string;
  timestamp: number;
}

export function useTypingIndicator(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`, {
      config: { broadcast: { self: false } } // Don't receive own typing events
    });

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { userId, isTyping } = payload as { userId: string; isTyping: boolean };

        if (isTyping) {
          setTypingUsers((prev) => {
            if (!prev.includes(userId)) {
              return [...prev, userId];
            }
            return prev;
          });

          // Clear existing timeout for this user
          const existingTimeout = timeoutsRef.current.get(userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Auto-remove after 3 seconds of inactivity
          const timeout = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((id) => id !== userId));
            timeoutsRef.current.delete(userId);
          }, 3000);

          timeoutsRef.current.set(userId, timeout);
        } else {
          setTypingUsers((prev) => prev.filter((id) => id !== userId));
          const timeout = timeoutsRef.current.get(userId);
          if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(userId);
          }
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      // Clear all timeouts
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();

      // Unsubscribe from channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  return typingUsers;
}

// Hook to send typing indicator
export function useSendTypingIndicator(conversationId: string) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Use ref instead of state to avoid stale closure in cleanup
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Get current user ID and store in ref
    supabase.auth.getUser().then(({ data }) => {
      currentUserIdRef.current = data.user?.id || null;
    });

    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);
    channel.subscribe();
    channelRef.current = channel;

    return () => {
      // Send stopped typing when unmounting
      // Use ref to get latest userId (avoids stale closure)
      if (channelRef.current && currentUserIdRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            userId: currentUserIdRef.current,
            isTyping: false
          }
        });
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!channelRef.current || !currentUserIdRef.current) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: currentUserIdRef.current,
        isTyping,
        timestamp: Date.now()
      }
    });

    // If starting to type, set up auto-stop after 3 seconds
    if (isTyping) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 3000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, []);

  return sendTypingIndicator;
}

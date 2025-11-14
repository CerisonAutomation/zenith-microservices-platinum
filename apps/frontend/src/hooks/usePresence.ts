import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type UserStatus = 'online' | 'away' | 'offline';

export interface PresenceState {
  userId: string;
  status: UserStatus;
  lastSeen: string;
}

export function usePresence() {
  const [presenceState, setPresenceState] = useState<Record<string, PresenceState>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const awayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set user to 'away' after 5 minutes of inactivity
  const resetAwayTimer = useCallback(() => {
    if (awayTimeoutRef.current) {
      clearTimeout(awayTimeoutRef.current);
    }

    if (channelRef.current) {
      channelRef.current.track({
        userId: currentUserId,
        status: 'online',
        lastSeen: new Date().toISOString()
      });
    }

    awayTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.track({
          userId: currentUserId,
          status: 'away',
          lastSeen: new Date().toISOString()
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }, [currentUserId]);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });

    if (!currentUserId) return;

    const channel = supabase.channel('presence', {
      config: {
        presence: {
          key: currentUserId
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceState>();
        const formatted = Object.entries(state).reduce((acc, [userId, presence]) => {
          const presenceData = presence[0] as PresenceState;
          acc[userId] = presenceData;
          return acc;
        }, {} as Record<string, PresenceState>);
        setPresenceState(formatted);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setPresenceState((prev) => ({
          ...prev,
          [key]: newPresences[0] as PresenceState
        }));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setPresenceState((prev) => {
          const next = { ...prev };
          const leftPresence = leftPresences[0] as PresenceState;
          if (next[key]) {
            next[key] = {
              ...leftPresence,
              status: 'offline',
              lastSeen: new Date().toISOString()
            };
          }
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUserId,
            status: 'online',
            lastSeen: new Date().toISOString()
          });

          // Also update in database
          await supabase.rpc('update_user_presence', {
            p_status: 'online'
          });
        }
      });

    channelRef.current = channel;

    // Set up activity listeners for away status
    const events = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetAwayTimer);
    });

    // Initial timer
    resetAwayTimer();

    // Update database presence periodically
    const dbUpdateInterval = setInterval(async () => {
      const currentState = channelRef.current?.presenceState<PresenceState>();
      const myPresence = currentState?.[currentUserId]?.[0];
      if (myPresence) {
        await supabase.rpc('update_user_presence', {
          p_status: myPresence.status
        });
      }
    }, 60000); // Update DB every minute

    return () => {
      // Clean up activity listeners
      events.forEach((event) => {
        window.removeEventListener(event, resetAwayTimer);
      });

      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
      }

      clearInterval(dbUpdateInterval);

      // Set user offline when unmounting
      if (channelRef.current) {
        channelRef.current.track({
          userId: currentUserId,
          status: 'offline',
          lastSeen: new Date().toISOString()
        });

        supabase.rpc('update_user_presence', {
          p_status: 'offline'
        });

        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [currentUserId, resetAwayTimer]);

  // Manually update status
  const updateStatus = useCallback((status: UserStatus) => {
    if (channelRef.current && currentUserId) {
      channelRef.current.track({
        userId: currentUserId,
        status,
        lastSeen: new Date().toISOString()
      });

      supabase.rpc('update_user_presence', {
        p_status: status
      });
    }
  }, [currentUserId]);

  return {
    presenceState,
    updateStatus
  };
}

// Hook to get specific user's presence
export function useUserPresence(userId: string | undefined) {
  const { presenceState } = usePresence();
  const [userPresence, setUserPresence] = useState<PresenceState | null>(null);

  useEffect(() => {
    if (!userId) {
      setUserPresence(null);
      return;
    }

    // Get from real-time state
    if (presenceState[userId]) {
      setUserPresence(presenceState[userId]);
    } else {
      // Fallback to database
      supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .single()
        .then(({ data }) => {
          if (data) {
            setUserPresence({
              userId: data.user_id,
              status: data.status as UserStatus,
              lastSeen: data.last_seen
            });
          }
        });
    }
  }, [userId, presenceState]);

  return userPresence;
}

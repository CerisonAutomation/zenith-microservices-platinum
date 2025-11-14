import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';

interface NearbyUser {
  user_id: string;
  distance_km: number;
  last_seen: string;
  is_online: boolean;
  profile?: {
    name: string;
    age: number;
    bio: string;
    photos: string[];
  };
}

interface UseNearbyUsersOptions {
  radiusKm?: number;
  maxResults?: number;
  refreshInterval?: number;
  includeProfiles?: boolean;
}

export function useNearbyUsers(options: UseNearbyUsersOptions = {}) {
  const {
    radiusKm = 10,
    maxResults = 50,
    refreshInterval = 30000, // Refresh every 30 seconds
    includeProfiles = true
  } = options;

  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch nearby users
  const fetchNearbyUsers = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('find_nearby_users_realtime', {
        radius_km: radiusKm,
        max_results: maxResults
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      if (!data) {
        setUsers([]);
        return;
      }

      // Fetch profiles if requested
      if (includeProfiles && data.length > 0) {
        const userIds = data.map((u: NearbyUser) => u.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, age, bio, photos')
          .in('id', userIds);

        const usersWithProfiles = data.map((user: NearbyUser) => ({
          ...user,
          profile: profiles?.find((p) => p.id === user.user_id)
        }));

        setUsers(usersWithProfiles);
      } else {
        setUsers(data);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nearby users');
    } finally {
      setLoading(false);
    }
  }, [radiusKm, maxResults, includeProfiles]);

  useEffect(() => {
    fetchNearbyUsers();

    // Set up real-time subscription to location updates
    const channel = supabase
      .channel('nearby-users-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'location_history'
        },
        () => {
          // Refresh nearby users when any location is updated
          fetchNearbyUsers();
        }
      )
      .subscribe();

    // Set up periodic refresh
    const intervalId = setInterval(fetchNearbyUsers, refreshInterval);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [fetchNearbyUsers, refreshInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setLoading(true);
    fetchNearbyUsers();
  }, [fetchNearbyUsers]);

  return {
    users,
    loading,
    error,
    refresh
  };
}

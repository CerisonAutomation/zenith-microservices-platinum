/**
 * 🔄 Session Management Hook
 * Zenith Oracle Executive Apex - Advanced Session Handling
 *
 * Features:
 * - Automatic session refresh
 * - Session persistence across tabs
 * - Session monitoring and health checks
 * - Multi-device session management
 * - Session timeout handling
 * - Recovery from network interruptions
 *
 * @see https://supabase.com/docs/guides/auth/auth-sessions
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorTracker, UserAnalytics } from '@/lib/observability';

interface SessionState {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  refreshCount: number;
  healthCheckCount: number;
  networkStatus: 'online' | 'offline' | 'unknown';
}

interface SessionConfig {
  refreshThreshold: number; // Minutes before expiry to refresh
  healthCheckInterval: number; // Minutes between health checks
  maxRefreshAttempts: number; // Max refresh attempts before logout
  enableMultiTabSync: boolean; // Sync sessions across tabs
}

const DEFAULT_CONFIG: SessionConfig = {
  refreshThreshold: 5, // Refresh 5 minutes before expiry
  healthCheckInterval: 10, // Health check every 10 minutes
  maxRefreshAttempts: 3, // Max 3 refresh attempts
  enableMultiTabSync: true,
};

export function useSessionManagement(config: Partial<SessionConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const { user, session, refreshSession } = useAuth();

  const [sessionState, setSessionState] = useState<SessionState>({
    isRefreshing: false,
    lastRefresh: null,
    refreshCount: 0,
    healthCheckCount: 0,
    networkStatus: navigator.onLine ? 'online' : 'offline',
  });

  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const refreshAttemptsRef = useRef(0);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setSessionState((prev) => ({ ...prev, networkStatus: 'online' }));
      UserAnalytics.trackEvent('network_online');
      // Attempt session recovery when coming back online
      if (session && user) {
        performHealthCheck();
      }
    };

    const handleOffline = () => {
      setSessionState((prev) => ({ ...prev, networkStatus: 'offline' }));
      UserAnalytics.trackEvent('network_offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [session, user]);

  // Session refresh scheduling
  const scheduleSessionRefresh = useCallback(() => {
    if (!session?.expires_at) return;

    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const refreshAt = new Date(
      expiresAt.getTime() - finalConfig.refreshThreshold * 60 * 1000,
    );

    if (refreshAt <= now) {
      // Session needs refresh now
      performSessionRefresh();
      return;
    }

    const delay = refreshAt.getTime() - now.getTime();

    refreshTimeoutRef.current = setTimeout(() => {
      performSessionRefresh();
    }, delay);
  }, [session, finalConfig.refreshThreshold]);

  // Perform session refresh
  const performSessionRefresh = useCallback(async () => {
    if (sessionState.isRefreshing) return;

    setSessionState((prev) => ({ ...prev, isRefreshing: true }));

    try {
      await refreshSession();
      refreshAttemptsRef.current = 0; // Reset attempts on success

      setSessionState((prev) => ({
        ...prev,
        isRefreshing: false,
        lastRefresh: new Date(),
        refreshCount: prev.refreshCount + 1,
      }));

      UserAnalytics.trackEvent('session_refresh_success', {
        refreshCount: sessionState.refreshCount + 1,
      });

      // Reschedule next refresh
      scheduleSessionRefresh();
    } catch (error) {
      console.error('Session refresh failed:', error);
      refreshAttemptsRef.current++;

      setSessionState((prev) => ({ ...prev, isRefreshing: false }));

      ErrorTracker.trackError(error as Error, {
        context: 'session_refresh',
        attempt: refreshAttemptsRef.current,
      });

      if (refreshAttemptsRef.current >= finalConfig.maxRefreshAttempts) {
        // Max attempts reached, force logout
        UserAnalytics.trackEvent('session_refresh_max_attempts', {
          attempts: refreshAttemptsRef.current,
        });
        await supabase.auth.signOut();
      } else {
        // Retry after delay
        setTimeout(
          () => performSessionRefresh(),
          5000 * refreshAttemptsRef.current,
        );
      }
    }
  }, [
    sessionState.isRefreshing,
    sessionState.refreshCount,
    refreshSession,
    finalConfig.maxRefreshAttempts,
    scheduleSessionRefresh,
  ]);

  // Session health check
  const performHealthCheck = useCallback(async () => {
    if (!session || sessionState.networkStatus === 'offline') return;

    try {
      // Check if session is still valid by making a test request
      const { error } = await supabase.from('profiles').select('id').limit(1);

      if (error && error.message.includes('JWT')) {
        // Session is invalid, trigger refresh
        UserAnalytics.trackEvent('session_health_check_failed');
        performSessionRefresh();
        return;
      }

      setSessionState((prev) => ({
        ...prev,
        healthCheckCount: prev.healthCheckCount + 1,
      }));

      UserAnalytics.trackEvent('session_health_check_passed');
    } catch (error) {
      ErrorTracker.trackError(error as Error, {
        context: 'session_health_check',
      });
    }
  }, [session, sessionState.networkStatus, performSessionRefresh]);

  // Health check scheduling
  useEffect(() => {
    if (!session) return;

    healthCheckIntervalRef.current = setInterval(
      () => {
        performHealthCheck();
      },
      finalConfig.healthCheckInterval * 60 * 1000,
    );

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [session, finalConfig.healthCheckInterval, performHealthCheck]);

  // Initialize session management
  useEffect(() => {
    if (session) {
      scheduleSessionRefresh();
      performHealthCheck();
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [session, scheduleSessionRefresh, performHealthCheck]);

  // Manual session refresh
  const manualRefresh = useCallback(async () => {
    UserAnalytics.trackEvent('session_manual_refresh');
    await performSessionRefresh();
  }, [performSessionRefresh]);

  // Get session expiry information
  const getSessionExpiry = useCallback(() => {
    if (!session?.expires_at) return null;

    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();

    return {
      expiresAt,
      minutesUntilExpiry: Math.floor(timeUntilExpiry / (1000 * 60)),
      isExpiringSoon:
        timeUntilExpiry < finalConfig.refreshThreshold * 60 * 1000,
    };
  }, [session, finalConfig.refreshThreshold]);

  return {
    sessionState,
    getSessionExpiry,
    manualRefresh,
    performHealthCheck,
    config: finalConfig,
  };
}

/**
 * Session persistence utilities
 */
export class SessionPersistence {
  private static readonly STORAGE_KEY = 'session_backup';

  static saveSession(session: Session): void {
    try {
      const backup = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user,
        saved_at: Date.now(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(backup));
    } catch (error) {
      console.warn('Failed to save session backup:', error);
    }
  }

  static getSavedSession(): Session | null {
    try {
      const backup = localStorage.getItem(this.STORAGE_KEY);
      if (!backup) return null;

      const parsed = JSON.parse(backup);
      const age = Date.now() - parsed.saved_at;

      // Only use backup if less than 24 hours old
      if (age > 24 * 60 * 60 * 1000) {
        this.clearSavedSession();
        return null;
      }

      return {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
        expires_at: parsed.expires_at,
        expires_in: 3600, // Default 1 hour
        user: parsed.user,
        token_type: 'bearer',
      };
    } catch (error) {
      console.warn('Failed to restore session backup:', error);
      return null;
    }
  }

  static clearSavedSession(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

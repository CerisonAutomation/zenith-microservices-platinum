/**
 * Custom React Hooks
 * Reusable hooks for state management, side effects, and business logic
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { DatingProfile, Booking, Message } from '@/lib/validations';
import {
  AuthService,
  ProfileService,
  BookingService,
  MessagingService,
  AnalyticsService,
  APIError,
  RateLimitError,
} from '@/services/api.service';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UsePaginationState<T> {
  items: T[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// AUTH HOOKS
// ============================================================================

/**
 * Hook for authentication state
 */
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check initial session
    AuthService.getSession()
      .then((session) => setUser(session?.user || null))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);

      if (event === 'SIGNED_IN') {
        AnalyticsService.trackEvent('user_signed_in');
      } else if (event === 'SIGNED_OUT') {
        AnalyticsService.trackEvent('user_signed_out');
        router.push('/');
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [router]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await AuthService.signOut();
      setUser(null);
      router.push('/');
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [router]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signOut,
  };
}

/**
 * Hook to require authentication
 */
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}

// ============================================================================
// PROFILE HOOKS
// ============================================================================

/**
 * Hook to fetch and manage profile data
 */
export function useProfile(userId?: string): UseAsyncState<DatingProfile> {
  const [data, setData] = useState<DatingProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const profile = await ProfileService.getProfile(userId);
      setData(profile);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    data,
    loading,
    error,
    refetch: fetchProfile,
  };
}

/**
 * Hook for profile search with filters
 */
export function useProfileSearch(filters: Parameters<typeof ProfileService.searchProfiles>[0]) {
  const [data, setData] = useState<DatingProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Debounce filter changes
  const debouncedFilters = useDebounce(filters, 500);

  useEffect(() => {
    const searchProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const results = await ProfileService.searchProfiles(debouncedFilters);
        setData(results);
        AnalyticsService.trackEvent('profile_search', debouncedFilters);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    searchProfiles();
  }, [debouncedFilters]);

  return { data, loading, error };
}

// ============================================================================
// BOOKING HOOKS
// ============================================================================

/**
 * Hook for managing bookings
 */
export function useBookings(userId?: string) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await BookingService.getBookings(userId);
      setBookings(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = useCallback(
    async (booking: Partial<Booking>) => {
      try {
        setLoading(true);
        setError(null);
        const newBooking = await BookingService.createBooking(booking);
        setBookings((prev) => [...prev, newBooking]);
        AnalyticsService.trackEvent('booking_created', { bookingId: newBooking.id });
        return newBooking;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancelBooking = useCallback(async (bookingId: string, reason?: string) => {
    try {
      setLoading(true);
      setError(null);
      await BookingService.cancelBooking(bookingId, reason);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
      );
      AnalyticsService.trackEvent('booking_cancelled', { bookingId, reason });
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    bookings,
    loading,
    error,
    createBooking,
    cancelBooking,
    refetch: fetchBookings,
  };
}

// ============================================================================
// MESSAGING HOOKS
// ============================================================================

/**
 * Hook for managing conversations
 */
export function useMessages(conversationId?: string): UsePaginationState<Message> & {
  sendMessage: (content: string) => Promise<void>;
} {
  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const loadMessages = useCallback(
    async (reset = false) => {
      if (!conversationId || loading) return;

      try {
        setLoading(true);
        setError(null);
        const newOffset = reset ? 0 : offset;
        const messages = await MessagingService.getMessages(conversationId, limit, newOffset);

        setItems((prev) => (reset ? messages : [...prev, ...messages]));
        setHasMore(messages.length === limit);
        setOffset(newOffset + messages.length);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, loading, offset, limit]
  );

  useEffect(() => {
    loadMessages(true);
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return;

      try {
        const message = await MessagingService.sendMessage({
          conversationId,
          content,
          sentAt: new Date(),
        });

        setItems((prev) => [message, ...prev]);
        AnalyticsService.trackEvent('message_sent', { conversationId });
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [conversationId]
  );

  return {
    items,
    loading,
    error,
    hasMore,
    loadMore: () => loadMessages(false),
    refresh: () => loadMessages(true),
    sendMessage,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for local storage with type safety
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}

/**
 * Hook for window size
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState<{
    width: number;
    height: number;
  }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}

/**
 * Hook for intersection observer (infinite scroll, lazy loading)
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [element, options]);

  return [setElement, isIntersecting];
}

/**
 * Hook for rate limiting actions
 */
export function useRateLimit(limit: number, window: number) {
  const attempts = useRef<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    attempts.current = attempts.current.filter((time) => now - time < window);

    if (attempts.current.length >= limit) {
      const oldestAttempt = attempts.current[0];
      const retryAfter = Math.ceil((window - (now - oldestAttempt)) / 1000);
      throw new RateLimitError('Rate limit exceeded', retryAfter);
    }

    attempts.current.push(now);
  }, [limit, window]);

  return checkLimit;
}

/**
 * Hook for async operations with loading/error states
 */
export function useAsync<T, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<{
    loading: boolean;
    error: Error | null;
    data: T | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ loading: true, error: null, data: null });

      try {
        const data = await asyncFunction(...args);
        setState({ loading: false, error: null, data });
        return data;
      } catch (error) {
        setState({ loading: false, error: error as Error, data: null });
        throw error;
      }
    },
    [asyncFunction]
  );

  return { ...state, execute };
}

/**
 * Hook for clipboard operations
 */
export function useClipboard(timeout = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), timeout);
      } catch (error) {
        console.error('Failed to copy:', error);
      }
    },
    [timeout]
  );

  return { isCopied, copy };
}

/**
 * Hook for tracking analytics
 */
export function useAnalytics() {
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    AnalyticsService.trackEvent(event, properties);
  }, []);

  const trackPageView = useCallback((path: string) => {
    AnalyticsService.trackPageView(path);
  }, []);

  return { trackEvent, trackPageView };
}

/**
 * Hook for media queries
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

/**
 * Hook for online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for form validation
 */
export function useFormValidation<T extends Record<string, any>>(
  schema: z.ZodSchema<T>,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validate = useCallback(
    (fieldValues: T = values) => {
      const result = schema.safeParse(fieldValues);

      if (!result.success) {
        const fieldErrors: Partial<Record<keyof T, string>> = {};
        result.error.errors.forEach((err) => {
          const path = err.path[0] as keyof T;
          if (path) fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
        return false;
      }

      setErrors({});
      return true;
    },
    [schema, values]
  );

  const handleChange = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validate(values);
    },
    [validate, values]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
}

// Export supabase for realtime subscriptions
import { supabase } from '@/services/api.service';
export { supabase };

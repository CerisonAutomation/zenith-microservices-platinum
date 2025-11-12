/**
 * API Service Layer
 * Centralized API communication with error handling, retry logic, and caching
 */

import { createClient } from '@supabase/supabase-js';
import type {
  DatingProfile,
  Booking,
  Report,
  Message,
  SignUpFormData,
  SignInFormData,
} from '@/lib/validations';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// API Configuration
const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second, will use exponential backoff
};

// ============================================================================
// ERROR TYPES
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class NetworkError extends APIError {
  constructor(message = 'Network error occurred') {
    super(message, 0, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded', public retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Exponential backoff retry logic
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = API_CONFIG.retries,
  delay = API_CONFIG.retryDelay
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;

    // Don't retry on client errors (4xx except 429)
    if (error instanceof APIError && error.statusCode) {
      if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
        throw error;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = API_CONFIG.timeout
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NetworkError('Request timeout');
    }
    throw new NetworkError('Network request failed');
  }
}

/**
 * Parse API response and handle errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    throw new RateLimitError('Rate limit exceeded', retryAfter);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));

    if (response.status === 401) {
      throw new AuthenticationError(error.message);
    }

    if (response.status === 400) {
      throw new ValidationError(error.message, error.details);
    }

    throw new APIError(
      error.message || 'An error occurred',
      response.status,
      error.code
    );
  }

  return response.json();
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new Cache();

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export const AuthService = {
  /**
   * Sign up new user
   */
  async signUp(data: SignUpFormData) {
    return retryWithBackoff(async () => {
      const { error, data: authData } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            age_confirmed: data.ageConfirmed,
            terms_accepted: data.termsAccepted,
          },
        },
      });

      if (error) throw new APIError(error.message, 400, error.name);
      return authData;
    });
  },

  /**
   * Sign in user
   */
  async signIn(data: SignInFormData) {
    return retryWithBackoff(async () => {
      const { error, data: authData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw new AuthenticationError(error.message);

      // Invalidate all cached data on login
      cache.clear();

      return authData;
    });
  },

  /**
   * Sign out user
   */
  async signOut() {
    await supabase.auth.signOut();
    cache.clear();
  },

  /**
   * Get current session
   */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new AuthenticationError(error.message);
    return data.session;
  },

  /**
   * Sign in with OAuth (Google)
   */
  async signInWithOAuth(provider: 'google') {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) throw new APIError(error.message);
  },

  /**
   * Send magic link
   */
  async sendMagicLink(email: string) {
    return retryWithBackoff(async () => {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw new APIError(error.message);
    });
  },

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    return retryWithBackoff(async () => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw new APIError(error.message);
    });
  },
};

// ============================================================================
// PROFILE SERVICE
// ============================================================================

export const ProfileService = {
  /**
   * Get user profile by ID
   */
  async getProfile(userId: string, useCache = true): Promise<DatingProfile> {
    const cacheKey = `profile:${userId}`;

    if (useCache) {
      const cached = cache.get<DatingProfile>(cacheKey);
      if (cached) return cached;
    }

    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw new APIError(error.message);

      cache.set(cacheKey, data);
      return data;
    });
  },

  /**
   * Update profile
   */
  async updateProfile(userId: string, updates: Partial<DatingProfile>) {
    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new APIError(error.message);

      // Invalidate cache
      cache.invalidate(`profile:${userId}`);

      return data;
    });
  },

  /**
   * Upload profile photo
   */
  async uploadPhoto(file: File, userId: string): Promise<string> {
    return retryWithBackoff(async () => {
      const fileName = `${userId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw new APIError(uploadError.message);

      const { data } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      return data.publicUrl;
    });
  },

  /**
   * Search profiles with filters
   */
  async searchProfiles(filters: {
    bodyTypes?: string[];
    kinks?: string[];
    distance?: number;
    ageRange?: [number, number];
    onlineOnly?: boolean;
    premiumOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<DatingProfile[]> {
    const cacheKey = `search:${JSON.stringify(filters)}`;
    const cached = cache.get<DatingProfile[]>(cacheKey);
    if (cached) return cached;

    return retryWithBackoff(async () => {
      let query = supabase.from('profiles').select('*');

      if (filters.bodyTypes?.length) {
        query = query.contains('body_type', filters.bodyTypes);
      }

      if (filters.ageRange) {
        query = query
          .gte('age', filters.ageRange[0])
          .lte('age', filters.ageRange[1]);
      }

      if (filters.onlineOnly) {
        query = query.eq('online', true);
      }

      if (filters.premiumOnly) {
        query = query.eq('is_premium', true);
      }

      query = query
        .limit(filters.limit || 50)
        .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50));

      const { data, error } = await query;

      if (error) throw new APIError(error.message);

      // Cache search results for 1 minute
      cache.set(cacheKey, data, 60 * 1000);

      return data;
    });
  },
};

// ============================================================================
// BOOKING SERVICE
// ============================================================================

export const BookingService = {
  /**
   * Create booking
   */
  async createBooking(booking: Partial<Booking>): Promise<Booking> {
    return retryWithBackoff(async () => {
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/bookings`, {
        method: 'POST',
        body: JSON.stringify(booking),
      });

      const data = await handleResponse<Booking>(response);

      // Invalidate related caches
      cache.invalidate('bookings:');

      return data;
    });
  },

  /**
   * Get user bookings
   */
  async getBookings(userId: string, status?: Booking['status']): Promise<Booking[]> {
    const cacheKey = `bookings:${userId}:${status || 'all'}`;
    const cached = cache.get<Booking[]>(cacheKey);
    if (cached) return cached;

    return retryWithBackoff(async () => {
      let query = supabase
        .from('bookings')
        .select('*')
        .or(`client_id.eq.${userId},boyfriend_id.eq.${userId}`);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('date', { ascending: true });

      if (error) throw new APIError(error.message);

      cache.set(cacheKey, data, 2 * 60 * 1000); // 2 minutes
      return data;
    });
  },

  /**
   * Cancel booking
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    return retryWithBackoff(async () => {
      const response = await fetchWithTimeout(
        `${API_CONFIG.baseURL}/bookings/${bookingId}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify({ reason }),
        }
      );

      await handleResponse(response);

      cache.invalidate('bookings:');
    });
  },
};

// ============================================================================
// REPORT SERVICE
// ============================================================================

export const ReportService = {
  /**
   * Submit report
   */
  async submitReport(report: Partial<Report>): Promise<Report> {
    return retryWithBackoff(async () => {
      const response = await fetchWithTimeout(`${API_CONFIG.baseURL}/reports`, {
        method: 'POST',
        body: JSON.stringify(report),
      });

      return handleResponse<Report>(response);
    });
  },

  /**
   * Block user
   */
  async blockUser(userId: string, blockedUserId: string): Promise<void> {
    return retryWithBackoff(async () => {
      const { error } = await supabase
        .from('blocked_users')
        .insert({ user_id: userId, blocked_user_id: blockedUserId });

      if (error) throw new APIError(error.message);

      cache.invalidate(`blocked:${userId}`);
    });
  },
};

// ============================================================================
// MESSAGING SERVICE
// ============================================================================

export const MessagingService = {
  /**
   * Send message
   */
  async sendMessage(message: Partial<Message>): Promise<Message> {
    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();

      if (error) throw new APIError(error.message);

      cache.invalidate(`messages:${message.conversationId}`);
      return data;
    });
  },

  /**
   * Get conversation messages
   */
  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    const cacheKey = `messages:${conversationId}:${offset}`;
    const cached = cache.get<Message[]>(cacheKey);
    if (cached) return cached;

    return retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: false })
        .range(offset, offset + limit);

      if (error) throw new APIError(error.message);

      cache.set(cacheKey, data, 30 * 1000); // 30 seconds
      return data;
    });
  },

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    return retryWithBackoff(async () => {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', messageIds);

      if (error) throw new APIError(error.message);
    });
  },
};

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

export const AnalyticsService = {
  /**
   * Track event
   */
  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    // Fire and forget - don't block on analytics
    fetchWithTimeout(`${API_CONFIG.baseURL}/analytics/events`, {
      method: 'POST',
      body: JSON.stringify({ event, properties, timestamp: Date.now() }),
    }).catch((error) => {
      console.error('Analytics tracking failed:', error);
    });
  },

  /**
   * Track page view
   */
  async trackPageView(path: string): Promise<void> {
    await this.trackEvent('page_view', { path });
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export { cache, supabase };

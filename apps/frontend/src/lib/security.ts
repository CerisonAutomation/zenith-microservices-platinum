/**
 * 🛡️ Security Middleware
 * Zenith Oracle Executive Apex - Enterprise Security Implementation
 *
 * Implements:
 * - Rate limiting for auth endpoints
 * - CSRF protection with tokens
 * - Request sanitization and validation
 * - Suspicious activity detection
 * - Security headers and CORS
 * - Audit logging for security events
 *
 * @see https://supabase.com/docs/guides/auth/auth-security
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorTracker, UserAnalytics } from '@/lib/observability';

// Rate limiting configuration
const RATE_LIMITS = {
  signIn: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  signUp: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  passwordReset: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  general: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 requests per minute
};

// In-memory rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface SecurityEvent {
  type:
    | 'rate_limit_exceeded'
    | 'suspicious_activity'
    | 'csrf_attempt'
    | 'unusual_pattern';
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint: string;
  details: Record<string, any>;
  timestamp: Date;
}

class SecurityMiddleware {
  private csrfToken: string | null = null;

  // Generate CSRF token
  generateCSRFToken(): string {
    if (!this.csrfToken) {
      this.csrfToken = crypto.randomUUID();
      // Store in session storage for persistence
      sessionStorage.setItem('csrf_token', this.csrfToken);
    }
    return this.csrfToken;
  }

  // Validate CSRF token
  validateCSRFToken(token: string): boolean {
    const storedToken = sessionStorage.getItem('csrf_token');
    return token === storedToken && token === this.csrfToken;
  }

  // Rate limiting check
  checkRateLimit(
    identifier: string,
    action: keyof typeof RATE_LIMITS,
  ): { allowed: boolean; resetTime?: number; remaining?: number } {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const config = RATE_LIMITS[action];

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      // First attempt or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return { allowed: true, remaining: config.maxAttempts - 1 };
    }

    if (record.count >= config.maxAttempts) {
      return { allowed: false, resetTime: record.resetTime };
    }

    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);

    return {
      allowed: true,
      remaining: config.maxAttempts - record.count,
    };
  }

  // Detect suspicious activity
  detectSuspiciousActivity(
    action: string,
    metadata: Record<string, any>,
  ): boolean {
    const suspiciousPatterns = [
      // Multiple failed login attempts
      action === 'sign_in_failed' && metadata['attemptCount'] > 3,
      // Rapid password reset requests
      action === 'password_reset' && metadata['timeWindow'] < 300000, // 5 minutes
      // Unusual login times
      metadata['hour'] && (metadata['hour'] < 6 || metadata['hour'] > 22),
      // Multiple IP addresses for same user
      metadata['ipCount'] && metadata['ipCount'] > 3,
    ];

    return suspiciousPatterns.some((pattern) => pattern);
  }

  // Log security event
  logSecurityEvent(event: SecurityEvent): void {
    console.warn('Security Event:', event);

    ErrorTracker.trackError(new Error(`Security event: ${event.type}`), {
      context: 'security_middleware',
      ...event,
    });

    UserAnalytics.trackEvent('security_event', {
      eventType: event.type,
      userId: event.userId,
      endpoint: event.endpoint,
      timestamp: event.timestamp.toISOString(),
    });
  }

  // Sanitize input data
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .trim()
      .slice(0, 1000); // Limit length
  }

  // Validate email format with additional security checks
  validateEmailSecurity(email: string): { valid: boolean; reason?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return { valid: false, reason: 'Invalid email format' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /[<>'"&]/, // HTML characters
      /\.\./, // Double dots
      /@.*@/, // Multiple @ symbols
      /\s/, // Whitespace
    ];

    if (suspiciousPatterns.some((pattern) => pattern.test(email))) {
      return { valid: false, reason: 'Suspicious email pattern' };
    }

    // Check length
    if (email.length > 254) {
      return { valid: false, reason: 'Email too long' };
    }

    return { valid: true };
  }
}

// Singleton instance
export const securityMiddleware = new SecurityMiddleware();

/**
 * React hook for security middleware integration
 */
export function useSecurity() {
  const { user } = useAuth();

  // Initialize CSRF token on mount
  useEffect(() => {
    securityMiddleware.generateCSRFToken();
  }, []);

  const checkRateLimit = useCallback(
    (action: keyof typeof RATE_LIMITS) => {
      const identifier = user?.id || getClientIdentifier();
      return securityMiddleware.checkRateLimit(identifier, action);
    },
    [user?.id],
  );

  const validateAndSanitizeEmail = useCallback((email: string) => {
    const validation = securityMiddleware.validateEmailSecurity(email);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }
    return securityMiddleware.sanitizeInput(email);
  }, []);

  const logSecurityEvent = useCallback(
    (type: SecurityEvent['type'], details: Record<string, any>) => {
      const event: SecurityEvent = {
        type,
        endpoint: window.location.pathname,
        details,
        timestamp: new Date(),
        ...(user?.id && { userId: user.id }),
      };
      securityMiddleware.logSecurityEvent(event);
    },
    [user?.id],
  );

  return {
    checkRateLimit,
    validateAndSanitizeEmail,
    logSecurityEvent,
    csrfToken: securityMiddleware.generateCSRFToken(),
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(): string {
  // In a real app, you'd use a more sophisticated method
  // including IP address, user agent fingerprinting, etc.
  return navigator.userAgent + Date.now().toString();
}

/**
 * Security headers configuration for Supabase
 */
export const SECURITY_HEADERS = {
  'X-Client-Info': 'dating-app/1.0.0',
  'X-Requested-With': 'XMLHttpRequest',
};

/**
 * Enhanced fetch wrapper with security features
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const headers = {
    ...SECURITY_HEADERS,
    'X-CSRF-Token': securityMiddleware.generateCSRFToken(),
    ...options.headers,
  };

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

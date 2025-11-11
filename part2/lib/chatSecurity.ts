/**
 * OMNIPRIME 15 Commandments - Chat Security & Sanitization
 * Absolute security, sanitization, and validation for chat functionality
 */

import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Security configuration
export const CHAT_SECURITY_CONFIG = {
  maxMessageLength: 1000,
  maxMessagesPerMinute: 30,
  maxMessagesPerHour: 200,
  maxMessagesPerDay: 1000,
  rateLimitWindowMs: 60000, // 1 minute
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  allowedDomains: ['unsplash.com', 'images.unsplash.com'], // For avatar images
  blockedWords: [
    'spam',
    'scam',
    'phishing',
    'malware',
    'virus',
    'hack',
    'exploit',
    'inappropriate',
    'offensive',
    'hate',
    'discrimination',
    'harassment',
  ],
  htmlAllowedTags: [], // No HTML allowed in messages
  htmlAllowedAttributes: {},
} as const;

// Message validation schema
export const messageSchema = z.object({
  id: z.string().uuid().optional(),
  senderId: z.string().min(1, 'Sender ID is required'),
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(
      CHAT_SECURITY_CONFIG.maxMessageLength,
      `Message must be less than ${CHAT_SECURITY_CONFIG.maxMessageLength} characters`,
    )
    .refine(
      (content) => !containsBlockedWords(content),
      'Message contains inappropriate content',
    ),
  timestamp: z.date().optional(),
  read: z.boolean().optional(),
  type: z.enum(['text', 'image', 'voice', 'emoji', 'system']).optional(),
  metadata: z
    .object({
      imageUrl: z.string().url().optional(),
      voiceUrl: z.string().url().optional(),
      emoji: z.string().optional(),
      replyTo: z.string().uuid().optional(),
    })
    .optional(),
});

export type SecureMessage = z.infer<typeof messageSchema>;

// Rate limiting store
class RateLimiter {
  private attempts = new Map<string, number[]>();

  isAllowed(userId: string, action: string = 'message'): boolean {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowStart = now - CHAT_SECURITY_CONFIG.rateLimitWindowMs;

    // Get existing attempts
    const userAttempts = this.attempts.get(key) || [];

    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(
      (timestamp) => timestamp > windowStart,
    );

    // Check if under limit
    const isAllowed =
      recentAttempts.length < CHAT_SECURITY_CONFIG.maxMessagesPerMinute;

    if (isAllowed) {
      // Add current attempt
      recentAttempts.push(now);
      this.attempts.set(key, recentAttempts);
    }

    return isAllowed;
  }

  getRemainingAttempts(userId: string, action: string = 'message'): number {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const windowStart = now - CHAT_SECURITY_CONFIG.rateLimitWindowMs;

    const userAttempts = this.attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(
      (timestamp) => timestamp > windowStart,
    );

    return Math.max(
      0,
      CHAT_SECURITY_CONFIG.maxMessagesPerMinute - recentAttempts.length,
    );
  }

  reset(userId: string, action: string = 'message'): void {
    const key = `${userId}:${action}`;
    this.attempts.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Content sanitization
export class ChatSanitizer {
  static sanitizeMessage(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    // Remove null bytes and other control characters
    let sanitized = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Sanitize HTML
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: [...CHAT_SECURITY_CONFIG.htmlAllowedTags],
      ALLOWED_ATTR: Object.keys(CHAT_SECURITY_CONFIG.htmlAllowedAttributes),
      ALLOW_DATA_ATTR: false,
    });

    // Normalize whitespace
    sanitized = sanitized.trim().replace(/\s+/g, ' ');

    // Limit length
    if (sanitized.length > CHAT_SECURITY_CONFIG.maxMessageLength) {
      sanitized = sanitized.substring(0, CHAT_SECURITY_CONFIG.maxMessageLength);
    }

    return sanitized;
  }

  static sanitizeImageUrl(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    try {
      const urlObj = new URL(url);

      // Check if domain is allowed
      if (
        !CHAT_SECURITY_CONFIG.allowedDomains.some(
          (domain) =>
            urlObj.hostname === domain ||
            urlObj.hostname.endsWith('.' + domain),
        )
      ) {
        return null;
      }

      // Ensure HTTPS
      if (urlObj.protocol !== 'https:') {
        return null;
      }

      return url;
    } catch {
      return null;
    }
  }

  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!CHAT_SECURITY_CONFIG.allowedImageTypes.includes(file.type as any)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${CHAT_SECURITY_CONFIG.allowedImageTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > CHAT_SECURITY_CONFIG.maxImageSize) {
      return {
        valid: false,
        error: `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds maximum allowed size of ${CHAT_SECURITY_CONFIG.maxImageSize / 1024 / 1024}MB`,
      };
    }

    return { valid: true };
  }
}

// Content moderation
export class ContentModerator {
  static containsBlockedWords(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    const lowerContent = content.toLowerCase();

    return CHAT_SECURITY_CONFIG.blockedWords.some((word) =>
      lowerContent.includes(word.toLowerCase()),
    );
  }

  static containsSpamPatterns(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Common spam patterns
    const spamPatterns = [
      /(\b(?:buy|sell|purchase|order|discount|cheap|free)\b.*){3,}/i, // Excessive sales language
      /(.)\1{4,}/, // Character repetition
      /https?:\/\/[^\s]{10,}/gi, // Long URLs
      /\b(?:crypto|bitcoin|investment|money|cash|profit)\b.*\b(?:guarantee|promise|sure|certain)\b/i, // Financial spam
      /\b(?:viagra|casino|lottery|winner|prize)\b/i, // Common spam keywords
    ];

    return spamPatterns.some((pattern) => pattern.test(content));
  }

  static calculateSpamScore(content: string): number {
    let score = 0;

    if (this.containsBlockedWords(content)) score += 50;
    if (this.containsSpamPatterns(content)) score += 30;

    // Length-based scoring
    if (content.length < 5) score += 20; // Too short
    if (content.length > 500) score += 10; // Very long

    // Capitalization scoring
    const uppercaseRatio =
      (content.match(/[A-Z]/g) || []).length / content.length;
    if (uppercaseRatio > 0.7) score += 15; // Excessive caps

    // Symbol scoring
    const symbolRatio =
      (content.match(/[^a-zA-Z0-9\s]/g) || []).length / content.length;
    if (symbolRatio > 0.3) score += 10; // Excessive symbols

    return Math.min(score, 100);
  }

  static shouldBlockMessage(
    content: string,
    userId: string,
  ): { block: boolean; reason?: string; score: number } {
    const score = this.calculateSpamScore(content);

    if (score >= 70) {
      return {
        block: true,
        reason: 'High spam score - message blocked for safety',
        score,
      };
    }

    // Check rate limiting
    if (!rateLimiter.isAllowed(userId)) {
      return {
        block: true,
        reason: 'Rate limit exceeded - please slow down',
        score: 100,
      };
    }

    return { block: false, score };
  }
}

// Input validation utilities
export class ChatValidator {
  static validateMessage(message: unknown): {
    valid: boolean;
    data?: SecureMessage;
    errors?: string[];
  } {
    try {
      const validatedMessage = messageSchema.parse(message);
      return { valid: true, data: validatedMessage };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          (err) => `${err.path.join('.')}: ${err.message}`,
        );
        return { valid: false, errors };
      }
      return { valid: false, errors: ['Invalid message format'] };
    }
  }

  static validateAndSanitizeMessage(
    message: unknown,
    userId: string,
  ): {
    valid: boolean;
    data?: SecureMessage;
    errors?: string[];
    blocked?: boolean;
    blockReason?: string;
  } {
    // First validate structure
    const validation = this.validateMessage(message);
    if (!validation.valid) {
      return validation;
    }

    const msg = validation.data!;

    // Sanitize content
    msg.content = ChatSanitizer.sanitizeMessage(msg.content);

    // Check for blocked content
    const moderation = ContentModerator.shouldBlockMessage(msg.content, userId);
    if (moderation.block) {
      return {
        valid: false,
        blocked: true,
        blockReason: moderation.reason || 'Content moderation',
        errors: [moderation.reason || 'Message blocked by content moderation'],
      };
    }

    // Additional security checks
    if (msg.metadata?.imageUrl) {
      const sanitizedUrl = ChatSanitizer.sanitizeImageUrl(
        msg.metadata.imageUrl,
      );
      if (!sanitizedUrl) {
        return {
          valid: false,
          errors: ['Invalid or unsafe image URL'],
        };
      }
      msg.metadata.imageUrl = sanitizedUrl;
    }

    return { valid: true, data: msg };
  }
}

// Security headers and CSP
export const CHAT_SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://images.unsplash.com https://unsplash.com",
    "font-src 'self'",
    "connect-src 'self' wss: https:",
    "media-src 'self'",
    "object-src 'none'",
    "frame-src 'none'",
  ].join('; '),

  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Export utility functions
export const containsBlockedWords = ContentModerator.containsBlockedWords;
export const sanitizeMessage = ChatSanitizer.sanitizeMessage;
export const validateMessage = ChatValidator.validateMessage;
export const validateAndSanitizeMessage =
  ChatValidator.validateAndSanitizeMessage;

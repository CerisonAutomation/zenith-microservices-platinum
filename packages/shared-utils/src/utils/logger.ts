import winston from 'winston';

/**
 * SECURITY FIX #5: Sanitize sensitive data from logs
 *
 * This prevents accidentally logging passwords, tokens, API keys, and other
 * sensitive information that could be exposed in log files or monitoring systems.
 */

// List of sensitive field names to redact
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'authorization',
  'cookie',
  'session',
  'sessionId',
  'session_id',
  'privateKey',
  'private_key',
  'creditCard',
  'credit_card',
  'cvv',
  'ssn',
  'socialSecurity',
  'social_security',
];

// Regex patterns for sensitive data
const SENSITIVE_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone numbers
  /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, // Credit card numbers
  /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g, // Bearer tokens
  /sk_[a-z]+_[A-Za-z0-9]+/g, // Stripe secret keys
  /pk_[a-z]+_[A-Za-z0-9]+/g, // Stripe publishable keys (less sensitive but still good to redact)
];

/**
 * Sanitize sensitive data from log messages and objects
 */
function sanitize(data: any): any {
  if (typeof data === 'string') {
    let sanitized = data;

    // Replace patterns with redacted values
    SENSITIVE_PATTERNS.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => sanitize(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Check if field name is sensitive
      const isSensitiveField = SENSITIVE_FIELDS.some(field =>
        key.toLowerCase().includes(field.toLowerCase())
      );

      if (isSensitiveField) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Custom format to sanitize logs before writing
 */
const sanitizeFormat = winston.format((info) => {
  // Sanitize the message
  if (info.message) {
    info.message = sanitize(info.message);
  }

  // Sanitize metadata
  const sanitized = sanitize(info);

  return sanitized;
});

const logFormat = winston.format.combine(
  sanitizeFormat(), // SECURITY FIX #5: Apply sanitization first
  winston.format.timestamp(),
  winston.format.errors({ stack: process.env.NODE_ENV === 'production' ? false : true }), // SECURITY: Hide stack traces in production logs
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'zenith-microservices' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Create logs directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs', { recursive: true });
}

// SECURITY: Add method to explicitly redact sensitive data
logger.redact = (message: string, data?: any) => {
  return {
    message,
    data: data ? sanitize(data) : undefined
  };
};

export default logger;
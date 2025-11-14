/**
 * Production-ready logging for Next.js API routes
 * Works in both Edge and Node.js runtimes
 * Integrates with Vercel's logging infrastructure
 */

interface LogContext {
  [key: string]: unknown;
}

interface ErrorContext extends LogContext {
  error?: Error | unknown;
  stack?: string;
}

/**
 * API Logger for production use
 * - Structured logging compatible with Vercel
 * - Works in Edge and Node.js runtimes
 * - Automatically captures context and errors
 */
export class APILogger {
  private static formatError(error: unknown): ErrorContext {
    if (error instanceof Error) {
      return {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      };
    }
    return { error: String(error) };
  }

  /**
   * Log informational messages
   */
  static info(message: string, context?: LogContext) {
    const logData = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    };

    if (process.env.NODE_ENV === 'development') {
      console.log('[INFO]', message, context || '');
    } else {
      // In production, log as JSON for Vercel's log aggregation
      console.log(JSON.stringify(logData));
    }
  }

  /**
   * Log warning messages
   */
  static warn(message: string, context?: LogContext) {
    const logData = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...context
    };

    if (process.env.NODE_ENV === 'development') {
      console.warn('[WARN]', message, context || '');
    } else {
      console.warn(JSON.stringify(logData));
    }
  }

  /**
   * Log error messages with full context
   */
  static error(message: string, error?: unknown, context?: LogContext) {
    const errorContext = error ? this.formatError(error) : {};
    const logData = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      ...errorContext,
      ...context
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR]', message, error, context || '');
    } else {
      // Production: structured JSON logging
      console.error(JSON.stringify(logData));
    }
  }

  /**
   * Log debug messages (only in development)
   */
  static debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[DEBUG]', message, context || '');
    }
  }

  /**
   * Create a scoped logger for a specific API route
   */
  static scope(routeName: string) {
    return {
      info: (message: string, context?: LogContext) =>
        this.info(`[${routeName}] ${message}`, context),
      warn: (message: string, context?: LogContext) =>
        this.warn(`[${routeName}] ${message}`, context),
      error: (message: string, error?: unknown, context?: LogContext) =>
        this.error(`[${routeName}] ${message}`, error, context),
      debug: (message: string, context?: LogContext) =>
        this.debug(`[${routeName}] ${message}`, context)
    };
  }
}

/**
 * Helper to log API request metrics
 * Use this to track performance and usage
 */
export function logAPIMetrics(route: string, duration: number, statusCode: number, context?: LogContext) {
  APILogger.info('API Request Completed', {
    route,
    duration_ms: duration,
    status_code: statusCode,
    ...context
  });
}

/**
 * Measure and log API route execution time
 */
export async function measureAPIPerformance<T>(
  route: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logAPIMetrics(route, duration, 200);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logAPIMetrics(route, duration, 500, { error: true });
    throw error;
  }
}

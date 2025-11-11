/**
 * 📊 Monitoring & Observability System
 * Comprehensive logging, metrics, and error tracking
 */

import { getCircuitBreakerHealth } from '@/lib/circuitBreaker';

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  tags?: Record<string, string>;
  timestamp: Date;
}

class MonitoringSystem {
  private logs: LogEntry[] = [];
  private metrics: Metric[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private readonly maxEntries = 1000;

  /**
   * Log an event
   */
  log(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>,
  ): void {
    const userId = this.getCurrentUserId();
    const sessionId = this.getSessionId();
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      ...(context && { context }),
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxEntries) {
      this.logs = this.logs.slice(-this.maxEntries);
    }

    // Console output for development
    const logMethod =
      level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    console[logMethod](`[${level.toUpperCase()}] ${message}`, context || '');

    // In production, send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalLogger(entry);
    }
  }

  /**
   * Record a metric
   */
  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): void {
    const metric: Metric = {
      name,
      value,
      ...(tags && { tags }),
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxEntries) {
      this.metrics = this.metrics.slice(-this.maxEntries);
    }

    // In production, send to metrics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMetricsService(metric);
    }
  }

  /**
   * Record performance metric
   */
  recordPerformance(
    name: string,
    duration: number,
    tags?: Record<string, string>,
  ): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      ...(tags && { tags }),
      timestamp: new Date(),
    };

    this.performanceMetrics.push(metric);

    // Keep only recent metrics
    if (this.performanceMetrics.length > this.maxEntries) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxEntries);
    }

    // Log slow operations
    if (duration > 1000) {
      this.log('warn', `Slow operation: ${name}`, { duration, tags });
    }
  }

  /**
   * Performance monitoring decorator
   */
  timeOperation<T>(
    name: string,
    operation: () => T,
    tags?: Record<string, string>,
  ): T {
    const start = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - start;
      this.recordPerformance(name, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordPerformance(`${name}.error`, duration, {
        ...tags,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Async performance monitoring
   */
  async timeAsyncOperation<T>(
    name: string,
    operation: () => Promise<T>,
    tags?: Record<string, string>,
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      this.recordPerformance(name, duration, tags);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordPerformance(`${name}.error`, duration, {
        ...tags,
        error: String(error),
      });
      throw error;
    }
  }

  /**
   * Error tracking
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.log('error', error.message, {
      ...context,
      stack: error.stack,
      name: error.name,
    });

    this.recordMetric('error.count', 1, {
      type: error.name,
      message: error.message,
    });

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracker(error, context);
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus(): HealthStatus {
    const circuitBreakerHealth = getCircuitBreakerHealth();

    const errorsLastHour = this.logs.filter(
      (log) =>
        log.level === 'error' && log.timestamp > new Date(Date.now() - 3600000),
    ).length;

    const avgResponseTime = this.calculateAverageResponseTime();

    return {
      status: errorsLastHour > 10 ? 'unhealthy' : 'healthy',
      timestamp: new Date(),
      metrics: {
        errorCount: errorsLastHour,
        averageResponseTime: avgResponseTime,
        circuitBreakers: circuitBreakerHealth,
      },
    };
  }

  /**
   * Get monitoring data for dashboard
   */
  getMonitoringData(): MonitoringData {
    return {
      logs: this.logs.slice(-100), // Last 100 logs
      metrics: this.metrics.slice(-100), // Last 100 metrics
      performance: this.performanceMetrics.slice(-100), // Last 100 performance metrics
      health: this.getHealthStatus(),
    };
  }

  private getCurrentUserId(): string | undefined {
    // In a real app, get from auth context
    return 'demo-user';
  }

  private getSessionId(): string | undefined {
    // Generate or get session ID
    return sessionStorage.getItem('sessionId') || 'demo-session';
  }

  private calculateAverageResponseTime(): number {
    const recentMetrics = this.performanceMetrics.filter(
      (metric) => metric.timestamp > new Date(Date.now() - 300000), // Last 5 minutes
    );

    if (recentMetrics.length === 0) return 0;

    const total = recentMetrics.reduce(
      (sum, metric) => sum + metric.duration,
      0,
    );
    return total / recentMetrics.length;
  }

  private sendToExternalLogger(entry: LogEntry): void {
    // Send to services like DataDog, LogRocket, etc.
    // Implementation depends on chosen logging service
    console.log('Sending to external logger:', entry);
  }

  private sendToMetricsService(metric: Metric): void {
    // Send to services like DataDog, New Relic, etc.
    console.log('Sending metric:', metric);
  }

  private sendToErrorTracker(
    error: Error,
    context?: Record<string, any>,
  ): void {
    // Send to services like Sentry, Rollbar, etc.
    console.log('Sending error to tracker:', error, context);
  }
}

// Global monitoring instance
export const monitoring = new MonitoringSystem();

// Convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>) =>
    monitoring.log('debug', message, context),
  info: (message: string, context?: Record<string, any>) =>
    monitoring.log('info', message, context),
  warn: (message: string, context?: Record<string, any>) =>
    monitoring.log('warn', message, context),
  error: (message: string, context?: Record<string, any>) =>
    monitoring.log('error', message, context),
};

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  metrics: {
    errorCount: number;
    averageResponseTime: number;
    circuitBreakers: Record<string, any>;
  };
}

export interface MonitoringData {
  logs: LogEntry[];
  metrics: Metric[];
  performance: PerformanceMetric[];
  health: HealthStatus;
}

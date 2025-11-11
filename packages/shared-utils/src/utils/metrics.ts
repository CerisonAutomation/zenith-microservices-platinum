import {
  register,
  collectDefaultMetrics,
  Gauge,
  Counter,
  Histogram,
  Summary,
} from 'prom-client';

// Enable default metrics collection with a prefix to avoid conflicts
collectDefaultMetrics({ prefix: 'zenith_' });

// --- TYPE DEFINITIONS FOR STRICT METRIC LABELS ---

type HttpMetricLabels = 'method' | 'route' | 'status_code';
type DatabaseMetricLabels = 'operation' | 'table';
type ErrorMetricLabels = 'service' | 'operation' | 'severity';
type CacheMetricLabels = 'operation';

/**
 * A singleton service for collecting and exposing Prometheus metrics.
 * This service provides a centralized, type-safe way to manage metrics.
 *
 * @class MetricsService
 * @see https://github.com/siimon/prom-client
 */
export class MetricsService {
  private static instance: MetricsService;

  // HTTP metrics
  public readonly httpRequestTotal: Counter<HttpMetricLabels>;
  public readonly httpRequestDuration: Histogram<HttpMetricLabels>;

  // Business metrics
  public readonly userRegistrations: Counter<'source'>;
  public readonly messagesSent: Counter<'type'>;
  public readonly searchesPerformed: Counter<never>;
  public readonly matchesCreated: Counter<'tier'>;

  // System metrics
  public readonly errorsTotal: Counter<ErrorMetricLabels>;
  public readonly cacheHits: Counter<CacheMetricLabels>;
  public readonly cacheMisses: Counter<CacheMetricLabels>;
  public readonly cacheLatency: Histogram<CacheMetricLabels>;
  public readonly databaseConnections: Gauge<never>;
  public readonly databaseQueryDuration: Histogram<DatabaseMetricLabels>;

  /**
   * The constructor is private to enforce the singleton pattern.
   * It initializes all the metrics that will be collected.
   */
  private constructor() {
    // HTTP metrics
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests.',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds.',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 1, 1.5, 3, 5], // Adjusted for web services
    });

    // Business metrics
    this.userRegistrations = new Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations.',
      labelNames: ['source'],
    });

    this.messagesSent = new Counter({
      name: 'messages_sent_total',
      help: 'Total number of messages sent.',
      labelNames: ['type'],
    });

    this.searchesPerformed = new Counter({
      name: 'searches_performed_total',
      help: 'Total number of searches performed.',
    });

    this.matchesCreated = new Counter({
      name: 'matches_created_total',
      help: 'Total number of matches created.',
      labelNames: ['tier'],
    });

    // System metrics
    this.errorsTotal = new Counter({
      name: 'errors_total',
      help: 'Total number of application errors.',
      labelNames: ['service', 'operation', 'severity'],
    });

    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits.',
      labelNames: ['operation'],
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses.',
      labelNames: ['operation'],
    });

    this.cacheLatency = new Histogram({
      name: 'cache_latency_seconds',
      help: 'Latency of cache operations in seconds.',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
    });

    this.databaseConnections = new Gauge({
      name: 'database_connections_active',
      help: 'Number of active database connections.',
    });

    this.databaseQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries in seconds.',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5], // Granular buckets for DB
    });
  }

  /**
   * Returns the singleton instance of the MetricsService.
   * @returns {MetricsService} The singleton instance.
   */
  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Retrieves the metrics in a format that can be exposed by a Prometheus endpoint.
   * The endpoint should set the Content-Type header to the value of `register.contentType`.
   * @returns {Promise<string>} A promise that resolves to the metrics string.
   */
  public async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * The content type for the metrics endpoint.
   * @type {string}
   */
  public get contentType(): string {
    return register.contentType;
  }

  /**
   * Resets all metrics. Useful for testing environments.
   * WARNING: Do not use in production.
   */
  public reset(): void {
    register.resetMetrics();
  }

  /**
   * Clears all registered metrics. Useful for hot-reloading environments.
   * WARNING: Do not use in production.
   */
  public clear(): void {
    register.clear();
  }
}

/**
 * The singleton instance of the MetricsService.
 * Use this instance to interact with metrics throughout the application.
 *
 * @example
 * import { metrics } from '@/utils/metrics';
 *
 * // Increment a counter
 * metrics.httpRequestTotal.inc({ method: 'GET', route: '/api/users', status_code: '200' });
 *
 * // Observe a histogram
 * const end = metrics.httpRequestDuration.startTimer();
 * // ... do something ...
 * end({ method: 'GET', route: '/api/users', status_code: '200' });
 *
 * // Set a gauge
 * metrics.databaseConnections.set(10);
 */
export const metrics = MetricsService.getInstance();
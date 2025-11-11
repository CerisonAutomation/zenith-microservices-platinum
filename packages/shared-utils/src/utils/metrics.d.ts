import { Gauge, Counter, Histogram } from 'prom-client';
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
export declare class MetricsService {
    private static instance;
    readonly httpRequestTotal: Counter<HttpMetricLabels>;
    readonly httpRequestDuration: Histogram<HttpMetricLabels>;
    readonly userRegistrations: Counter<'source'>;
    readonly messagesSent: Counter<'type'>;
    readonly searchesPerformed: Counter<never>;
    readonly matchesCreated: Counter<'tier'>;
    readonly errorsTotal: Counter<ErrorMetricLabels>;
    readonly cacheHits: Counter<CacheMetricLabels>;
    readonly cacheMisses: Counter<CacheMetricLabels>;
    readonly cacheLatency: Histogram<CacheMetricLabels>;
    readonly databaseConnections: Gauge<never>;
    readonly databaseQueryDuration: Histogram<DatabaseMetricLabels>;
    /**
     * The constructor is private to enforce the singleton pattern.
     * It initializes all the metrics that will be collected.
     */
    private constructor();
    /**
     * Returns the singleton instance of the MetricsService.
     * @returns {MetricsService} The singleton instance.
     */
    static getInstance(): MetricsService;
    /**
     * Retrieves the metrics in a format that can be exposed by a Prometheus endpoint.
     * The endpoint should set the Content-Type header to the value of `register.contentType`.
     * @returns {Promise<string>} A promise that resolves to the metrics string.
     */
    getMetrics(): Promise<string>;
    /**
     * The content type for the metrics endpoint.
     * @type {string}
     */
    get contentType(): string;
    /**
     * Resets all metrics. Useful for testing environments.
     * WARNING: Do not use in production.
     */
    reset(): void;
    /**
     * Clears all registered metrics. Useful for hot-reloading environments.
     * WARNING: Do not use in production.
     */
    clear(): void;
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
export declare const metrics: MetricsService;
export {};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = exports.MetricsService = void 0;
const prom_client_1 = require("prom-client");
// Enable default metrics collection with a prefix to avoid conflicts
(0, prom_client_1.collectDefaultMetrics)({ prefix: 'zenith_' });
/**
 * A singleton service for collecting and exposing Prometheus metrics.
 * This service provides a centralized, type-safe way to manage metrics.
 *
 * @class MetricsService
 * @see https://github.com/siimon/prom-client
 */
class MetricsService {
    /**
     * The constructor is private to enforce the singleton pattern.
     * It initializes all the metrics that will be collected.
     */
    constructor() {
        // HTTP metrics
        this.httpRequestTotal = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests.',
            labelNames: ['method', 'route', 'status_code'],
        });
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds.',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.3, 0.5, 1, 1.5, 3, 5], // Adjusted for web services
        });
        // Business metrics
        this.userRegistrations = new prom_client_1.Counter({
            name: 'user_registrations_total',
            help: 'Total number of user registrations.',
            labelNames: ['source'],
        });
        this.messagesSent = new prom_client_1.Counter({
            name: 'messages_sent_total',
            help: 'Total number of messages sent.',
            labelNames: ['type'],
        });
        this.searchesPerformed = new prom_client_1.Counter({
            name: 'searches_performed_total',
            help: 'Total number of searches performed.',
        });
        this.matchesCreated = new prom_client_1.Counter({
            name: 'matches_created_total',
            help: 'Total number of matches created.',
            labelNames: ['tier'],
        });
        // System metrics
        this.errorsTotal = new prom_client_1.Counter({
            name: 'errors_total',
            help: 'Total number of application errors.',
            labelNames: ['service', 'operation', 'severity'],
        });
        this.cacheHits = new prom_client_1.Counter({
            name: 'cache_hits_total',
            help: 'Total number of cache hits.',
            labelNames: ['operation'],
        });
        this.cacheMisses = new prom_client_1.Counter({
            name: 'cache_misses_total',
            help: 'Total number of cache misses.',
            labelNames: ['operation'],
        });
        this.cacheLatency = new prom_client_1.Histogram({
            name: 'cache_latency_seconds',
            help: 'Latency of cache operations in seconds.',
            labelNames: ['operation'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5],
        });
        this.databaseConnections = new prom_client_1.Gauge({
            name: 'database_connections_active',
            help: 'Number of active database connections.',
        });
        this.databaseQueryDuration = new prom_client_1.Histogram({
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
    static getInstance() {
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
    async getMetrics() {
        return prom_client_1.register.metrics();
    }
    /**
     * The content type for the metrics endpoint.
     * @type {string}
     */
    get contentType() {
        return prom_client_1.register.contentType;
    }
    /**
     * Resets all metrics. Useful for testing environments.
     * WARNING: Do not use in production.
     */
    reset() {
        prom_client_1.register.resetMetrics();
    }
    /**
     * Clears all registered metrics. Useful for hot-reloading environments.
     * WARNING: Do not use in production.
     */
    clear() {
        prom_client_1.register.clear();
    }
}
exports.MetricsService = MetricsService;
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
exports.metrics = MetricsService.getInstance();
//# sourceMappingURL=metrics.js.map
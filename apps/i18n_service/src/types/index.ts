/**
 * Translation request for batch operations
 */
export interface TranslationRequest {
  language: string;
  keys: string[];
  variables?: Record<string, Record<string, any>>;
}

/**
 * Translation result for batch operations
 */
export interface TranslationResult {
  language: string;
  translations: Record<string, any>;
  fallbackUsed?: boolean;
}

/**
 * Interpolation options for variable substitution
 */
export interface InterpolationOptions {
  [key: string]: string | number | boolean;
}

/**
 * Pluralization options
 */
export interface PluralOptions {
  count: number;
  [key: string]: any;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  service: string;
  version: string;
}

/**
 * Metrics response
 */
export interface MetricsResponse {
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
  };
  cache: {
    hits: number;
    misses: number;
    keys: number;
    hitRate: string;
  };
}

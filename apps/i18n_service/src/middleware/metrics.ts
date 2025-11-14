import { Request, Response, NextFunction } from 'express';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';
import { trace, SpanStatusCode } from '@opentelemetry/api';

// Create a Registry to register metrics
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP request counter
const httpRequestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status', 'service'],
  registers: [register],
});

// HTTP request duration histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// Database query counter
export const dbQueryCounter = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'service'],
  registers: [register],
});

// Database query duration histogram
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table', 'service'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Database connection pool metrics
export const dbPoolConnections = {
  active: new Counter({
    name: 'db_pool_connections_active',
    help: 'Number of active database connections',
    labelNames: ['service'],
    registers: [register],
  }),
  idle: new Counter({
    name: 'db_pool_connections_idle',
    help: 'Number of idle database connections',
    labelNames: ['service'],
    registers: [register],
  }),
  waiting: new Counter({
    name: 'db_pool_connections_waiting',
    help: 'Number of waiting database connections',
    labelNames: ['service'],
    registers: [register],
  }),
};

// Authentication metrics
export const authMetrics = {
  loginAttempts: new Counter({
    name: 'auth_login_attempts_total',
    help: 'Total number of login attempts',
    labelNames: ['status', 'method', 'service'],
    registers: [register],
  }),
  loginDuration: new Histogram({
    name: 'auth_login_duration_seconds',
    help: 'Duration of login operations in seconds',
    labelNames: ['method', 'service'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [register],
  }),
  tokenGeneration: new Counter({
    name: 'auth_tokens_generated_total',
    help: 'Total number of tokens generated',
    labelNames: ['type', 'service'],
    registers: [register],
  }),
  tokenValidation: new Counter({
    name: 'auth_tokens_validated_total',
    help: 'Total number of token validations',
    labelNames: ['status', 'service'],
    registers: [register],
  }),
};

// Middleware to track HTTP metrics
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const serviceName = process.env.SERVICE_NAME || 'auth-service';

  // Create a span for the request
  const span = trace.getActiveSpan();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status: res.statusCode.toString(),
      service: serviceName,
    };

    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, duration);

    // Add span attributes
    if (span) {
      span.setAttribute('http.duration_ms', Date.now() - start);
      span.setAttribute('http.route', route);

      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      }
    }
  });

  next();
};

// Metrics endpoint handler
export const metricsHandler = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  const metrics = await register.metrics();
  res.end(metrics);
};

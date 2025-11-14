import { Request, Response, NextFunction, Router } from 'express';

// Simple in-memory metrics
class MetricsCollector {
  private requests: Map<string, number> = new Map();
  private requestDurations: Map<string, number[]> = new Map();
  private errors: Map<string, number> = new Map();
  private totalRequests = 0;
  private totalErrors = 0;

  recordRequest(method: string, path: string, duration: number, statusCode: number) {
    const key = `${method} ${path}`;

    // Count requests
    this.requests.set(key, (this.requests.get(key) || 0) + 1);
    this.totalRequests++;

    // Record duration
    if (!this.requestDurations.has(key)) {
      this.requestDurations.set(key, []);
    }
    this.requestDurations.get(key)!.push(duration);

    // Count errors
    if (statusCode >= 400) {
      this.errors.set(key, (this.errors.get(key) || 0) + 1);
      this.totalErrors++;
    }
  }

  getMetrics() {
    const metrics: any = {
      total_requests: this.totalRequests,
      total_errors: this.totalErrors,
      requests_by_endpoint: {},
      errors_by_endpoint: {},
      avg_duration_by_endpoint: {},
    };

    // Requests per endpoint
    this.requests.forEach((count, key) => {
      metrics.requests_by_endpoint[key] = count;
    });

    // Errors per endpoint
    this.errors.forEach((count, key) => {
      metrics.errors_by_endpoint[key] = count;
    });

    // Average duration per endpoint
    this.requestDurations.forEach((durations, key) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      metrics.avg_duration_by_endpoint[key] = `${Math.round(avg)}ms`;
    });

    return metrics;
  }

  getPrometheusMetrics(): string {
    let output = '';

    // Total requests
    output += '# HELP http_requests_total Total number of HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    output += `http_requests_total ${this.totalRequests}\n\n`;

    // Total errors
    output += '# HELP http_errors_total Total number of HTTP errors\n';
    output += '# TYPE http_errors_total counter\n';
    output += `http_errors_total ${this.totalErrors}\n\n`;

    // Requests per endpoint
    output += '# HELP http_requests_by_endpoint Number of requests by endpoint\n';
    output += '# TYPE http_requests_by_endpoint counter\n';
    this.requests.forEach((count, key) => {
      const [method, path] = key.split(' ');
      output += `http_requests_by_endpoint{method="${method}",path="${path}"} ${count}\n`;
    });
    output += '\n';

    // Average duration
    output += '# HELP http_request_duration_ms Average request duration in milliseconds\n';
    output += '# TYPE http_request_duration_ms gauge\n';
    this.requestDurations.forEach((durations, key) => {
      const [method, path] = key.split(' ');
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      output += `http_request_duration_ms{method="${method}",path="${path}"} ${avg.toFixed(2)}\n`;
    });

    return output;
  }
}

const metricsCollector = new MetricsCollector();

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metricsCollector.recordRequest(req.method, req.route?.path || req.path, duration, res.statusCode);
  });

  next();
};

export const metricsRouter = Router();

metricsRouter.get('/', (req: Request, res: Response) => {
  const metrics = metricsCollector.getMetrics();
  res.json(metrics);
});

metricsRouter.get('/prometheus', (req: Request, res: Response) => {
  const metrics = metricsCollector.getPrometheusMetrics();
  res.set('Content-Type', 'text/plain');
  res.send(metrics);
});

import { Request, Response, NextFunction, Router } from 'express';

interface Metrics {
  totalRequests: number;
  requestsByMethod: Record<string, number>;
  requestsByPath: Record<string, number>;
  requestsByStatus: Record<number, number>;
  totalResponseTime: number;
  uptime: number;
  startTime: Date;
}

const metrics: Metrics = {
  totalRequests: 0,
  requestsByMethod: {},
  requestsByPath: {},
  requestsByStatus: {},
  totalResponseTime: 0,
  uptime: 0,
  startTime: new Date(),
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  metrics.totalRequests++;
  metrics.requestsByMethod[req.method] = (metrics.requestsByMethod[req.method] || 0) + 1;
  metrics.requestsByPath[req.path] = (metrics.requestsByPath[req.path] || 0) + 1;

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.totalResponseTime += duration;
    metrics.requestsByStatus[res.statusCode] = (metrics.requestsByStatus[res.statusCode] || 0) + 1;
  });

  next();
};

export const metricsRouter = Router();

metricsRouter.get('/', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - metrics.startTime.getTime()) / 1000);

  res.json({
    ...metrics,
    uptime: uptimeSeconds,
    averageResponseTime: metrics.totalRequests > 0
      ? Math.round(metrics.totalResponseTime / metrics.totalRequests)
      : 0,
  });
});

metricsRouter.get('/prometheus', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - metrics.startTime.getTime()) / 1000);
  const avgResponseTime = metrics.totalRequests > 0
    ? Math.round(metrics.totalResponseTime / metrics.totalRequests)
    : 0;

  let output = '';

  // Total requests
  output += `# HELP auth_total_requests Total number of requests\n`;
  output += `# TYPE auth_total_requests counter\n`;
  output += `auth_total_requests ${metrics.totalRequests}\n\n`;

  // Requests by method
  output += `# HELP auth_requests_by_method Requests by HTTP method\n`;
  output += `# TYPE auth_requests_by_method counter\n`;
  Object.entries(metrics.requestsByMethod).forEach(([method, count]) => {
    output += `auth_requests_by_method{method="${method}"} ${count}\n`;
  });
  output += '\n';

  // Requests by status
  output += `# HELP auth_requests_by_status Requests by HTTP status\n`;
  output += `# TYPE auth_requests_by_status counter\n`;
  Object.entries(metrics.requestsByStatus).forEach(([status, count]) => {
    output += `auth_requests_by_status{status="${status}"} ${count}\n`;
  });
  output += '\n';

  // Average response time
  output += `# HELP auth_avg_response_time Average response time in ms\n`;
  output += `# TYPE auth_avg_response_time gauge\n`;
  output += `auth_avg_response_time ${avgResponseTime}\n\n`;

  // Uptime
  output += `# HELP auth_uptime Service uptime in seconds\n`;
  output += `# TYPE auth_uptime counter\n`;
  output += `auth_uptime ${uptimeSeconds}\n`;

  res.set('Content-Type', 'text/plain');
  res.send(output);
});

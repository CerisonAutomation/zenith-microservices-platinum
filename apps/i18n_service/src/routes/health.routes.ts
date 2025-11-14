import { Router, Request, Response } from 'express';
import { HealthCheckResponse } from '../types';

export const healthRouter = Router();

/**
 * Liveness probe - Check if service is running
 */
healthRouter.get('/live', (req: Request, res: Response): void => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'i18n-service',
    version: '1.0.0',
  };

  res.json(response);
});

/**
 * Readiness probe - Check if service is ready to accept traffic
 */
healthRouter.get('/ready', (req: Request, res: Response): void => {
  // Add additional checks here if needed (e.g., database connection)
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'i18n-service',
    version: '1.0.0',
  };

  res.json(response);
});

/**
 * General health check
 */
healthRouter.get('/', (req: Request, res: Response): void => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'i18n-service',
    version: '1.0.0',
  };

  res.json(response);
});

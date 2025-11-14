import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';

// Assuming shared-utils is a sibling of apps
import { metrics } from '../../../packages/shared-utils/src/utils/metrics';
import { swaggerSpec } from './swagger.config';

// --- CONFIGURATION LOADING ---
interface ServiceConfig {
  url: string;
  prefix: string;
  timeout: number;
}

interface GatewayConfig {
  services: Record<string, ServiceConfig>;
  cors: cors.CorsOptions;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

const configPath = path.join(__dirname, '..', 'gateway.config.json');
const config: GatewayConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// --- INITIALIZATION ---
const app = express();
const PORT = process.env.PORT || 8080;

// --- CORE MIDDLEWARE ---
app.use(helmet()); // Secure headers
app.use(cors(config.cors)); // Enable CORS
app.use(express.json()); // Body parser

// Apply rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// --- METRICS INSTRUMENTATION MIDDLEWARE ---
const instrumentationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  const route = req.path;

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const statusCode = res.statusCode.toString();

    // Increment request total
    metrics.httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    // Observe request duration
    metrics.httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationInSeconds
    );
  });

  next();
};

app.use(instrumentationMiddleware);

// --- API DOCUMENTATION ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Zenith API Gateway Docs',
}));

app.get('/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// --- HEALTH CHECK ENDPOINTS ---
/**
 * @openapi
 * /health/live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness check
 *     description: Check if the gateway is alive
 *     responses:
 *       200:
 *         description: Gateway is alive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({ status: 'alive' });
});

/**
 * @openapi
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness check
 *     description: Check if the gateway is ready to accept traffic
 *     responses:
 *       200:
 *         description: Gateway is ready
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get('/health/ready', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ready' });
});

// --- METRICS ENDPOINT ---
/**
 * @openapi
 * /metrics:
 *   get:
 *     tags: [Metrics]
 *     summary: Prometheus metrics
 *     description: Get Prometheus-formatted metrics
 *     responses:
 *       200:
 *         description: Metrics in Prometheus format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', metrics.contentType);
    res.end(await metrics.getMetrics());
  } catch (error) {
    const err = error as Error;
    metrics.errorsTotal.inc({
      service: 'api-gateway',
      operation: 'getMetrics',
      severity: 'critical',
    });
    res.status(500).send(err.message);
  }
});

// --- DYNAMIC PROXY SETUP ---
Object.keys(config.services).forEach((serviceName) => {
  const service = config.services[serviceName];

  const proxyOptions: Options = {
    target: service.url,
    changeOrigin: true,
    pathRewrite: {
      [`^${service.prefix}`]: '', // Rewrite path to remove prefix
    },
    proxyTimeout: service.timeout,
    onError: (err: Error, req: Request, res: Response) => {
      metrics.errorsTotal.inc({
        service: serviceName,
        operation: 'proxyError',
        severity: 'high',
      });
      if (res instanceof require('http').ServerResponse) {
          res.writeHead(500, {
              'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ message: 'Error connecting to downstream service.' }));
      }
    },
  };

  app.use(service.prefix, createProxyMiddleware(proxyOptions));
  console.log(`[INFO] Proxy created for ${serviceName} at ${service.prefix} -> ${service.url}`);
});

// --- CENTRALIZED ERROR HANDLING ---
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR] Unhandled exception:', err);

  metrics.errorsTotal.inc({
    service: 'api-gateway',
    operation: 'unhandledException',
    severity: 'critical',
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({ error: 'Internal Server Error' });
});

// --- SERVER START ---
app.listen(PORT, () => {
  console.log(`[INFO] API Gateway listening on port ${PORT}`);
  console.log(`[INFO] API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`[INFO] OpenAPI Spec: http://localhost:${PORT}/openapi.json`);
  console.log(`[INFO] Health Check: http://localhost:${PORT}/health/live`);
  console.log(`[INFO] Metrics: http://localhost:${PORT}/metrics`);
});

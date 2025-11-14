import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { initializeI18n } from './i18n';
import { translationRouter } from './routes/translation.routes';
import { healthRouter } from './routes/health.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { metricsMiddleware, metricsRouter } from './middleware/metrics.middleware';
import { translationService } from './services/translation.service';
import { swaggerSpec } from './swagger.config';

const app = express();

// Trust proxy if configured (for rate limiting behind reverse proxy)
if (config.trustProxy) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/i18n', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Metrics middleware
app.use(metricsMiddleware);

// Store cache stats in app.locals for metrics endpoint
app.use((req: Request, res: Response, next: NextFunction) => {
  const stats = translationService.getCacheStats();
  app.locals.cacheKeys = stats.keys;
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Zenith i18n Service API Docs',
}));

app.get('/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);
app.use('/i18n', translationRouter);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'i18n-service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      languages: '/i18n/languages',
      translation: '/i18n/:language',
      translationKey: '/i18n/:language/:key',
      batchTranslate: 'POST /i18n/translate',
      clearCache: 'DELETE /i18n/cache',
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const start = async () => {
  try {
    // Initialize i18n
    await initializeI18n();
    console.log('✓ i18n initialized');

    const port = config.port;
    app.listen(port, () => {
      console.log(`✓ i18n Service running on port ${port}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
      console.log(`✓ Default language: ${config.defaultLanguage}`);
      console.log(`✓ Supported languages: ${config.supportedLanguages.join(', ')}`);
      console.log(`✓ Cache enabled: ${config.cacheEnabled}`);
      console.log(`✓ Health check: http://localhost:${port}/health`);
      console.log(`✓ Metrics: http://localhost:${port}/metrics`);
      console.log(`✓ API Documentation: http://localhost:${port}/api-docs`);
      console.log(`✓ OpenAPI Spec: http://localhost:${port}/openapi.json`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export { app };

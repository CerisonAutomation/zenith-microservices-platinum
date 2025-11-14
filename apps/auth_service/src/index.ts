// Initialize OpenTelemetry first (before any other imports)
import { startTracing } from './tracing';
startTracing();

import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { authRouter } from './routes/auth.routes';
import { healthRouter } from './routes/health.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import { initializeDatabase } from './db/database';
import { configurePassport } from './auth/passport.config';
import { metricsMiddleware, metricsHandler } from './middleware/metrics';
import { correlationIdMiddleware } from './middleware/correlation';
import { logger } from './utils/logger';
import { swaggerSpec } from './swagger.config';

const app = express();

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

app.use('/auth', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Correlation ID middleware (must be early in the chain)
app.use(correlationIdMiddleware);

// Request logging
app.use(requestLogger);

// Metrics middleware
app.use(metricsMiddleware);

// Passport initialization
app.use(passport.initialize());
configurePassport();

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Zenith Auth Service API Docs',
}));

// OpenAPI JSON endpoint
app.get('/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Routes
app.use('/health', healthRouter);
app.get('/metrics', metricsHandler);
app.use('/auth', authRouter);

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
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    const port = config.port;
    app.listen(port, () => {
      logger.info(`Auth Service running on port ${port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`Health check: http://localhost:${port}/health`);
      logger.info(`Metrics: http://localhost:${port}/metrics`);
      logger.info(`API Documentation: http://localhost:${port}/api-docs`);
      logger.info(`OpenAPI Spec: http://localhost:${port}/openapi.json`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export { app };

import express, { Request, Response, NextFunction } from 'express';
import swaggerUi from 'swagger-ui-express';
import checkoutRoutes from './routes/checkout';
import subscriptionRoutes from './routes/subscriptions';
import paymentMethodRoutes from './routes/payment-methods';
import webhookRoutes from './routes/webhooks';
import { swaggerSpec } from './swagger.config';

const app = express();
const PORT = process.env.PORT || 3002;

// Webhook route needs raw body, so we handle it separately
app.use(
  '/webhooks',
  express.raw({ type: 'application/json' }),
  webhookRoutes
);

// For all other routes, use JSON parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Zenith Payment Service API Docs',
}));

app.get('/openapi.json', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount routes
app.use('/checkout', checkoutRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/methods', paymentMethodRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Zenith Payment Service',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      checkout: {
        createSession: 'POST /checkout/create-session',
        success: 'POST /checkout/success',
        getSession: 'GET /checkout/session/:sessionId',
      },
      subscription: {
        create: 'POST /subscription/create',
        update: 'PUT /subscription/update/:subscriptionId',
        cancel: 'DELETE /subscription/cancel/:subscriptionId',
        get: 'GET /subscription/:subscriptionId',
        getUserSubscriptions: 'GET /subscription/user/:userId',
        reactivate: 'POST /subscription/reactivate/:subscriptionId',
      },
      paymentMethods: {
        list: 'GET /methods/:customerId',
        listByUser: 'GET /methods/user/:userId',
        attach: 'POST /methods/attach',
        detach: 'DELETE /methods/:paymentMethodId',
        setDefault: 'PUT /methods/:paymentMethodId/default',
        setupIntent: 'POST /methods/setup-intent',
      },
      webhooks: {
        stripe: 'POST /webhooks/stripe',
      },
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Payment Service running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`📄 OpenAPI Spec: http://localhost:${PORT}/openapi.json`);
  console.log(`🔔 Webhook endpoint: http://localhost:${PORT}/webhooks/stripe`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zenith Payment Service API',
      version: '1.0.0',
      description: 'Payment processing service with Stripe integration',
      contact: {
        name: 'Zenith API Support',
        email: 'api@zenith.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3002}`,
        description: 'Development server',
      },
      {
        url: 'https://api.zenith.com/payment',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        CheckoutSessionRequest: {
          type: 'object',
          required: ['priceId', 'userId', 'email'],
          properties: {
            priceId: { type: 'string', example: 'price_1234567890' },
            userId: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            successUrl: { type: 'string', format: 'uri', example: 'https://example.com/success' },
            cancelUrl: { type: 'string', format: 'uri', example: 'https://example.com/cancel' },
            metadata: { type: 'object', additionalProperties: { type: 'string' } },
          },
        },
        CheckoutSessionResponse: {
          type: 'object',
          properties: {
            sessionId: { type: 'string', example: 'cs_test_1234567890' },
            url: { type: 'string', format: 'uri', example: 'https://checkout.stripe.com/pay/cs_test_1234567890' },
          },
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            customerId: { type: 'string' },
            userId: { type: 'string' },
            status: { type: 'string', enum: ['active', 'canceled', 'past_due', 'unpaid'] },
            currentPeriodStart: { type: 'number' },
            currentPeriodEnd: { type: 'number' },
            cancelAtPeriodEnd: { type: 'boolean' },
          },
        },
        CreateSubscriptionRequest: {
          type: 'object',
          required: ['userId', 'email', 'priceId'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            priceId: { type: 'string' },
            paymentMethodId: { type: 'string' },
          },
        },
        PaymentMethod: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', example: 'card' },
            card: {
              type: 'object',
              properties: {
                brand: { type: 'string', example: 'visa' },
                last4: { type: 'string', example: '4242' },
                expMonth: { type: 'number', example: 12 },
                expYear: { type: 'number', example: 2025 },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      { name: 'Checkout', description: 'Checkout session management' },
      { name: 'Subscriptions', description: 'Subscription management' },
      { name: 'Payment Methods', description: 'Payment method management' },
      { name: 'Webhooks', description: 'Stripe webhook handlers' },
      { name: 'Health', description: 'Service health checks' },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zenith API Gateway',
      version: '1.0.0',
      description: 'Unified API Gateway for Zenith microservices platform',
      contact: {
        name: 'Zenith API Support',
        email: 'api@zenith.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 8080}`,
        description: 'Development server',
      },
      {
        url: 'https://api.zenith.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        HealthResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'alive' },
          },
        },
        ServiceRoute: {
          type: 'object',
          properties: {
            service: { type: 'string' },
            prefix: { type: 'string' },
            target: { type: 'string' },
            description: { type: 'string' },
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
      { name: 'Health', description: 'Gateway health and readiness checks' },
      { name: 'Metrics', description: 'Prometheus metrics' },
      { name: 'Proxy', description: 'Service proxy routes' },
    ],
  },
  apis: ['./src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

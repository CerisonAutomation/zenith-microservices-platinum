import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Zenith i18n Service API',
      version: '1.0.0',
      description: 'Internationalization and translation service',
      contact: {
        name: 'Zenith API Support',
        email: 'api@zenith.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}`,
        description: 'Development server',
      },
      {
        url: 'https://api.zenith.com/i18n',
        description: 'Production server',
      },
    ],
    components: {
      schemas: {
        TranslationResponse: {
          type: 'object',
          properties: {
            language: { type: 'string', example: 'en' },
            translations: { type: 'object', additionalProperties: { type: 'string' } },
          },
        },
        BatchTranslateRequest: {
          type: 'object',
          required: ['language', 'keys'],
          properties: {
            language: { type: 'string', example: 'es' },
            keys: { type: 'array', items: { type: 'string' }, example: ['welcome', 'goodbye'] },
          },
        },
        LanguageList: {
          type: 'object',
          properties: {
            languages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string', example: 'en' },
                  name: { type: 'string', example: 'English' },
                  nativeName: { type: 'string', example: 'English' },
                },
              },
            },
            default: { type: 'string', example: 'en' },
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
      { name: 'Translations', description: 'Translation endpoints' },
      { name: 'Languages', description: 'Language management' },
      { name: 'Health', description: 'Service health checks' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

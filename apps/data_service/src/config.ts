import { z } from 'zod';

const configSchema = z.object({
  port: z.number().default(3002),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  databaseUrl: z.string().url(),

  // CORS
  allowedOrigins: z.array(z.string()),

  // Rate limiting
  rateLimitWindowMs: z.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.number().default(100),

  // Pagination
  defaultPageSize: z.number().default(20),
  maxPageSize: z.number().default(100),

  // Auth Service
  authServiceUrl: z.string().url().default('http://localhost:3001'),

  // Security
  enableAuditLogging: z.boolean().default(true),
});

export type Config = z.infer<typeof configSchema>;

const parseConfig = (): Config => {
  const rawConfig = {
    port: parseInt(process.env.PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/data_db',

    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),

    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),

    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',

    enableAuditLogging: process.env.ENABLE_AUDIT_LOGGING !== 'false',
  };

  return configSchema.parse(rawConfig);
};

export const config = parseConfig();

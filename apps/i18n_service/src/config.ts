import { z } from 'zod';

const configSchema = z.object({
  port: z.number().default(3002),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // i18n Configuration
  defaultLanguage: z.string().default('en'),
  supportedLanguages: z.array(z.string()).default(['en', 'es', 'ja', 'zh', 'ar']),
  translationPath: z.string().default('./src/dictionary'),

  // Cache Configuration
  cacheEnabled: z.boolean().default(true),
  cacheTtl: z.number().default(3600), // 1 hour in seconds
  cacheCheckPeriod: z.number().default(600), // 10 minutes

  // CORS
  allowedOrigins: z.array(z.string()),

  // Rate limiting
  rateLimitWindowMs: z.number().default(900000), // 15 minutes
  rateLimitMaxRequests: z.number().default(100),

  // Security
  trustProxy: z.boolean().default(false),
});

export type Config = z.infer<typeof configSchema>;

const parseConfig = (): Config => {
  const rawConfig = {
    port: parseInt(process.env.PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,es,ja,zh,ar').split(','),
    translationPath: process.env.TRANSLATION_PATH || './src/dictionary',

    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    cacheTtl: parseInt(process.env.CACHE_TTL || '3600', 10),
    cacheCheckPeriod: parseInt(process.env.CACHE_CHECK_PERIOD || '600', 10),

    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),

    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    trustProxy: process.env.TRUST_PROXY === 'true',
  };

  return configSchema.parse(rawConfig);
};

export const config = parseConfig();

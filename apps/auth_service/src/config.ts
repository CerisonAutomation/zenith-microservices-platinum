import { z } from 'zod';

const configSchema = z.object({
  port: z.number().default(3001),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // JWT
  jwtSecret: z.string().min(32),
  jwtExpiresIn: z.string().default('7d'),
  refreshTokenExpiresIn: z.string().default('30d'),

  // Database
  databaseUrl: z.string().url(),

  // OAuth
  googleClientId: z.string().optional(),
  googleClientSecret: z.string().optional(),
  googleCallbackUrl: z.string().url().optional(),

  githubClientId: z.string().optional(),
  githubClientSecret: z.string().optional(),
  githubCallbackUrl: z.string().url().optional(),

  // CORS
  allowedOrigins: z.array(z.string()),

  // Rate limiting
  rateLimitWindowMs: z.number().default(900000),
  rateLimitMaxRequests: z.number().default(100),

  // Security
  bcryptRounds: z.number().default(12),
  maxLoginAttempts: z.number().default(5),
  lockoutDurationMs: z.number().default(900000), // 15 minutes
});

export type Config = z.infer<typeof configSchema>;

const parseConfig = (): Config => {
  const rawConfig = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production-minimum-32-chars',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',

    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/auth_db',

    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,

    githubClientId: process.env.GITHUB_CLIENT_ID,
    githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
    githubCallbackUrl: process.env.GITHUB_CALLBACK_URL,

    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),

    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDurationMs: parseInt(process.env.LOCKOUT_DURATION_MS || '900000', 10),
  };

  return configSchema.parse(rawConfig);
};

export const config = parseConfig();

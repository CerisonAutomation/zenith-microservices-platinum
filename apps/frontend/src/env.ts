/**
 * Environment Variable Validation
 * Validates all env vars at build time and runtime
 * PREVENTS RUNTIME CRASHES FROM MISSING VARS
 */

import { z } from 'zod';

const envSchema = z.object({
  // Supabase (REQUIRED)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key required'),

  // API (REQUIRED)
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3000/api'),

  // Stripe (REQUIRED for payments)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // AWS S3 (REQUIRED for photo uploads)
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().min(1),

  // Twilio (REQUIRED for SMS verification)
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().regex(/^\+[1-9]\d{1,14}$/),

  // SendGrid (REQUIRED for emails)
  SENDGRID_API_KEY: z.string().startsWith('SG.'),
  SENDGRID_FROM_EMAIL: z.string().email(),

  // Error Tracking (REQUIRED for production)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Analytics (OPTIONAL)
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_MIXPANEL_TOKEN: z.string().optional(),

  // Feature Flags (OPTIONAL)
  NEXT_PUBLIC_ENABLE_BOOKINGS: z.string().default('true').transform((v) => v === 'true'),
  NEXT_PUBLIC_ENABLE_PREMIUM: z.string().default('true').transform((v) => v === 'true'),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  CSRF_SECRET: z.string().min(32, 'CSRF secret must be at least 32 characters'),

  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
});

// Validate environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      throw new Error(
        `❌ CRITICAL: Missing or invalid environment variables:\n\n${missing}\n\n` +
          `Please check your .env.local file and ensure all required variables are set.\n` +
          `See .env.example for reference.`
      );
    }
    throw error;
  }
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe access
export type Env = z.infer<typeof envSchema>;

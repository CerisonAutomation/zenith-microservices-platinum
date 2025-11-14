/**
 * Environment variable validation for Next.js
 * Validates at build time and runtime
 * Following Vercel best practices
 */

import { z } from 'zod';

/**
 * Client-side environment variables (NEXT_PUBLIC_*)
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY: z.string().min(1).optional()
});

/**
 * Server-side environment variables
 */
const serverEnvSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1).optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_PREMIUM_PRICE_ID: z.string().min(1).optional(),
  STRIPE_ELITE_PRICE_ID: z.string().min(1).optional(),

  // JWT
  JWT_SECRET: z.string().min(32).optional(),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

/**
 * Validate environment variables
 * Throws detailed error if validation fails
 */
export function validateEnvironment() {
  // Only validate client vars in browser
  if (typeof window !== 'undefined') {
    const clientResult = clientEnvSchema.safeParse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
    });

    if (!clientResult.success) {
      console.error('❌ Invalid client environment variables:', clientResult.error.flatten());
      throw new Error('Invalid client environment configuration');
    }
    return;
  }

  // Validate server vars on server
  const serverResult = serverEnvSchema.safeParse(process.env);

  if (!serverResult.success) {
    console.error('❌ Invalid server environment variables:', serverResult.error.flatten());
    throw new Error('Invalid server environment configuration');
  }
}

/**
 * Check if specific features are configured
 */
export const isConfigured = {
  openai: () => Boolean(process.env.OPENAI_API_KEY),
  stripe: () => Boolean(process.env.STRIPE_SECRET_KEY),
  redis: () => Boolean(process.env.REDIS_URL),
  jwt: () => Boolean(process.env.JWT_SECRET)
};

/**
 * Get environment-specific configuration
 */
export function getEnvConfig() {
  return {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    features: {
      ai: isConfigured.openai(),
      payments: isConfigured.stripe(),
      cache: isConfigured.redis(),
      auth: isConfigured.jwt()
    }
  };
}

/**
 * Assert required environment variable exists
 * Use in API routes to fail fast if config missing
 */
export function requireEnv(key: string, context?: string): string {
  const value = process.env[key];
  if (!value) {
    const message = context
      ? `${context} requires ${key} environment variable`
      : `Missing required environment variable: ${key}`;
    throw new Error(message);
  }
  return value;
}

// Validate on import (fail fast in development)
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnvironment();
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.warn('⚠️  Environment validation failed:', error);
  }
}

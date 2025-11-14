/**
 * Environment Variable Validation
 *
 * Validates that all required environment variables are present
 * Prevents runtime errors from missing configuration
 */

interface EnvVar {
  key: string
  description: string
  required: boolean
  default?: string
}

const ENV_VARS: EnvVar[] = [
  // Supabase
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    required: true,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key',
    required: true,
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (server-side only)',
    required: false, // Only needed for server-side operations
  },

  // AI Gateway
  {
    key: 'AI_GATEWAY_API_KEY',
    description: 'Vercel AI Gateway API key',
    required: false, // Optional if using OIDC tokens
  },

  // AI Providers (BYOK)
  {
    key: 'OPENAI_API_KEY',
    description: 'OpenAI API key',
    required: false,
  },
  {
    key: 'ANTHROPIC_API_KEY',
    description: 'Anthropic API key',
    required: false,
  },

  // Payments
  {
    key: 'STRIPE_SECRET_KEY',
    description: 'Stripe secret key',
    required: false, // Only if using Stripe
  },
  {
    key: 'STRIPE_WEBHOOK_SECRET',
    description: 'Stripe webhook secret',
    required: false,
  },

  // App Configuration
  {
    key: 'NEXT_PUBLIC_APP_URL',
    description: 'Application URL',
    required: false,
    default: 'http://localhost:3000',
  },
]

export interface ValidationResult {
  valid: boolean
  missing: Array<{ key: string; description: string }>
  warnings: Array<{ key: string; message: string }>
}

/**
 * Validate environment variables
 * @param throwOnError If true, throws an error if required vars are missing
 * @returns Validation result
 */
export function validateEnvironment(throwOnError = false): ValidationResult {
  const missing: Array<{ key: string; description: string }> = []
  const warnings: Array<{ key: string; message: string }> = []

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.key]

    if (!value) {
      if (envVar.required) {
        missing.push({
          key: envVar.key,
          description: envVar.description,
        })
      } else if (!envVar.default) {
        warnings.push({
          key: envVar.key,
          message: `Optional variable not set: ${envVar.description}`,
        })
      }
    }
  }

  const result: ValidationResult = {
    valid: missing.length === 0,
    missing,
    warnings,
  }

  if (!result.valid && throwOnError) {
    throw new Error(
      `Missing required environment variables:\n${missing
        .map((m) => `  - ${m.key}: ${m.description}`)
        .join('\n')}`
    )
  }

  return result
}

/**
 * Log environment validation results
 */
export function logEnvironmentStatus(): void {
  const result = validateEnvironment(false)

  if (result.valid) {
    console.log('✅ All required environment variables are set')
  } else {
    console.error('❌ Missing required environment variables:')
    result.missing.forEach((m) => {
      console.error(`  - ${m.key}: ${m.description}`)
    })
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Optional environment variables not set:')
    result.warnings.forEach((w) => {
      console.warn(`  - ${w.key}: ${w.message}`)
    })
  }
}

/**
 * Check if environment is properly configured
 * Use this in middleware or API routes
 */
export function isEnvironmentReady(): boolean {
  return validateEnvironment(false).valid
}

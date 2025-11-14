/**
 * AXIOM:1 COMPLIANT AI CONFIGURATION
 *
 * Vercel AI SDK configuration with:
 * - Model management and versioning
 * - Provider fallback strategy
 * - Error handling and retries
 * - Cost optimization
 * - Observability hooks
 */

export interface AIModelConfig {
  primary: string;
  fallback: string;
  moderation: string;
  maxRetries: number;
  timeout: number;
  temperature: number;
}

export interface AIProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
  apiKey?: string;
  endpoint?: string;
}

/**
 * AI Model Configuration
 *
 * Oracle Tier Standards:
 * - <50ms p95 response time
 * - 99.999%+ uptime
 * - Automatic fallback
 * - Cost monitoring
 */
export const AI_CONFIG: AIModelConfig = {
  // Use stable production models (not preview)
  primary: Deno.env.get('AI_MODEL_PRIMARY') || 'gpt-4-turbo',
  fallback: Deno.env.get('AI_MODEL_FALLBACK') || 'gpt-3.5-turbo',
  moderation: Deno.env.get('AI_MODEL_MODERATION') || 'text-moderation-stable',

  // Retry configuration for resilience
  maxRetries: parseInt(Deno.env.get('AI_MAX_RETRIES') || '3'),
  timeout: parseInt(Deno.env.get('AI_TIMEOUT_MS') || '30000'),

  // Default temperature for conversation generation
  temperature: parseFloat(Deno.env.get('AI_TEMPERATURE') || '0.8'),
};

/**
 * Provider Configuration with Fallback Strategy
 *
 * Priority order:
 * 1. OpenAI (primary)
 * 2. Anthropic (fallback)
 * 3. Google Gemini (secondary fallback)
 */
export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    name: 'openai',
    enabled: !!Deno.env.get('OPENAI_API_KEY'),
    priority: 1,
    apiKey: Deno.env.get('OPENAI_API_KEY'),
    endpoint: Deno.env.get('OPENAI_API_ENDPOINT') || 'https://api.openai.com/v1',
  },
  {
    name: 'anthropic',
    enabled: !!Deno.env.get('ANTHROPIC_API_KEY'),
    priority: 2,
    apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
  },
  {
    name: 'google',
    enabled: !!Deno.env.get('GOOGLE_AI_API_KEY'),
    priority: 3,
    apiKey: Deno.env.get('GOOGLE_AI_API_KEY'),
  },
];

/**
 * Get active providers sorted by priority
 */
export function getActiveProviders(): AIProviderConfig[] {
  return AI_PROVIDERS
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Get primary provider or throw error
 */
export function getPrimaryProvider(): AIProviderConfig {
  const providers = getActiveProviders();
  if (providers.length === 0) {
    throw new Error('No AI providers configured. Set OPENAI_API_KEY or other provider keys.');
  }
  return providers[0];
}

/**
 * Check if fallback providers are available
 */
export function hasFallbackProviders(): boolean {
  return getActiveProviders().length > 1;
}

/**
 * Circuit breaker configuration for resilience
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

export const CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: parseInt(Deno.env.get('AI_CIRCUIT_BREAKER_THRESHOLD') || '5'),
  resetTimeout: parseInt(Deno.env.get('AI_CIRCUIT_BREAKER_RESET_MS') || '60000'),
  monitoringWindow: parseInt(Deno.env.get('AI_CIRCUIT_BREAKER_WINDOW_MS') || '10000'),
};

/**
 * Observability configuration
 */
export interface ObservabilityConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export const OBSERVABILITY_CONFIG: ObservabilityConfig = {
  enableMetrics: Deno.env.get('AI_ENABLE_METRICS') !== 'false',
  enableTracing: Deno.env.get('AI_ENABLE_TRACING') === 'true',
  logLevel: (Deno.env.get('AI_LOG_LEVEL') || 'info') as 'error' | 'warn' | 'info' | 'debug',
};

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  costCapPerDay: number; // in USD
}

export const RATE_LIMIT_CONFIG: RateLimitConfig = {
  requestsPerMinute: parseInt(Deno.env.get('AI_RATE_LIMIT_PER_MINUTE') || '60'),
  requestsPerHour: parseInt(Deno.env.get('AI_RATE_LIMIT_PER_HOUR') || '1000'),
  costCapPerDay: parseFloat(Deno.env.get('AI_COST_CAP_PER_DAY') || '100'),
};

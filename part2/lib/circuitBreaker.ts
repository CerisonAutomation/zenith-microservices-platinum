/**
 * 🔌 Circuit Breaker Pattern
 * Prevents cascading failures by automatically tripping calls to failing services
 */

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Circuit is open, failing fast
  HALF_OPEN = 'half_open' // Testing if service recovered
}

export interface CircuitBreakerConfig {
  failureThreshold: number;    // Number of failures before opening
  recoveryTimeout: number;     // Time to wait before trying again (ms)
  monitoringPeriod: number;    // Time window for failure counting (ms)
  successThreshold: number;    // Successes needed to close circuit in half-open state
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;
  private successes = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
      } else {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        console.log(`Circuit breaker ${this.name} CLOSED`);
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.warn(`Circuit breaker ${this.name} OPEN after ${this.failures} failures`);
    }
  }

  private shouldAttemptReset(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      successes: this.successes,
    };
  }
}

// Global circuit breaker registry
const circuitBreakers = new Map<string, CircuitBreaker>();

export const getCircuitBreaker = (
  name: string,
  config: CircuitBreakerConfig = {
    failureThreshold: 5,
    recoveryTimeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    successThreshold: 3,
  }
): CircuitBreaker => {
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, new CircuitBreaker(name, config));
  }
  return circuitBreakers.get(name)!;
};

// Circuit breaker for Supabase operations
export const supabaseCircuitBreaker = getCircuitBreaker('supabase', {
  failureThreshold: 3,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 300000,
  successThreshold: 2,
});

// Circuit breaker for external API calls
export const externalApiCircuitBreaker = getCircuitBreaker('external-api', {
  failureThreshold: 5,
  recoveryTimeout: 60000, // 1 minute
  monitoringPeriod: 300000,
  successThreshold: 3,
});

// Circuit breaker for image uploads
export const uploadCircuitBreaker = getCircuitBreaker('upload', {
  failureThreshold: 3,
  recoveryTimeout: 45000, // 45 seconds
  monitoringPeriod: 300000,
  successThreshold: 2,
});

// Utility function to wrap async operations with circuit breaker
export const withCircuitBreaker = async <T>(
  circuitBreaker: CircuitBreaker,
  operation: () => Promise<T>,
  fallback?: () => T
): Promise<T> => {
  try {
    return await circuitBreaker.execute(operation);
  } catch (error) {
    console.warn(`Circuit breaker blocked operation:`, error);

    if (fallback) {
      console.log('Using fallback operation');
      return fallback();
    }

    throw error;
  }
};

// Health check function for circuit breaker monitoring
export const getCircuitBreakerHealth = () => {
  const health: Record<string, any> = {};

  for (const [name, breaker] of circuitBreakers) {
    health[name] = breaker.getStats();
  }

  return health;
};
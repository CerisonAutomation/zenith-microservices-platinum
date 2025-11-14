/**
 * Example: Complete Observability Integration
 *
 * This file demonstrates how to use all observability features in a Node.js service
 */

import { Request, Response, NextFunction } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { logger } from '../utils/logger';
import { getCorrelationContext, getCorrelationHeaders } from '../middleware/correlation';
import {
  httpRequestCounter,
  httpRequestDuration,
  dbQueryCounter,
  dbQueryDuration,
  authMetrics
} from '../middleware/metrics';

// ============================================
// Example 1: Basic Request Handler with Tracing
// ============================================

export const getUserProfile = async (req: Request, res: Response) => {
  const tracer = trace.getTracer('auth-service');
  const span = tracer.startSpan('getUserProfile');

  try {
    // Add custom attributes to the span
    span.setAttribute('user.id', req.params.userId);
    span.setAttribute('request.method', req.method);

    // Log with automatic trace correlation
    logger.info('Fetching user profile', {
      userId: req.params.userId,
      correlationId: req.correlationId
    });

    // Your business logic here
    const user = await fetchUserFromDatabase(req.params.userId);

    // Add result attributes
    span.setAttribute('user.found', !!user);
    span.setStatus({ code: SpanStatusCode.OK });

    logger.info('User profile retrieved successfully', {
      userId: req.params.userId
    });

    res.json(user);
  } catch (error) {
    // Record exception in span
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });

    // Log error with trace context
    logger.error('Failed to fetch user profile', {
      error: (error as Error).message,
      userId: req.params.userId
    });

    res.status(500).json({ error: 'Internal server error' });
  } finally {
    span.end();
  }
};

// ============================================
// Example 2: Database Operation with Metrics
// ============================================

async function fetchUserFromDatabase(userId: string) {
  const tracer = trace.getTracer('auth-service');
  const span = tracer.startSpan('db.query.users.findById');

  // Track query metrics
  const timer = dbQueryDuration.startTimer({
    operation: 'SELECT',
    table: 'users',
    service: 'auth-service'
  });

  try {
    span.setAttribute('db.operation', 'SELECT');
    span.setAttribute('db.table', 'users');
    span.setAttribute('db.user_id', userId);

    // Simulate database query
    const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

    // Increment query counter
    dbQueryCounter.inc({
      operation: 'SELECT',
      table: 'users',
      service: 'auth-service'
    });

    span.setAttribute('db.rows_returned', result.rows.length);
    span.setStatus({ code: SpanStatusCode.OK });

    return result.rows[0];
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });
    throw error;
  } finally {
    timer(); // Stop timer
    span.end();
  }
}

// ============================================
// Example 3: External API Call with Context Propagation
// ============================================

export const callExternalService = async (req: Request) => {
  const tracer = trace.getTracer('auth-service');
  const span = tracer.startSpan('http.client.call_user_service');

  try {
    span.setAttribute('http.method', 'GET');
    span.setAttribute('http.url', 'http://user-service:8000/api/users');

    // Get correlation headers for propagation
    const headers = getCorrelationHeaders(req);

    logger.info('Calling user service', {
      url: 'http://user-service:8000/api/users',
      headers: Object.keys(headers)
    });

    // Make external call with propagated context
    const response = await fetch('http://user-service:8000/api/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers // Propagate trace context
      }
    });

    span.setAttribute('http.status_code', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    span.setStatus({ code: SpanStatusCode.OK });

    return data;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });
    throw error;
  } finally {
    span.end();
  }
};

// ============================================
// Example 4: Authentication with Custom Metrics
// ============================================

export const loginUser = async (req: Request, res: Response) => {
  const tracer = trace.getTracer('auth-service');
  const span = tracer.startSpan('auth.login');

  // Start login duration timer
  const loginTimer = authMetrics.loginDuration.startTimer({
    method: 'password',
    service: 'auth-service'
  });

  try {
    const { email, password } = req.body;

    span.setAttribute('auth.method', 'password');
    span.setAttribute('auth.email', email.replace(/@.*/, '@***')); // Sanitize

    logger.info('Login attempt', {
      email: email.replace(/@.*/, '@***'),
      method: 'password'
    });

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      // Record failed login attempt
      authMetrics.loginAttempts.inc({
        status: 'failed',
        method: 'password',
        service: 'auth-service'
      });

      span.setAttribute('auth.success', false);
      span.setStatus({ code: SpanStatusCode.OK }); // Not an error, just failed auth

      logger.warn('Login failed - invalid credentials', {
        email: email.replace(/@.*/, '@***')
      });

      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = await generateToken(user);

    // Record successful login
    authMetrics.loginAttempts.inc({
      status: 'success',
      method: 'password',
      service: 'auth-service'
    });

    authMetrics.tokenGeneration.inc({
      type: 'access',
      service: 'auth-service'
    });

    span.setAttribute('auth.success', true);
    span.setAttribute('user.id', user.id);
    span.setStatus({ code: SpanStatusCode.OK });

    logger.info('Login successful', {
      userId: user.id,
      email: email.replace(/@.*/, '@***')
    });

    res.json({ token, user });
  } catch (error) {
    // Record error
    authMetrics.loginAttempts.inc({
      status: 'error',
      method: 'password',
      service: 'auth-service'
    });

    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });

    logger.error('Login error', {
      error: (error as Error).message
    });

    res.status(500).json({ error: 'Internal server error' });
  } finally {
    loginTimer(); // Stop timer
    span.end();
  }
};

// ============================================
// Example 5: Nested Spans for Complex Operations
// ============================================

export const processUserRegistration = async (req: Request, res: Response) => {
  const tracer = trace.getTracer('auth-service');
  const parentSpan = tracer.startSpan('auth.register');

  try {
    parentSpan.setAttribute('operation', 'user_registration');

    // Step 1: Validate user data
    const validationSpan = tracer.startSpan('auth.register.validate', {
      parent: parentSpan
    });
    try {
      await validateUserData(req.body);
      validationSpan.setStatus({ code: SpanStatusCode.OK });
    } finally {
      validationSpan.end();
    }

    // Step 2: Check if user exists
    const checkSpan = tracer.startSpan('auth.register.check_exists', {
      parent: parentSpan
    });
    try {
      const exists = await checkUserExists(req.body.email);
      if (exists) {
        throw new Error('User already exists');
      }
      checkSpan.setStatus({ code: SpanStatusCode.OK });
    } finally {
      checkSpan.end();
    }

    // Step 3: Create user
    const createSpan = tracer.startSpan('auth.register.create_user', {
      parent: parentSpan
    });
    let user;
    try {
      user = await createUser(req.body);
      createSpan.setAttribute('user.id', user.id);
      createSpan.setStatus({ code: SpanStatusCode.OK });
    } finally {
      createSpan.end();
    }

    // Step 4: Send welcome email
    const emailSpan = tracer.startSpan('auth.register.send_email', {
      parent: parentSpan
    });
    try {
      await sendWelcomeEmail(user.email);
      emailSpan.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      // Log error but don't fail registration
      emailSpan.recordException(error as Error);
      logger.warn('Failed to send welcome email', {
        userId: user.id,
        error: (error as Error).message
      });
    } finally {
      emailSpan.end();
    }

    parentSpan.setStatus({ code: SpanStatusCode.OK });

    logger.info('User registration completed', {
      userId: user.id
    });

    res.status(201).json(user);
  } catch (error) {
    parentSpan.recordException(error as Error);
    parentSpan.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });

    logger.error('User registration failed', {
      error: (error as Error).message
    });

    res.status(400).json({ error: (error as Error).message });
  } finally {
    parentSpan.end();
  }
};

// ============================================
// Example 6: Middleware with Tracing
// ============================================

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const tracer = trace.getTracer('auth-service');
  const span = tracer.startSpan('middleware.auth');

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      span.setAttribute('auth.token_present', false);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return res.status(401).json({ error: 'No token provided' });
    }

    span.setAttribute('auth.token_present', true);

    // Validate token
    const decoded = await validateToken(token);

    // Record token validation
    authMetrics.tokenValidation.inc({
      status: 'valid',
      service: 'auth-service'
    });

    // Add user to request
    req.user = decoded;
    span.setAttribute('user.id', decoded.userId);
    span.setStatus({ code: SpanStatusCode.OK });

    next();
  } catch (error) {
    authMetrics.tokenValidation.inc({
      status: 'invalid',
      service: 'auth-service'
    });

    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: 'Token validation failed'
    });

    logger.warn('Token validation failed', {
      error: (error as Error).message
    });

    res.status(401).json({ error: 'Invalid token' });
  } finally {
    span.end();
  }
};

// ============================================
// Helper Functions (placeholder implementations)
// ============================================

const db = {
  query: async (sql: string, params: any[]) => {
    // Placeholder
    return { rows: [] };
  }
};

async function authenticateUser(email: string, password: string) {
  // Placeholder
  return { id: '123', email };
}

async function generateToken(user: any) {
  // Placeholder
  return 'token123';
}

async function validateUserData(data: any) {
  // Placeholder
}

async function checkUserExists(email: string) {
  // Placeholder
  return false;
}

async function createUser(data: any) {
  // Placeholder
  return { id: '123', ...data };
}

async function sendWelcomeEmail(email: string) {
  // Placeholder
}

async function validateToken(token: string) {
  // Placeholder
  return { userId: '123' };
}

// ============================================
// Key Takeaways:
// ============================================
//
// 1. Always create spans for important operations
// 2. Add meaningful attributes to spans
// 3. Use structured logging with trace context
// 4. Record exceptions in spans
// 5. Propagate context to external services
// 6. Track custom metrics for business operations
// 7. Use nested spans for complex operations
// 8. Always end spans in finally blocks
// 9. Set appropriate span status codes
// 10. Sanitize sensitive data in logs and spans

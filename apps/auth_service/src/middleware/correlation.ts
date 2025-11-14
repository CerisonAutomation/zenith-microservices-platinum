import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { trace, context, propagation } from '@opentelemetry/api';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      traceId?: string;
      spanId?: string;
    }
  }
}

/**
 * Middleware to generate and propagate correlation IDs
 * Integrates with OpenTelemetry trace context
 */
export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Extract correlation ID from headers or generate new one
  const correlationId =
    req.headers['x-correlation-id'] as string ||
    req.headers['x-request-id'] as string ||
    uuidv4();

  // Get trace context from OpenTelemetry
  const span = trace.getSpan(context.active());
  const spanContext = span?.spanContext();

  // Attach IDs to request object
  req.correlationId = correlationId;
  if (spanContext) {
    req.traceId = spanContext.traceId;
    req.spanId = spanContext.spanId;
  }

  // Set correlation ID in response headers
  res.setHeader('X-Correlation-ID', correlationId);
  if (req.traceId) {
    res.setHeader('X-Trace-ID', req.traceId);
  }
  if (req.spanId) {
    res.setHeader('X-Span-ID', req.spanId);
  }

  // Add correlation ID to span attributes
  if (span) {
    span.setAttribute('correlation.id', correlationId);
    span.setAttribute('http.request.correlation_id', correlationId);
  }

  next();
};

/**
 * Helper function to get correlation context from request
 */
export const getCorrelationContext = (req: Request) => {
  return {
    correlationId: req.correlationId,
    traceId: req.traceId,
    spanId: req.spanId,
  };
};

/**
 * Helper function to propagate correlation context to external calls
 */
export const getCorrelationHeaders = (req: Request): Record<string, string> => {
  const headers: Record<string, string> = {};

  if (req.correlationId) {
    headers['X-Correlation-ID'] = req.correlationId;
  }

  // Propagate W3C Trace Context
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  Object.assign(headers, carrier);

  return headers;
};

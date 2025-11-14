"""
Correlation ID and distributed tracing middleware for FastAPI
"""
import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from opentelemetry import trace, propagate
from opentelemetry.trace import Span


class CorrelationMiddleware(BaseHTTPMiddleware):
    """
    Middleware to generate and propagate correlation IDs
    Integrates with OpenTelemetry trace context
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract correlation ID from headers or generate new one
        correlation_id = (
            request.headers.get("x-correlation-id")
            or request.headers.get("x-request-id")
            or str(uuid.uuid4())
        )

        # Store correlation ID in request state
        request.state.correlation_id = correlation_id

        # Get current span and add correlation ID as attribute
        span = trace.get_current_span()
        if span and span.is_recording():
            span.set_attribute("correlation.id", correlation_id)
            span.set_attribute("http.request.correlation_id", correlation_id)

            # Get span context for response headers
            span_context = span.get_span_context()
            if span_context.is_valid:
                request.state.trace_id = format(span_context.trace_id, "032x")
                request.state.span_id = format(span_context.span_id, "016x")

        # Process request
        response = await call_next(request)

        # Add correlation and trace IDs to response headers
        response.headers["X-Correlation-ID"] = correlation_id
        if hasattr(request.state, "trace_id"):
            response.headers["X-Trace-ID"] = request.state.trace_id
        if hasattr(request.state, "span_id"):
            response.headers["X-Span-ID"] = request.state.span_id

        return response


def get_correlation_context(request: Request) -> dict:
    """
    Get correlation context from request

    Args:
        request: FastAPI request object

    Returns:
        Dictionary containing correlation IDs
    """
    return {
        "correlation_id": getattr(request.state, "correlation_id", None),
        "trace_id": getattr(request.state, "trace_id", None),
        "span_id": getattr(request.state, "span_id", None),
    }


def get_correlation_headers(request: Request) -> dict:
    """
    Get correlation headers for propagation to external services

    Args:
        request: FastAPI request object

    Returns:
        Dictionary of headers for correlation context propagation
    """
    headers = {}

    # Add correlation ID
    if hasattr(request.state, "correlation_id"):
        headers["X-Correlation-ID"] = request.state.correlation_id

    # Propagate W3C Trace Context
    carrier = {}
    propagate.inject(carrier)
    headers.update(carrier)

    return headers

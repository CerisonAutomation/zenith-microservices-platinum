"""
Structured logging with OpenTelemetry correlation
"""
import logging
import json
import sys
from datetime import datetime
from typing import Any, Dict
from opentelemetry import trace

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging with trace context"""

    def format(self, record: logging.LogRecord) -> str:
        # Get trace context
        span = trace.get_current_span()
        span_context = span.get_span_context() if span else None

        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "service": "user-service",
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add trace context if available
        if span_context and span_context.is_valid:
            log_data["trace_id"] = format(span_context.trace_id, "032x")
            log_data["span_id"] = format(span_context.span_id, "016x")
            log_data["trace_flags"] = span_context.trace_flags

        # Add extra fields from record
        if hasattr(record, "extra"):
            log_data.update(record.extra)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def setup_logger(name: str = "user-service", level: str = "INFO") -> logging.Logger:
    """
    Setup structured logger with JSON formatting and trace correlation

    Args:
        name: Logger name
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    # Remove existing handlers
    logger.handlers = []

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)

    # Prevent propagation to root logger
    logger.propagate = False

    return logger


# Create default logger instance
logger = setup_logger()


class LoggerAdapter(logging.LoggerAdapter):
    """Logger adapter that adds correlation context to all log records"""

    def process(self, msg, kwargs):
        # Get current span context
        span = trace.get_current_span()
        span_context = span.get_span_context() if span else None

        # Add trace context to extra fields
        if "extra" not in kwargs:
            kwargs["extra"] = {}

        if span_context and span_context.is_valid:
            kwargs["extra"]["trace_id"] = format(span_context.trace_id, "032x")
            kwargs["extra"]["span_id"] = format(span_context.span_id, "016x")

        return msg, kwargs

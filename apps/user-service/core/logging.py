"""
Zenith Logging Module
Structured logging configuration with JSON output and log aggregation
"""

import logging
import sys
from typing import Dict, Any, Optional
from pathlib import Path

try:
    import structlog
    STRUCTLOG_AVAILABLE = True
except ImportError:
    STRUCTLOG_AVAILABLE = False

try:
    from .config import settings
    SETTINGS_AVAILABLE = True
except ImportError:
    SETTINGS_AVAILABLE = False
    settings = None

def setup_logging() -> None:
    """Setup structured logging configuration"""

    # Create logs directory
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Configure standard logging
    if SETTINGS_AVAILABLE and settings:
        log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    else:
        log_level = logging.INFO

    # Base formatter
    class StructuredFormatter(logging.Formatter):
        def format(self, record):
            # Add extra fields
            if not hasattr(record, 'request_id'):
                record.request_id = 'N/A'

            return super().format(record)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(request_id)s] - %(message)s'
    )
    console_handler.setFormatter(console_formatter)

    # File handler
    file_handler = logging.FileHandler(log_dir / "zenith.log")
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(request_id)s - %(message)s - %(pathname)s:%(lineno)d'
    )
    file_handler.setFormatter(file_formatter)

    # Error file handler
    error_handler = logging.FileHandler(log_dir / "zenith-error.log")
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)

    # Configure structlog if available
    if STRUCTLOG_AVAILABLE:
        # Configure structlog
        try:
            import structlog as _structlog
            _structlog.configure(
                processors=[
                    _structlog.contextvars.merge_contextvars,
                    _structlog.processors.add_log_level,
                    _structlog.processors.TimeStamper(fmt="iso"),
                    _structlog.processors.JSONRenderer(),
                ],
                wrapper_class=_structlog.make_filtering_bound_logger(log_level),
                context_class=dict,
                logger_factory=_structlog.WriteLoggerFactory(),
                cache_logger_on_first_use=True,
            )
        except Exception as e:
            logging.warning(f"Failed to configure structlog: {e}")


def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance"""
    return logging.getLogger(name)

def log_request(request_id: str, method: str, url: str, status: int, duration: float) -> None:
    """Log HTTP request details"""
    logger = get_logger("http")
    logger.info(
        "HTTP Request",
        extra={
            "request_id": request_id,
            "method": method,
            "url": str(url),
            "status": status,
            "duration": duration,
        }
    )

def log_error(error: Exception, request_id: Optional[str] = None, **kwargs) -> None:
    """Log error with context"""
    logger = get_logger("error")
    logger.error(
        f"Error occurred: {str(error)}",
        exc_info=error,
        extra={
            "request_id": request_id or "N/A",
            **kwargs
        }
    )

def log_security_event(event: str, ip_address: str, user_agent: str, **kwargs) -> None:
    """Log security-related events"""
    logger = get_logger("security")
    logger.warning(
        f"Security event: {event}",
        extra={
            "ip_address": ip_address,
            "user_agent": user_agent,
            **kwargs
        }
    )

def log_business_event(event: str, user_id: Optional[str] = None, **kwargs) -> None:
    """Log business logic events"""
    logger = get_logger("business")
    logger.info(
        f"Business event: {event}",
        extra={
            "user_id": user_id or "N/A",
            **kwargs
        }
    )
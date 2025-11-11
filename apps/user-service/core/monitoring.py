"""
Zenith Monitoring Module
Comprehensive monitoring, metrics, and observability
"""

import asyncio
import logging
import time
from typing import Callable, Dict, Any
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import psutil
import socket
from contextlib import asynccontextmanager

try:
    from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    # Mock classes for when prometheus is not available
    class Counter:
        def __init__(self, *args, **kwargs): pass
        def inc(self, *args, **kwargs): pass
        def labels(self, *args, **kwargs): return self

    class Histogram:
        def __init__(self, *args, **kwargs): pass
        def observe(self, *args, **kwargs): pass
        def labels(self, *args, **kwargs): return self

    class Gauge:
        def __init__(self, *args, **kwargs): pass
        def set(self, *args, **kwargs): pass

    CONTENT_TYPE_LATEST = "text/plain; version=0.0.4; charset=utf-8"
    generate_latest = lambda: b""

from .config import settings

logger = logging.getLogger(__name__)

# Prometheus metrics
if PROMETHEUS_AVAILABLE:
    # HTTP metrics
    HTTP_REQUESTS_TOTAL = Counter(
        'http_requests_total',
        'Total number of HTTP requests',
        ['method', 'endpoint', 'status']
    )

    HTTP_REQUEST_DURATION = Histogram(
        'http_request_duration_seconds',
        'HTTP request duration in seconds',
        ['method', 'endpoint']
    )

    # System metrics
    CPU_USAGE = Gauge('cpu_usage_percent', 'Current CPU usage percentage')
    MEMORY_USAGE = Gauge('memory_usage_percent', 'Current memory usage percentage')
    DISK_USAGE = Gauge('disk_usage_percent', 'Current disk usage percentage')

    # Application metrics
    ACTIVE_CONNECTIONS = Gauge('active_connections', 'Number of active connections')
    DB_CONNECTIONS = Gauge('db_connections_active', 'Number of active database connections')

    # Business metrics
    USER_REGISTRATIONS = Counter('user_registrations_total', 'Total user registrations')
    AUTH_ATTEMPTS = Counter('auth_attempts_total', 'Total authentication attempts', ['result'])
    PAYMENT_TRANSACTIONS = Counter('payment_transactions_total', 'Total payment transactions', ['status'])

class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for collecting HTTP metrics"""

    def __init__(self, app: Callable):
        super().__init__(app)
        self.active_connections = 0

    async def dispatch(self, request: Request, call_next):
        """Collect metrics for each request"""
        self.active_connections += 1
        ACTIVE_CONNECTIONS.set(self.active_connections)

        start_time = time.time()
        response = None

        try:
            response = await call_next(request)
            return response
        finally:
            # Update metrics
            duration = time.time() - start_time
            status_code = response.status_code if response else 500

            HTTP_REQUESTS_TOTAL.labels(
                method=request.method,
                endpoint=request.url.path,
                status=str(status_code)
            ).inc()

            HTTP_REQUEST_DURATION.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(duration)

            self.active_connections -= 1
            ACTIVE_CONNECTIONS.set(self.active_connections)

async def init_monitoring() -> None:
    """Initialize monitoring systems"""
    logger.info("Initializing monitoring systems")

    if PROMETHEUS_AVAILABLE:
        # Start system metrics collection
        import asyncio
        asyncio.create_task(collect_system_metrics())
        logger.info("Prometheus metrics initialized")
    else:
        logger.warning("Prometheus not available, metrics disabled")

    # Initialize other monitoring (Sentry, etc.)
    if settings.sentry_dsn:
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                environment="production" if not settings.debug else "development",
                traces_sample_rate=1.0,
            )
            logger.info("Sentry monitoring initialized")
        except ImportError:
            logger.warning("Sentry SDK not available")

async def collect_system_metrics() -> None:
    """Collect system metrics periodically"""
    while True:
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            CPU_USAGE.set(cpu_percent)

            # Memory usage
            memory = psutil.virtual_memory()
            MEMORY_USAGE.set(memory.percent)

            # Disk usage
            disk = psutil.disk_usage('/')
            DISK_USAGE.set(disk.percent)

        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")

        await asyncio.sleep(60)  # Collect every minute

def get_system_info() -> Dict[str, Any]:
    """Get system information"""
    try:
        return {
            "hostname": socket.gethostname(),
            "cpu_count": psutil.cpu_count(),
            "cpu_percent": psutil.cpu_percent(),
            "memory_total": psutil.virtual_memory().total,
            "memory_available": psutil.virtual_memory().available,
            "memory_percent": psutil.virtual_memory().percent,
            "disk_total": psutil.disk_usage('/').total,
            "disk_free": psutil.disk_usage('/').free,
            "disk_percent": psutil.disk_usage('/').percent,
        }
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        return {}

def log_performance_metrics(operation: str, duration: float, **kwargs) -> None:
    """Log performance metrics"""
    logger.info(
        f"Performance metric: {operation}",
        extra={
            "operation": operation,
            "duration": duration,
            **kwargs
        }
    )

@asynccontextmanager
async def timed_operation(operation: str, **kwargs):
    """Context manager for timing operations"""
    start_time = time.time()
    try:
        yield
    finally:
        duration = time.time() - start_time
        log_performance_metrics(operation, duration, **kwargs)

# Business metrics functions
def increment_user_registrations() -> None:
    """Increment user registration counter"""
    USER_REGISTRATIONS.inc()

def record_auth_attempt(success: bool) -> None:
    """Record authentication attempt"""
    AUTH_ATTEMPTS.labels(result="success" if success else "failure").inc()

def record_payment_transaction(status: str) -> None:
    """Record payment transaction"""
    PAYMENT_TRANSACTIONS.labels(status=status).inc()

# Export metrics middleware
metrics_middleware = MetricsMiddleware
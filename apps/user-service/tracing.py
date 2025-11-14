"""
OpenTelemetry tracing and metrics configuration for user-service
"""
import os
import logging
from opentelemetry import trace, metrics
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.http.metric_exporter import OTLPMetricExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION, DEPLOYMENT_ENVIRONMENT
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

logger = logging.getLogger(__name__)

# Service configuration
SERVICE_NAME_VALUE = os.getenv("SERVICE_NAME", "user-service")
SERVICE_VERSION_VALUE = os.getenv("SERVICE_VERSION", "1.0.0")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# OTLP Exporter configuration
OTLP_ENDPOINT = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://jaeger:4318")
OTLP_TRACE_ENDPOINT = f"{OTLP_ENDPOINT}/v1/traces"
OTLP_METRICS_ENDPOINT = f"{OTLP_ENDPOINT}/v1/metrics"


def setup_tracing():
    """Configure OpenTelemetry tracing"""
    try:
        # Create resource with service information
        resource = Resource.create({
            SERVICE_NAME: SERVICE_NAME_VALUE,
            SERVICE_VERSION: SERVICE_VERSION_VALUE,
            DEPLOYMENT_ENVIRONMENT: ENVIRONMENT,
            "service.namespace": "zenith-microservices",
        })

        # Create tracer provider
        tracer_provider = TracerProvider(resource=resource)

        # Create OTLP span exporter
        otlp_exporter = OTLPSpanExporter(
            endpoint=OTLP_TRACE_ENDPOINT,
            headers={}
        )

        # Add span processor
        tracer_provider.add_span_processor(
            BatchSpanProcessor(otlp_exporter)
        )

        # Set global tracer provider
        trace.set_tracer_provider(tracer_provider)

        logger.info(f"OpenTelemetry tracing initialized for {SERVICE_NAME_VALUE}")
    except Exception as e:
        logger.error(f"Failed to initialize tracing: {e}")


def setup_metrics():
    """Configure OpenTelemetry metrics"""
    try:
        # Create resource with service information
        resource = Resource.create({
            SERVICE_NAME: SERVICE_NAME_VALUE,
            SERVICE_VERSION: SERVICE_VERSION_VALUE,
            DEPLOYMENT_ENVIRONMENT: ENVIRONMENT,
            "service.namespace": "zenith-microservices",
        })

        # Create OTLP metric exporter
        otlp_exporter = OTLPMetricExporter(
            endpoint=OTLP_METRICS_ENDPOINT,
            headers={}
        )

        # Create metric reader with periodic export
        metric_reader = PeriodicExportingMetricReader(
            exporter=otlp_exporter,
            export_interval_millis=10000  # 10 seconds
        )

        # Create and set meter provider
        meter_provider = MeterProvider(
            resource=resource,
            metric_readers=[metric_reader]
        )
        metrics.set_meter_provider(meter_provider)

        logger.info(f"OpenTelemetry metrics initialized for {SERVICE_NAME_VALUE}")
    except Exception as e:
        logger.error(f"Failed to initialize metrics: {e}")


def instrument_app(app, engine=None):
    """
    Instrument FastAPI application with OpenTelemetry

    Args:
        app: FastAPI application instance
        engine: SQLAlchemy engine instance (optional)
    """
    try:
        # Setup tracing and metrics
        setup_tracing()
        setup_metrics()

        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(
            app,
            excluded_urls="/health,/metrics",
            tracer_provider=trace.get_tracer_provider()
        )

        # Instrument HTTP clients
        HTTPXClientInstrumentor().instrument()
        RequestsInstrumentor().instrument()

        # Instrument Redis
        RedisInstrumentor().instrument()

        # Instrument SQLAlchemy if engine provided
        if engine:
            SQLAlchemyInstrumentor().instrument(
                engine=engine,
                service=SERVICE_NAME_VALUE
            )

        logger.info("FastAPI application instrumented with OpenTelemetry")
    except Exception as e:
        logger.error(f"Failed to instrument application: {e}")


def get_tracer(name: str = None):
    """Get a tracer instance"""
    tracer_name = name or SERVICE_NAME_VALUE
    return trace.get_tracer(tracer_name)


def get_meter(name: str = None):
    """Get a meter instance"""
    meter_name = name or SERVICE_NAME_VALUE
    return metrics.get_meter(meter_name)


# Create custom span decorator
from functools import wraps
from typing import Callable

def traced(span_name: str = None):
    """Decorator to create a span for a function"""
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            tracer = get_tracer()
            name = span_name or func.__name__
            with tracer.start_as_current_span(name) as span:
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("function.name", func.__name__)
                    span.set_attribute("function.module", func.__module__)
                    return result
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                    raise

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            tracer = get_tracer()
            name = span_name or func.__name__
            with tracer.start_as_current_span(name) as span:
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("function.name", func.__name__)
                    span.set_attribute("function.module", func.__module__)
                    return result
                except Exception as e:
                    span.record_exception(e)
                    span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                    raise

        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper

    return decorator

"""
Zenith Backend - Enterprise Microservices Platform
Senior-level FastAPI application with comprehensive microservices architecture
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import time
import uuid
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
import structlog

# Core configuration
from .core.config import settings
from .core.database import init_db, close_db
# from .core.cache import init_cache, close_cache
from .core.security import SecurityMiddleware, RateLimitMiddleware
from .core.monitoring import init_monitoring, metrics_middleware
from .core.logging import setup_logging

# Service routers
from .services.auth.router import router as auth_router
from .services.chat.router import router as chat_router
from .services.search.router import router as search_router
from .services.payment.main import router as payment_router
from .services.sms.main import router as sms_router
from .services.twofa.main import router as twofa_router
from .services.blog.main import router as blog_router
from .services.forum.main import router as forum_router
from .services.gallery.main import router as gallery_router
from .services.games.main import router as games_router
from .services.newsletter.main import router as newsletter_router

# Setup structured logging
setup_logging()
logger = structlog.get_logger(__name__)

# Metrics
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency', ['method', 'endpoint'])

class RequestIDMiddleware(BaseHTTPMiddleware):
    """Add request ID to all requests for tracing"""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Add request ID to logger context
        with structlog.contextvars.bound_contextvars(request_id=request_id):
            start_time = time.time()
            response = await call_next(request)
            process_time = time.time() - start_time

            # Log request
            logger.info(
                "Request processed",
                method=request.method,
                url=str(request.url),
                status_code=response.status_code,
                duration=process_time
            )

            # Update metrics
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status=str(response.status_code)
            ).inc()

            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(process_time)

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            return response

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager"""
    # Startup
    logger.info("Starting Zenith Backend")

    # Initialize core services
    await init_db()
    # await init_cache()
    await init_monitoring()

    logger.info("All services initialized successfully")

    yield

    # Shutdown
    logger.info("Shutting down Zenith Backend")
    await close_db()
    # await close_cache()

# Create FastAPI application
app = FastAPI(
    title="Zenith Backend API",
    description="Enterprise microservices platform for modern dating",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

# Security middleware (order matters)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(SecurityMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(metrics_middleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware
if not settings.DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Include service routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["Chat"])
app.include_router(search_router, prefix="/api/v1/search", tags=["Search"])
app.include_router(payment_router, prefix="/api/v1/payment", tags=["Payment"])
app.include_router(sms_router, prefix="/api/v1/sms", tags=["SMS"])
app.include_router(twofa_router, prefix="/api/v1/2fa", tags=["Two-Factor Authentication"])
app.include_router(blog_router, prefix="/api/v1/blog", tags=["Blog"])
app.include_router(forum_router, prefix="/api/v1/forum", tags=["Forum"])
app.include_router(gallery_router, prefix="/api/v1/gallery", tags=["Gallery"])
app.include_router(games_router, prefix="/api/v1/games", tags=["Games"])
app.include_router(newsletter_router, prefix="/api/v1/newsletter", tags=["Newsletter"])

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "2.0.0"
    }

# Metrics endpoint
@app.get("/metrics", tags=["Metrics"])
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(
        generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    request_id = getattr(request.state, 'request_id', 'unknown')

    logger.error(
        "Unhandled exception",
        exc_info=exc,
        request_id=request_id,
        url=str(request.url),
        method=request.method
    )

    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "request_id": request_id,
            "message": "An unexpected error occurred"
        }
    )

# 404 handler
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: Exception):
    """404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Not found",
            "message": f"Endpoint {request.url.path} not found"
        }
    )

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_config=None,  # Use our custom logging
        access_log=False  # We handle access logging ourselves
    )
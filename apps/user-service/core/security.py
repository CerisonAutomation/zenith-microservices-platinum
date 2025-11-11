"""
Zenith Security Middleware
Enterprise-grade security middleware for FastAPI
"""

import logging
import re
from typing import Callable, Dict, List, Optional, Set
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
import time
import hashlib
import hmac

from .config import settings

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware with multiple protection layers"""

    def __init__(self, app: Callable):
        super().__init__(app)
        self.suspicious_patterns = [
            r'<script[^>]*>.*?</script>',
            r'javascript:',
            r'on\w+\s*=',
            r'union\s+select',
            r';\s*drop\s+table',
            r';\s*delete\s+from',
            r'--',
            r'/\*.*?\*/',
        ]
        self.blocked_ips: Set[str] = set()
        self.request_counts: Dict[str, List[float]] = {}

    async def dispatch(self, request: Request, call_next):
        """Process request through security checks"""

        # Rate limiting
        client_ip = self.get_client_ip(request)
        if not self.check_rate_limit(client_ip):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"error": "Rate limit exceeded"}
            )

        # IP blocking
        if client_ip in self.blocked_ips:
            logger.warning(f"Blocked IP attempted access: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"error": "Access denied"}
            )

        # Input validation
        if self.contains_suspicious_content(request):
            logger.warning(f"Suspicious content detected from IP: {client_ip}")
            self.blocked_ips.add(client_ip)
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Invalid request"}
            )

        # Security headers validation
        if not self.validate_security_headers(request):
            logger.warning(f"Invalid security headers from IP: {client_ip}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"error": "Invalid security headers"}
            )

        # Process request
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        # Add security headers to response
        response.headers.update(self.get_security_headers())

        # Log slow requests
        if process_time > 1.0:  # More than 1 second
            logger.warning(f"Slow request: {request.method} {request.url} took {process_time:.2f}s")

        return response

    def get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        # Check for forwarded headers
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()

        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip

        # Fallback to client host
        return request.client.host if request.client else "unknown"

    def check_rate_limit(self, client_ip: str) -> bool:
        """Check if request is within rate limits"""
        current_time = time.time()
        window_start = current_time - settings.rate_limit_window

        # Clean old requests
        if client_ip in self.request_counts:
            self.request_counts[client_ip] = [
                t for t in self.request_counts[client_ip] if t > window_start
            ]
        else:
            self.request_counts[client_ip] = []

        # Check if under limit
        if len(self.request_counts[client_ip]) >= settings.rate_limit_requests:
            return False

        # Add current request
        self.request_counts[client_ip].append(current_time)
        return True

    def contains_suspicious_content(self, request: Request) -> bool:
        """Check for suspicious content in request"""
        # Check URL
        if any(re.search(pattern, str(request.url), re.IGNORECASE) for pattern in self.suspicious_patterns):
            return True

        # Check headers (basic check)
        for header_name, header_value in request.headers.items():
            if any(re.search(pattern, header_value, re.IGNORECASE) for pattern in self.suspicious_patterns):
                return True

        return False

    def validate_security_headers(self, request: Request) -> bool:
        """Validate security-related headers"""
        # Check for required headers in production
        if not settings.debug:
            # Check for HTTPS in production
            if not str(request.url).startswith("https://"):
                return False

        return True

    def get_security_headers(self) -> Dict[str, str]:
        """Get security headers for response"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        }

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Advanced rate limiting middleware"""

    def __init__(self, app: Callable):
        super().__init__(app)
        self.rate_limits: Dict[str, Dict] = {}

    async def dispatch(self, request: Request, call_next):
        """Apply advanced rate limiting"""
        client_ip = self.get_client_ip(request)
        endpoint = f"{request.method}:{request.url.path}"

        # Check endpoint-specific limits
        if not self.check_endpoint_limit(client_ip, endpoint):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Rate limit exceeded",
                    "retry_after": 60
                }
            )

        response = await call_next(request)

        # Add rate limit headers
        remaining, reset_time = self.get_remaining_requests(client_ip, endpoint)
        response.headers.update({
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(int(reset_time)),
            "X-RateLimit-Limit": str(settings.rate_limit_requests),
        })

        return response

    def get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def check_endpoint_limit(self, client_ip: str, endpoint: str) -> bool:
        """Check rate limit for specific endpoint"""
        current_time = time.time()
        key = f"{client_ip}:{endpoint}"

        if key not in self.rate_limits:
            self.rate_limits[key] = {
                "requests": [],
                "blocked_until": 0
            }

        limit_data = self.rate_limits[key]

        # Check if currently blocked
        if current_time < limit_data["blocked_until"]:
            return False

        # Clean old requests
        window_start = current_time - settings.rate_limit_window
        limit_data["requests"] = [t for t in limit_data["requests"] if t > window_start]

        # Check limit
        if len(limit_data["requests"]) >= settings.rate_limit_requests:
            # Block for 5 minutes
            limit_data["blocked_until"] = current_time + 300
            return False

        # Add current request
        limit_data["requests"].append(current_time)
        return True

    def get_remaining_requests(self, client_ip: str, endpoint: str) -> tuple[int, float]:
        """Get remaining requests and reset time"""
        current_time = time.time()
        key = f"{client_ip}:{endpoint}"

        if key not in self.rate_limits:
            return settings.rate_limit_requests, current_time + settings.rate_limit_window

        limit_data = self.rate_limits[key]
        window_start = current_time - settings.rate_limit_window
        valid_requests = [t for t in limit_data["requests"] if t > window_start]

        remaining = max(0, settings.rate_limit_requests - len(valid_requests))
        reset_time = window_start + settings.rate_limit_window

        return remaining, reset_time
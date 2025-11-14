"""
Example: Complete Observability Integration for Python/FastAPI

This file demonstrates how to use all observability features in a Python service
"""

from fastapi import FastAPI, Request, HTTPException, Depends
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode
import httpx
from typing import Optional

from tracing import traced, get_tracer, get_meter
from utils.logger import logger
from middleware.correlation import get_correlation_context, get_correlation_headers

# Get tracer and meter
tracer = get_tracer(__name__)
meter = get_meter(__name__)

# Create custom metrics
user_operations_counter = meter.create_counter(
    "user_operations_total",
    description="Total user operations",
    unit="1"
)

user_operation_duration = meter.create_histogram(
    "user_operation_duration_seconds",
    description="Duration of user operations",
    unit="s"
)


# ============================================
# Example 1: Basic Request Handler with Tracing
# ============================================

@traced("get_user_profile")
async def get_user_profile(user_id: str, request: Request):
    """
    Fetch user profile with automatic tracing via @traced decorator
    """
    # Get current span to add attributes
    span = trace.get_current_span()
    span.set_attribute("user.id", user_id)
    span.set_attribute("request.method", "GET")

    # Log with automatic trace correlation
    correlation = get_correlation_context(request)
    logger.info(
        "Fetching user profile",
        extra={
            "user_id": user_id,
            "correlation_id": correlation.get("correlation_id")
        }
    )

    try:
        # Your business logic here
        user = await fetch_user_from_database(user_id)

        if not user:
            span.set_attribute("user.found", False)
            raise HTTPException(status_code=404, detail="User not found")

        # Add result attributes
        span.set_attribute("user.found", True)
        span.set_status(Status(StatusCode.OK))

        logger.info(
            "User profile retrieved successfully",
            extra={"user_id": user_id}
        )

        return user

    except HTTPException:
        raise
    except Exception as e:
        # Exception is automatically recorded by @traced decorator
        logger.error(
            "Failed to fetch user profile",
            extra={"error": str(e), "user_id": user_id}
        )
        raise


# ============================================
# Example 2: Database Operation with Metrics
# ============================================

async def fetch_user_from_database(user_id: str):
    """
    Database operation with custom span and metrics
    """
    with tracer.start_as_current_span("db.query.users.find_by_id") as span:
        import time
        start_time = time.time()

        try:
            span.set_attribute("db.operation", "SELECT")
            span.set_attribute("db.table", "users")
            span.set_attribute("db.user_id", user_id)

            # Simulate database query
            result = await db.query("SELECT * FROM users WHERE id = %s", user_id)

            # Record metrics
            user_operations_counter.add(
                1,
                {"operation": "db_query", "table": "users", "status": "success"}
            )

            duration = time.time() - start_time
            user_operation_duration.record(
                duration,
                {"operation": "db_query", "table": "users"}
            )

            span.set_attribute("db.rows_returned", len(result))
            span.set_status(Status(StatusCode.OK))

            return result[0] if result else None

        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))

            user_operations_counter.add(
                1,
                {"operation": "db_query", "table": "users", "status": "error"}
            )
            raise


# ============================================
# Example 3: External API Call with Context Propagation
# ============================================

async def call_external_service(request: Request, user_id: str):
    """
    Make external API call with trace context propagation
    """
    with tracer.start_as_current_span("http.client.call_auth_service") as span:
        url = f"http://auth-service:3001/api/users/{user_id}"

        span.set_attribute("http.method", "GET")
        span.set_attribute("http.url", url)

        # Get correlation headers for propagation
        headers = get_correlation_headers(request)
        headers["Content-Type"] = "application/json"

        logger.info(
            "Calling auth service",
            extra={
                "url": url,
                "headers": list(headers.keys())
            }
        )

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)

                span.set_attribute("http.status_code", response.status_code)

                if response.status_code >= 400:
                    span.set_status(Status(StatusCode.ERROR))
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"External service error: {response.text}"
                    )

                span.set_status(Status(StatusCode.OK))
                return response.json()

        except httpx.HTTPError as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            logger.error("External service call failed", extra={"error": str(e)})
            raise


# ============================================
# Example 4: Authentication with Custom Metrics
# ============================================

# Create auth-specific metrics
auth_attempts_counter = meter.create_counter(
    "auth_login_attempts_total",
    description="Total login attempts",
    unit="1"
)

auth_duration_histogram = meter.create_histogram(
    "auth_login_duration_seconds",
    description="Login operation duration",
    unit="s"
)


async def login_user(email: str, password: str, request: Request):
    """
    Login with comprehensive observability
    """
    with tracer.start_as_current_span("auth.login") as span:
        import time
        start_time = time.time()

        try:
            span.set_attribute("auth.method", "password")
            # Sanitize email in span
            span.set_attribute("auth.email", email.split("@")[0] + "@***")

            logger.info(
                "Login attempt",
                extra={
                    "email": email.split("@")[0] + "@***",
                    "method": "password"
                }
            )

            # Authenticate user
            user = await authenticate_user(email, password)

            if not user:
                # Record failed attempt
                auth_attempts_counter.add(
                    1,
                    {"status": "failed", "method": "password"}
                )

                span.set_attribute("auth.success", False)
                span.set_status(Status(StatusCode.OK))  # Not an error

                logger.warning(
                    "Login failed - invalid credentials",
                    extra={"email": email.split("@")[0] + "@***"}
                )

                raise HTTPException(status_code=401, detail="Invalid credentials")

            # Generate token
            token = await generate_token(user)

            # Record successful login
            auth_attempts_counter.add(
                1,
                {"status": "success", "method": "password"}
            )

            duration = time.time() - start_time
            auth_duration_histogram.record(
                duration,
                {"method": "password", "status": "success"}
            )

            span.set_attribute("auth.success", True)
            span.set_attribute("user.id", user["id"])
            span.set_status(Status(StatusCode.OK))

            logger.info(
                "Login successful",
                extra={
                    "user_id": user["id"],
                    "email": email.split("@")[0] + "@***"
                }
            )

            return {"token": token, "user": user}

        except HTTPException:
            duration = time.time() - start_time
            auth_duration_histogram.record(
                duration,
                {"method": "password", "status": "failed"}
            )
            raise
        except Exception as e:
            # Record error
            auth_attempts_counter.add(
                1,
                {"status": "error", "method": "password"}
            )

            duration = time.time() - start_time
            auth_duration_histogram.record(
                duration,
                {"method": "password", "status": "error"}
            )

            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))

            logger.error("Login error", extra={"error": str(e)})
            raise


# ============================================
# Example 5: Nested Spans for Complex Operations
# ============================================

async def process_user_registration(data: dict, request: Request):
    """
    Complex operation with nested spans
    """
    with tracer.start_as_current_span("auth.register") as parent_span:
        try:
            parent_span.set_attribute("operation", "user_registration")

            # Step 1: Validate user data
            with tracer.start_as_current_span("auth.register.validate"):
                await validate_user_data(data)

            # Step 2: Check if user exists
            with tracer.start_as_current_span("auth.register.check_exists"):
                exists = await check_user_exists(data["email"])
                if exists:
                    raise ValueError("User already exists")

            # Step 3: Create user
            with tracer.start_as_current_span("auth.register.create_user") as create_span:
                user = await create_user(data)
                create_span.set_attribute("user.id", user["id"])

            # Step 4: Send welcome email
            with tracer.start_as_current_span("auth.register.send_email") as email_span:
                try:
                    await send_welcome_email(user["email"])
                    email_span.set_status(Status(StatusCode.OK))
                except Exception as e:
                    # Log error but don't fail registration
                    email_span.record_exception(e)
                    logger.warning(
                        "Failed to send welcome email",
                        extra={"user_id": user["id"], "error": str(e)}
                    )

            parent_span.set_status(Status(StatusCode.OK))

            logger.info(
                "User registration completed",
                extra={"user_id": user["id"]}
            )

            return user

        except Exception as e:
            parent_span.record_exception(e)
            parent_span.set_status(Status(StatusCode.ERROR, str(e)))

            logger.error(
                "User registration failed",
                extra={"error": str(e)}
            )
            raise


# ============================================
# Example 6: Dependency with Tracing
# ============================================

async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency with tracing
    """
    with tracer.start_as_current_span("dependency.get_current_user") as span:
        try:
            auth_header = request.headers.get("authorization")

            if not auth_header:
                span.set_attribute("auth.token_present", False)
                raise HTTPException(status_code=401, detail="No token provided")

            span.set_attribute("auth.token_present", True)

            # Validate token
            token = auth_header.replace("Bearer ", "")
            user = await validate_token(token)

            span.set_attribute("user.id", user["id"])
            span.set_status(Status(StatusCode.OK))

            return user

        except HTTPException:
            raise
        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            logger.warning("Token validation failed", extra={"error": str(e)})
            raise HTTPException(status_code=401, detail="Invalid token")


# ============================================
# Example 7: FastAPI Route with Everything
# ============================================

app = FastAPI()


@app.get("/api/users/{user_id}")
async def get_user(
    user_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Complete example endpoint with all observability features
    """
    # Span is automatically created by FastAPI instrumentation
    span = trace.get_current_span()

    # Add custom attributes
    span.set_attribute("user.id", user_id)
    span.set_attribute("authenticated_user.id", current_user["id"])

    # Get correlation context
    correlation = get_correlation_context(request)

    # Log with full context
    logger.info(
        "Getting user profile",
        extra={
            "user_id": user_id,
            "authenticated_user_id": current_user["id"],
            "correlation_id": correlation.get("correlation_id")
        }
    )

    # Record custom metric
    user_operations_counter.add(
        1,
        {"operation": "get_user", "status": "started"}
    )

    try:
        # Fetch user data
        user = await get_user_profile(user_id, request)

        # Record success metric
        user_operations_counter.add(
            1,
            {"operation": "get_user", "status": "success"}
        )

        return user

    except Exception as e:
        # Record error metric
        user_operations_counter.add(
            1,
            {"operation": "get_user", "status": "error"}
        )
        raise


# ============================================
# Helper Functions (placeholder implementations)
# ============================================

class db:
    @staticmethod
    async def query(sql: str, *params):
        # Placeholder
        return []


async def authenticate_user(email: str, password: str):
    # Placeholder
    return {"id": "123", "email": email}


async def generate_token(user: dict):
    # Placeholder
    return "token123"


async def validate_user_data(data: dict):
    # Placeholder
    pass


async def check_user_exists(email: str):
    # Placeholder
    return False


async def create_user(data: dict):
    # Placeholder
    return {"id": "123", **data}


async def send_welcome_email(email: str):
    # Placeholder
    pass


async def validate_token(token: str):
    # Placeholder
    return {"id": "123"}


# ============================================
# Key Takeaways:
# ============================================
#
# 1. Use @traced decorator for automatic span creation
# 2. Add meaningful attributes to spans with set_attribute()
# 3. Use structured logging with trace context
# 4. Record exceptions with span.record_exception()
# 5. Propagate context with get_correlation_headers()
# 6. Create custom metrics for business operations
# 7. Use nested spans (context managers) for complex operations
# 8. Always set appropriate span status
# 9. Sanitize sensitive data in logs and spans
# 10. Leverage FastAPI's automatic instrumentation

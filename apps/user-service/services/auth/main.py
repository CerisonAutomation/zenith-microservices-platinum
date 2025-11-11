"""
Zenith Auth Service - Enterprise Authentication & Authorization
Provides secure user authentication, MFA, session management, and GDPR compliance.
"""
import os
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import logging
from contextlib import asynccontextmanager

# Import routers
from services.auth.router import router as auth_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Email service configuration
class EmailService:
    """Enterprise email service for auth notifications."""

    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@zenithdating.com")
        self.use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

        # Validate configuration
        if not self.smtp_username or not self.smtp_password:
            logger.warning("SMTP credentials not configured. Email features will be disabled.")
            self.enabled = False
        else:
            self.enabled = True
            logger.info("Email service configured successfully")

    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = ""):
        """Send email using SMTP."""
        if not self.enabled:
            logger.warning(f"Email service disabled. Would send email to {to_email}: {subject}")
            return False

        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email

            # Add text content
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)

            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)

            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            if self.use_tls:
                server.starttls()
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    logger.info("Starting Zenith Auth Service...")

    # Startup tasks
    logger.info("Auth service startup complete")

    yield

    # Shutdown tasks
    logger.info("Shutting down Zenith Auth Service...")

# Create FastAPI application
app = FastAPI(
    title="Zenith Auth Service",
    description="Enterprise authentication and authorization service with MFA, GDPR compliance, and security features",
    version="2.0.0",
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware (configure for production)
if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["your-domain.com"]  # Configure for production
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "zenith-auth",
        "version": "2.0.0",
        "email_service": "enabled" if email_service.enabled else "disabled"
    }

# Include routers
app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["authentication"]
)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "Zenith Auth Service",
        "version": "2.0.0",
        "description": "Enterprise authentication and authorization",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    # Development server configuration
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") != "production",
        log_level="info"
    )
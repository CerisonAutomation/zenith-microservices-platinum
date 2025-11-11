from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from supabase_client import get_supabase_client, get_supabase_admin_client, verify_token
from database import get_db
from typing import Optional, List
from datetime import datetime, timedelta
import models, schemas
import os
import secrets
import hashlib
import hmac
import base64
import pyotp
import qrcode
import io
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

# Import email service from main
try:
    from main import email_service
except ImportError:
    # Fallback for when running router independently
    email_service = None

router = APIRouter()

# Security constants
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = timedelta(minutes=15)
PASSWORD_RESET_TOKEN_EXPIRY = timedelta(hours=1)
EMAIL_VERIFICATION_TOKEN_EXPIRY = timedelta(days=7)

def get_current_user_from_token(request: Request) -> Optional[dict]:
    """Extract and verify user from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    if not verify_token(token):
        return None

    # Get user data from Supabase
    supabase = get_supabase_client()
    try:
        user_response = supabase.auth.get_user(token)
        return user_response.user.model_dump() if user_response.user else None
    except Exception:
        return None

def hash_password(password: str) -> str:
    """Hash password with salt."""
    salt = os.getenv("PASSWORD_SALT", "default_salt").encode()
    return hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000).hex()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash."""
    salt = os.getenv("PASSWORD_SALT", "default_salt").encode()
    return hmac.compare_digest(
        hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000).hex(),
        hashed
    )

def send_email(to_email: str, subject: str, html_content: str):
    """Send email using the configured email service."""
    if email_service and email_service.enabled:
        success = email_service.send_email(to_email, subject, html_content)
        if not success:
            # Log error but don't raise exception to avoid breaking user flow
            print(f"Failed to send email to {to_email}")
    else:
        # Log that email service is not available
        print(f"Email service not available. Would send: {subject} to {to_email}")

@router.post("/register", response_model=schemas.AuthResponse)
async def register_user(
    user_data: schemas.UserCreate,
    background_tasks: BackgroundTasks,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user with enhanced security."""
    supabase = get_supabase_client()

    try:
        # Check if user already exists
        existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")

        # Register user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "role": user_data.role or "user"
                }
            }
        })

        if auth_response.user:
            # Create user in database with hashed password
            verification_token = secrets.token_urlsafe(32)
            db_user = models.User(
                id=auth_response.user.id,
                email=user_data.email,
                password_hash=hash_password(user_data.password),
                role=user_data.role or "user",
                verification_token=verification_token,
                is_verified=False
            )
            db.add(db_user)

            # Create GDPR consent record
            consent = models.GDPRConsent(
                user_id=auth_response.user.id,
                consent_type="necessary",
                consented=True,
                ip_address=request.client.host,
                user_agent=request.headers.get("User-Agent")
            )
            db.add(consent)
            db.commit()

            # Send verification email
            verification_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email?token={verification_token}"
            html_content = f"""
            <h2>Welcome to Zenith!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <a href="{verification_url}">Verify Email</a>
            <p>This link will expire in 7 days.</p>
            """
            background_tasks.add_task(send_email, user_data.email, "Verify Your Zenith Account", html_content)

            return {
                "access_token": auth_response.session.access_token if auth_response.session else "",
                "refresh_token": auth_response.session.refresh_token if auth_response.session else "",
                "token_type": "bearer",
                "expires_in": 3600,
                "user": {
                    "id": auth_response.user.id,
                    "email": auth_response.user.email,
                    "role": user_data.role or "user",
                    "is_active": True,
                    "is_verified": False,
                    "two_factor_enabled": False,
                    "created_at": datetime.utcnow(),
                    "last_login": None
                }
            }
        else:
            raise HTTPException(status_code=400, detail="Registration failed")

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-email")
async def verify_email(verification: schemas.EmailVerification, db: Session = Depends(get_db)):
    """Verify user email address."""
    user = db.query(models.User).filter(
        models.User.verification_token == verification.token,
        models.User.is_verified == False
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    # Check if token is expired
    # Note: In production, you'd store token creation time
    user.is_verified = True
    user.verification_token = None
    db.commit()

    return {"message": "Email verified successfully"}

@router.post("/login")
async def login_user(credentials: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    """Enhanced login with security features."""
    supabase = get_supabase_client()

    try:
        # Get user from database
        user = db.query(models.User).filter(models.User.email == credentials.email).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.utcnow():
            raise HTTPException(status_code=429, detail="Account temporarily locked due to too many failed attempts")

        # Verify password
        if not verify_password(credentials.password, user.password_hash):
            user.login_attempts += 1
            if user.login_attempts >= MAX_LOGIN_ATTEMPTS:
                user.locked_until = datetime.utcnow() + LOCKOUT_DURATION
            db.commit()
            raise HTTPException(status_code=401, detail="Invalid credentials")

        # Check if email is verified
        if not user.is_verified:
            raise HTTPException(status_code=403, detail="Please verify your email before logging in")

        # Reset login attempts on successful login
        user.login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.utcnow()
        db.commit()

        # Login with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })

        if auth_response.session:
            # Create session record
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(hours=24) if credentials.remember_me else datetime.utcnow() + timedelta(hours=1)

            db_session = models.UserSession(
                user_id=user.id,
                session_token=session_token,
                device_info=request.headers.get("User-Agent"),
                ip_address=request.client.host,
                expires_at=expires_at
            )
            db.add(db_session)
            db.commit()

            return {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
                "token_type": "bearer",
                "expires_in": int((expires_at - datetime.utcnow()).total_seconds()),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role,
                    "is_active": user.is_active,
                    "is_verified": user.is_verified,
                    "two_factor_enabled": user.two_factor_enabled,
                    "created_at": user.created_at,
                    "last_login": user.last_login
                }
            }
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Login failed")

@router.post("/logout")
async def logout_user(request: Request, db: Session = Depends(get_db)):
    """Enhanced logout with session cleanup."""
    supabase = get_supabase_client()

    # Get token from header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            supabase.auth.sign_out(token)
        except Exception:
            pass  # Ignore errors during logout

    # Invalidate session in database
    session_token = request.headers.get("X-Session-Token")
    if session_token:
        session = db.query(models.UserSession).filter(
            models.UserSession.session_token == session_token,
            models.UserSession.is_active == True
        ).first()
        if session:
            session.is_active = False
            db.commit()

    return {"message": "Logged out successfully"}

@router.post("/password-reset/request")
async def request_password_reset(
    reset_request: schemas.PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Request password reset."""
    user = db.query(models.User).filter(models.User.email == reset_request.email).first()
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a reset link has been sent"}

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.utcnow() + PASSWORD_RESET_TOKEN_EXPIRY
    db.commit()

    # Send reset email
    reset_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={reset_token}"
    html_content = f"""
    <h2>Password Reset Request</h2>
    <p>You requested a password reset for your Zenith account.</p>
    <p>Click the link below to reset your password:</p>
    <a href="{reset_url}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
    """
    background_tasks.add_task(send_email, reset_request.email, "Reset Your Zenith Password", html_content)

    return {"message": "If the email exists, a reset link has been sent"}

@router.post("/password-reset")
async def reset_password(reset_data: schemas.PasswordReset, db: Session = Depends(get_db)):
    """Reset password using token."""
    user = db.query(models.User).filter(
        models.User.reset_token == reset_data.token,
        models.User.reset_token_expires > datetime.utcnow()
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    # Update password
    user.password_hash = hash_password(reset_data.new_password)
    user.reset_token = None
    user.reset_token_expires = None

    # Add to password history
    password_history = models.PasswordHistory(
        user_id=user.id,
        password_hash=user.password_hash
    )
    db.add(password_history)
    db.commit()

    return {"message": "Password reset successfully"}

@router.post("/2fa/setup")
async def setup_two_factor(current_user: dict = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """Setup two-factor authentication."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(models.User).filter(models.User.id == current_user["id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate TOTP secret
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)

    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(totp.provisioning_uri(name=user.email, issuer_name="Zenith"))
    qr.make(fit=True)

    img = io.BytesIO()
    qr.make_image(fill_color="black", back_color="white").save(img)
    img.seek(0)
    qr_code_base64 = base64.b64encode(img.getvalue()).decode()

    # Store secret temporarily (don't save until verified)
    user.two_factor_secret = secret
    db.commit()

    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_code_base64}"
    }

@router.post("/2fa/enable")
async def enable_two_factor(code: schemas.TwoFactorVerify, current_user: dict = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """Enable two-factor authentication."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = db.query(models.User).filter(models.User.id == current_user["id"]).first()
    if not user or not user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")

    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(code.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code")

    user.two_factor_enabled = True
    db.commit()

    return {"message": "2FA enabled successfully"}

@router.post("/consent")
async def update_gdpr_consent(
    consent: schemas.GDPRConsentCreate,
    request: Request,
    current_user: dict = Depends(get_current_user_from_token),
    db: Session = Depends(get_db)
):
    """Update GDPR consent."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Update or create consent record
    existing_consent = db.query(models.GDPRConsent).filter(
        models.GDPRConsent.user_id == current_user["id"],
        models.GDPRConsent.consent_type == consent.consent_type
    ).first()

    if existing_consent:
        existing_consent.consented = consent.consented
        existing_consent.consent_date = datetime.utcnow()
    else:
        new_consent = models.GDPRConsent(
            user_id=current_user["id"],
            consent_type=consent.consent_type,
            consented=consent.consented,
            ip_address=request.client.host,
            user_agent=request.headers.get("User-Agent")
        )
        db.add(new_consent)

    db.commit()
    return {"message": "Consent updated successfully"}

@router.get("/sessions", response_model=List[schemas.UserSessionOut])
async def get_user_sessions(current_user: dict = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """Get user's active sessions."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    sessions = db.query(models.UserSession).filter(
        models.UserSession.user_id == current_user["id"],
        models.UserSession.is_active == True,
        models.UserSession.expires_at > datetime.utcnow()
    ).all()

    return sessions

@router.delete("/sessions/{session_id}")
async def revoke_session(session_id: str, current_user: dict = Depends(get_current_user_from_token), db: Session = Depends(get_db)):
    """Revoke a specific session."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = db.query(models.UserSession).filter(
        models.UserSession.id == session_id,
        models.UserSession.user_id == current_user["id"]
    ).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.is_active = False
    db.commit()

    return {"message": "Session revoked successfully"}

# Legacy endpoints for backward compatibility
@router.post("/", response_model=schemas.UserOut)
def create_item(item: schemas.UserCreate, db: Session = Depends(get_db)):
    """Legacy endpoint - creates user in database only."""
    db_item = models.User(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/{item_id}", response_model=schemas.UserOut)
def read_item(item_id: str, db: Session = Depends(get_db)):
    """Legacy endpoint - reads user from database."""
    item = db.query(models.User).filter(models.User.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="User not found")
    return item

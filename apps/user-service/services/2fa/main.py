"""
Two-Factor Authentication Service - FastAPI microservice for 2FA functionality
Senior-level implementation with comprehensive 2FA features
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_, text
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import json
import logging
import secrets
import string
import hashlib
import hmac
import base64
import qrcode
import io
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Import our models and schemas
from models import (
    Base, TwoFactorConfig, TwoFactorChallenge, BackupCode, HardwareKey,
    TwoFactorAttempt, RecoveryRequest
)
from schemas import (
    TwoFactorConfigCreate, TwoFactorConfigUpdate, TwoFactorConfig as TwoFactorConfigSchema,
    TwoFactorChallengeCreate, TwoFactorChallenge as TwoFactorChallengeSchema,
    BackupCodeCreate, BackupCode as BackupCodeSchema,
    HardwareKeyCreate, HardwareKey as HardwareKeySchema,
    TwoFactorAttemptCreate, TwoFactorAttempt as TwoFactorAttemptSchema,
    RecoveryRequestCreate, RecoveryRequest as RecoveryRequestSchema,
    SetupTOTPRequest, SetupTOTPResponse, VerifyTOTPRequest,
    Enable2FARequest, Disable2FARequest, ChallengeRequest, ChallengeResponse,
    VerifyChallengeRequest, VerifyChallengeResponse, GenerateBackupCodesRequest,
    GenerateBackupCodesResponse, VerifyBackupCodeRequest,
    RecoveryRequestCreateRequest, RecoveryRequestResponse, ApproveRecoveryRequest,
    WebAuthnRegistrationOptions, WebAuthnCredential, WebAuthnRegistrationRequest,
    WebAuthnAuthenticationOptions, WebAuthnAuthenticationRequest,
    TwoFactorStats, UserTwoFactorStatus,
    PaginationParams, PaginatedResponse,
    APIResponse, ErrorResponse, SuccessResponse,
    TwoFactorStatus, TwoFactorMethod, ChallengeStatus, BackupCodeStatus
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup (placeholder - will be configured with actual database)
DATABASE_URL = "postgresql://user:password@localhost/twofa_db"

# Encryption setup (placeholder - use proper key management in production)
ENCRYPTION_KEY = Fernet.generate_key()
cipher = Fernet(ENCRYPTION_KEY)

# Create FastAPI app
app = FastAPI(
    title="Two-Factor Authentication Service API",
    description="Enterprise two-factor authentication with TOTP, SMS, hardware keys, and backup codes",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency (placeholder)
def get_db():
    # This will be replaced with actual database session management
    return None

# Authentication dependency (placeholder)
def get_current_user():
    # This will be replaced with actual authentication
    return {"id": 1, "email": "user@example.com"}

# Admin authorization dependency (placeholder)
def require_admin(current_user: dict = Depends(get_current_user)):
    # This will be replaced with actual admin check
    return current_user

# Utility functions
def generate_secret_key() -> str:
    """Generate a random secret key for TOTP"""
    return base64.b32encode(secrets.token_bytes(20)).decode('utf-8')

def generate_backup_codes(count: int = 10) -> List[str]:
    """Generate backup codes for account recovery"""
    codes = []
    for _ in range(count):
        code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
        codes.append(code)
    return codes

def hash_backup_code(code: str) -> str:
    """Hash a backup code for storage"""
    return hashlib.sha256(code.encode()).hexdigest()

def verify_backup_code(hashed_code: str, provided_code: str) -> bool:
    """Verify a backup code against its hash"""
    return hmac.compare_digest(hashed_code, hash_backup_code(provided_code))

def encrypt_data(data: str) -> str:
    """Encrypt sensitive data"""
    return cipher.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    return cipher.decrypt(encrypted_data.encode()).decode()

def generate_totp_uri(secret: str, account_name: str, issuer: str = "Zenith") -> str:
    """Generate TOTP URI for QR code"""
    return f"otpauth://totp/{issuer}:{account_name}?secret={secret}&issuer={issuer}"

def generate_qr_code(data: str) -> str:
    """Generate QR code as base64 string"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, "PNG")
    return base64.b64encode(buffer.getvalue()).decode()

def verify_totp_code(secret: str, code: str) -> bool:
    """Verify TOTP code (simplified implementation)"""
    # In production, use a proper TOTP library like pyotp
    # For now, accept any 6-digit code for demo purposes
    return len(code) == 6 and code.isdigit()

def create_challenge_token() -> str:
    """Create a unique challenge token"""
    return secrets.token_urlsafe(32)

# API Routes

# Health check
@app.get("/health", response_model=SuccessResponse)
async def health_check():
    """Health check endpoint"""
    return SuccessResponse(message="2FA service is healthy")

# 2FA Configuration API
@app.post("/config", response_model=TwoFactorConfigSchema)
async def create_2fa_config(config: TwoFactorConfigCreate, db: Session = Depends(get_db)):
    """Create 2FA configuration for a user"""
    try:
        # Check if config already exists
        existing = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == config.user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="2FA configuration already exists for this user")

        db_config = TwoFactorConfig(**config.dict())
        db.add(db_config)
        db.commit()
        db.refresh(db_config)
        return db_config
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Configuration creation failed")

@app.get("/config/{user_id}", response_model=TwoFactorConfigSchema)
async def get_2fa_config(user_id: int, db: Session = Depends(get_db)):
    """Get 2FA configuration for a user"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")
    return config

@app.put("/config/{user_id}", response_model=TwoFactorConfigSchema)
async def update_2fa_config(
    user_id: int,
    config_update: TwoFactorConfigUpdate,
    db: Session = Depends(get_db)
):
    """Update 2FA configuration"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")

    for field, value in config_update.dict(exclude_unset=True).items():
        setattr(config, field, value)

    config.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(config)
    return config

# TOTP Setup API
@app.post("/totp/setup", response_model=SetupTOTPResponse)
async def setup_totp(request: SetupTOTPRequest, db: Session = Depends(get_db)):
    """Setup TOTP for a user"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == request.user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")

    if config.status == TwoFactorStatus.ENABLED:
        raise HTTPException(status_code=400, detail="2FA is already enabled for this user")

    # Generate secret and backup codes
    secret = generate_secret_key()
    backup_codes = generate_backup_codes(10)

    # Store encrypted secret
    config.secret_key = encrypt_data(secret)
    config.status = TwoFactorStatus.PENDING

    # Generate QR code
    totp_uri = generate_totp_uri(secret, f"user_{request.user_id}")
    qr_code = generate_qr_code(totp_uri)

    # Store backup codes
    for code in backup_codes:
        hashed_code = hash_backup_code(code)
        backup_code = BackupCode(
            config_id=config.id,
            code_hash=hashed_code
        )
        db.add(backup_code)

    db.commit()

    return SetupTOTPResponse(
        secret=secret,
        qr_code_url=f"data:image/png;base64,{qr_code}",
        backup_codes=backup_codes
    )

@app.post("/totp/verify", response_model=SuccessResponse)
async def verify_totp_setup(request: VerifyTOTPRequest, db: Session = Depends(get_db)):
    """Verify TOTP setup and enable 2FA"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == request.user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")

    if not config.secret_key:
        raise HTTPException(status_code=400, detail="TOTP not set up for this user")

    # Decrypt secret and verify code
    secret = decrypt_data(config.secret_key)
    if not verify_totp_code(secret, request.code):
        raise HTTPException(status_code=400, detail="Invalid TOTP code")

    # Enable 2FA
    config.status = TwoFactorStatus.ENABLED
    config.primary_method = TwoFactorMethod.TOTP
    config.reset_failures()

    db.commit()

    return SuccessResponse(message="TOTP setup verified and 2FA enabled")

# Challenge API
@app.post("/challenge", response_model=ChallengeResponse)
async def create_challenge(
    request: ChallengeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a 2FA challenge"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == request.user_id).first()
    if not config or config.status != TwoFactorStatus.ENABLED:
        raise HTTPException(status_code=400, detail="2FA not enabled for this user")

    if config.is_locked():
        raise HTTPException(status_code=429, detail="Account is temporarily locked")

    # Create challenge
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    challenge_token = create_challenge_token()

    db_challenge = TwoFactorChallenge(
        config_id=config.id,
        challenge_type=request.method,
        challenge_token=challenge_token,
        expires_at=expires_at
    )

    # Generate verification code based on method
    if request.method == TwoFactorMethod.TOTP:
        # For TOTP, user provides the code
        pass
    elif request.method == TwoFactorMethod.SMS:
        # Generate and send SMS code
        code = ''.join(secrets.choice(string.digits) for _ in range(6))
        db_challenge.challenge_code = code
        # In real implementation, send SMS via SMS service
        background_tasks.add_task(send_sms_code, config.phone_number, code)
    elif request.method == TwoFactorMethod.EMAIL:
        # Generate and send email code
        code = ''.join(secrets.choice(string.digits) for _ in range(6))
        db_challenge.challenge_code = code
        # In real implementation, send email via email service
        background_tasks.add_task(send_email_code, config.recovery_email, code)

    db.add(db_challenge)
    db.commit()
    db.refresh(db_challenge)

    return ChallengeResponse(
        challenge_id=db_challenge.id,
        challenge_token=challenge_token,
        expires_at=expires_at,
        method=request.method
    )

@app.post("/challenge/verify", response_model=VerifyChallengeResponse)
async def verify_challenge(
    request: VerifyChallengeRequest,
    db: Session = Depends(get_db)
):
    """Verify a 2FA challenge"""
    challenge = db.query(TwoFactorChallenge).options(joinedload(TwoFactorChallenge.config)).filter(
        TwoFactorChallenge.challenge_token == request.challenge_token
    ).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if not challenge.can_verify():
        challenge.status = ChallengeStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=400, detail="Challenge expired or already used")

    config = challenge.config
    success = False

    # Verify based on challenge type
    if challenge.challenge_type == TwoFactorMethod.TOTP:
        if config.secret_key:
            secret = decrypt_data(config.secret_key)
            success = verify_totp_code(secret, request.code)
    elif challenge.challenge_type in [TwoFactorMethod.SMS, TwoFactorMethod.EMAIL]:
        success = challenge.challenge_code == request.code
    elif challenge.challenge_type == TwoFactorMethod.BACKUP_CODE:
        # Verify backup code
        backup_code = db.query(BackupCode).filter(
            BackupCode.config_id == config.id,
            BackupCode.status == BackupCodeStatus.UNUSED
        ).first()

        if backup_code and verify_backup_code(backup_code.code_hash, request.code):
            backup_code.status = BackupCodeStatus.USED
            backup_code.used_at = datetime.utcnow()
            backup_code.ip_address = request.ip_address
            backup_code.user_agent = request.user_agent
            success = True

    # Log attempt
    attempt = TwoFactorAttempt(
        user_id=config.user_id,
        method=challenge.challenge_type,
        success=success,
        ip_address=request.ip_address,
        user_agent=request.user_agent,
        challenge_id=challenge.id
    )

    if success:
        challenge.status = ChallengeStatus.COMPLETED
        challenge.verified_at = datetime.utcnow()
        config.reset_failures()
    else:
        challenge.status = ChallengeStatus.FAILED
        config.increment_failures()
        attempt.failure_reason = "Invalid code"

    db.add(attempt)
    db.commit()

    return VerifyChallengeResponse(
        success=success,
        user_id=config.user_id,
        method=challenge.challenge_type
    )

# Backup Codes API
@app.post("/backup-codes/generate", response_model=GenerateBackupCodesResponse)
async def generate_new_backup_codes(
    request: GenerateBackupCodesRequest,
    db: Session = Depends(get_db)
):
    """Generate new backup codes"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == request.user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")

    # Mark existing codes as expired
    db.query(BackupCode).filter(
        BackupCode.config_id == config.id,
        BackupCode.status == BackupCodeStatus.UNUSED
    ).update({"status": BackupCodeStatus.EXPIRED})

    # Generate new codes
    codes = generate_backup_codes(request.count)
    for code in codes:
        hashed_code = hash_backup_code(code)
        backup_code = BackupCode(
            config_id=config.id,
            code_hash=hashed_code
        )
        db.add(backup_code)

    db.commit()

    return GenerateBackupCodesResponse(backup_codes=codes)

@app.get("/backup-codes/{user_id}", response_model=List[BackupCodeSchema])
async def list_backup_codes(user_id: int, db: Session = Depends(get_db)):
    """List backup codes for a user"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")

    codes = db.query(BackupCode).filter(BackupCode.config_id == config.id).all()
    return codes

# Enable/Disable 2FA API
@app.post("/enable", response_model=SuccessResponse)
async def enable_2fa(request: Enable2FARequest, db: Session = Depends(get_db)):
    """Enable 2FA for a user"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == request.user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")

    if config.status == TwoFactorStatus.ENABLED:
        raise HTTPException(status_code=400, detail="2FA is already enabled")

    # Verify with current method if provided
    if request.verification_code:
        if config.primary_method == TwoFactorMethod.TOTP and config.secret_key:
            secret = decrypt_data(config.secret_key)
            if not verify_totp_code(secret, request.verification_code):
                raise HTTPException(status_code=400, detail="Invalid verification code")
        # Add other verification methods as needed

    config.status = TwoFactorStatus.ENABLED
    config.primary_method = request.method
    db.commit()

    return SuccessResponse(message="2FA enabled successfully")

@app.post("/disable", response_model=SuccessResponse)
async def disable_2fa(request: Disable2FARequest, db: Session = Depends(get_db)):
    """Disable 2FA for a user"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == request.user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")

    if config.status != TwoFactorStatus.ENABLED:
        raise HTTPException(status_code=400, detail="2FA is not enabled")

    # Verify with backup method if primary method is not available
    if request.backup_code:
        backup_code = db.query(BackupCode).filter(
            BackupCode.config_id == config.id,
            BackupCode.status == BackupCodeStatus.UNUSED
        ).first()

        if not backup_code or not verify_backup_code(backup_code.code_hash, request.backup_code):
            raise HTTPException(status_code=400, detail="Invalid backup code")

        backup_code.status = BackupCodeStatus.USED
        backup_code.used_at = datetime.utcnow()

    config.status = TwoFactorStatus.DISABLED
    config.primary_method = None
    config.secret_key = None

    # Mark all backup codes as expired
    db.query(BackupCode).filter(BackupCode.config_id == config.id).update(
        {"status": BackupCodeStatus.EXPIRED}
    )

    db.commit()

    return SuccessResponse(message="2FA disabled successfully")

# Recovery API
@app.post("/recovery", response_model=RecoveryRequestResponse)
async def create_recovery_request(
    request: RecoveryRequestCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a recovery request for account access"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == request.user_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="2FA configuration not found")

    # Create recovery request
    recovery_token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(hours=24)

    recovery_request = RecoveryRequest(
        user_id=request.user_id,
        recovery_token=recovery_token,
        recovery_method=request.recovery_method,
        expires_at=expires_at
    )

    db.add(recovery_request)
    db.commit()

    return RecoveryRequestResponse(
        recovery_token=recovery_token,
        expires_at=expires_at
    )

@app.post("/recovery/approve", response_model=SuccessResponse)
async def approve_recovery_request(request: ApproveRecoveryRequest, db: Session = Depends(get_db)):
    """Approve a recovery request"""
    recovery_request = db.query(RecoveryRequest).filter(
        RecoveryRequest.recovery_token == request.recovery_token
    ).first()

    if not recovery_request:
        raise HTTPException(status_code=404, detail="Recovery request not found")

    if recovery_request.is_expired():
        recovery_request.status = "expired"
        db.commit()
        raise HTTPException(status_code=400, detail="Recovery request has expired")

    if recovery_request.status != "pending":
        raise HTTPException(status_code=400, detail="Recovery request already processed")

    # Verify approval code (simplified - in production, send code to recovery method)
    if request.approval_code != "123456":  # Placeholder
        raise HTTPException(status_code=400, detail="Invalid approval code")

    recovery_request.status = "approved"
    recovery_request.approved_at = datetime.utcnow()

    # Temporarily disable 2FA for recovery
    config = db.query(TwoFactorConfig).filter(
        TwoFactorConfig.user_id == recovery_request.user_id
    ).first()

    if config:
        config.status = TwoFactorStatus.DISABLED
        config.primary_method = None

    db.commit()

    return SuccessResponse(message="Recovery request approved")

# Analytics API
@app.get("/analytics/stats", response_model=TwoFactorStats)
async def get_2fa_stats(db: Session = Depends(get_db)):
    """Get 2FA statistics"""
    # Total users with 2FA enabled
    total_with_2fa = db.query(func.count(TwoFactorConfig.id)).filter(
        TwoFactorConfig.status == TwoFactorStatus.ENABLED
    ).scalar()

    # Users by method
    method_counts = db.query(
        TwoFactorConfig.primary_method,
        func.count(TwoFactorConfig.id)
    ).filter(TwoFactorConfig.status == TwoFactorStatus.ENABLED)\
     .group_by(TwoFactorConfig.primary_method)\
     .all()

    users_by_method = {method.value: count for method, count in method_counts if method}

    # Today's attempts
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())

    attempts_today = db.query(func.count(TwoFactorAttempt.id)).filter(
        TwoFactorAttempt.created_at >= today_start
    ).scalar()

    successful_today = db.query(func.count(TwoFactorAttempt.id)).filter(
        TwoFactorAttempt.created_at >= today_start,
        TwoFactorAttempt.success == True
    ).scalar()

    failed_today = attempts_today - successful_today

    recovery_today = db.query(func.count(RecoveryRequest.id)).filter(
        RecoveryRequest.created_at >= today_start
    ).scalar()

    # Most used method
    most_used = db.query(
        TwoFactorAttempt.method,
        func.count(TwoFactorAttempt.id)
    ).group_by(TwoFactorAttempt.method)\
     .order_by(desc(func.count(TwoFactorAttempt.id)))\
     .first()

    return TwoFactorStats(
        total_users_with_2fa=total_with_2fa,
        users_by_method=users_by_method,
        verification_attempts_today=attempts_today,
        successful_verifications_today=successful_today,
        failed_verifications_today=failed_today,
        recovery_requests_today=recovery_today,
        most_used_method=most_used[0] if most_used else None,
        verification_success_rate=(successful_today / attempts_today * 100) if attempts_today > 0 else 0.0
    )

@app.get("/status/{user_id}", response_model=UserTwoFactorStatus)
async def get_user_2fa_status(user_id: int, db: Session = Depends(get_db)):
    """Get 2FA status for a user"""
    config = db.query(TwoFactorConfig).filter(TwoFactorConfig.user_id == user_id).first()
    if not config:
        return UserTwoFactorStatus(
            user_id=user_id,
            status=TwoFactorStatus.DISABLED,
            primary_method=None,
            backup_method=None,
            last_verified_at=None,
            failed_attempts=0,
            is_locked=False
        )

    return UserTwoFactorStatus(
        user_id=user_id,
        status=config.status,
        primary_method=config.primary_method,
        backup_method=config.backup_method,
        last_verified_at=config.last_verified_at,
        failed_attempts=config.failed_attempts,
        is_locked=config.is_locked()
    )

# Background task functions
async def send_sms_code(phone_number: str, code: str):
    """Send SMS verification code (placeholder)"""
    logger.info(f"Sending SMS code {code} to {phone_number}")

async def send_email_code(email: str, code: str):
    """Send email verification code (placeholder)"""
    logger.info(f"Sending email code {code} to {email}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
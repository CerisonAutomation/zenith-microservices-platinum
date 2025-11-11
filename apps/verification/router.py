"""
Age Verification & Identity Verification Router
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from typing import Optional
import uuid
import json
import httpx
import random
import string

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from verification.models import (
    Verification, AgeGate, EmailVerification, PhoneVerification,
    BackgroundCheck, VerificationBadge, VerificationType, VerificationStatus
)
from verification.schemas import (
    AgeVerificationRequest, VerificationResponse, EmailVerificationRequest
)

router = APIRouter(prefix="/api/v1/verification", tags=["Verification"])


# ============================================================================
# AGE GATE - PUBLIC ENDPOINT
# ============================================================================

@router.get("/age-gate/{service}")
async def get_age_gate(service: str):
    """
    Check if age verification is required for service
    Public endpoint - no authentication required
    """
    services_requiring_age_verification = {
        "booking": True,
        "messaging": True,
        "profile_view": False,
        "reviews": False,
        "payment": True
    }
    
    return {
        "service": service,
        "requires_age_verification": services_requiring_age_verification.get(service, True),
        "minimum_age": 18,
        "verification_methods": ["document", "email", "phone"]
    }


@router.post("/age-gate/confirm")
async def confirm_age_gate(
    service: str,
    age_confirmed: bool,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Anonymous age gate confirmation (before login)
    """
    gate = AgeGate(
        id=str(uuid.uuid4()),
        user_id=user_id,
        service_accessed=service,
        age_confirmed=age_confirmed,
        confirmation_method="user_statement",
        confirmed_at=datetime.utcnow() if age_confirmed else None
    )
    db.add(gate)
    db.commit()
    
    return {
        "status": "confirmed" if age_confirmed else "declined",
        "gate_id": gate.id
    }


# ============================================================================
# DOCUMENT-BASED AGE VERIFICATION
# ============================================================================

@router.post("/document-upload")
async def upload_identity_document(
    document: UploadFile = File(...),
    document_type: str = None,  # "passport", "drivers_license", "id_card"
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Upload identity document for age verification
    Integrates with external verification service (Jumio, IDology, etc)
    """
    # Check if already verified
    existing = db.query(Verification).filter(
        and_(
            Verification.user_id == current_user.id,
            Verification.verification_type == VerificationType.AGE,
            Verification.status == VerificationStatus.VERIFIED,
            Verification.expires_at > datetime.utcnow()
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already verified")
    
    # Save uploaded file
    file_path = f"/tmp/{uuid.uuid4()}_{document.filename}"
    with open(file_path, "wb") as f:
        f.write(await document.read())
    
    # Create verification record
    verification = Verification(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        verification_type=VerificationType.AGE,
        status=VerificationStatus.PROCESSING,
        document_type=document_type,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=365),
        verification_provider="jumio"  # External service
    )
    db.add(verification)
    db.commit()
    
    # Queue verification job
    if background_tasks:
        background_tasks.add_task(
            verify_document_async,
            verification_id=verification.id,
            file_path=file_path,
            document_type=document_type,
            user_id=current_user.id,
            db=db
        )
    
    return {
        "status": "processing",
        "verification_id": verification.id,
        "message": "Document received. Verification in progress (usually 1-2 hours)."
    }


async def verify_document_async(
    verification_id: str,
    file_path: str,
    document_type: str,
    user_id: str,
    db: Session
):
    """
    Background task: Call external verification service
    """
    try:
        # Call Jumio API (example)
        # In production: Use actual API credentials
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                files = {"document": f}
                response = await client.post(
                    "https://upload.jumio.com/api/v2/initiateNetverify",
                    files=files,
                    data={"userID": user_id}
                )
        
        verification = db.query(Verification).filter(
            Verification.id == verification_id
        ).first()
        
        if response.status_code == 200:
            data = response.json()
            verification.external_verification_id = data.get("netverifyId")
            verification.status = VerificationStatus.PENDING
            verification.notes = "Awaiting external verification service"
        else:
            verification.status = VerificationStatus.FAILED
            verification.notes = f"API error: {response.status_code}"
        
        db.commit()
    
    except Exception as e:
        verification = db.query(Verification).filter(
            Verification.id == verification_id
        ).first()
        verification.status = VerificationStatus.FAILED
        verification.notes = f"Error: {str(e)}"
        db.commit()


@router.get("/document/{verification_id}/status")
async def get_verification_status(
    verification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get status of document verification
    """
    verification = db.query(Verification).filter(
        and_(
            Verification.id == verification_id,
            Verification.user_id == current_user.id
        )
    ).first()
    
    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    return {
        "verification_id": verification.id,
        "status": verification.status,
        "document_type": verification.document_type,
        "verified_at": verification.verified_at,
        "message": verification.notes
    }


# ============================================================================
# EMAIL VERIFICATION
# ============================================================================

@router.post("/email/send")
async def send_email_verification(
    email: str,
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Send email verification link (simple email confirmation)
    """
    # Generate token
    token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
    
    email_verification = EmailVerification(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        email=email,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(email_verification)
    db.commit()
    
    # Send email
    if background_tasks:
        background_tasks.add_task(
            send_email_verification_link,
            email=email,
            token=token
        )
    
    return {
        "status": "email_sent",
        "message": f"Verification link sent to {email}"
    }


async def send_email_verification_link(email: str, token: str):
    """
    Send email with verification link
    """
    # In production: Use SendGrid, AWS SES, etc.
    verification_url = f"https://zenith.app/verify-email/{token}"
    print(f"Email verification link for {email}: {verification_url}")


@router.get("/email/{token}/verify")
async def verify_email(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Verify email with token from link
    """
    email_verification = db.query(EmailVerification).filter(
        EmailVerification.token == token
    ).first()
    
    if not email_verification:
        raise HTTPException(status_code=404, detail="Token not found")
    
    if email_verification.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Token expired")
    
    if email_verification.verified:
        raise HTTPException(status_code=400, detail="Already verified")
    
    email_verification.verified = True
    email_verification.verified_at = datetime.utcnow()
    
    # Update user verification badge
    badge = db.query(VerificationBadge).filter(
        VerificationBadge.user_id == email_verification.user_id
    ).first()
    
    if badge:
        badge.email_verified = True
        badge.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "status": "verified",
        "message": "Email verified successfully"
    }


# ============================================================================
# PHONE VERIFICATION
# ============================================================================

@router.post("/phone/send-otp")
async def send_phone_otp(
    phone_number: str,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Send OTP code via SMS
    """
    # Generate 6-digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    phone_verification = PhoneVerification(
        id=str(uuid.uuid4()),
        user_id=None,  # Can be anonymous
        phone_number=phone_number,
        otp_code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=15)
    )
    db.add(phone_verification)
    db.commit()
    
    # Send SMS
    if background_tasks:
        background_tasks.add_task(
            send_sms_otp,
            phone_number=phone_number,
            otp_code=otp_code
        )
    
    return {
        "status": "otp_sent",
        "message": f"OTP sent to {phone_number}",
        "verification_id": phone_verification.id
    }


async def send_sms_otp(phone_number: str, otp_code: str):
    """
    Send SMS with OTP code
    """
    # In production: Use Twilio, AWS SNS, etc.
    print(f"OTP {otp_code} sent to {phone_number}")


@router.post("/phone/verify-otp")
async def verify_phone_otp(
    verification_id: str,
    otp_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Verify phone with OTP code
    """
    phone_verification = db.query(PhoneVerification).filter(
        PhoneVerification.id == verification_id
    ).first()
    
    if not phone_verification:
        raise HTTPException(status_code=404, detail="Verification not found")
    
    if phone_verification.expires_at < datetime.utcnow():
        raise HTTPException(status_code=410, detail="OTP expired")
    
    phone_verification.attempts += 1
    
    if phone_verification.attempts > 3:
        raise HTTPException(status_code=429, detail="Too many attempts")
    
    if phone_verification.otp_code != otp_code:
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    phone_verification.verified = True
    phone_verification.verified_at = datetime.utcnow()
    phone_verification.user_id = current_user.id
    
    # Update verification badge
    badge = db.query(VerificationBadge).filter(
        VerificationBadge.user_id == current_user.id
    ).first_or_create()
    
    badge.phone_verified = True
    badge.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "status": "verified",
        "message": "Phone verified successfully"
    }


# ============================================================================
# PROVIDER BACKGROUND CHECK
# ============================================================================

@router.post("/provider/background-check")
async def request_background_check(
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """
    Request background check for service provider
    Checks: criminal record, sex offender registry, sanctions list
    """
    background_check = BackgroundCheck(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        requested_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=365),
        status="pending"
    )
    db.add(background_check)
    db.commit()
    
    # Queue background check
    if background_tasks:
        background_tasks.add_task(
            perform_background_check,
            user_id=current_user.id,
            check_id=background_check.id,
            db=db
        )
    
    return {
        "status": "processing",
        "check_id": background_check.id,
        "message": "Background check initiated. Results in 1-3 business days."
    }


async def perform_background_check(user_id: str, check_id: str, db: Session):
    """
    Background task: Perform actual background checks
    """
    # In production: Integrate with Experian, Serco, etc.
    # This is a placeholder for the actual implementation
    pass


# ============================================================================
# VERIFICATION STATUS
# ============================================================================

@router.get("/status")
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user's overall verification status
    """
    badge = db.query(VerificationBadge).filter(
        VerificationBadge.user_id == current_user.id
    ).first()
    
    if not badge:
        return {
            "email_verified": False,
            "phone_verified": False,
            "age_verified": False,
            "identity_verified": False,
            "background_checked": False,
            "verification_level": "unverified"
        }
    
    return {
        "email_verified": badge.email_verified,
        "phone_verified": badge.phone_verified,
        "age_verified": badge.age_verified,
        "identity_verified": badge.identity_verified,
        "background_checked": badge.background_checked,
        "verification_level": badge.verification_level,
        "show_badge": badge.show_badge
    }

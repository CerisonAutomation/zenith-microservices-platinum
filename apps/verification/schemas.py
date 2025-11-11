"""
Verification Schemas (Pydantic Models)
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum


class DocumentType(str, Enum):
    """Types of identity documents"""
    PASSPORT = "passport"
    DRIVERS_LICENSE = "drivers_license"
    ID_CARD = "id_card"
    NATIONAL_ID = "national_id"


class VerificationMethod(str, Enum):
    """Methods of verification"""
    DOCUMENT = "document"
    EMAIL = "email"
    PHONE = "phone"
    BACKGROUND_CHECK = "background_check"


class AgeVerificationRequest(BaseModel):
    """Request to verify age"""
    document_type: DocumentType
    document_country: str  # ISO country code
    dob: datetime


class VerificationResponse(BaseModel):
    """Verification result"""
    status: str
    verification_id: str
    message: str
    verified_at: Optional[datetime] = None


class EmailVerificationRequest(BaseModel):
    """Request to verify email"""
    email: EmailStr


class PhoneVerificationRequest(BaseModel):
    """Request to verify phone"""
    phone_number: str


class OTPVerificationRequest(BaseModel):
    """Verify OTP code"""
    verification_id: str
    otp_code: str


class BackgroundCheckRequest(BaseModel):
    """Request background check"""
    check_type: str  # "criminal", "sex_offender", "sanctions"


class VerificationStatusResponse(BaseModel):
    """User's verification status"""
    email_verified: bool
    phone_verified: bool
    age_verified: bool
    identity_verified: bool
    background_checked: bool
    verification_level: str  # "unverified", "basic", "standard", "premium"
    show_badge: Optional[bool] = False

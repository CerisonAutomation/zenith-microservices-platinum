"""
Age Verification Models
Implements 18+ enforcement and document-based identity verification
"""
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()


class VerificationType(str, enum.Enum):
    """Types of identity verification"""
    AGE = "age"
    EMAIL = "email"
    PHONE = "phone"
    BACKGROUND_CHECK = "background_check"
    DOCUMENT = "document"


class VerificationStatus(str, enum.Enum):
    """Status of verification"""
    PENDING = "pending"
    PROCESSING = "processing"
    VERIFIED = "verified"
    FAILED = "failed"
    EXPIRED = "expired"
    REJECTED = "rejected"


class Verification(Base):
    """Track user verifications"""
    __tablename__ = "verifications"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    verification_type = Column(Enum(VerificationType), nullable=False)
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    
    # For age/document verification
    document_type = Column(String, nullable=True)  # "passport", "drivers_license", "id_card"
    document_country = Column(String, nullable=True)  # ISO country code
    
    # For identity data
    verified_name = Column(String, nullable=True)
    verified_dob = Column(DateTime, nullable=True)
    verified_age = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # When verification expires
    
    # Reference data
    external_verification_id = Column(String, nullable=True)  # ID from external service
    verification_provider = Column(String, nullable=True)  # "jumio", "idology", etc
    
    # Audit
    notes = Column(String, nullable=True)
    verified_by = Column(String, nullable=True)  # Admin who verified


class AgeGate(Base):
    """Track age gate interactions"""
    __tablename__ = "age_gates"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=True)  # Null if anonymous
    service_accessed = Column(String)  # "booking", "profile", "messaging"
    age_confirmed = Column(Boolean, default=False)
    confirmation_method = Column(String)  # "document", "email", "phone"
    confirmed_at = Column(DateTime, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)


class EmailVerification(Base):
    """Email verification tokens and status"""
    __tablename__ = "email_verifications"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    email = Column(String, nullable=False)
    token = Column(String, unique=True, nullable=False)
    verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime)  # Token expires in 24 hours
    created_at = Column(DateTime, default=datetime.utcnow)
    attempts = Column(Integer, default=0)  # Failed verification attempts


class PhoneVerification(Base):
    """Phone verification via SMS OTP"""
    __tablename__ = "phone_verifications"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    phone_number = Column(String, nullable=False)
    otp_code = Column(String, nullable=False)
    verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime)  # OTP expires in 15 minutes
    created_at = Column(DateTime, default=datetime.utcnow)
    attempts = Column(Integer, default=0)


class BackgroundCheck(Base):
    """Provider background check tracking"""
    __tablename__ = "background_checks"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    
    # Check types
    criminal_record_checked = Column(Boolean, default=False)
    sex_offender_checked = Column(Boolean, default=False)
    sanctions_list_checked = Column(Boolean, default=False)
    
    # Results
    criminal_record_found = Column(Boolean, default=False)
    sex_offender_registered = Column(Boolean, default=False)
    sanctions_listed = Column(Boolean, default=False)
    
    # Reference
    check_provider = Column(String)  # "experian", "serco", etc
    external_reference = Column(String)
    
    # Timestamps
    requested_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime)  # Checks valid for 12 months
    
    # Status
    status = Column(String, default="pending")  # pending, completed, failed
    notes = Column(String, nullable=True)


class VerificationBadge(Base):
    """User verification status badge"""
    __tablename__ = "verification_badges"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    
    # Badge levels
    email_verified = Column(Boolean, default=False)
    phone_verified = Column(Boolean, default=False)
    age_verified = Column(Boolean, default=False)
    identity_verified = Column(Boolean, default=False)
    background_checked = Column(Boolean, default=False)
    
    # Overall verification level
    verification_level = Column(String, default="unverified")  # unverified, basic, standard, premium
    
    # Display
    show_badge = Column(Boolean, default=False)
    badge_type = Column(String, nullable=True)  # "verified", "premium", etc
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

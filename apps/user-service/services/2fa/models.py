"""
Two-Factor Authentication Service Models - SQLAlchemy models for 2FA functionality
Senior-level implementation with comprehensive 2FA features
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
import enum
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from base import Base

class TwoFactorMethod(str, enum.Enum):
    TOTP = "totp"  # Time-based One-Time Password (Google Authenticator, etc.)
    SMS = "sms"   # SMS-based verification
    EMAIL = "email"  # Email-based verification
    HARDWARE = "hardware"  # Hardware security keys (U2F/WebAuthn)
    BACKUP_CODE = "backup_code"  # Backup codes for recovery

class TwoFactorStatus(str, enum.Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    PENDING = "pending"  # Waiting for verification
    LOCKED = "locked"    # Temporarily locked due to failed attempts

class BackupCodeStatus(str, enum.Enum):
    UNUSED = "unused"
    USED = "used"
    EXPIRED = "expired"

class ChallengeStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    EXPIRED = "expired"
    FAILED = "failed"

class TwoFactorConfig(Base):
    """User's 2FA configuration"""
    __tablename__ = "two_factor_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True, index=True)
    primary_method = Column(Enum(TwoFactorMethod), nullable=True)
    backup_method = Column(Enum(TwoFactorMethod), nullable=True)
    status = Column(Enum(TwoFactorStatus), nullable=False, default=TwoFactorStatus.DISABLED)
    secret_key = Column(String(255), nullable=True)  # Encrypted TOTP secret
    recovery_email = Column(String(255), nullable=True)
    phone_number = Column(String(20), nullable=True)  # For SMS backup
    failed_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    challenges = relationship("TwoFactorChallenge", back_populates="config", cascade="all, delete-orphan")
    backup_codes = relationship("BackupCode", back_populates="config", cascade="all, delete-orphan")

    def is_locked(self) -> bool:
        """Check if account is temporarily locked"""
        if self.locked_until and datetime.utcnow() < self.locked_until:
            return True
        return False

    def can_attempt(self) -> bool:
        """Check if user can make another 2FA attempt"""
        return not self.is_locked() and self.failed_attempts < 5

    def increment_failures(self):
        """Increment failed attempts and lock if necessary"""
        self.failed_attempts += 1
        if self.failed_attempts >= 5:
            self.locked_until = datetime.utcnow() + timedelta(minutes=30)
        elif self.failed_attempts >= 3:
            self.locked_until = datetime.utcnow() + timedelta(minutes=5)

    def reset_failures(self):
        """Reset failed attempts on successful verification"""
        self.failed_attempts = 0
        self.locked_until = None
        self.last_verified_at = datetime.utcnow()

class TwoFactorChallenge(Base):
    """2FA verification challenge"""
    __tablename__ = "two_factor_challenges"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("two_factor_configs.id"), nullable=False)
    challenge_type = Column(Enum(TwoFactorMethod), nullable=False)
    challenge_code = Column(String(10), nullable=True)  # For TOTP/SMS codes
    challenge_token = Column(String(255), nullable=True)  # Unique token for challenge
    status = Column(Enum(ChallengeStatus), nullable=False, default=ChallengeStatus.PENDING)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)  # Additional challenge data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    config = relationship("TwoFactorConfig", back_populates="challenges")

    def is_expired(self) -> bool:
        """Check if challenge has expired"""
        return datetime.utcnow() > self.expires_at

    def can_verify(self) -> bool:
        """Check if challenge can still be verified"""
        return self.status == ChallengeStatus.PENDING and not self.is_expired()

class BackupCode(Base):
    """Backup codes for account recovery"""
    __tablename__ = "backup_codes"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("two_factor_configs.id"), nullable=False)
    code_hash = Column(String(255), nullable=False)  # Hashed backup code
    status = Column(Enum(BackupCodeStatus), nullable=False, default=BackupCodeStatus.UNUSED)
    used_at = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    config = relationship("TwoFactorConfig", back_populates="backup_codes")

class HardwareKey(Base):
    """Hardware security key registration (WebAuthn/U2F)"""
    __tablename__ = "hardware_keys"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("two_factor_configs.id"), nullable=False)
    key_id = Column(String(255), nullable=False, unique=True)
    public_key = Column(Text, nullable=False)  # WebAuthn public key
    key_type = Column(String(50), nullable=False)  # "u2f" or "webauthn"
    counter = Column(Integer, default=0)  # For U2F counter
    credential_id = Column(String(255), nullable=True)  # WebAuthn credential ID
    transports = Column(JSON, nullable=True)  # WebAuthn transports
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    config = relationship("TwoFactorConfig")

class TwoFactorAttempt(Base):
    """Log of all 2FA verification attempts"""
    __tablename__ = "two_factor_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    method = Column(Enum(TwoFactorMethod), nullable=False)
    success = Column(Boolean, nullable=False)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    failure_reason = Column(String(100), nullable=True)
    challenge_id = Column(Integer, ForeignKey("two_factor_challenges.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    challenge = relationship("TwoFactorChallenge")

class RecoveryRequest(Base):
    """Account recovery requests"""
    __tablename__ = "recovery_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    recovery_token = Column(String(255), nullable=False, unique=True)
    recovery_method = Column(Enum(TwoFactorMethod), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected, expired
    expires_at = Column(DateTime(timezone=True), nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def is_expired(self) -> bool:
        """Check if recovery request has expired"""
        return datetime.utcnow() > self.expires_at
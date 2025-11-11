"""
SMS Verification Service Models - SQLAlchemy models for SMS verification functionality
Senior-level implementation with comprehensive SMS verification features
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float, JSON, Index
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import enum
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from base import Base

class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    VERIFIED = "verified"
    EXPIRED = "expired"
    FAILED = "failed"
    CANCELLED = "cancelled"

class SMSProvider(str, enum.Enum):
    TWILIO = "twilio"
    AWS_SNS = "aws_sns"
    NEXMO = "nexmo"
    MESSAGEBIRD = "messagebird"
    TELNYX = "telnyx"

class MessageType(str, enum.Enum):
    VERIFICATION = "verification"
    NOTIFICATION = "notification"
    MARKETING = "marketing"
    TRANSACTIONAL = "transactional"

class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    UNDELIVERABLE = "undeliverable"
    UNKNOWN = "unknown"

class SMSProviderConfig(Base):
    """SMS provider configuration model"""
    __tablename__ = "sms_provider_configs"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(Enum(SMSProvider), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    api_key = Column(String(500), nullable=False)  # Encrypted in production
    api_secret = Column(String(500), nullable=True)  # Encrypted in production
    account_sid = Column(String(100), nullable=True)  # For Twilio
    phone_number = Column(String(20), nullable=True)  # Sender phone number
    region = Column(String(50), nullable=True)  # AWS region for SNS
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=1)  # Higher priority = preferred provider
    rate_limit_per_minute = Column(Integer, default=100)
    rate_limit_per_hour = Column(Integer, default=1000)
    rate_limit_per_day = Column(Integer, default=10000)
    cost_per_sms = Column(Float, default=0.01)  # Cost tracking
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    messages = relationship("SMSMessage", back_populates="provider_config")

    @validates('phone_number')
    def validate_phone_number(self, key, value):
        if value and not value.startswith('+'):
            raise ValueError("Phone number must start with +")
        return value

class SMSMessage(Base):
    """SMS message model"""
    __tablename__ = "sms_messages"

    id = Column(Integer, primary_key=True, index=True)
    provider_config_id = Column(Integer, ForeignKey("sms_provider_configs.id"), nullable=False)
    to_phone = Column(String(20), nullable=False, index=True)
    from_phone = Column(String(20), nullable=True)
    message = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), nullable=False, default=MessageType.VERIFICATION)
    delivery_status = Column(Enum(DeliveryStatus), nullable=False, default=DeliveryStatus.PENDING)
    provider_message_id = Column(String(255), nullable=True, index=True)
    cost = Column(Float, nullable=True)
    segments = Column(Integer, default=1)  # SMS segments used
    error_message = Column(Text, nullable=True)
    provider_response = Column(JSON, nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    provider_config = relationship("SMSProviderConfig", back_populates="messages")
    verification = relationship("SMSVerification", back_populates="message", uselist=False)

    __table_args__ = (
        Index('idx_sms_message_status_created', 'delivery_status', 'created_at'),
        Index('idx_sms_message_phone_status', 'to_phone', 'delivery_status'),
    )

class SMSVerification(Base):
    """SMS verification model"""
    __tablename__ = "sms_verifications"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("sms_messages.id"), nullable=False)
    verification_code = Column(String(10), nullable=False)  # Encrypted in production
    user_id = Column(Integer, nullable=True)  # Associated user ID
    purpose = Column(String(100), nullable=False)  # e.g., "phone_verification", "2fa", "password_reset"
    status = Column(Enum(VerificationStatus), nullable=False, default=VerificationStatus.PENDING)
    max_attempts = Column(Integer, default=3)
    attempts_used = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    user_agent = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)  # Additional verification data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("SMSMessage", back_populates="verification")

    def is_expired(self) -> bool:
        """Check if verification has expired"""
        return datetime.utcnow() > self.expires_at

    def can_attempt(self) -> bool:
        """Check if user can make another verification attempt"""
        return self.attempts_used < self.max_attempts and not self.is_expired()

    def increment_attempts(self):
        """Increment attempts counter"""
        self.attempts_used += 1
        if self.attempts_used >= self.max_attempts:
            self.status = VerificationStatus.FAILED

class PhoneNumberValidation(Base):
    """Phone number validation and formatting model"""
    __tablename__ = "phone_number_validations"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), nullable=False, unique=True, index=True)
    country_code = Column(String(5), nullable=True)
    national_number = Column(String(15), nullable=True)
    is_valid = Column(Boolean, default=False)
    is_mobile = Column(Boolean, nullable=True)
    carrier = Column(String(100), nullable=True)
    line_type = Column(String(50), nullable=True)  # mobile, landline, voip, etc.
    location = Column(String(100), nullable=True)
    validation_provider = Column(String(50), nullable=True)
    validated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SMSRateLimit(Base):
    """Rate limiting for SMS sending"""
    __tablename__ = "sms_rate_limits"

    id = Column(Integer, primary_key=True, index=True)
    identifier = Column(String(255), nullable=False, index=True)  # phone number or IP
    limit_type = Column(String(50), nullable=False)  # "phone", "ip", "user"
    window_start = Column(DateTime(timezone=True), nullable=False)
    window_end = Column(DateTime(timezone=True), nullable=False)
    request_count = Column(Integer, default=0)
    limit_value = Column(Integer, nullable=False)
    is_blocked = Column(Boolean, default=False)
    blocked_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index('idx_rate_limit_identifier_window', 'identifier', 'limit_type', 'window_start'),
    )

class SMSWebhookLog(Base):
    """Webhook logs from SMS providers"""
    __tablename__ = "sms_webhook_logs"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(Enum(SMSProvider), nullable=False)
    event_type = Column(String(50), nullable=False)  # "delivered", "failed", "bounce", etc.
    message_id = Column(String(255), nullable=True, index=True)
    provider_message_id = Column(String(255), nullable=True)
    payload = Column(JSON, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    processing_error = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class SMSAnalytics(Base):
    """SMS analytics and reporting"""
    __tablename__ = "sms_analytics"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    provider = Column(Enum(SMSProvider), nullable=True)
    message_type = Column(Enum(MessageType), nullable=True)
    total_sent = Column(Integer, default=0)
    total_delivered = Column(Integer, default=0)
    total_failed = Column(Integer, default=0)
    total_cost = Column(Float, default=0.0)
    average_delivery_time = Column(Float, nullable=True)  # in seconds
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        Index('idx_sms_analytics_date_provider', 'date', 'provider'),
    )
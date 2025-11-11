"""
SMS Verification Service Schemas - Pydantic schemas for SMS verification functionality
Senior-level implementation with comprehensive validation
"""

from pydantic import BaseModel, validator, root_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class VerificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    VERIFIED = "verified"
    EXPIRED = "expired"
    FAILED = "failed"
    CANCELLED = "cancelled"

class SMSProvider(str, Enum):
    TWILIO = "twilio"
    AWS_SNS = "aws_sns"
    NEXMO = "nexmo"
    MESSAGEBIRD = "messagebird"
    TELNYX = "telnyx"

class MessageType(str, Enum):
    VERIFICATION = "verification"
    NOTIFICATION = "notification"
    MARKETING = "marketing"
    TRANSACTIONAL = "transactional"

class DeliveryStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    UNDELIVERABLE = "undeliverable"
    UNKNOWN = "unknown"

# Base schemas
class SMSProviderConfigBase(BaseModel):
    provider: SMSProvider
    name: str
    api_key: str
    api_secret: Optional[str] = None
    account_sid: Optional[str] = None
    phone_number: Optional[str] = None
    region: Optional[str] = None
    is_active: bool = True
    priority: int = 1
    rate_limit_per_minute: int = 100
    rate_limit_per_hour: int = 1000
    rate_limit_per_day: int = 10000
    cost_per_sms: float = 0.01

    @validator('phone_number')
    def validate_phone_number(cls, v):
        if v and not v.startswith('+'):
            raise ValueError('Phone number must start with +')
        return v

class SMSProviderConfigCreate(SMSProviderConfigBase):
    pass

class SMSProviderConfigUpdate(BaseModel):
    name: Optional[str] = None
    api_key: Optional[str] = None
    api_secret: Optional[str] = None
    account_sid: Optional[str] = None
    phone_number: Optional[str] = None
    region: Optional[str] = None
    is_active: Optional[bool] = None
    priority: Optional[int] = None
    rate_limit_per_minute: Optional[int] = None
    rate_limit_per_hour: Optional[int] = None
    rate_limit_per_day: Optional[int] = None
    cost_per_sms: Optional[float] = None

class SMSProviderConfig(SMSProviderConfigBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class SMSMessageBase(BaseModel):
    to_phone: str
    message: str
    message_type: MessageType = MessageType.VERIFICATION
    from_phone: Optional[str] = None

class SMSMessageCreate(SMSMessageBase):
    provider_config_id: int

class SMSMessage(SMSMessageBase):
    id: int
    provider_config_id: int
    delivery_status: DeliveryStatus
    provider_message_id: Optional[str]
    cost: Optional[float]
    segments: int = 1
    error_message: Optional[str]
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    failed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class SMSVerificationBase(BaseModel):
    message_id: int
    user_id: Optional[int] = None
    purpose: str
    max_attempts: int = 3
    expires_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SMSVerificationCreate(SMSVerificationBase):
    pass

class SMSVerification(SMSVerificationBase):
    id: int
    verification_code: str
    status: VerificationStatus
    attempts_used: int = 0
    verified_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class PhoneNumberValidationBase(BaseModel):
    phone_number: str
    country_code: Optional[str] = None
    national_number: Optional[str] = None
    is_valid: bool = False
    is_mobile: Optional[bool] = None
    carrier: Optional[str] = None
    line_type: Optional[str] = None
    location: Optional[str] = None
    validation_provider: Optional[str] = None

class PhoneNumberValidationCreate(PhoneNumberValidationBase):
    pass

class PhoneNumberValidation(PhoneNumberValidationBase):
    id: int
    validated_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class SMSRateLimitBase(BaseModel):
    identifier: str
    limit_type: str
    window_start: datetime
    window_end: datetime
    limit_value: int

class SMSRateLimitCreate(SMSRateLimitBase):
    pass

class SMSRateLimit(SMSRateLimitBase):
    id: int
    request_count: int = 0
    is_blocked: bool = False
    blocked_until: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class SMSWebhookLogBase(BaseModel):
    provider: SMSProvider
    event_type: str
    message_id: Optional[str] = None
    provider_message_id: Optional[str] = None
    payload: Dict[str, Any]

class SMSWebhookLogCreate(SMSWebhookLogBase):
    pass

class SMSWebhookLog(SMSWebhookLogBase):
    id: int
    processed_at: Optional[datetime]
    processing_error: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class SMSAnalyticsBase(BaseModel):
    date: datetime
    provider: Optional[SMSProvider] = None
    message_type: Optional[MessageType] = None
    total_sent: int = 0
    total_delivered: int = 0
    total_failed: int = 0
    total_cost: float = 0.0
    average_delivery_time: Optional[float] = None

class SMSAnalyticsCreate(SMSAnalyticsBase):
    pass

class SMSAnalytics(SMSAnalyticsBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Request/Response schemas
class SendSMSRequest(BaseModel):
    to_phone: str
    message: str
    message_type: MessageType = MessageType.VERIFICATION
    provider: Optional[SMSProvider] = None

class SendVerificationRequest(BaseModel):
    phone_number: str
    purpose: str = "phone_verification"
    user_id: Optional[int] = None
    custom_message: Optional[str] = None
    expires_in_minutes: int = 10

class VerifyCodeRequest(BaseModel):
    verification_id: int
    code: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class ValidatePhoneRequest(BaseModel):
    phone_number: str
    validate_carrier: bool = False

class BulkSMSRequest(BaseModel):
    messages: List[SendSMSRequest]
    provider: Optional[SMSProvider] = None

# Analytics and reporting
class SMSStats(BaseModel):
    total_sent_today: int
    total_sent_this_week: int
    total_sent_this_month: int
    total_delivered_today: int
    total_failed_today: int
    total_cost_today: float
    average_delivery_rate: float
    most_used_provider: Optional[SMSProvider]
    top_failure_reasons: List[Dict[str, Any]]

class VerificationStats(BaseModel):
    total_verifications_today: int
    total_verified_today: int
    total_failed_today: int
    average_verification_time: Optional[float]
    verification_success_rate: float
    most_common_purposes: List[Dict[str, str]]

# API Response schemas
class PaginationParams(BaseModel):
    page: int = 1
    per_page: int = 20

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int

class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class SuccessResponse(APIResponse):
    success: bool = True

class ErrorResponse(APIResponse):
    success: bool = False
    error_code: Optional[str] = None

# Webhook schemas
class TwilioWebhook(BaseModel):
    MessageSid: str
    MessageStatus: str
    To: str
    From: str
    Body: str
    NumSegments: int

class AWSWebhook(BaseModel):
    notification: Dict[str, Any]

class GenericSMSWebhook(BaseModel):
    provider: SMSProvider
    event_type: str
    message_id: Optional[str]
    status: Optional[str]
    error_code: Optional[str]
    error_message: Optional[str]
    metadata: Optional[Dict[str, Any]]
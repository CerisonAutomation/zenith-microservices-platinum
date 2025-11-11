"""
Two-Factor Authentication Service Schemas - Pydantic schemas for 2FA functionality
Senior-level implementation with comprehensive validation
"""

from pydantic import BaseModel, EmailStr, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class TwoFactorMethod(str, Enum):
    TOTP = "totp"
    SMS = "sms"
    EMAIL = "email"
    HARDWARE = "hardware"
    BACKUP_CODE = "backup_code"

class TwoFactorStatus(str, Enum):
    ENABLED = "enabled"
    DISABLED = "disabled"
    PENDING = "pending"
    LOCKED = "locked"

class BackupCodeStatus(str, Enum):
    UNUSED = "unused"
    USED = "used"
    EXPIRED = "expired"

class ChallengeStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    EXPIRED = "expired"
    FAILED = "failed"

# Base schemas
class TwoFactorConfigBase(BaseModel):
    primary_method: Optional[TwoFactorMethod] = None
    backup_method: Optional[TwoFactorMethod] = None
    recovery_email: Optional[EmailStr] = None
    phone_number: Optional[str] = None

class TwoFactorConfigCreate(TwoFactorConfigBase):
    user_id: int

class TwoFactorConfigUpdate(BaseModel):
    primary_method: Optional[TwoFactorMethod] = None
    backup_method: Optional[TwoFactorMethod] = None
    recovery_email: Optional[EmailStr] = None
    phone_number: Optional[str] = None

class TwoFactorConfig(TwoFactorConfigBase):
    id: int
    user_id: int
    status: TwoFactorStatus
    failed_attempts: int = 0
    locked_until: Optional[datetime]
    last_verified_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class TwoFactorChallengeBase(BaseModel):
    challenge_type: TwoFactorMethod
    expires_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class TwoFactorChallengeCreate(TwoFactorChallengeBase):
    config_id: int

class TwoFactorChallenge(TwoFactorChallengeBase):
    id: int
    config_id: int
    challenge_code: Optional[str]
    challenge_token: str
    status: ChallengeStatus
    verified_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class BackupCodeBase(BaseModel):
    pass

class BackupCodeCreate(BackupCodeBase):
    config_id: int
    code: str  # Plain text code (will be hashed)

class BackupCode(BackupCodeBase):
    id: int
    config_id: int
    status: BackupCodeStatus
    used_at: Optional[datetime]
    ip_address: Optional[str]
    user_agent: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class HardwareKeyBase(BaseModel):
    key_id: str
    public_key: str
    key_type: str
    credential_id: Optional[str] = None
    transports: Optional[List[str]] = None

class HardwareKeyCreate(HardwareKeyBase):
    config_id: int

class HardwareKey(HardwareKeyBase):
    id: int
    config_id: int
    counter: int = 0
    last_used_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class TwoFactorAttemptBase(BaseModel):
    user_id: int
    method: TwoFactorMethod
    success: bool
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    failure_reason: Optional[str] = None

class TwoFactorAttemptCreate(TwoFactorAttemptBase):
    challenge_id: Optional[int] = None

class TwoFactorAttempt(TwoFactorAttemptBase):
    id: int
    challenge_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class RecoveryRequestBase(BaseModel):
    user_id: int
    recovery_method: TwoFactorMethod
    expires_at: datetime
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class RecoveryRequestCreate(RecoveryRequestBase):
    pass

class RecoveryRequest(RecoveryRequestBase):
    id: int
    recovery_token: str
    status: str
    approved_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

# Request/Response schemas
class SetupTOTPRequest(BaseModel):
    user_id: int

class SetupTOTPResponse(BaseModel):
    secret: str
    qr_code_url: str
    backup_codes: List[str]

class VerifyTOTPRequest(BaseModel):
    user_id: int
    code: str

class Enable2FARequest(BaseModel):
    user_id: int
    method: TwoFactorMethod
    verification_code: Optional[str] = None  # For TOTP verification during setup

class Disable2FARequest(BaseModel):
    user_id: int
    backup_code: Optional[str] = None  # For disabling without primary method

class ChallengeRequest(BaseModel):
    user_id: int
    method: TwoFactorMethod
    purpose: str = "login"  # login, action, etc.

class ChallengeResponse(BaseModel):
    challenge_id: int
    challenge_token: str
    expires_at: datetime
    method: TwoFactorMethod

class VerifyChallengeRequest(BaseModel):
    challenge_token: str
    code: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class VerifyChallengeResponse(BaseModel):
    success: bool
    user_id: int
    method: TwoFactorMethod

class GenerateBackupCodesRequest(BaseModel):
    user_id: int
    count: int = 10

class GenerateBackupCodesResponse(BaseModel):
    backup_codes: List[str]

class VerifyBackupCodeRequest(BaseModel):
    user_id: int
    code: str

class RecoveryRequestCreateRequest(BaseModel):
    user_id: int
    recovery_method: TwoFactorMethod

class RecoveryRequestResponse(BaseModel):
    recovery_token: str
    expires_at: datetime

class ApproveRecoveryRequest(BaseModel):
    recovery_token: str
    approval_code: str

# WebAuthn schemas
class WebAuthnRegistrationOptions(BaseModel):
    challenge: str
    rp: Dict[str, Any]
    user: Dict[str, Any]
    pubKeyCredParams: List[Dict[str, Any]]
    authenticatorSelection: Optional[Dict[str, Any]]
    timeout: Optional[int]
    extensions: Optional[Dict[str, Any]]

class WebAuthnCredential(BaseModel):
    id: str
    rawId: str
    type: str
    response: Dict[str, Any]

class WebAuthnRegistrationRequest(BaseModel):
    user_id: int
    credential: WebAuthnCredential

class WebAuthnAuthenticationOptions(BaseModel):
    challenge: str
    allowCredentials: List[Dict[str, Any]]
    timeout: Optional[int]
    extensions: Optional[Dict[str, Any]]

class WebAuthnAuthenticationRequest(BaseModel):
    user_id: int
    credential: WebAuthnCredential

# Analytics and reporting
class TwoFactorStats(BaseModel):
    total_users_with_2fa: int
    users_by_method: Dict[str, int]
    verification_attempts_today: int
    successful_verifications_today: int
    failed_verifications_today: int
    recovery_requests_today: int
    most_used_method: Optional[TwoFactorMethod]
    verification_success_rate: float

class UserTwoFactorStatus(BaseModel):
    user_id: int
    status: TwoFactorStatus
    primary_method: Optional[TwoFactorMethod]
    backup_method: Optional[TwoFactorMethod]
    last_verified_at: Optional[datetime]
    failed_attempts: int
    is_locked: bool

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
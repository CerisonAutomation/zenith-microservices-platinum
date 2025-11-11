"""
GDPR Compliance Schemas (Pydantic Models)
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ConsentTypeEnum(str, Enum):
    """Types of user consent"""
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    DATA_SHARING = "data_sharing"
    PROFILING = "profiling"
    THIRD_PARTY = "third_party"


class ConsentRequest(BaseModel):
    """Request to record consent"""
    consent_type: ConsentTypeEnum
    language: Optional[str] = "en"
    policy_version: Optional[str] = "1.0"


class ConsentLogResponse(BaseModel):
    """Single consent log entry"""
    type: str
    given: bool
    timestamp: datetime
    version: str


class ProcessingActivity(BaseModel):
    """Data processing activity with transparency"""
    purpose: str
    legal_basis: str
    data_categories: List[str]
    retention: str
    recipients: Optional[List[str]] = []
    consent_required: bool
    consent_given: Optional[bool] = None


class ConsentStatusResponse(BaseModel):
    """User's consent status for all activities"""
    consents: List[ConsentLogResponse]
    processing_activities: List[ProcessingActivity]


class DataSubjectAccessRequest(BaseModel):
    """Request for access to personal data"""
    reason: Optional[str] = None
    data_categories: Optional[List[str]] = None


class DataExportResponse(BaseModel):
    """Response for data export request"""
    status: str
    export_id: str
    message: str
    deadline: datetime


class AccountDeletionRequest(BaseModel):
    """Request account deletion"""
    password_confirmation: str
    reason: Optional[str] = None


class AccountDeletionResponse(BaseModel):
    """Account deletion confirmation"""
    status: str
    deletion_date: datetime
    message: str
    can_cancel_until: datetime


class DSARResponse(BaseModel):
    """Data Subject Access Request response"""
    status: str
    dsar_id: str
    deadline: datetime
    message: str


class AuditLogEntry(BaseModel):
    """Single audit log entry"""
    action: str
    resource_type: str
    timestamp: datetime
    actor: str
    status: str


class AuditLogResponse(BaseModel):
    """User's audit log"""
    audit_log: List[AuditLogEntry]


class BreachNotificationRequest(BaseModel):
    """Internal: Report a data breach"""
    breach_date: datetime
    affected_user_ids: List[str]
    data_categories: List[str]
    description: str
    cause: str


class DPATemplate(BaseModel):
    """Data Processing Agreement"""
    vendor_name: str
    jurisdiction: str
    contact_person: str
    contact_email: EmailStr
    signed_date: Optional[datetime] = None

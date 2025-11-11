from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SafetyReportCreate(BaseModel):
    reporter_id: str
    reported_user_id: str
    report_type: str
    description: str
    severity: Optional[str] = "medium"

class SafetyReportOut(BaseModel):
    id: int
    reporter_id: str
    reported_user_id: str
    report_type: str
    description: str
    status: str
    severity: str
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    admin_notes: Optional[str]

    class Config:
        orm_mode = True

class SafetyReportUpdate(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    admin_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None

class SafetyIncidentCreate(BaseModel):
    user_id: str
    incident_type: str
    description: str
    risk_score: Optional[float] = 0.0

class SafetyIncidentOut(BaseModel):
    id: int
    user_id: str
    incident_type: str
    description: str
    risk_score: float
    status: str
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        orm_mode = True

class BlockedUserCreate(BaseModel):
    blocker_id: str
    blocked_user_id: str
    reason: Optional[str] = None

class BlockedUserOut(BaseModel):
    id: int
    blocker_id: str
    blocked_user_id: str
    reason: Optional[str]
    created_at: datetime
    is_active: bool

    class Config:
        orm_mode = True

class SafetySettingCreate(BaseModel):
    user_id: str
    show_online_status: Optional[bool] = True
    allow_messages_from_strangers: Optional[bool] = False
    require_verification_for_bookings: Optional[bool] = True
    enable_two_factor: Optional[bool] = False
    share_location: Optional[bool] = False

class SafetySettingOut(BaseModel):
    id: int
    user_id: str
    show_online_status: bool
    allow_messages_from_strangers: bool
    require_verification_for_bookings: bool
    enable_two_factor: bool
    share_location: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class SafetySettingUpdate(BaseModel):
    show_online_status: Optional[bool] = None
    allow_messages_from_strangers: Optional[bool] = None
    require_verification_for_bookings: Optional[bool] = None
    enable_two_factor: Optional[bool] = None
    share_location: Optional[bool] = None
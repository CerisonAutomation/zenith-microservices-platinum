from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class AdminUserCreate(BaseModel):
    user_id: str
    role: str = "moderator"
    permissions: Optional[str] = None

class AdminUserOut(BaseModel):
    id: int
    user_id: str
    role: str
    permissions: Optional[str]
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]

    class Config:
        orm_mode = True

class AdminActionCreate(BaseModel):
    admin_id: int
    action_type: str
    target_type: str
    target_id: str
    description: str
    metadata: Optional[str] = None

class AdminActionOut(BaseModel):
    id: int
    admin_id: int
    action_type: str
    target_type: str
    target_id: str
    description: str
    metadata: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True

class SystemMetricCreate(BaseModel):
    metric_name: str
    metric_value: float
    metric_unit: Optional[str] = None
    category: str = "general"

class SystemMetricOut(BaseModel):
    id: int
    metric_name: str
    metric_value: float
    metric_unit: Optional[str]
    timestamp: datetime
    category: str

    class Config:
        orm_mode = True

class DashboardWidgetCreate(BaseModel):
    name: str
    title: str
    description: Optional[str] = None
    widget_type: str
    config: Optional[str] = None

class DashboardWidgetOut(BaseModel):
    id: int
    name: str
    title: str
    description: Optional[str]
    widget_type: str
    config: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    announcement_type: str = "info"
    target_audience: str = "all"
    expires_at: Optional[datetime] = None
    created_by: int

class AnnouncementOut(BaseModel):
    id: int
    title: str
    content: str
    announcement_type: str
    target_audience: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime]
    created_by: int

    class Config:
        orm_mode = True

class SystemSettingCreate(BaseModel):
    setting_key: str
    setting_value: str
    setting_type: str = "string"
    description: Optional[str] = None
    is_public: bool = False
    updated_by: int

class SystemSettingOut(BaseModel):
    id: int
    setting_key: str
    setting_value: str
    setting_type: str
    description: Optional[str]
    is_public: bool
    updated_at: datetime
    updated_by: int

    class Config:
        orm_mode = True

class SystemSettingUpdate(BaseModel):
    setting_value: Optional[str] = None
    setting_type: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None
    updated_by: int

# Dashboard data models
class DashboardStats(BaseModel):
    total_users: int
    active_users: int
    total_providers: int
    active_providers: int
    total_bookings: int
    pending_reports: int
    revenue_today: float
    revenue_month: float

class UserActivityData(BaseModel):
    date: str
    new_users: int
    active_users: int
    bookings: int

class RevenueData(BaseModel):
    date: str
    amount: float
    currency: str
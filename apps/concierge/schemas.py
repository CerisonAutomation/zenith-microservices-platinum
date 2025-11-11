from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class VIPServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "USD"
    category: str

class VIPServiceOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    currency: str
    category: str
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class VIPPackageCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "USD"
    duration_days: int
    services_included: Optional[str] = None

class VIPPackageOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    currency: str
    duration_days: int
    services_included: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class VIPSubscriptionCreate(BaseModel):
    user_id: str
    package_id: int
    expires_at: datetime
    auto_renew: bool = True

class VIPSubscriptionOut(BaseModel):
    id: int
    user_id: str
    package_id: int
    status: str
    started_at: datetime
    expires_at: datetime
    auto_renew: bool
    created_at: datetime

    class Config:
        orm_mode = True

class ConciergeRequestCreate(BaseModel):
    user_id: str
    request_type: str
    title: str
    description: str
    priority: Optional[str] = "normal"

class ConciergeRequestOut(BaseModel):
    id: int
    user_id: str
    request_type: str
    title: str
    description: str
    priority: str
    status: str
    assigned_concierge_id: Optional[str]
    estimated_completion: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]

    class Config:
        orm_mode = True

class ConciergeRequestUpdate(BaseModel):
    status: Optional[str] = None
    assigned_concierge_id: Optional[str] = None
    estimated_completion: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ConciergeMessageCreate(BaseModel):
    request_id: int
    sender_id: str
    recipient_id: str
    message: str
    message_type: Optional[str] = "text"

class ConciergeMessageOut(BaseModel):
    id: int
    request_id: int
    sender_id: str
    recipient_id: str
    message: str
    message_type: str
    is_read: bool
    created_at: datetime

    class Config:
        orm_mode = True
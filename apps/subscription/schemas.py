from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SubscriptionPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    currency: str = "USD"
    duration_days: int
    features: Optional[str] = None

class SubscriptionPlanOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    currency: str
    duration_days: int
    features: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True

class SubscriptionCreate(BaseModel):
    user_id: str
    plan: str
    amount: float
    currency: str = "USD"
    expires_at: datetime
    auto_renew: bool = True
    payment_method_id: Optional[str] = None

class SubscriptionOut(BaseModel):
    id: int
    user_id: str
    plan: str
    amount: float
    currency: str
    status: str
    started_at: datetime
    expires_at: datetime
    auto_renew: bool
    payment_method_id: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    auto_renew: Optional[bool] = None
    payment_method_id: Optional[str] = None

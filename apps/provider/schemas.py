from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, time

# Availability Schemas
class ProviderAvailabilityBase(BaseModel):
    date: date
    start_time: time
    end_time: time
    availability_type: str = "available"
    is_recurring: bool = False
    recurring_pattern: Optional[str] = None
    notes: Optional[str] = None

class ProviderAvailabilityCreate(ProviderAvailabilityBase):
    provider_id: str

class ProviderAvailabilityUpdate(BaseModel):
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    availability_type: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurring_pattern: Optional[str] = None
    notes: Optional[str] = None

class ProviderAvailabilityOut(ProviderAvailabilityBase):
    id: str
    provider_id: str
    booking_id: Optional[str]
    created_at: datetime
    updated_at: datetime

# Service Schemas
class ProviderServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    hourly_rate: float
    minimum_hours: int = 1
    maximum_hours: int = 24
    is_active: bool = True
    requires_deposit: bool = False
    deposit_percentage: float = 0.0

class ProviderServiceCreate(ProviderServiceBase):
    provider_id: str

class ProviderServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    hourly_rate: Optional[float] = None
    minimum_hours: Optional[int] = None
    maximum_hours: Optional[int] = None
    is_active: Optional[bool] = None
    requires_deposit: Optional[bool] = None
    deposit_percentage: Optional[float] = None

class ProviderServiceOut(ProviderServiceBase):
    id: str
    provider_id: str
    created_at: datetime
    updated_at: datetime

# Earnings Schemas
class ProviderEarningOut(BaseModel):
    id: str
    provider_id: str
    booking_id: str
    amount: float
    currency: str
    platform_fee: float
    net_amount: float
    payment_status: str
    payment_date: Optional[datetime]
    stripe_transfer_id: Optional[str]
    created_at: datetime
    updated_at: datetime

# Stats Schemas
class ProviderStatsOut(BaseModel):
    id: str
    provider_id: str
    total_earnings: float
    total_bookings: int
    completed_bookings: int
    cancelled_bookings: int
    average_rating: float
    total_reviews: int
    five_star_reviews: int
    four_star_reviews: int
    three_star_reviews: int
    two_star_reviews: int
    one_star_reviews: int
    average_response_time_minutes: float
    total_responses: int
    total_available_hours: float
    booked_hours: float
    created_at: datetime
    updated_at: datetime

# Calendar Settings Schemas
class ProviderCalendarSettingsBase(BaseModel):
    timezone: str = "UTC"
    working_hours_start: time = Field(default_factory=lambda: time(9, 0))
    working_hours_end: time = Field(default_factory=lambda: time(17, 0))
    working_days: List[str] = Field(default_factory=lambda: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"])
    advance_notice_hours: int = 24
    max_consecutive_hours: int = 8
    buffer_time_minutes: int = 30
    cancellation_policy: str = "flexible"
    cancellation_deadline_hours: int = 24

class ProviderCalendarSettingsCreate(ProviderCalendarSettingsBase):
    provider_id: str

class ProviderCalendarSettingsUpdate(BaseModel):
    timezone: Optional[str] = None
    working_hours_start: Optional[time] = None
    working_hours_end: Optional[time] = None
    working_days: Optional[List[str]] = None
    advance_notice_hours: Optional[int] = None
    max_consecutive_hours: Optional[int] = None
    buffer_time_minutes: Optional[int] = None
    cancellation_policy: Optional[str] = None
    cancellation_deadline_hours: Optional[int] = None

class ProviderCalendarSettingsOut(ProviderCalendarSettingsBase):
    id: str
    provider_id: str
    created_at: datetime
    updated_at: datetime

# Dashboard Schemas
class ProviderDashboardData(BaseModel):
    stats: ProviderStatsOut
    recent_bookings: List[Dict[str, Any]]
    upcoming_availability: List[ProviderAvailabilityOut]
    earnings_summary: Dict[str, Any]
    pending_reviews: int

class EarningsSummary(BaseModel):
    total_earned: float
    pending_payments: float
    paid_this_month: float
    paid_last_month: float
    currency: str

# Calendar View Schemas
class CalendarDay(BaseModel):
    date: date
    availability_slots: List[ProviderAvailabilityOut]
    booked_slots: List[Dict[str, Any]]  # Bookings with client info
    is_working_day: bool

class CalendarView(BaseModel):
    month: int
    year: int
    days: List[CalendarDay]
    settings: ProviderCalendarSettingsOut
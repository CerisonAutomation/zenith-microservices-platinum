"""
Newsletter Service Schemas - Pydantic schemas for newsletter functionality
Senior-level implementation with comprehensive validation
"""

from pydantic import BaseModel, EmailStr, Field, validator, root_validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class NewsletterStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    CANCELLED = "cancelled"

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    UNSUBSCRIBED = "unsubscribed"
    BOUNCED = "bounced"
    COMPLAINT = "complaint"

class CampaignType(str, Enum):
    NEWSLETTER = "newsletter"
    PROMOTIONAL = "promotional"
    ANNOUNCEMENT = "announcement"
    WELCOME = "welcome"
    REENGAGEMENT = "reengagement"

class SendStatus(str, Enum):
    PENDING = "pending"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"

class BounceType(str, Enum):
    HARD = "hard"
    SOFT = "soft"
    COMPLAINT = "complaint"

# Base schemas
class NewsletterTemplateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=3, max_length=255, pattern=r'^[a-z0-9-]+$')
    subject_template: str = Field(..., min_length=1, max_length=500)
    html_content: str = Field(..., min_length=1)
    text_content: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    is_active: bool = True
    is_default: bool = False

class NewsletterTemplateCreate(NewsletterTemplateBase):
    pass

class NewsletterTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=3, max_length=255, pattern=r'^[a-z0-9-]+$')
    subject_template: Optional[str] = Field(None, min_length=1, max_length=500)
    html_content: Optional[str] = Field(None, min_length=1)
    text_content: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None

class NewsletterTemplate(NewsletterTemplateBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class NewsletterBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=3, max_length=255, pattern=r'^[a-z0-9-]+$')
    subject: str = Field(..., min_length=1, max_length=500)
    html_content: str = Field(..., min_length=1)
    text_content: Optional[str] = None
    preview_text: Optional[str] = Field(None, max_length=160)
    campaign_type: CampaignType = CampaignType.NEWSLETTER
    template_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None

class NewsletterCreate(NewsletterBase):
    pass

class NewsletterUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=3, max_length=255, pattern=r'^[a-z0-9-]+$')
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    html_content: Optional[str] = Field(None, min_length=1)
    text_content: Optional[str] = None
    preview_text: Optional[str] = Field(None, max_length=160)
    campaign_type: Optional[CampaignType] = None
    template_id: Optional[int] = None
    scheduled_at: Optional[datetime] = None
    status: Optional[NewsletterStatus] = None

class Newsletter(NewsletterBase):
    id: int
    status: NewsletterStatus
    sent_at: Optional[datetime]
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    # Statistics
    total_recipients: int = 0
    sent_count: int = 0
    delivered_count: int = 0
    opened_count: int = 0
    clicked_count: int = 0
    bounced_count: int = 0
    complained_count: int = 0
    unsubscribed_count: int = 0

    # Performance metrics
    open_rate: float = 0.0
    click_rate: float = 0.0
    bounce_rate: float = 0.0
    unsubscribe_rate: float = 0.0

    class Config:
        from_attributes = True

class NewsletterWithDetails(Newsletter):
    template: Optional[NewsletterTemplate] = None
    segments: List['NewsletterSegment'] = []
    links: List['NewsletterLink'] = []

    class Config:
        from_attributes = True

class NewsletterSegmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=3, max_length=255, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = None
    criteria: Optional[Dict[str, Any]] = None
    is_dynamic: bool = True
    is_active: bool = True

class NewsletterSegmentCreate(NewsletterSegmentBase):
    pass

class NewsletterSegmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=3, max_length=255, pattern=r'^[a-z0-9-]+$')
    description: Optional[str] = None
    criteria: Optional[Dict[str, Any]] = None
    is_dynamic: Optional[bool] = None
    is_active: Optional[bool] = None

class NewsletterSegment(NewsletterSegmentBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]
    subscriber_count: int = 0
    last_calculated_at: Optional[datetime]

    class Config:
        from_attributes = True

class SubscriberBase(BaseModel):
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    subscription_source: Optional[str] = Field(None, max_length=100)
    preferences: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class SubscriberCreate(SubscriberBase):
    pass

class SubscriberUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    status: Optional[SubscriptionStatus] = None
    preferences: Optional[Dict[str, Any]] = None
    custom_fields: Optional[Dict[str, Any]] = None

class Subscriber(SubscriberBase):
    id: int
    status: SubscriptionStatus
    subscribed_at: datetime
    unsubscribed_at: Optional[datetime]
    confirmed_at: Optional[datetime]
    last_activity_at: Optional[datetime]
    bounce_count: int = 0
    last_bounce_at: Optional[datetime]
    complaint_count: int = 0
    last_complaint_at: Optional[datetime]

    class Config:
        from_attributes = True

class SubscriberWithDetails(Subscriber):
    segments: List[NewsletterSegment] = []

    class Config:
        from_attributes = True

class NewsletterSendBase(BaseModel):
    newsletter_id: int
    subscriber_id: int

class NewsletterSendCreate(NewsletterSendBase):
    pass

class NewsletterSend(NewsletterSendBase):
    id: int
    status: SendStatus
    sent_at: Optional[datetime]
    delivered_at: Optional[datetime]
    opened_at: Optional[datetime]
    first_opened_at: Optional[datetime]
    clicked_at: Optional[datetime]
    bounced_at: Optional[datetime]
    complaint_at: Optional[datetime]
    error_message: Optional[str]
    message_id: Optional[str]

    class Config:
        from_attributes = True

class NewsletterLinkBase(BaseModel):
    url: str = Field(..., max_length=2000)
    title: Optional[str] = Field(None, max_length=255)

class NewsletterLinkCreate(NewsletterLinkBase):
    newsletter_id: int

class NewsletterLink(NewsletterLinkBase):
    id: int
    newsletter_id: int
    click_count: int = 0
    unique_click_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class NewsletterClickBase(BaseModel):
    send_id: int
    link_id: int
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = None
    referrer: Optional[str] = Field(None, max_length=2000)

class NewsletterClickCreate(NewsletterClickBase):
    pass

class NewsletterClick(NewsletterClickBase):
    id: int
    clicked_at: datetime

    class Config:
        from_attributes = True

class SubscriberActivityBase(BaseModel):
    activity_type: str = Field(..., max_length=50)
    newsletter_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = None

class SubscriberActivityCreate(SubscriberActivityBase):
    subscriber_id: int

class SubscriberActivity(SubscriberActivityBase):
    id: int
    subscriber_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BounceEventBase(BaseModel):
    subscriber_id: int
    newsletter_id: Optional[int] = None
    bounce_type: BounceType
    bounce_reason: Optional[str] = Field(None, max_length=255)
    bounce_code: Optional[str] = Field(None, max_length=10)
    provider_message: Optional[str] = None
    raw_data: Optional[Dict[str, Any]] = None

class BounceEventCreate(BounceEventBase):
    pass

class BounceEvent(BounceEventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Search and filter schemas
class NewsletterSearchFilters(BaseModel):
    query: Optional[str] = None
    campaign_type: Optional[CampaignType] = None
    status: Optional[NewsletterStatus] = None
    created_by: Optional[int] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"

class SubscriberSearchFilters(BaseModel):
    query: Optional[str] = None
    status: Optional[SubscriptionStatus] = None
    segment_id: Optional[int] = None
    subscription_source: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = "subscribed_at"
    sort_order: str = "desc"

class SegmentSearchFilters(BaseModel):
    query: Optional[str] = None
    is_active: Optional[bool] = None
    is_dynamic: Optional[bool] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"

# Bulk operations
class BulkSubscriberUpdate(BaseModel):
    subscriber_ids: List[int]
    updates: SubscriberUpdate

class BulkNewsletterUpdate(BaseModel):
    newsletter_ids: List[int]
    updates: NewsletterUpdate

class BulkDeleteRequest(BaseModel):
    ids: List[int]

# Analytics and reporting
class NewsletterStats(BaseModel):
    newsletter_id: int
    total_recipients: int
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    bounced_count: int
    complained_count: int
    unsubscribed_count: int
    open_rate: float
    click_rate: float
    bounce_rate: float
    unsubscribe_rate: float

class SubscriberStats(BaseModel):
    total_subscribers: int
    active_subscribers: int
    pending_subscribers: int
    unsubscribed_count: int
    bounced_count: int
    complaint_count: int
    new_subscribers_today: int
    new_subscribers_this_week: int
    new_subscribers_this_month: int

class CampaignPerformance(BaseModel):
    campaign_type: CampaignType
    total_sent: int
    total_opened: int
    total_clicked: int
    average_open_rate: float
    average_click_rate: float
    best_performing_subject: Optional[str]
    worst_performing_subject: Optional[str]

# Subscription management
class SubscriptionRequest(BaseModel):
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    source: str = "website"
    preferences: Optional[Dict[str, Any]] = None

class UnsubscribeRequest(BaseModel):
    email: EmailStr
    reason: Optional[str] = None

class ConfirmSubscriptionRequest(BaseModel):
    token: str

# API Response schemas
class PaginationParams(BaseModel):
    page: int = Field(1, ge=1)
    per_page: int = Field(20, ge=1, le=100)

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
"""
Zenith Shared Types and Interfaces
Common types, interfaces, and utilities used across all services
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

# Common Enums
class UserRole(str, Enum):
    USER = "user"
    PREMIUM = "premium"
    ADMIN = "admin"
    MODERATOR = "moderator"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    BANNED = "banned"

class ContentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"
    DELETED = "deleted"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    SYSTEM = "system"

# Common Base Models
class TimestampedModel(BaseModel):
    """Base model with timestamp fields"""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AuditableModel(TimestampedModel):
    """Base model with audit fields"""
    created_by: Optional[str] = None
    updated_by: Optional[str] = None

# Common Response Models
class APIResponse(BaseModel):
    """Standard API response"""
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class PaginatedResponse(APIResponse):
    """Paginated API response"""
    total: int
    page: int
    per_page: int
    pages: int

class ErrorResponse(APIResponse):
    """Error response"""
    success: bool = False
    error_code: Optional[str] = None

# Common Request Models
class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)

class SortParams(BaseModel):
    """Sorting parameters"""
    sort_by: Optional[str] = None
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")

class FilterParams(BaseModel):
    """Common filter parameters"""
    search: Optional[str] = None
    status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None

# User-related shared models
class UserProfile(BaseModel):
    """Shared user profile model"""
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    is_verified: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None

# Content-related shared models
class ContentMetadata(BaseModel):
    """Shared content metadata"""
    id: str
    title: str
    description: Optional[str] = None
    status: ContentStatus = ContentStatus.DRAFT
    author_id: str
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

# Notification shared models
class NotificationData(BaseModel):
    """Shared notification data"""
    id: str
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool = False
    created_at: datetime

# Payment shared models
class PaymentData(BaseModel):
    """Shared payment data"""
    id: str
    user_id: str
    amount: float
    currency: str = "USD"
    status: PaymentStatus
    payment_method: str
    transaction_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

# Common utility functions
def generate_id() -> str:
    """Generate a unique ID"""
    import uuid
    return str(uuid.uuid4())

def get_current_timestamp() -> datetime:
    """Get current UTC timestamp"""
    return datetime.utcnow()

def format_datetime(dt: datetime) -> str:
    """Format datetime for API responses"""
    return dt.isoformat()

def validate_email(email: str) -> bool:
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_phone(phone: str) -> bool:
    """Basic phone validation"""
    import re
    pattern = r'^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$'
    return bool(re.match(pattern, phone))

# Constants
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
DEFAULT_CURRENCY = "USD"
SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"]

# Error messages
ERROR_MESSAGES = {
    "not_found": "Resource not found",
    "unauthorized": "Unauthorized access",
    "forbidden": "Access forbidden",
    "validation_error": "Validation error",
    "internal_error": "Internal server error",
    "rate_limit_exceeded": "Rate limit exceeded",
    "service_unavailable": "Service temporarily unavailable",
}
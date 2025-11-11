"""
Forum Service Schemas - Pydantic validation models
Senior-level implementation with comprehensive validation
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum

class ForumStatus(str, Enum):
    ACTIVE = "active"
    LOCKED = "locked"
    ARCHIVED = "archived"

class PostStatus(str, Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"
    DELETED = "deleted"

class ReportStatus(str, Enum):
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class ModerationAction(str, Enum):
    DELETE_TOPIC = "delete_topic"
    DELETE_POST = "delete_post"
    LOCK_TOPIC = "lock_topic"
    UNLOCK_TOPIC = "unlock_topic"
    PIN_TOPIC = "pin_topic"
    UNPIN_TOPIC = "unpin_topic"
    MOVE_TOPIC = "move_topic"
    BAN_USER = "ban_user"
    UNBAN_USER = "unban_user"
    EDIT_POST = "edit_post"

# Category Schemas
class ForumCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)

class ForumCategoryCreate(ForumCategoryBase):
    pass

class ForumCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class ForumCategoryResponse(ForumCategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Forum Schemas
class ForumBase(BaseModel):
    category_id: int = Field(..., gt=0)
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)
    is_locked: bool = Field(default=False)
    requires_moderation: bool = Field(default=False)

    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Forum name cannot be empty or whitespace')
        return v.strip()

class ForumCreate(ForumBase):
    pass

class ForumUpdate(BaseModel):
    category_id: Optional[int] = Field(None, gt=0)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    is_locked: Optional[bool] = None
    requires_moderation: Optional[bool] = None

class ForumResponse(ForumBase):
    id: int
    slug: str
    topic_count: int
    post_count: int
    last_post_at: Optional[datetime]
    last_post_user_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Topic Schemas
class ForumTopicBase(BaseModel):
    forum_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1, max_length=50000)  # First post content

    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Topic title cannot be empty or whitespace')
        return v.strip()

    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Topic content cannot be empty or whitespace')
        return v.strip()

class ForumTopicCreate(ForumTopicBase):
    pass

class ForumTopicUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    is_locked: Optional[bool] = None

class ForumTopicResponse(ForumTopicBase):
    id: int
    slug: str
    author_id: int
    author_username: str
    is_pinned: bool
    is_locked: bool
    is_approved: bool
    view_count: int
    post_count: int
    last_post_at: datetime
    last_post_user_id: int
    last_post_username: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Post Schemas
class ForumPostBase(BaseModel):
    topic_id: int = Field(..., gt=0)
    content: str = Field(..., min_length=1, max_length=50000)

    @validator('content')
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Post content cannot be empty or whitespace')
        return v.strip()

class ForumPostCreate(ForumPostBase):
    pass

class ForumPostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=50000)

class ForumPostResponse(ForumPostBase):
    id: int
    author_id: int
    author_username: str
    is_approved: bool
    is_edited: bool
    edited_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Moderation Schemas
class ForumModerationAction(BaseModel):
    action_type: ModerationAction
    entity_type: str = Field(pattern=r'^(topic|post|user)$')
    entity_id: int = Field(gt=0)
    reason: Optional[str] = Field(None, max_length=500)

class ForumModerationLogResponse(BaseModel):
    id: int
    moderator_id: int
    moderator_username: str
    action_type: str
    entity_type: str
    entity_id: int
    forum_id: Optional[int]
    topic_id: Optional[int]
    reason: Optional[str]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Report Schemas
class ForumReportCreate(BaseModel):
    entity_type: str = Field(pattern=r'^(topic|post|user)$')
    entity_id: int = Field(gt=0)
    reason: str = Field(min_length=1, max_length=100)
    description: str = Field(min_length=1, max_length=2000)

class ForumReportUpdate(BaseModel):
    status: ReportStatus
    moderator_notes: Optional[str] = Field(None, max_length=2000)

class ForumReportResponse(BaseModel):
    id: int
    reporter_id: int
    reporter_username: str
    entity_type: str
    entity_id: int
    entity_title: str
    reason: str
    description: str
    status: ReportStatus
    moderator_id: Optional[int]
    moderator_notes: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Search and Filter Schemas
class ForumSearchFilters(BaseModel):
    query: Optional[str] = None
    category_id: Optional[int] = None
    forum_id: Optional[int] = None
    author_id: Optional[int] = None
    status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = "updated_at"
    sort_order: str = "desc"
    page: int = 1
    limit: int = 20

# Statistics Schemas
class ForumStatistics(BaseModel):
    total_categories: int
    total_forums: int
    total_topics: int
    total_posts: int
    total_users: int
    topics_today: int
    posts_today: int
    active_users_today: int
    most_active_forum: Optional[dict]
    latest_topics: List[dict]
    popular_topics: List[dict]

# Bulk Operations Schemas
class BulkModerationRequest(BaseModel):
    action_type: ModerationAction
    entity_ids: List[int] = Field(min_length=1, max_length=50)
    reason: Optional[str] = Field(None, max_length=500)

class BulkModerationResponse(BaseModel):
    success_count: int
    failure_count: int
    failures: List[dict]  # List of {entity_id, error_message}

# Pagination Response
from typing import Generic, TypeVar
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool
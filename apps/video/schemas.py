"""
Video Service Schemas - Pydantic validation models
Senior-level implementation with comprehensive validation
"""

from datetime import datetime
from typing import Optional, List, Generic, TypeVar
from pydantic import BaseModel, Field, validator
from enum import Enum

class VideoStatus(str, Enum):
    PROCESSING = "processing"
    PUBLISHED = "published"
    FAILED = "failed"
    DELETED = "deleted"

class VideoCommentStatus(str, Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"

class VideoReportStatus(str, Enum):
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class VideoResolution(str, Enum):
    P240 = "240p"
    P360 = "360p"
    P480 = "480p"
    P720 = "720p"
    P1080 = "1080p"
    P1440 = "1440p"
    P2160 = "2160p"

# Category Schemas
class VideoCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)
    thumbnail_url: Optional[str] = Field(None, max_length=500)

class VideoCategoryCreate(VideoCategoryBase):
    pass

class VideoCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    thumbnail_url: Optional[str] = Field(None, max_length=500)

class VideoCategoryResponse(VideoCategoryBase):
    id: int
    video_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Video Schemas
class VideoBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=220)
    description: Optional[str] = Field(None, max_length=5000)
    video_url: str = Field(..., min_length=1, max_length=500)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    duration: Optional[int] = Field(None, gt=0)
    file_size: Optional[int] = Field(None, gt=0)
    mime_type: Optional[str] = Field(None, max_length=100)
    resolution: Optional[VideoResolution] = None
    bitrate: Optional[int] = Field(None, gt=0)
    category_id: int = Field(..., gt=0)
    status: VideoStatus = Field(default=VideoStatus.PROCESSING)
    is_featured: bool = Field(default=False)
    is_private: bool = Field(default=False)
    allow_comments: bool = Field(default=True)
    allow_ratings: bool = Field(default=True)
    published_at: Optional[datetime] = None

    @validator('slug')
    def validate_slug(cls, v):
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug must contain only letters, numbers, hyphens, and underscores')
        return v.lower()

    @validator('published_at')
    def validate_published_at(cls, v, values):
        if v and values.get('status') == VideoStatus.PROCESSING:
            raise ValueError('Cannot set published_at for processing videos')
        return v

class VideoCreate(VideoBase):
    author_id: int = Field(..., gt=0)

class VideoUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=220)
    description: Optional[str] = Field(None, max_length=5000)
    video_url: Optional[str] = Field(None, min_length=1, max_length=500)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    duration: Optional[int] = Field(None, gt=0)
    file_size: Optional[int] = Field(None, gt=0)
    mime_type: Optional[str] = Field(None, max_length=100)
    resolution: Optional[VideoResolution] = None
    bitrate: Optional[int] = Field(None, gt=0)
    category_id: Optional[int] = Field(None, gt=0)
    status: Optional[VideoStatus] = None
    is_featured: Optional[bool] = None
    is_private: Optional[bool] = None
    allow_comments: Optional[bool] = None
    allow_ratings: Optional[bool] = None
    published_at: Optional[datetime] = None

class VideoResponse(VideoBase):
    id: int
    author_id: int
    view_count: int
    like_count: int
    dislike_count: int
    comment_count: int
    average_rating: Optional[float]
    total_ratings: int
    processing_progress: Optional[float]
    processing_error: Optional[str]
    category: VideoCategoryResponse
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Comment Schemas
class VideoCommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[int] = Field(None, gt=0)

class VideoCommentCreate(VideoCommentBase):
    author_id: int = Field(..., gt=0)
    author_name: str = Field(..., min_length=1, max_length=100)
    author_email: Optional[str] = Field(None, pattern=r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')

class VideoCommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    status: Optional[VideoCommentStatus] = None

class VideoCommentResponse(VideoCommentBase):
    id: int
    video_id: int
    author_id: int
    author_name: str
    author_email: Optional[str]
    status: VideoCommentStatus
    is_edited: bool
    edited_at: Optional[datetime]
    replies: List['VideoCommentResponse'] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Rating Schemas
class VideoRatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = Field(None, max_length=1000)

class VideoRatingUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review: Optional[str] = Field(None, max_length=1000)

class VideoRatingResponse(BaseModel):
    id: int
    video_id: int
    user_id: int
    rating: int
    review: Optional[str]
    is_helpful: Optional[bool]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Like Schemas
class VideoLikeCreate(BaseModel):
    is_like: bool = Field(...)  # True for like, False for dislike

class VideoLikeResponse(BaseModel):
    id: int
    video_id: int
    user_id: int
    is_like: bool
    created_at: datetime

    class Config:
        from_attributes = True

# View Schemas
class VideoViewCreate(BaseModel):
    watch_time: Optional[int] = Field(None, ge=0)
    completion_rate: Optional[float] = Field(None, ge=0, le=100)

class VideoViewResponse(BaseModel):
    id: int
    video_id: int
    user_id: Optional[int]
    watch_time: Optional[int]
    completion_rate: Optional[float]
    viewed_at: datetime

    class Config:
        from_attributes = True

# Playlist Schemas
class PlaylistBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=220)
    description: Optional[str] = Field(None, max_length=1000)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    is_public: bool = Field(default=True)
    is_featured: bool = Field(default=False)

class PlaylistCreate(PlaylistBase):
    author_id: int = Field(..., gt=0)
    video_ids: List[int] = Field(default_factory=list)

class PlaylistUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=220)
    description: Optional[str] = Field(None, max_length=1000)
    thumbnail_url: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None
    is_featured: Optional[bool] = None
    video_ids: Optional[List[int]] = None

class PlaylistResponse(PlaylistBase):
    id: int
    author_id: int
    video_count: int
    total_duration: int
    view_count: int
    like_count: int
    videos: List[dict] = Field(default_factory=list)  # Simplified video info
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Report Schemas
class VideoReportCreate(BaseModel):
    reason: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

class VideoReportUpdate(BaseModel):
    status: Optional[VideoReportStatus] = None
    moderator_notes: Optional[str] = Field(None, max_length=1000)

class VideoReportResponse(BaseModel):
    id: int
    video_id: int
    reporter_id: int
    reason: str
    description: Optional[str]
    status: VideoReportStatus
    moderator_id: Optional[int]
    moderator_notes: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Search and Filter Schemas
class VideoSearchFilters(BaseModel):
    query: Optional[str] = None
    category_id: Optional[int] = None
    author_id: Optional[int] = None
    status: Optional[VideoStatus] = None
    is_featured: Optional[bool] = None
    is_private: Optional[bool] = None
    min_duration: Optional[int] = None
    max_duration: Optional[int] = None
    resolution: Optional[VideoResolution] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = 1
    limit: int = 20

# Statistics Schemas
class VideoStatistics(BaseModel):
    total_videos: int
    total_categories: int
    total_views: int
    total_likes: int
    total_comments: int
    total_duration: int
    videos_this_month: int
    views_this_month: int
    popular_videos: List[dict]
    recent_videos: List[dict]
    top_categories: List[dict]
    processing_stats: dict

# Upload Schemas
class VideoUploadResponse(BaseModel):
    upload_url: str
    video_id: int
    fields: dict = Field(default_factory=dict)

class VideoProcessingStatus(BaseModel):
    video_id: int
    status: VideoStatus
    progress: Optional[float]
    error: Optional[str]
    estimated_time: Optional[int]  # seconds

# Pagination Response
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool

# Bulk Operations Schemas
class BulkVideoOperation(BaseModel):
    video_ids: List[int] = Field(min_length=1, max_length=50)
    operation: str = Field(..., pattern=r'^(publish|unpublish|delete|feature|unfeature)$')

class BulkCommentModeration(BaseModel):
    comment_ids: List[int] = Field(min_length=1, max_length=50)
    action: str = Field(..., pattern=r'^(approve|reject|delete)$')

# Streaming Schemas
class VideoStreamInfo(BaseModel):
    video_id: int
    title: str
    duration: int
    resolution: str
    bitrate: int
    stream_url: str
    thumbnail_url: Optional[str]
    subtitles: List[dict] = Field(default_factory=list)

class VideoWatchProgress(BaseModel):
    video_id: int
    user_id: int
    current_time: int
    total_duration: int
    completion_rate: float
    last_watched: datetime
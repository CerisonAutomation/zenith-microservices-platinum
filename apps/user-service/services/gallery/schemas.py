"""
Gallery Service Schemas - Pydantic models for validation and serialization
Senior-level implementation with comprehensive validation and enums
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field, validator, EmailStr, HttpUrl, field_validator
from pydantic.types import PositiveInt, NonNegativeInt
from typing import Annotated, List, Optional, Dict, Any
import re

class GalleryCategoryStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class AlbumStatus(str, Enum):
    PUBLISHED = "published"
    DRAFT = "draft"
    PRIVATE = "private"
    DELETED = "deleted"

class PhotoStatus(str, Enum):
    PUBLISHED = "published"
    PROCESSING = "processing"
    FAILED = "failed"
    DELETED = "deleted"

class CommentStatus(str, Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"

class ReportStatus(str, Enum):
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class ReportReason(str, Enum):
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    SPAM = "spam"
    HARASSMENT = "harassment"
    VIOLENCE = "violence"
    HATE_SPEECH = "hate_speech"
    COPYRIGHT_VIOLATION = "copyright_violation"
    OTHER = "other"

# Base schemas
class GalleryCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    slug: str = Field(..., min_length=1, max_length=120, description="URL-friendly slug")
    description: Optional[str] = Field(None, max_length=1000, description="Category description")
    display_order: NonNegativeInt = Field(default=0, description="Display order for sorting")
    is_active: bool = Field(default=True, description="Whether category is active")
    thumbnail_url: Optional[HttpUrl] = Field(None, description="Category thumbnail URL")

class GalleryCategoryCreate(GalleryCategoryBase):
    pass

class GalleryCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=1000)
    display_order: Optional[NonNegativeInt] = None
    is_active: Optional[bool] = None
    thumbnail_url: Optional[HttpUrl] = None

class GalleryCategory(GalleryCategoryBase):
    id: int
    album_count: NonNegativeInt = Field(default=0)
    photo_count: NonNegativeInt = Field(default=0)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GalleryCategoryWithAlbums(GalleryCategory):
    albums: List["AlbumSummary"] = []

# Album schemas
class AlbumBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Album title")
    slug: str = Field(..., min_length=1, max_length=220, description="URL-friendly slug")
    description: Optional[str] = Field(None, max_length=2000, description="Album description")
    cover_photo_url: Optional[HttpUrl] = Field(None, description="Cover photo URL")
    category_id: PositiveInt = Field(..., description="Category ID")
    status: AlbumStatus = Field(default=AlbumStatus.PUBLISHED, description="Album status")
    is_featured: bool = Field(default=False, description="Whether album is featured")
    allow_comments: bool = Field(default=True, description="Whether comments are allowed")
    allow_ratings: bool = Field(default=True, description="Whether ratings are allowed")

class AlbumCreate(AlbumBase):
    pass

class AlbumUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=220)
    description: Optional[str] = Field(None, max_length=2000)
    cover_photo_url: Optional[HttpUrl] = None
    category_id: Optional[PositiveInt] = None
    status: Optional[AlbumStatus] = None
    is_featured: Optional[bool] = None
    allow_comments: Optional[bool] = None
    allow_ratings: Optional[bool] = None

class AlbumSummary(BaseModel):
    id: int
    title: str
    slug: str
    cover_photo_url: Optional[str]
    author_id: int
    category_id: int
    status: AlbumStatus
    is_featured: bool
    view_count: NonNegativeInt
    like_count: NonNegativeInt
    comment_count: NonNegativeInt
    photo_count: NonNegativeInt
    average_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Average rating 0-5")
    created_at: datetime

    class Config:
        from_attributes = True

class Album(AlbumSummary):
    description: Optional[str]
    allow_comments: bool
    allow_ratings: bool
    total_ratings: NonNegativeInt
    updated_at: datetime

class AlbumWithPhotos(Album):
    category: GalleryCategory
    photos: List["PhotoSummary"] = []
    comments: List["AlbumComment"] = []

# Photo schemas
class PhotoBase(BaseModel):
    title: Optional[str] = Field(None, max_length=200, description="Photo title")
    description: Optional[str] = Field(None, max_length=2000, description="Photo description")
    album_id: PositiveInt = Field(..., description="Album ID")
    allow_comments: bool = Field(default=True, description="Whether comments are allowed")

class PhotoCreate(PhotoBase):
    image_data: str = Field(..., description="Base64 encoded image data")
    filename: str = Field(..., description="Original filename")

class PhotoUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    album_id: Optional[PositiveInt] = None
    allow_comments: Optional[bool] = None

class PhotoSummary(BaseModel):
    id: int
    title: Optional[str]
    image_url: str
    thumbnail_url: Optional[str]
    medium_url: Optional[str]
    large_url: Optional[str]
    width: Optional[PositiveInt]
    height: Optional[PositiveInt]
    album_id: int
    author_id: int
    status: PhotoStatus
    is_featured: bool
    view_count: NonNegativeInt
    like_count: NonNegativeInt
    photo_count: NonNegativeInt
    average_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Average rating 0-5")
    created_at: datetime

    class Config:
        from_attributes = True

class Photo(PhotoSummary):
    description: Optional[str]
    file_size: Optional[PositiveInt]
    mime_type: Optional[str]
    allow_comments: bool
    total_ratings: NonNegativeInt
    processing_progress: Optional[float] = Field(default=None, ge=0, le=100, description="Processing progress 0-100")
    processing_error: Optional[str]
    taken_at: Optional[datetime]
    location: Optional[str]
    camera_make: Optional[str]
    camera_model: Optional[str]
    updated_at: datetime

class PhotoWithDetails(Photo):
    album: AlbumSummary
    tags: List["PhotoTag"] = []
    comments: List["PhotoComment"] = []

# Tag schemas
class PhotoTagBase(BaseModel):
    tag_name: str = Field(..., min_length=1, max_length=50, description="Tag name")
    confidence: Optional[float] = Field(default=None, ge=0, le=1, description="AI confidence score")
    is_ai_generated: bool = Field(default=False, description="Whether tag was AI-generated")

class PhotoTagCreate(PhotoTagBase):
    photo_id: PositiveInt = Field(..., description="Photo ID")

class PhotoTag(PhotoTagBase):
    id: int
    photo_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Comment schemas
class AlbumCommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Comment content")
    parent_id: Optional[PositiveInt] = Field(None, description="Parent comment ID for replies")

class AlbumCommentCreate(AlbumCommentBase):
    album_id: PositiveInt = Field(..., description="Album ID")

class AlbumCommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)

class AlbumComment(AlbumCommentBase):
    id: int
    album_id: int
    author_id: int
    author_name: str
    author_email: Optional[EmailStr]
    status: CommentStatus
    is_edited: bool
    edited_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    replies: List["AlbumComment"] = []

    class Config:
        from_attributes = True

class PhotoCommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Comment content")
    parent_id: Optional[PositiveInt] = Field(None, description="Parent comment ID for replies")

class PhotoCommentCreate(PhotoCommentBase):
    photo_id: PositiveInt = Field(..., description="Photo ID")

class PhotoCommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)

class PhotoComment(PhotoCommentBase):
    id: int
    photo_id: int
    author_id: int
    author_name: str
    author_email: Optional[EmailStr]
    status: CommentStatus
    is_edited: bool
    edited_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    replies: List["PhotoComment"] = []

    class Config:
        from_attributes = True

# Rating schemas
class AlbumRatingBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating value 1-5")
    review: Optional[str] = Field(None, max_length=1000, description="Optional review text")

class AlbumRatingCreate(AlbumRatingBase):
    album_id: PositiveInt = Field(..., description="Album ID")

class AlbumRating(AlbumRatingBase):
    id: int
    album_id: int
    user_id: int
    is_helpful: Optional[bool]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PhotoRatingBase(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Rating value 1-5")
    review: Optional[str] = Field(None, max_length=1000, description="Optional review text")

class PhotoRatingCreate(PhotoRatingBase):
    photo_id: PositiveInt = Field(..., description="Photo ID")

class PhotoRating(PhotoRatingBase):
    id: int
    photo_id: int
    user_id: int
    is_helpful: Optional[bool]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Like schemas
class AlbumLikeCreate(BaseModel):
    album_id: PositiveInt = Field(..., description="Album ID")
    is_like: bool = Field(..., description="True for like, False for dislike")

class AlbumLike(BaseModel):
    id: int
    album_id: int
    user_id: int
    is_like: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PhotoLikeCreate(BaseModel):
    photo_id: PositiveInt = Field(..., description="Photo ID")
    is_like: bool = Field(..., description="True for like, False for dislike")

class PhotoLike(BaseModel):
    id: int
    photo_id: int
    user_id: int
    is_like: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Report schemas
class PhotoReportBase(BaseModel):
    reason: ReportReason = Field(..., description="Report reason")
    description: Optional[str] = Field(None, max_length=1000, description="Additional description")

class PhotoReportCreate(PhotoReportBase):
    photo_id: PositiveInt = Field(..., description="Photo ID")

class PhotoReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    moderator_notes: Optional[str] = Field(None, max_length=2000)

class PhotoReport(PhotoReportBase):
    id: int
    photo_id: int
    reporter_id: int
    status: ReportStatus
    moderator_id: Optional[int]
    moderator_notes: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# View tracking schemas
class PhotoViewCreate(BaseModel):
    photo_id: PositiveInt = Field(..., description="Photo ID")

class PhotoView(BaseModel):
    id: int
    photo_id: int
    user_id: Optional[int]
    ip_address: str
    viewed_at: datetime

    class Config:
        from_attributes = True

# Statistics schemas
class GalleryStats(BaseModel):
    total_categories: NonNegativeInt
    total_albums: NonNegativeInt
    total_photos: NonNegativeInt
    total_views: NonNegativeInt
    total_likes: NonNegativeInt
    total_comments: NonNegativeInt
    total_ratings: NonNegativeInt
    average_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Average rating 0-5")

class CategoryStats(BaseModel):
    category_id: int
    album_count: NonNegativeInt
    photo_count: NonNegativeInt
    view_count: NonNegativeInt
    like_count: NonNegativeInt
    comment_count: NonNegativeInt
    average_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Average rating 0-5")

class AlbumStats(BaseModel):
    album_id: int
    photo_count: NonNegativeInt
    view_count: NonNegativeInt
    like_count: NonNegativeInt
    comment_count: NonNegativeInt
    rating_count: NonNegativeInt
    average_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Average rating 0-5")

class PhotoStats(BaseModel):
    photo_id: int
    view_count: NonNegativeInt
    like_count: NonNegativeInt
    comment_count: NonNegativeInt
    rating_count: NonNegativeInt
    average_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Average rating 0-5")

# Bulk operation schemas
class BulkAlbumUpdate(BaseModel):
    album_ids: List[PositiveInt] = Field(min_length=1, max_length=100, description="Album IDs to update")
    updates: AlbumUpdate

class BulkPhotoUpdate(BaseModel):
    photo_ids: List[PositiveInt] = Field(min_length=1, max_length=100, description="Photo IDs to update")
    updates: PhotoUpdate

class BulkDeleteRequest(BaseModel):
    ids: List[PositiveInt] = Field(min_length=1, max_length=100, description="IDs to delete")

# Search and filter schemas
class GallerySearchFilters(BaseModel):
    query: Optional[str] = Field(None, max_length=100, description="Search query")
    category_id: Optional[PositiveInt] = None
    author_id: Optional[PositiveInt] = None
    status: Optional[AlbumStatus] = None
    is_featured: Optional[bool] = None
    min_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Minimum rating filter")
    max_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Maximum rating filter")
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")

class PhotoSearchFilters(BaseModel):
    query: Optional[str] = Field(None, max_length=100, description="Search query")
    album_id: Optional[PositiveInt] = None
    author_id: Optional[PositiveInt] = None
    status: Optional[PhotoStatus] = None
    is_featured: Optional[bool] = None
    tags: Optional[List[str]] = Field(default=None, max_length=10, description="Tag names to filter by")
    min_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Minimum rating filter")
    max_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Maximum rating filter")
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = Field(default="created_at", description="Sort field")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")

# Pagination schemas
class PaginationParams(BaseModel):
    page: PositiveInt = Field(default=1, description="Page number")
    per_page: conint(ge=1, le=100) = Field(default=20, description="Items per page")

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: NonNegativeInt
    page: PositiveInt
    per_page: PositiveInt
    pages: PositiveInt

# API response schemas
class APIResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[List[str]] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: List[str]

class SuccessResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None

# Update forward references
GalleryCategoryWithAlbums.update_forward_refs()
AlbumWithPhotos.update_forward_refs()
PhotoWithDetails.update_forward_refs()
AlbumComment.update_forward_refs()
PhotoComment.update_forward_refs()
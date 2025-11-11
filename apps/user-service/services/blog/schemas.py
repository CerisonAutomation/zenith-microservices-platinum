"""
Blog Service Schemas - Pydantic validation models
Senior-level implementation with comprehensive validation
"""

from datetime import datetime
from typing import Optional, List, Generic, TypeVar
from pydantic import BaseModel, Field, validator
from enum import Enum

class BlogPostStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class BlogCommentStatus(str, Enum):
    APPROVED = "approved"
    PENDING = "pending"
    REJECTED = "rejected"

# Category Schemas
class BlogCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = Field(default=True)

class BlogCategoryCreate(BlogCategoryBase):
    pass

class BlogCategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = Field(None, max_length=500)
    display_order: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None

class BlogCategoryResponse(BlogCategoryBase):
    id: int
    post_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Tag Schemas
class BlogTagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    slug: str = Field(..., min_length=1, max_length=60)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')

class BlogTagCreate(BlogTagBase):
    pass

class BlogTagUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    slug: Optional[str] = Field(None, min_length=1, max_length=60)
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')

class BlogTagResponse(BlogTagBase):
    id: int
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# Post Schemas
class BlogPostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=220)
    excerpt: Optional[str] = Field(None, max_length=300)
    content: str = Field(..., min_length=1)
    content_html: Optional[str] = None
    featured_image_url: Optional[str] = Field(None, max_length=500)
    category_id: int = Field(..., gt=0)
    status: BlogPostStatus = Field(default=BlogPostStatus.DRAFT)
    is_featured: bool = Field(default=False)
    is_pinned: bool = Field(default=False)
    allow_comments: bool = Field(default=True)
    published_at: Optional[datetime] = None

    @validator('slug')
    def validate_slug(cls, v):
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Slug must contain only letters, numbers, hyphens, and underscores')
        return v.lower()

    @validator('published_at')
    def validate_published_at(cls, v, values):
        if v and values.get('status') == BlogPostStatus.DRAFT:
            raise ValueError('Cannot set published_at for draft posts')
        return v

class BlogPostCreate(BlogPostBase):
    author_id: int = Field(..., gt=0)
    tag_ids: List[int] = Field(default_factory=list)

class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    slug: Optional[str] = Field(None, min_length=1, max_length=220)
    excerpt: Optional[str] = Field(None, max_length=300)
    content: Optional[str] = Field(None, min_length=1)
    content_html: Optional[str] = None
    featured_image_url: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = Field(None, gt=0)
    status: Optional[BlogPostStatus] = None
    is_featured: Optional[bool] = None
    is_pinned: Optional[bool] = None
    allow_comments: Optional[bool] = None
    published_at: Optional[datetime] = None
    tag_ids: Optional[List[int]] = None

class BlogPostResponse(BlogPostBase):
    id: int
    author_id: int
    view_count: int
    like_count: int
    comment_count: int
    tags: List[BlogTagResponse]
    category: BlogCategoryResponse
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Comment Schemas
class BlogCommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[int] = Field(None, gt=0)

class BlogCommentCreate(BlogCommentBase):
    author_id: int = Field(..., gt=0)
    author_name: str = Field(..., min_length=1, max_length=100)
    author_email: Optional[str] = Field(None, pattern=r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')

class BlogCommentUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    status: Optional[BlogCommentStatus] = None

class BlogCommentResponse(BlogCommentBase):
    id: int
    post_id: int
    author_id: int
    author_name: str
    author_email: Optional[str]
    status: BlogCommentStatus
    is_edited: bool
    edited_at: Optional[datetime]
    replies: List['BlogCommentResponse'] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Like Schemas
class BlogLikeCreate(BaseModel):
    post_id: int = Field(..., gt=0)
    user_id: int = Field(..., gt=0)

class BlogLikeResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Search and Filter Schemas
class BlogSearchFilters(BaseModel):
    query: Optional[str] = None
    category_id: Optional[int] = None
    tag_id: Optional[int] = None
    author_id: Optional[int] = None
    status: Optional[BlogPostStatus] = None
    is_featured: Optional[bool] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    sort_by: str = "created_at"
    sort_order: str = "desc"
    page: int = 1
    limit: int = 20

# Statistics Schemas
class BlogStatistics(BaseModel):
    total_posts: int
    total_categories: int
    total_tags: int
    total_comments: int
    total_likes: int
    total_views: int
    posts_this_month: int
    comments_this_month: int
    popular_posts: List[dict]
    recent_posts: List[dict]
    top_categories: List[dict]

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

# SEO and Meta Schemas
class BlogPostSEO(BaseModel):
    meta_title: Optional[str] = Field(None, max_length=60)
    meta_description: Optional[str] = Field(None, max_length=160)
    meta_keywords: Optional[str] = Field(None, max_length=255)
    canonical_url: Optional[str] = Field(None, max_length=500)
    og_title: Optional[str] = Field(None, max_length=95)
    og_description: Optional[str] = Field(None, max_length=200)
    og_image: Optional[str] = Field(None, max_length=500)
    twitter_card: str = Field(default="summary_large_image")
    structured_data: Optional[dict] = None

# Bulk Operations Schemas
class BulkPostOperation(BaseModel):
    post_ids: List[int] = Field(min_length=1, max_length=50)
    operation: str = Field(..., pattern=r'^(publish|archive|delete|feature|unfeature)$')

class BulkCommentModeration(BaseModel):
    comment_ids: List[int] = Field(min_length=1, max_length=50)
    action: str = Field(..., pattern=r'^(approve|reject|delete)$')
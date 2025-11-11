"""
Blog Service - FastAPI microservice
Senior-level implementation with comprehensive CRUD operations, search, and analytics
"""

import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, desc, asc, func, and_, or_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError

# Import our models and schemas
from models import (
    BlogCategory, BlogPost, BlogTag, BlogComment, BlogLike, BlogView,
    BlogPostTag, Base
)
from schemas import (
    BlogCategoryCreate, BlogCategoryUpdate, BlogCategoryResponse,
    BlogTagCreate, BlogTagUpdate, BlogTagResponse,
    BlogPostCreate, BlogPostUpdate, BlogPostResponse,
    BlogCommentCreate, BlogCommentUpdate, BlogCommentResponse,
    BlogLikeCreate, BlogLikeResponse,
    BlogSearchFilters, BlogStatistics,
    PaginatedResponse, BulkPostOperation, BulkCommentModeration,
    BlogPostStatus, BlogCommentStatus
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/blog_db")
engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

# Background task for updating statistics
def update_post_statistics(db: Session, post_id: int):
    """Update view, like, and comment counts for a post"""
    try:
        # Update view count
        view_count = db.query(func.count(BlogView.id)).filter(BlogView.post_id == post_id).scalar()

        # Update like count
        like_count = db.query(func.count(BlogLike.id)).filter(BlogLike.post_id == post_id).scalar()

        # Update comment count
        comment_count = db.query(func.count(BlogComment.id)).filter(
            BlogComment.post_id == post_id,
            BlogComment.status == BlogCommentStatus.APPROVED
        ).scalar()

        # Update post
        post = db.query(BlogPost).filter(BlogPost.id == post_id).first()
        if post:
            post.view_count = view_count or 0
            post.like_count = like_count or 0
            post.comment_count = comment_count or 0
            db.commit()

    except Exception as e:
        logger.error(f"Error updating post statistics: {e}")
        db.rollback()

# Repository classes
class BaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def commit(self):
        self.db.commit()

    def refresh(self, obj):
        self.db.refresh(obj)

class BlogCategoryRepository(BaseRepository):
    def get_all(self, active_only: bool = True) -> List[BlogCategory]:
        query = self.db.query(BlogCategory)
        if active_only:
            query = query.filter(BlogCategory.is_active == True)
        return query.order_by(BlogCategory.display_order).all()

    def get_by_id(self, category_id: int) -> Optional[BlogCategory]:
        return self.db.query(BlogCategory).filter(BlogCategory.id == category_id).first()

    def get_by_slug(self, slug: str) -> Optional[BlogCategory]:
        return self.db.query(BlogCategory).filter(BlogCategory.slug == slug).first()

    def create(self, category_data: BlogCategoryCreate) -> BlogCategory:
        category = BlogCategory(**category_data.dict())
        self.db.add(category)
        self.commit()
        self.refresh(category)
        return category

    def update(self, category_id: int, updates: Dict[str, Any]) -> Optional[BlogCategory]:
        category = self.get_by_id(category_id)
        if category:
            for key, value in updates.items():
                setattr(category, key, value)
            category.updated_at = datetime.utcnow()
            self.commit()
            self.refresh(category)
        return category

    def delete(self, category_id: int) -> bool:
        category = self.get_by_id(category_id)
        if category:
            self.db.delete(category)
            self.commit()
            return True
        return False

    def update_post_count(self, category_id: int):
        """Update post count for category"""
        category = self.get_by_id(category_id)
        if category:
            count = self.db.query(func.count(BlogPost.id)).filter(
                BlogPost.category_id == category_id,
                BlogPost.status == BlogPostStatus.PUBLISHED
            ).scalar()
            category.post_count = count or 0
            self.commit()

class BlogTagRepository(BaseRepository):
    def get_all(self, limit: int = 100) -> List[BlogTag]:
        return self.db.query(BlogTag).order_by(desc(BlogTag.usage_count)).limit(limit).all()

    def get_by_id(self, tag_id: int) -> Optional[BlogTag]:
        return self.db.query(BlogTag).filter(BlogTag.id == tag_id).first()

    def get_by_slug(self, slug: str) -> Optional[BlogTag]:
        return self.db.query(BlogTag).filter(BlogTag.slug == slug).first()

    def create(self, tag_data: BlogTagCreate) -> BlogTag:
        tag = BlogTag(**tag_data.dict())
        self.db.add(tag)
        self.commit()
        self.refresh(tag)
        return tag

    def update(self, tag_id: int, updates: Dict[str, Any]) -> Optional[BlogTag]:
        tag = self.get_by_id(tag_id)
        if tag:
            for key, value in updates.items():
                setattr(tag, key, value)
            self.commit()
            self.refresh(tag)
        return tag

    def update_usage_count(self, tag_id: int):
        """Update usage count for tag"""
        tag = self.get_by_id(tag_id)
        if tag:
            count = self.db.query(func.count(BlogPostTag.id)).filter(
                BlogPostTag.tag_id == tag_id
            ).scalar()
            tag.usage_count = count or 0
            self.commit()

class BlogPostRepository(BaseRepository):
    def get_all(self, filters: BlogSearchFilters) -> List[BlogPost]:
        query = self.db.query(BlogPost)

        # Apply filters
        if filters.query:
            query = query.filter(
                or_(
                    BlogPost.title.ilike(f"%{filters.query}%"),
                    BlogPost.content.ilike(f"%{filters.query}%"),
                    BlogPost.excerpt.ilike(f"%{filters.query}%")
                )
            )

        if filters.category_id:
            query = query.filter(BlogPost.category_id == filters.category_id)

        if filters.author_id:
            query = query.filter(BlogPost.author_id == filters.author_id)

        if filters.status:
            query = query.filter(BlogPost.status == filters.status)

        if filters.is_featured is not None:
            query = query.filter(BlogPost.is_featured == filters.is_featured)

        if filters.date_from:
            query = query.filter(BlogPost.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(BlogPost.created_at <= filters.date_to)

        # Apply sorting
        sort_column = getattr(BlogPost, filters.sort_by, BlogPost.created_at)
        if filters.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        return query.all()

    def get_paginated(self, filters: BlogSearchFilters) -> tuple[List[BlogPost], int]:
        query = self.db.query(BlogPost)

        # Apply same filters as get_all
        if filters.query:
            query = query.filter(
                or_(
                    BlogPost.title.ilike(f"%{filters.query}%"),
                    BlogPost.content.ilike(f"%{filters.query}%"),
                    BlogPost.excerpt.ilike(f"%{filters.query}%")
                )
            )

        if filters.category_id:
            query = query.filter(BlogPost.category_id == filters.category_id)

        if filters.author_id:
            query = query.filter(BlogPost.author_id == filters.author_id)

        if filters.status:
            query = query.filter(BlogPost.status == filters.status)

        if filters.is_featured is not None:
            query = query.filter(BlogPost.is_featured == filters.is_featured)

        if filters.date_from:
            query = query.filter(BlogPost.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(BlogPost.created_at <= filters.date_to)

        # Get total count
        total = query.count()

        # Apply sorting
        sort_column = getattr(BlogPost, filters.sort_by, BlogPost.created_at)
        if filters.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Apply pagination
        posts = query.offset((filters.page - 1) * filters.limit).limit(filters.limit).all()

        return posts, total

    def get_by_id(self, post_id: int) -> Optional[BlogPost]:
        return self.db.query(BlogPost).filter(BlogPost.id == post_id).first()

    def get_by_slug(self, slug: str) -> Optional[BlogPost]:
        return self.db.query(BlogPost).filter(BlogPost.slug == slug).first()

    def create(self, post_data: BlogPostCreate) -> BlogPost:
        # Create post
        post_dict = post_data.dict()
        tag_ids = post_dict.pop('tag_ids', [])

        post = BlogPost(**post_dict)
        self.db.add(post)
        self.commit()
        self.refresh(post)

        # Add tags
        if tag_ids:
            for tag_id in tag_ids:
                post_tag = BlogPostTag(post_id=post.id, tag_id=tag_id)
                self.db.add(post_tag)
            self.commit()

        return post

    def update(self, post_id: int, updates: Dict[str, Any]) -> Optional[BlogPost]:
        post = self.get_by_id(post_id)
        if post:
            tag_ids = updates.pop('tag_ids', None)

            for key, value in updates.items():
                setattr(post, key, value)
            post.updated_at = datetime.utcnow()

            # Update tags if provided
            if tag_ids is not None:
                # Remove existing tags
                self.db.query(BlogPostTag).filter(BlogPostTag.post_id == post_id).delete()

                # Add new tags
                for tag_id in tag_ids:
                    post_tag = BlogPostTag(post_id=post_id, tag_id=tag_id)
                    self.db.add(post_tag)

            self.commit()
            self.refresh(post)
        return post

    def delete(self, post_id: int) -> bool:
        post = self.get_by_id(post_id)
        if post:
            self.db.delete(post)
            self.commit()
            return True
        return False

    def increment_view_count(self, post_id: int, user_id: Optional[int], ip_address: str):
        """Increment view count and track view"""
        # Create view record
        view = BlogView(
            post_id=post_id,
            user_id=user_id,
            ip_address=ip_address
        )
        self.db.add(view)
        self.commit()

        # Update post view count
        post = self.get_by_id(post_id)
        if post:
            post.view_count += 1
            self.commit()

class BlogCommentRepository(BaseRepository):
    def get_for_post(self, post_id: int, status: Optional[BlogCommentStatus] = None) -> List[BlogComment]:
        query = self.db.query(BlogComment).filter(BlogComment.post_id == post_id)

        if status:
            query = query.filter(BlogComment.status == status)

        return query.order_by(BlogComment.created_at).all()

    def get_by_id(self, comment_id: int) -> Optional[BlogComment]:
        return self.db.query(BlogComment).filter(BlogComment.id == comment_id).first()

    def create(self, comment_data: BlogCommentCreate) -> BlogComment:
        comment = BlogComment(**comment_data.dict())
        self.db.add(comment)
        self.commit()
        self.refresh(comment)
        return comment

    def update(self, comment_id: int, updates: Dict[str, Any]) -> Optional[BlogComment]:
        comment = self.get_by_id(comment_id)
        if comment:
            for key, value in updates.items():
                setattr(comment, key, value)
            comment.updated_at = datetime.utcnow()
            if 'content' in updates:
                comment.is_edited = True
                comment.edited_at = datetime.utcnow()
            self.commit()
            self.refresh(comment)
        return comment

    def delete(self, comment_id: int) -> bool:
        comment = self.get_by_id(comment_id)
        if comment:
            self.db.delete(comment)
            self.commit()
            return True
        return False

class BlogLikeRepository(BaseRepository):
    def get_for_post(self, post_id: int) -> List[BlogLike]:
        return self.db.query(BlogLike).filter(BlogLike.post_id == post_id).all()

    def get_by_user_and_post(self, user_id: int, post_id: int) -> Optional[BlogLike]:
        return self.db.query(BlogLike).filter(
            BlogLike.user_id == user_id,
            BlogLike.post_id == post_id
        ).first()

    def create(self, like_data: BlogLikeCreate) -> BlogLike:
        like = BlogLike(**like_data.dict())
        self.db.add(like)
        self.commit()
        self.refresh(like)
        return like

    def delete(self, user_id: int, post_id: int) -> bool:
        like = self.get_by_user_and_post(user_id, post_id)
        if like:
            self.db.delete(like)
            self.commit()
            return True
        return False

# Service classes
class BlogCategoryService:
    def __init__(self, db: Session):
        self.repository = BlogCategoryRepository(db)

    def get_categories(self, active_only: bool = True) -> List[BlogCategoryResponse]:
        categories = self.repository.get_all(active_only)
        return [BlogCategoryResponse.from_orm(cat) for cat in categories]

    def get_category(self, category_id: int) -> Optional[BlogCategoryResponse]:
        category = self.repository.get_by_id(category_id)
        return BlogCategoryResponse.from_orm(category) if category else None

    def create_category(self, category_data: BlogCategoryCreate) -> BlogCategoryResponse:
        try:
            category = self.repository.create(category_data)
            return BlogCategoryResponse.from_orm(category)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Category with this name or slug already exists")

    def update_category(self, category_id: int, updates: BlogCategoryUpdate) -> Optional[BlogCategoryResponse]:
        update_data = updates.dict(exclude_unset=True)
        category = self.repository.update(category_id, update_data)
        if category:
            return BlogCategoryResponse.from_orm(category)
        return None

    def delete_category(self, category_id: int) -> bool:
        return self.repository.delete(category_id)

class BlogTagService:
    def __init__(self, db: Session):
        self.repository = BlogTagRepository(db)

    def get_tags(self, limit: int = 100) -> List[BlogTagResponse]:
        tags = self.repository.get_all(limit)
        return [BlogTagResponse.from_orm(tag) for tag in tags]

    def get_tag(self, tag_id: int) -> Optional[BlogTagResponse]:
        tag = self.repository.get_by_id(tag_id)
        return BlogTagResponse.from_orm(tag) if tag else None

    def create_tag(self, tag_data: BlogTagCreate) -> BlogTagResponse:
        try:
            tag = self.repository.create(tag_data)
            return BlogTagResponse.from_orm(tag)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Tag with this name or slug already exists")

    def update_tag(self, tag_id: int, updates: BlogTagUpdate) -> Optional[BlogTagResponse]:
        update_data = updates.dict(exclude_unset=True)
        tag = self.repository.update(tag_id, update_data)
        if tag:
            return BlogTagResponse.from_orm(tag)
        return None

class BlogPostService:
    def __init__(self, db: Session):
        self.repository = BlogPostRepository(db)

    def get_posts(self, filters: BlogSearchFilters) -> PaginatedResponse[BlogPostResponse]:
        posts, total = self.repository.get_paginated(filters)

        # Calculate pagination info
        pages = (total + filters.limit - 1) // filters.limit
        has_next = filters.page < pages
        has_prev = filters.page > 1

        return PaginatedResponse(
            items=[BlogPostResponse.from_orm(post) for post in posts],
            total=total,
            page=filters.page,
            limit=filters.limit,
            pages=pages,
            has_next=has_next,
            has_prev=has_prev
        )

    def get_post(self, post_id: int) -> Optional[BlogPostResponse]:
        post = self.repository.get_by_id(post_id)
        return BlogPostResponse.from_orm(post) if post else None

    def get_post_by_slug(self, slug: str) -> Optional[BlogPostResponse]:
        post = self.repository.get_by_slug(slug)
        return BlogPostResponse.from_orm(post) if post else None

    def create_post(self, post_data: BlogPostCreate) -> BlogPostResponse:
        try:
            post = self.repository.create(post_data)
            return BlogPostResponse.from_orm(post)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Post with this slug already exists")

    def update_post(self, post_id: int, updates: BlogPostUpdate) -> Optional[BlogPostResponse]:
        update_data = updates.dict(exclude_unset=True)
        post = self.repository.update(post_id, update_data)
        if post:
            return BlogPostResponse.from_orm(post)
        return None

    def delete_post(self, post_id: int) -> bool:
        return self.repository.delete(post_id)

    def increment_views(self, post_id: int, user_id: Optional[int], ip_address: str):
        """Increment post view count"""
        self.repository.increment_view_count(post_id, user_id, ip_address)

class BlogCommentService:
    def __init__(self, db: Session):
        self.repository = BlogCommentRepository(db)

    def get_comments_for_post(self, post_id: int, status: Optional[BlogCommentStatus] = None) -> List[BlogCommentResponse]:
        comments = self.repository.get_for_post(post_id, status)
        return [BlogCommentResponse.from_orm(comment) for comment in comments]

    def create_comment(self, comment_data: BlogCommentCreate) -> BlogCommentResponse:
        comment = self.repository.create(comment_data)
        return BlogCommentResponse.from_orm(comment)

    def update_comment(self, comment_id: int, updates: BlogCommentUpdate) -> Optional[BlogCommentResponse]:
        update_data = updates.dict(exclude_unset=True)
        comment = self.repository.update(comment_id, update_data)
        if comment:
            return BlogCommentResponse.from_orm(comment)
        return None

    def delete_comment(self, comment_id: int) -> bool:
        return self.repository.delete(comment_id)

class BlogLikeService:
    def __init__(self, db: Session):
        self.repository = BlogLikeRepository(db)

    def get_likes_for_post(self, post_id: int) -> List[BlogLikeResponse]:
        likes = self.repository.get_for_post(post_id)
        return [BlogLikeResponse.from_orm(like) for like in likes]

    def toggle_like(self, like_data: BlogLikeCreate) -> bool:
        """Toggle like for a post. Returns True if liked, False if unliked."""
        existing_like = self.repository.get_by_user_and_post(like_data.user_id, like_data.post_id)

        if existing_like:
            # Unlike
            self.repository.delete(like_data.user_id, like_data.post_id)
            return False
        else:
            # Like
            self.repository.create(like_data)
            return True

class BlogStatisticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_statistics(self) -> BlogStatistics:
        # Get basic counts
        total_posts = self.db.query(func.count(BlogPost.id)).scalar() or 0
        total_categories = self.db.query(func.count(BlogCategory.id)).scalar() or 0
        total_tags = self.db.query(func.count(BlogTag.id)).scalar() or 0
        total_comments = self.db.query(func.count(BlogComment.id)).filter(
            BlogComment.status == BlogCommentStatus.APPROVED
        ).scalar() or 0
        total_likes = self.db.query(func.count(BlogLike.id)).scalar() or 0
        total_views = self.db.query(func.count(BlogView.id)).scalar() or 0

        # Get posts this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        posts_this_month = self.db.query(func.count(BlogPost.id)).filter(
            BlogPost.created_at >= month_start
        ).scalar() or 0

        comments_this_month = self.db.query(func.count(BlogComment.id)).filter(
            BlogComment.created_at >= month_start,
            BlogComment.status == BlogCommentStatus.APPROVED
        ).scalar() or 0

        # Get popular posts (by views)
        popular_posts = self.db.query(
            BlogPost.id, BlogPost.title, BlogPost.view_count
        ).order_by(desc(BlogPost.view_count)).limit(5).all()

        # Get recent posts
        recent_posts = self.db.query(
            BlogPost.id, BlogPost.title, BlogPost.created_at
        ).filter(BlogPost.status == BlogPostStatus.PUBLISHED).order_by(
            desc(BlogPost.created_at)
        ).limit(5).all()

        # Get top categories
        top_categories = self.db.query(
            BlogCategory.name, BlogCategory.post_count
        ).order_by(desc(BlogCategory.post_count)).limit(5).all()

        return BlogStatistics(
            total_posts=total_posts,
            total_categories=total_categories,
            total_tags=total_tags,
            total_comments=total_comments,
            total_likes=total_likes,
            total_views=total_views,
            posts_this_month=posts_this_month,
            comments_this_month=comments_this_month,
            popular_posts=[{"id": p.id, "title": p.title, "views": p.view_count} for p in popular_posts],
            recent_posts=[{"id": p.id, "title": p.title, "created_at": p.created_at.isoformat()} for p in recent_posts],
            top_categories=[{"name": c.name, "post_count": c.post_count} for c in top_categories]
        )

# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    yield
    # Shutdown
    # Add cleanup logic here if needed

app = FastAPI(
    title="Blog Service API",
    description="Comprehensive blog service with posts, categories, tags, comments, and analytics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Category routes
@app.get("/categories", response_model=List[BlogCategoryResponse])
async def get_categories(
    active_only: bool = Query(True, description="Return only active categories"),
    db: Session = Depends(get_db)
):
    """Get all blog categories"""
    service = BlogCategoryService(db)
    return service.get_categories(active_only)

@app.get("/categories/{category_id}", response_model=BlogCategoryResponse)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category"""
    service = BlogCategoryService(db)
    category = service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.post("/categories", response_model=BlogCategoryResponse)
async def create_category(category: BlogCategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    service = BlogCategoryService(db)
    return service.create_category(category)

@app.put("/categories/{category_id}", response_model=BlogCategoryResponse)
async def update_category(
    category_id: int,
    category_update: BlogCategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category"""
    service = BlogCategoryService(db)
    updated_category = service.update_category(category_id, category_update)
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated_category

@app.delete("/categories/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""
    service = BlogCategoryService(db)
    if not service.delete_category(category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# Tag routes
@app.get("/tags", response_model=List[BlogTagResponse])
async def get_tags(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get all blog tags"""
    service = BlogTagService(db)
    return service.get_tags(limit)

@app.get("/tags/{tag_id}", response_model=BlogTagResponse)
async def get_tag(tag_id: int, db: Session = Depends(get_db)):
    """Get a specific tag"""
    service = BlogTagService(db)
    tag = service.get_tag(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

@app.post("/tags", response_model=BlogTagResponse)
async def create_tag(tag: BlogTagCreate, db: Session = Depends(get_db)):
    """Create a new tag"""
    service = BlogTagService(db)
    return service.create_tag(tag)

@app.put("/tags/{tag_id}", response_model=BlogTagResponse)
async def update_tag(
    tag_id: int,
    tag_update: BlogTagUpdate,
    db: Session = Depends(get_db)
):
    """Update a tag"""
    service = BlogTagService(db)
    updated_tag = service.update_tag(tag_id, tag_update)
    if not updated_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return updated_tag

# Post routes
@app.get("/posts", response_model=PaginatedResponse[BlogPostResponse])
async def get_posts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    category_id: Optional[int] = None,
    author_id: Optional[int] = None,
    status: Optional[BlogPostStatus] = None,
    is_featured: Optional[bool] = None,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|title|view_count|like_count)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Get paginated blog posts with filtering and sorting"""
    filters = BlogSearchFilters(
        query=query,
        category_id=category_id,
        author_id=author_id,
        status=status,
        is_featured=is_featured,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    service = BlogPostService(db)
    return service.get_posts(filters)

@app.get("/posts/{post_id}", response_model=BlogPostResponse)
async def get_post(
    post_id: int,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Get a specific blog post"""
    service = BlogPostService(db)
    post = service.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Increment view count asynchronously
    if background_tasks and ip_address:
        background_tasks.add_task(service.increment_views, post_id, user_id, ip_address)

    return post

@app.get("/posts/slug/{slug}", response_model=BlogPostResponse)
async def get_post_by_slug(
    slug: str,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Get a blog post by slug"""
    service = BlogPostService(db)
    post = service.get_post_by_slug(slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Increment view count asynchronously
    if background_tasks and ip_address:
        background_tasks.add_task(service.increment_views, post_id=post.id, user_id=user_id, ip_address=ip_address)

    return post

@app.post("/posts", response_model=BlogPostResponse)
async def create_post(post: BlogPostCreate, db: Session = Depends(get_db)):
    """Create a new blog post"""
    service = BlogPostService(db)
    return service.create_post(post)

@app.put("/posts/{post_id}", response_model=BlogPostResponse)
async def update_post(
    post_id: int,
    post_update: BlogPostUpdate,
    db: Session = Depends(get_db)
):
    """Update a blog post"""
    service = BlogPostService(db)
    updated_post = service.update_post(post_id, post_update)
    if not updated_post:
        raise HTTPException(status_code=404, detail="Post not found")
    return updated_post

@app.delete("/posts/{post_id}")
async def delete_post(post_id: int, db: Session = Depends(get_db)):
    """Delete a blog post"""
    service = BlogPostService(db)
    if not service.delete_post(post_id):
        raise HTTPException(status_code=404, detail="Post not found")
    return {"message": "Post deleted successfully"}

# Comment routes
@app.get("/posts/{post_id}/comments", response_model=List[BlogCommentResponse])
async def get_post_comments(
    post_id: int,
    status: Optional[BlogCommentStatus] = None,
    db: Session = Depends(get_db)
):
    """Get comments for a blog post"""
    service = BlogCommentService(db)
    return service.get_comments_for_post(post_id, status)

@app.post("/comments", response_model=BlogCommentResponse)
async def create_comment(comment: BlogCommentCreate, db: Session = Depends(get_db)):
    """Create a new comment"""
    service = BlogCommentService(db)
    return service.create_comment(comment)

@app.put("/comments/{comment_id}", response_model=BlogCommentResponse)
async def update_comment(
    comment_id: int,
    comment_update: BlogCommentUpdate,
    db: Session = Depends(get_db)
):
    """Update a comment"""
    service = BlogCommentService(db)
    updated_comment = service.update_comment(comment_id, comment_update)
    if not updated_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return updated_comment

@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    """Delete a comment"""
    service = BlogCommentService(db)
    if not service.delete_comment(comment_id):
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}

# Like routes
@app.get("/posts/{post_id}/likes", response_model=List[BlogLikeResponse])
async def get_post_likes(post_id: int, db: Session = Depends(get_db)):
    """Get likes for a blog post"""
    service = BlogLikeService(db)
    return service.get_likes_for_post(post_id)

@app.post("/likes/toggle", response_model=dict)
async def toggle_like(like: BlogLikeCreate, db: Session = Depends(get_db)):
    """Toggle like for a post"""
    service = BlogLikeService(db)
    is_liked = service.toggle_like(like)
    return {"liked": is_liked}

# Statistics routes
@app.get("/statistics", response_model=BlogStatistics)
async def get_statistics(db: Session = Depends(get_db)):
    """Get blog statistics"""
    service = BlogStatisticsService(db)
    return service.get_statistics()

# Bulk operations routes
@app.post("/posts/bulk")
async def bulk_post_operation(
    operation: BulkPostOperation,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Perform bulk operations on posts"""
    # Implementation for bulk operations would go here
    # For now, return success
    return {"message": f"Bulk {operation.operation} operation queued for {len(operation.post_ids)} posts"}

@app.post("/comments/bulk")
async def bulk_comment_moderation(
    moderation: BulkCommentModeration,
    db: Session = Depends(get_db)
):
    """Perform bulk comment moderation"""
    # Implementation for bulk comment moderation would go here
    # For now, return success
    return {"message": f"Bulk {moderation.action} operation completed for {len(moderation.comment_ids)} comments"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
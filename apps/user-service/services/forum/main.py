"""
Forum Service - Senior Level Implementation
FastAPI service providing comprehensive forum functionality
"""

import asyncio
import logging
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean, ForeignKey, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from sqlalchemy.pool import QueuePool
from pydantic import BaseModel, Field, validator
import redis.asyncio as redis
from elasticsearch import AsyncElasticsearch
import aiofiles
import os
from pathlib import Path

# Import our models and schemas
from .models import (
    ForumCategory, Forum, ForumTopic, ForumPost,
    ForumModerationLog, ForumReport, Base
)
from .schemas import (
    ForumCategoryCreate, ForumCategoryResponse, ForumCategoryUpdate,
    ForumCreate, ForumResponse, ForumUpdate,
    ForumTopicCreate, ForumTopicResponse, ForumTopicUpdate,
    ForumPostCreate, ForumPostResponse, ForumPostUpdate,
    ForumModerationAction, ForumReportCreate,
    ForumSearchFilters, PaginatedResponse,
    ForumStatistics, BulkModerationRequest, BulkModerationResponse
)

# ============================================================================
# Configuration & Dependencies
# ============================================================================

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/forum_db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
ELASTICSEARCH_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION = timedelta(hours=24)

# Service Configuration
SERVICE_NAME = "forum-service"
VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

# ============================================================================
# Database Setup
# ============================================================================

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=3600,
    echo=DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ============================================================================
# External Services
# ============================================================================

redis_client = redis.from_url(REDIS_URL, decode_responses=True)
elasticsearch_client = AsyncElasticsearch([ELASTICSEARCH_URL])

# ============================================================================
# Dependency Injection Container
# ============================================================================

class DatabaseDependency:
    def __init__(self):
        self.engine = engine
        self.SessionLocal = SessionLocal

    def get_db(self) -> Session:
        db = self.SessionLocal()
        try:
            yield db
        finally:
            db.close()

class CacheDependency:
    def __init__(self):
        self.redis = redis_client

class SearchDependency:
    def __init__(self):
        self.elasticsearch = elasticsearch_client

# Initialize dependencies
db_dep = DatabaseDependency()
cache_dep = CacheDependency()
search_dep = SearchDependency()

# ============================================================================
# Security & Authentication
# ============================================================================

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(db_dep.get_db)
) -> Dict[str, Any]:
    """Get current authenticated user"""
    # This would integrate with your auth service
    # For now, return mock user data
    return {
        "id": 1,
        "username": "testuser",
        "email": "test@example.com",
        "is_moderator": False,
        "is_admin": False
    }

async def require_moderator(current_user: Dict = Depends(get_current_user)) -> Dict:
    """Require moderator permissions"""
    if not current_user.get("is_moderator", False) and not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator permissions required"
        )
    return current_user

async def require_admin(current_user: Dict = Depends(get_current_user)) -> Dict:
    """Require admin permissions"""
    if not current_user.get("is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permissions required"
        )
    return current_user

# ============================================================================
# Repository Layer (Data Access)
# ============================================================================

class BaseRepository:
    """Base repository with common database operations"""

    def __init__(self, db: Session):
        self.db = db

    def commit(self):
        """Commit transaction"""
        self.db.commit()

    def rollback(self):
        """Rollback transaction"""
        self.db.rollback()

    def refresh(self, obj):
        """Refresh object from database"""
        self.db.refresh(obj)

class ForumCategoryRepository(BaseRepository):
    """Forum category data access"""

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ForumCategory]:
        return self.db.query(ForumCategory).filter(
            ForumCategory.is_active == True
        ).order_by(ForumCategory.display_order).offset(skip).limit(limit).all()

    def get_by_id(self, category_id: int) -> Optional[ForumCategory]:
        return self.db.query(ForumCategory).filter(
            ForumCategory.id == category_id,
            ForumCategory.is_active == True
        ).first()

    def create(self, category: ForumCategoryCreate) -> ForumCategory:
        db_category = ForumCategory(**category.dict())
        self.db.add(db_category)
        self.commit()
        self.refresh(db_category)
        return db_category

    def update(self, category_id: int, updates: Dict[str, Any]) -> Optional[ForumCategory]:
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
            category.is_active = False
            self.commit()
            return True
        return False

class ForumRepository(BaseRepository):
    """Forum data access"""

    def get_all(self, category_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Forum]:
        query = self.db.query(Forum).filter(Forum.is_active == True)
        if category_id:
            query = query.filter(Forum.category_id == category_id)
        return query.order_by(Forum.display_order).offset(skip).limit(limit).all()

    def get_by_id(self, forum_id: int) -> Optional[Forum]:
        return self.db.query(Forum).filter(
            Forum.id == forum_id,
            Forum.is_active == True
        ).first()

    def get_by_slug(self, slug: str) -> Optional[Forum]:
        return self.db.query(Forum).filter(
            Forum.slug == slug,
            Forum.is_active == True
        ).first()

    def create(self, forum: ForumCreate) -> Forum:
        # Generate slug from name
        slug = forum.name.lower().replace(' ', '-').replace('_', '-')
        # Ensure unique slug
        counter = 1
        original_slug = slug
        while self.db.query(Forum).filter(Forum.slug == slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1

        db_forum = Forum(**forum.dict(), slug=slug)
        self.db.add(db_forum)
        self.commit()
        self.refresh(db_forum)
        return db_forum

    def update_topic_stats(self, forum_id: int):
        """Update forum topic and post counts"""
        forum = self.get_by_id(forum_id)
        if forum:
            # Update topic count
            forum.topic_count = self.db.query(ForumTopic).filter(
                ForumTopic.forum_id == forum_id,
                ForumTopic.is_deleted == False
            ).count()

            # Update post count
            forum.post_count = self.db.query(ForumPost).filter(
                ForumPost.topic_id.in_(
                    self.db.query(ForumTopic.id).filter(
                        ForumTopic.forum_id == forum_id,
                        ForumTopic.is_deleted == False
                    )
                ),
                ForumPost.is_deleted == False
            ).count()

            # Update last post info
            last_post = self.db.query(ForumPost).join(ForumTopic).filter(
                ForumTopic.forum_id == forum_id,
                ForumPost.is_deleted == False,
                ForumTopic.is_deleted == False
            ).order_by(ForumPost.created_at.desc()).first()

            if last_post:
                forum.last_post_at = last_post.created_at
                forum.last_post_user_id = last_post.author_id
            else:
                forum.last_post_at = None
                forum.last_post_user_id = None

            self.commit()

    def update(self, forum_id: int, updates: Dict[str, Any]) -> Optional[Forum]:
        forum = self.get_by_id(forum_id)
        if forum:
            for key, value in updates.items():
                setattr(forum, key, value)
            forum.updated_at = datetime.utcnow()
            self.commit()
            self.refresh(forum)
        return forum

class ForumTopicRepository(BaseRepository):
    """Forum topic data access"""

    def get_by_forum(self, forum_id: int, skip: int = 0, limit: int = 20,
                    sort_by: str = "last_post_at", sort_order: str = "desc") -> List[ForumTopic]:
        query = self.db.query(ForumTopic).filter(
            ForumTopic.forum_id == forum_id,
            ForumTopic.is_deleted == False
        )

        # Apply sorting
        if sort_by == "created_at":
            order_col = ForumTopic.created_at
        elif sort_by == "title":
            order_col = ForumTopic.title
        elif sort_by == "author":
            order_col = ForumTopic.author_username
        elif sort_by == "views":
            order_col = ForumTopic.view_count
        else:  # last_post_at
            order_col = ForumTopic.last_post_at

        if sort_order == "asc":
            query = query.order_by(order_col.asc())
        else:
            query = query.order_by(order_col.desc())

        return query.offset(skip).limit(limit).all()

    def get_by_id(self, topic_id: int) -> Optional[ForumTopic]:
        return self.db.query(ForumTopic).filter(
            ForumTopic.id == topic_id,
            ForumTopic.is_deleted == False
        ).first()

    def get_by_slug(self, slug: str) -> Optional[ForumTopic]:
        return self.db.query(ForumTopic).filter(
            ForumTopic.slug == slug,
            ForumTopic.is_deleted == False
        ).first()

    def create(self, topic: ForumTopicCreate, author: Dict[str, Any]) -> ForumTopic:
        # Generate slug from title
        slug = topic.title.lower().replace(' ', '-').replace('_', '-')
        # Ensure unique slug
        counter = 1
        original_slug = slug
        while self.db.query(ForumTopic).filter(ForumTopic.slug == slug).first():
            slug = f"{original_slug}-{counter}"
            counter += 1

        db_topic = ForumTopic(
            **topic.dict(),
            slug=slug,
            author_id=author["id"],
            author_username=author["username"],
            first_post_content=topic.content  # Store first post content
        )
        self.db.add(db_topic)
        self.commit()
        self.refresh(db_topic)

        # Update forum statistics
        forum_repo = ForumRepository(self.db)
        forum_repo.update_topic_stats(topic.forum_id)

        return db_topic

    def increment_views(self, topic_id: int):
        """Increment topic view count"""
        topic = self.get_by_id(topic_id)
        if topic:
            topic.view_count += 1
            self.commit()

class ForumPostRepository(BaseRepository):
    """Forum post data access"""

    def get_by_topic(self, topic_id: int, skip: int = 0, limit: int = 20) -> List[ForumPost]:
        return self.db.query(ForumPost).filter(
            ForumPost.topic_id == topic_id,
            ForumPost.is_deleted == False
        ).order_by(ForumPost.created_at.asc()).offset(skip).limit(limit).all()

    def get_by_id(self, post_id: int) -> Optional[ForumPost]:
        return self.db.query(ForumPost).filter(
            ForumPost.id == post_id,
            ForumPost.is_deleted == False
        ).first()

    def create(self, post: ForumPostCreate, author: Dict[str, Any]) -> ForumPost:
        db_post = ForumPost(
            **post.dict(),
            author_id=author["id"],
            author_username=author["username"]
        )
        self.db.add(db_post)
        self.commit()
        self.refresh(db_post)

        # Update topic statistics
        topic = self.db.query(ForumTopic).filter(ForumTopic.id == post.topic_id).first()
        if topic:
            topic.post_count += 1
            topic.last_post_at = db_post.created_at
            topic.last_post_user_id = author["id"]
            topic.last_post_username = author["username"]
            self.commit()

            # Update forum statistics
            forum_repo = ForumRepository(self.db)
            forum_repo.update_topic_stats(topic.forum_id)

        return db_post

# ============================================================================
# Service Layer (Business Logic)
# ============================================================================

class ForumCategoryService:
    """Forum category business logic"""

    def __init__(self, db: Session):
        self.repository = ForumCategoryRepository(db)

    def get_categories(self) -> List[ForumCategoryResponse]:
        categories = self.repository.get_all()
        return [ForumCategoryResponse.from_orm(cat) for cat in categories]

    def get_category(self, category_id: int) -> Optional[ForumCategoryResponse]:
        category = self.repository.get_by_id(category_id)
        return ForumCategoryResponse.from_orm(category) if category else None

    def create_category(self, category_data: ForumCategoryCreate) -> ForumCategoryResponse:
        category = self.repository.create(category_data)
        return ForumCategoryResponse.from_orm(category)

    def update_category(self, category_id: int, updates: ForumCategoryUpdate) -> Optional[ForumCategoryResponse]:
        update_data = updates.dict(exclude_unset=True)
        category = self.repository.update(category_id, update_data)
        return ForumCategoryResponse.from_orm(category) if category else None

    def delete_category(self, category_id: int) -> bool:
        return self.repository.delete(category_id)

class ForumService:
    """Forum business logic"""

    def __init__(self, db: Session):
        self.repository = ForumRepository(db)

    def get_forums(self, category_id: Optional[int] = None) -> List[ForumResponse]:
        forums = self.repository.get_all(category_id)
        return [ForumResponse.from_orm(forum) for forum in forums]

    def get_forum(self, forum_id: int) -> Optional[ForumResponse]:
        forum = self.repository.get_by_id(forum_id)
        return ForumResponse.from_orm(forum) if forum else None

    def get_forum_by_slug(self, slug: str) -> Optional[ForumResponse]:
        forum = self.repository.get_by_slug(slug)
        return ForumResponse.from_orm(forum) if forum else None

    def create_forum(self, forum_data: ForumCreate) -> ForumResponse:
        forum = self.repository.create(forum_data)
        return ForumResponse.from_orm(forum)

    def update_forum(self, forum_id: int, updates: ForumUpdate) -> Optional[ForumResponse]:
        # Validate category exists if being updated
        if updates.category_id is not None:
            category_repo = ForumCategoryRepository(self.repository.db)
            if not category_repo.get_by_id(updates.category_id):
                raise HTTPException(status_code=400, detail="Invalid category ID")

        update_data = updates.dict(exclude_unset=True)
        forum = self.repository.update(forum_id, update_data)
        return ForumResponse.from_orm(forum) if forum else None

class ForumTopicService:
    """Forum topic business logic"""

    def __init__(self, db: Session):
        self.repository = ForumTopicRepository(db)

    def get_topics(self, forum_id: int, filters: ForumSearchFilters) -> PaginatedResponse:
        # Validate forum exists
        forum_repo = ForumRepository(self.repository.db)
        if not forum_repo.get_by_id(forum_id):
            raise HTTPException(status_code=404, detail="Forum not found")

        topics = self.repository.get_by_forum(
            forum_id=forum_id,
            skip=filters.page * filters.limit,
            limit=filters.limit,
            sort_by=filters.sort_by,
            sort_order=filters.sort_order
        )

        total = len(topics)  # Simplified - should use count query
        total_pages = (total + filters.limit - 1) // filters.limit

        return PaginatedResponse(
            items=[ForumTopicResponse.from_orm(topic) for topic in topics],
            total=total,
            page=filters.page,
            limit=filters.limit,
            pages=total_pages,
            has_next=filters.page < total_pages - 1,
            has_prev=filters.page > 0
        )

    def get_topic(self, topic_id: int) -> Optional[ForumTopicResponse]:
        topic = self.repository.get_by_id(topic_id)
        return ForumTopicResponse.from_orm(topic) if topic else None

    def get_topic_by_slug(self, slug: str) -> Optional[ForumTopicResponse]:
        topic = self.repository.get_by_slug(slug)
        return ForumTopicResponse.from_orm(topic) if topic else None

    def create_topic(self, topic_data: ForumTopicCreate, author: Dict[str, Any]) -> ForumTopicResponse:
        # Validate forum exists and is not locked
        forum_repo = ForumRepository(self.repository.db)
        forum = forum_repo.get_by_id(topic_data.forum_id)
        if not forum:
            raise HTTPException(status_code=404, detail="Forum not found")
        if forum.is_locked:
            raise HTTPException(status_code=403, detail="Forum is locked")

        topic = self.repository.create(topic_data, author)
        return ForumTopicResponse.from_orm(topic)

    def view_topic(self, topic_id: int):
        """Increment topic view count"""
        self.repository.increment_views(topic_id)

class ForumPostService:
    """Forum post business logic"""

    def __init__(self, db: Session):
        self.repository = ForumPostRepository(db)

    def get_posts(self, topic_id: int, page: int = 0, limit: int = 20) -> PaginatedResponse:
        # Validate topic exists
        topic_repo = ForumTopicRepository(self.repository.db)
        if not topic_repo.get_by_id(topic_id):
            raise HTTPException(status_code=404, detail="Topic not found")

        posts = self.repository.get_by_topic(topic_id, page * limit, limit)
        total = len(posts)  # Simplified - should use count query
        total_pages = (total + limit - 1) // limit

        return PaginatedResponse(
            items=[ForumPostResponse.from_orm(post) for post in posts],
            total=total,
            page=page,
            limit=limit,
            pages=total_pages,
            has_next=page < total_pages - 1,
            has_prev=page > 0
        )

    def get_post(self, post_id: int) -> Optional[ForumPostResponse]:
        post = self.repository.get_by_id(post_id)
        return ForumPostResponse.from_orm(post) if post else None

    def create_post(self, post_data: ForumPostCreate, author: Dict[str, Any]) -> ForumPostResponse:
        # Validate topic exists and is not locked
        topic_repo = ForumTopicRepository(self.repository.db)
        topic = topic_repo.get_by_id(post_data.topic_id)
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        if topic.is_locked:
            raise HTTPException(status_code=403, detail="Topic is locked")

        # Validate forum is not locked
        forum_repo = ForumRepository(self.repository.db)
        forum = forum_repo.get_by_id(topic.forum_id)
        if forum and forum.is_locked:
            raise HTTPException(status_code=403, detail="Forum is locked")

        post = self.repository.create(post_data, author)
        return ForumPostResponse.from_orm(post)

# ============================================================================
# FastAPI Application
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logging.info(f"Starting {SERVICE_NAME} v{VERSION}")

    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Initialize search index
    try:
        await elasticsearch_client.indices.create(
            index="forum_posts",
            ignore=400  # Ignore if already exists
        )
        logging.info("Elasticsearch index initialized")
    except Exception as e:
        logging.warning(f"Failed to initialize Elasticsearch: {e}")

    yield

    # Shutdown
    await elasticsearch_client.close()
    await redis_client.close()
    logging.info(f"Stopped {SERVICE_NAME}")

# Create FastAPI application
app = FastAPI(
    title="Forum Service API",
    description="Comprehensive forum functionality with categories, topics, and posts",
    version=VERSION,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not DEBUG:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]  # Configure for production
    )

# ============================================================================
# API Routes
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": SERVICE_NAME, "version": VERSION}

# Category routes
@app.get("/categories", response_model=List[ForumCategoryResponse])
async def get_categories(db: Session = Depends(db_dep.get_db)):
    """Get all forum categories"""
    service = ForumCategoryService(db)
    return service.get_categories()

@app.get("/categories/{category_id}", response_model=ForumCategoryResponse)
async def get_category(category_id: int, db: Session = Depends(db_dep.get_db)):
    """Get forum category by ID"""
    service = ForumCategoryService(db)
    category = service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.post("/categories", response_model=ForumCategoryResponse)
async def create_category(
    category: ForumCategoryCreate,
    current_user: Dict = Depends(require_admin),
    db: Session = Depends(db_dep.get_db)
):
    """Create new forum category"""
    service = ForumCategoryService(db)
    return service.create_category(category)

@app.put("/categories/{category_id}", response_model=ForumCategoryResponse)
async def update_category(
    category_id: int,
    updates: ForumCategoryUpdate,
    current_user: Dict = Depends(require_admin),
    db: Session = Depends(db_dep.get_db)
):
    """Update forum category"""
    service = ForumCategoryService(db)
    category = service.update_category(category_id, updates)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    current_user: Dict = Depends(require_admin),
    db: Session = Depends(db_dep.get_db)
):
    """Delete forum category"""
    service = ForumCategoryService(db)
    if not service.delete_category(category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# Forum routes
@app.get("/forums", response_model=List[ForumResponse])
async def get_forums(
    category_id: Optional[int] = None,
    db: Session = Depends(db_dep.get_db)
):
    """Get all forums, optionally filtered by category"""
    service = ForumService(db)
    return service.get_forums(category_id)

@app.get("/forums/{forum_id}", response_model=ForumResponse)
async def get_forum(forum_id: int, db: Session = Depends(db_dep.get_db)):
    """Get forum by ID"""
    service = ForumService(db)
    forum = service.get_forum(forum_id)
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    return forum

@app.get("/forums/slug/{slug}", response_model=ForumResponse)
async def get_forum_by_slug(slug: str, db: Session = Depends(db_dep.get_db)):
    """Get forum by slug"""
    service = ForumService(db)
    forum = service.get_forum_by_slug(slug)
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    return forum

@app.post("/forums", response_model=ForumResponse)
async def create_forum(
    forum: ForumCreate,
    current_user: Dict = Depends(require_admin),
    db: Session = Depends(db_dep.get_db)
):
    """Create new forum"""
    service = ForumService(db)
    return service.create_forum(forum)

@app.put("/forums/{forum_id}", response_model=ForumResponse)
async def update_forum(
    forum_id: int,
    updates: ForumUpdate,
    current_user: Dict = Depends(require_admin),
    db: Session = Depends(db_dep.get_db)
):
    """Update forum"""
    service = ForumService(db)
    forum = service.update_forum(forum_id, updates)
    if not forum:
        raise HTTPException(status_code=404, detail="Forum not found")
    return forum

# Topic routes
@app.get("/forums/{forum_id}/topics", response_model=PaginatedResponse)
async def get_topics(
    forum_id: int,
    page: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("last_post_at", regex="^(created_at|updated_at|title|author|views|posts|last_post_at)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(db_dep.get_db)
):
    """Get topics for a forum"""
    filters = ForumSearchFilters(
        forum_id=forum_id,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    service = ForumTopicService(db)
    return service.get_topics(forum_id, filters)

@app.get("/topics/{topic_id}", response_model=ForumTopicResponse)
async def get_topic(topic_id: int, db: Session = Depends(db_dep.get_db)):
    """Get topic by ID"""
    service = ForumTopicService(db)
    topic = service.get_topic(topic_id)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@app.get("/topics/slug/{slug}", response_model=ForumTopicResponse)
async def get_topic_by_slug(slug: str, db: Session = Depends(db_dep.get_db)):
    """Get topic by slug"""
    service = ForumTopicService(db)
    topic = service.get_topic_by_slug(slug)
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic

@app.post("/topics", response_model=ForumTopicResponse)
async def create_topic(
    topic: ForumTopicCreate,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(db_dep.get_db)
):
    """Create new topic"""
    service = ForumTopicService(db)
    return service.create_topic(topic, current_user)

@app.put("/topics/{topic_id}/view")
async def view_topic(topic_id: int, db: Session = Depends(db_dep.get_db)):
    """Increment topic view count"""
    service = ForumTopicService(db)
    service.view_topic(topic_id)
    return {"message": "View recorded"}

# Post routes
@app.get("/topics/{topic_id}/posts", response_model=PaginatedResponse)
async def get_posts(
    topic_id: int,
    page: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(db_dep.get_db)
):
    """Get posts for a topic"""
    service = ForumPostService(db)
    return service.get_posts(topic_id, page, limit)

@app.get("/posts/{post_id}", response_model=ForumPostResponse)
async def get_post(post_id: int, db: Session = Depends(db_dep.get_db)):
    """Get post by ID"""
    service = ForumPostService(db)
    post = service.get_post(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@app.post("/posts", response_model=ForumPostResponse)
async def create_post(
    post: ForumPostCreate,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(db_dep.get_db)
):
    """Create new post"""
    service = ForumPostService(db)
    return service.create_post(post, current_user)

# Statistics endpoint
@app.get("/statistics", response_model=ForumStatistics)
async def get_statistics(db: Session = Depends(db_dep.get_db)):
    """Get forum statistics"""
    # This would be implemented with proper queries
    return ForumStatistics(
        total_categories=0,
        total_forums=0,
        total_topics=0,
        total_posts=0,
        total_users=0,
        topics_today=0,
        posts_today=0,
        active_users_today=0,
        most_active_forum=None,
        latest_topics=[],
        popular_topics=[]
    )

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    # Configure logging
    logging.basicConfig(
        level=logging.INFO if not DEBUG else logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

    # Start server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=DEBUG,
        log_level="info"
    )
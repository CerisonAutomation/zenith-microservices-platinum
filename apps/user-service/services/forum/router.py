"""
Forum Service Router
FastAPI router for forum management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...core.database import get_db
from . import models, schemas

router = APIRouter()

class ForumService:
    def __init__(self, db: Session):
        self.db = db

    def get_topics(self, skip: int = 0, limit: int = 10, category_id: Optional[int] = None):
        """Get forum topics with pagination"""
        query = self.db.query(models.ForumTopic)
        if category_id:
            query = query.filter(models.ForumTopic.category_id == category_id)
        topics = query.offset(skip).limit(limit).all()
        return topics

    def get_topic(self, topic_id: int):
        """Get a single forum topic"""
        topic = self.db.query(models.ForumTopic).filter(
            models.ForumTopic.id == topic_id
        ).first()
        if not topic:
            raise HTTPException(status_code=404, detail="Topic not found")
        return topic

    def create_topic(self, topic_data: Dict[str, Any], author_id: str):
        """Create a new forum topic"""
        topic = models.ForumTopic(
            title=topic_data["title"],
            content=topic_data["content"],
            category_id=topic_data["category_id"],
            author_id=author_id,
            created_at=datetime.utcnow()
        )
        self.db.add(topic)
        self.db.commit()
        self.db.refresh(topic)
        return topic

    def create_post(self, post_data: Dict[str, Any], author_id: str):
        """Create a new forum post"""
        post = models.ForumPost(
            topic_id=post_data["topic_id"],
            content=post_data["content"],
            author_id=author_id,
            created_at=datetime.utcnow()
        )
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

@router.get("/topics", response_model=List[schemas.ForumTopicResponse])
async def get_topics(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    category_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get forum topics with pagination and filtering"""
    service = ForumService(db)
    topics = service.get_topics(skip=skip, limit=limit, category_id=category_id)
    return topics

@router.get("/topics/{topic_id}", response_model=schemas.ForumTopicResponse)
async def get_topic(
    topic_id: int,
    db: Session = Depends(get_db)
):
    """Get a single forum topic by ID"""
    service = ForumService(db)
    return service.get_topic(topic_id)

@router.post("/topics", response_model=schemas.ForumTopicResponse)
async def create_topic(
    topic: schemas.ForumTopicCreate,
    author_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Create a new forum topic"""
    service = ForumService(db)
    return service.create_topic(topic.dict(), author_id)

@router.get("/topics/{topic_id}/posts", response_model=List[schemas.ForumPostResponse])
async def get_topic_posts(
    topic_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get posts for a forum topic"""
    posts = db.query(models.ForumPost).filter(
        models.ForumPost.topic_id == topic_id
    ).offset(skip).limit(limit).all()
    return posts

@router.post("/topics/{topic_id}/posts", response_model=schemas.ForumPostResponse)
async def create_post(
    topic_id: int,
    post: schemas.ForumPostCreate,
    author_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Create a new post in a forum topic"""
    # Verify topic exists
    topic = db.query(models.ForumTopic).filter(models.ForumTopic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    service = ForumService(db)
    return service.create_post({"topic_id": topic_id, **post.dict()}, author_id)

@router.get("/categories", response_model=List[schemas.ForumCategoryResponse])
async def get_categories(
    db: Session = Depends(get_db)
):
    """Get all forum categories"""
    categories = db.query(models.ForumCategory).all()
    return categories

@router.get("/statistics")
async def get_statistics(
    db: Session = Depends(get_db)
):
    """Get forum statistics"""
    total_topics = db.query(models.ForumTopic).count()
    total_posts = db.query(models.ForumPost).count()
    total_categories = db.query(models.ForumCategory).count()
    active_users = db.query(models.ForumPost.author_id).distinct().count()

    return {
        "total_topics": total_topics,
        "total_posts": total_posts,
        "total_categories": total_categories,
        "active_users": active_users
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "zenith-forum",
        "version": "1.0.0"
    }
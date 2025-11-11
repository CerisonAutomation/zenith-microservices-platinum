"""
Blog Service Router
FastAPI router for blog management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...core.database import get_db
from . import models, schemas

router = APIRouter()

# Blog service functions (simplified versions)
class BlogService:
    def __init__(self, db: Session):
        self.db = db

    def get_posts(self, skip: int = 0, limit: int = 10, status: str = "published"):
        """Get blog posts with pagination"""
        posts = self.db.query(models.BlogPost).filter(
            models.BlogPost.status == status
        ).offset(skip).limit(limit).all()
        return posts

    def get_post(self, post_id: int):
        """Get a single blog post"""
        post = self.db.query(models.BlogPost).filter(
            models.BlogPost.id == post_id
        ).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        return post

    def create_post(self, post_data: Dict[str, Any], author_id: str):
        """Create a new blog post"""
        post = models.BlogPost(
            title=post_data["title"],
            content=post_data["content"],
            excerpt=post_data.get("excerpt"),
            author_id=author_id,
            status=post_data.get("status", "draft"),
            published_at=datetime.utcnow() if post_data.get("status") == "published" else None
        )
        self.db.add(post)
        self.db.commit()
        self.db.refresh(post)
        return post

    def update_post(self, post_id: int, post_data: Dict[str, Any], author_id: str):
        """Update a blog post"""
        post = self.get_post(post_id)
        if post.author_id != author_id:
            raise HTTPException(status_code=403, detail="Not authorized to update this post")

        for key, value in post_data.items():
            setattr(post, key, value)

        if post_data.get("status") == "published" and not post.published_at:
            post.published_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(post)
        return post

    def delete_post(self, post_id: int, author_id: str):
        """Delete a blog post"""
        post = self.get_post(post_id)
        if post.author_id != author_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this post")

        self.db.delete(post)
        self.db.commit()
        return {"message": "Post deleted successfully"}

@router.get("/posts", response_model=List[schemas.BlogPostResponse])
async def get_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query("published", regex="^(draft|published|archived)$"),
    db: Session = Depends(get_db)
):
    """Get blog posts with pagination and filtering"""
    service = BlogService(db)
    posts = service.get_posts(skip=skip, limit=limit, status=status)
    return posts

@router.get("/posts/{post_id}", response_model=schemas.BlogPostResponse)
async def get_post(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get a single blog post by ID"""
    service = BlogService(db)
    return service.get_post(post_id)

@router.post("/posts", response_model=schemas.BlogPostResponse)
async def create_post(
    post: schemas.BlogPostCreate,
    author_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Create a new blog post"""
    service = BlogService(db)
    return service.create_post(post.dict(), author_id)

@router.put("/posts/{post_id}", response_model=schemas.BlogPostResponse)
async def update_post(
    post_id: int,
    post_update: schemas.BlogPostUpdate,
    author_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Update an existing blog post"""
    service = BlogService(db)
    return service.update_post(post_id, post_update.dict(exclude_unset=True), author_id)

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    author_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Delete a blog post"""
    service = BlogService(db)
    return service.delete_post(post_id, author_id)

@router.get("/categories", response_model=List[schemas.BlogCategoryResponse])
async def get_categories(
    db: Session = Depends(get_db)
):
    """Get all blog categories"""
    categories = db.query(models.BlogCategory).all()
    return categories

@router.get("/tags", response_model=List[schemas.BlogTagResponse])
async def get_tags(
    db: Session = Depends(get_db)
):
    """Get all blog tags"""
    tags = db.query(models.BlogTag).all()
    return tags

@router.post("/posts/{post_id}/comments", response_model=schemas.BlogCommentResponse)
async def create_comment(
    post_id: int,
    comment: schemas.BlogCommentCreate,
    user_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Create a comment on a blog post"""
    # Verify post exists
    post = db.query(models.BlogPost).filter(models.BlogPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    new_comment = models.BlogComment(
        post_id=post_id,
        user_id=user_id,
        content=comment.content,
        status="pending"  # Moderation queue
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/posts/{post_id}/comments", response_model=List[schemas.BlogCommentResponse])
async def get_post_comments(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get comments for a blog post"""
    comments = db.query(models.BlogComment).filter(
        models.BlogComment.post_id == post_id,
        models.BlogComment.status == "approved"
    ).all()
    return comments

@router.get("/statistics")
async def get_statistics(
    db: Session = Depends(get_db)
):
    """Get blog statistics"""
    total_posts = db.query(models.BlogPost).count()
    published_posts = db.query(models.BlogPost).filter(models.BlogPost.status == "published").count()
    total_comments = db.query(models.BlogComment).count()
    approved_comments = db.query(models.BlogComment).filter(models.BlogComment.status == "approved").count()

    return {
        "total_posts": total_posts,
        "published_posts": published_posts,
        "total_comments": total_comments,
        "approved_comments": approved_comments
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "zenith-blog",
        "version": "1.0.0"
    }
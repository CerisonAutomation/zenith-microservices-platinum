"""
Gallery Service Router
FastAPI router for gallery management endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime

from ...core.database import get_db
from . import models, schemas

router = APIRouter()

class GalleryService:
    def __init__(self, db: Session):
        self.db = db

    def get_albums(self, user_id: Optional[str] = None, skip: int = 0, limit: int = 10):
        """Get photo albums with pagination"""
        query = self.db.query(models.Album)
        if user_id:
            query = query.filter(models.Album.author_id == int(user_id))
        albums = query.offset(skip).limit(limit).all()
        return albums

    def get_album(self, album_id: int):
        """Get a single photo album"""
        album = self.db.query(models.Album).filter(
            models.Album.id == album_id
        ).first()
        if not album:
            raise HTTPException(status_code=404, detail="Album not found")
        return album

    def create_album(self, album_data: Dict[str, Any], user_id: str):
        """Create a new photo album"""
        album = models.Album(
            title=album_data["title"],
            slug=album_data["slug"],
            description=album_data.get("description"),
            category_id=album_data["category_id"],
            author_id=int(user_id),
            status=album_data.get("status", "published"),
            is_featured=album_data.get("is_featured", False),
            allow_comments=album_data.get("allow_comments", True),
            allow_ratings=album_data.get("allow_ratings", True),
            created_at=datetime.utcnow()
        )
        self.db.add(album)
        self.db.commit()
        self.db.refresh(album)
        return album

    def get_photos(self, album_id: Optional[int] = None, user_id: Optional[str] = None, skip: int = 0, limit: int = 20):
        """Get photos with filtering"""
        query = self.db.query(models.Photo)
        if album_id:
            query = query.filter(models.Photo.album_id == album_id)
        if user_id:
            query = query.filter(models.Photo.author_id == int(user_id))
        photos = query.offset(skip).limit(limit).all()
        return photos

    def upload_photo(self, photo_data: Dict[str, Any], user_id: str):
        """Upload a new photo"""
        photo = models.Photo(
            title=photo_data.get("title"),
            description=photo_data.get("description"),
            image_url=photo_data["image_url"],
            album_id=photo_data["album_id"],
            author_id=int(user_id),
            status="published",
            allow_comments=photo_data.get("allow_comments", True),
            created_at=datetime.utcnow()
        )
        self.db.add(photo)
        self.db.commit()
        self.db.refresh(photo)
        return photo

@router.get("/albums", response_model=List[schemas.AlbumSummary])
async def get_albums(
    user_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get photo albums with pagination and filtering"""
    service = GalleryService(db)
    albums = service.get_albums(user_id=user_id, skip=skip, limit=limit)
    return albums

@router.get("/albums/{album_id}", response_model=schemas.Album)
async def get_album(
    album_id: int,
    db: Session = Depends(get_db)
):
    """Get a single photo album by ID"""
    service = GalleryService(db)
    return service.get_album(album_id)

@router.post("/albums", response_model=schemas.Album)
async def create_album(
    album: schemas.AlbumCreate,
    user_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Create a new photo album"""
    service = GalleryService(db)
    return service.create_album(album.dict(), user_id)

@router.get("/photos", response_model=List[schemas.PhotoSummary])
async def get_photos(
    album_id: Optional[int] = None,
    user_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get photos with filtering and pagination"""
    service = GalleryService(db)
    photos = service.get_photos(album_id=album_id, user_id=user_id, skip=skip, limit=limit)
    return photos

@router.post("/photos", response_model=schemas.Photo)
async def upload_photo(
    photo: schemas.PhotoCreate,
    user_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Upload a new photo"""
    service = GalleryService(db)
    return service.upload_photo(photo.dict(), user_id)

@router.get("/albums/{album_id}/photos", response_model=List[schemas.PhotoSummary])
async def get_album_photos(
    album_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get photos for a specific album"""
    service = GalleryService(db)
    photos = service.get_photos(album_id=album_id, skip=skip, limit=limit)
    return photos

@router.post("/photos/{photo_id}/like")
async def like_photo(
    photo_id: int,
    user_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Like a photo"""
    # Check if photo exists
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Check if already liked
    existing_like = db.query(models.PhotoLike).filter(
        models.PhotoLike.photo_id == photo_id,
        models.PhotoLike.user_id == user_id
    ).first()

    if existing_like:
        raise HTTPException(status_code=400, detail="Photo already liked")

    # Create like
    like = models.PhotoLike(
        photo_id=photo_id,
        user_id=user_id,
        created_at=datetime.utcnow()
    )
    db.add(like)
    db.commit()

    return {"message": "Photo liked successfully"}

@router.delete("/photos/{photo_id}/like")
async def unlike_photo(
    photo_id: int,
    user_id: str,  # This would come from auth middleware
    db: Session = Depends(get_db)
):
    """Unlike a photo"""
    like = db.query(models.PhotoLike).filter(
        models.PhotoLike.photo_id == photo_id,
        models.PhotoLike.user_id == user_id
    ).first()

    if not like:
        raise HTTPException(status_code=404, detail="Like not found")

    db.delete(like)
    db.commit()

    return {"message": "Photo unliked successfully"}

@router.get("/statistics")
async def get_statistics(
    db: Session = Depends(get_db)
):
    """Get gallery statistics"""
    total_albums = db.query(models.Album).count()
    total_photos = db.query(models.Photo).count()
    total_likes = db.query(models.PhotoLike).count() if hasattr(models, 'PhotoLike') else 0

    return {
        "total_albums": total_albums,
        "total_photos": total_photos,
        "total_likes": total_likes
    }

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "zenith-gallery",
        "version": "1.0.0"
    }
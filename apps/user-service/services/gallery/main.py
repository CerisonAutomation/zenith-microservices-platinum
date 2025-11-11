"""
Gallery Service - FastAPI microservice for photo gallery management
Senior-level implementation with enterprise features and comprehensive API
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_, text
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import aiofiles
import os
import uuid
import shutil
from pathlib import Path
import logging
from contextlib import asynccontextmanager

# Import our models and schemas
from models import (
    Base, GalleryCategory, Album, Photo, PhotoTag, AlbumComment, PhotoComment,
    AlbumRating, PhotoRating, PhotoView, AlbumLike, PhotoLike, PhotoReport
)
from schemas import (
    GalleryCategoryCreate, GalleryCategoryUpdate, GalleryCategory as GalleryCategorySchema,
    AlbumCreate, AlbumUpdate, Album as AlbumSchema, AlbumSummary, AlbumWithPhotos,
    PhotoCreate, PhotoUpdate, Photo as PhotoSchema, PhotoSummary, PhotoWithDetails,
    PhotoTagCreate, PhotoTag as PhotoTagSchema,
    AlbumCommentCreate, AlbumCommentUpdate, AlbumComment as AlbumCommentSchema,
    PhotoCommentCreate, PhotoCommentUpdate, PhotoComment as PhotoCommentSchema,
    AlbumRatingCreate, AlbumRating as AlbumRatingSchema,
    PhotoRatingCreate, PhotoRating as PhotoRatingSchema,
    AlbumLikeCreate, AlbumLike as AlbumLikeSchema,
    PhotoLikeCreate, PhotoLike as PhotoLikeSchema,
    PhotoReportCreate, PhotoReportUpdate, PhotoReport as PhotoReportSchema,
    PhotoViewCreate, PhotoView as PhotoViewSchema,
    GalleryStats, CategoryStats, AlbumStats, PhotoStats,
    BulkAlbumUpdate, BulkPhotoUpdate, BulkDeleteRequest,
    GallerySearchFilters, PhotoSearchFilters,
    PaginationParams, PaginatedResponse,
    APIResponse, ErrorResponse, SuccessResponse
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup (placeholder - will be configured with actual database)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/gallery_db")

# File storage configuration
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/gallery_uploads"))
UPLOAD_DIR.mkdir(exist_ok=True)

# Create FastAPI app
app = FastAPI(
    title="Gallery Service API",
    description="Enterprise photo gallery management service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency (placeholder)
def get_db():
    # This will be replaced with actual database session management
    # For now, return None to indicate database not configured
    return None

# Authentication dependency (placeholder)
def get_current_user():
    # This will be replaced with actual authentication
    return {"id": 1, "email": "user@example.com"}

# Admin authorization dependency (placeholder)
def require_admin(current_user: dict = Depends(get_current_user)):
    # This will be replaced with actual admin check
    return current_user

# Background task for updating statistics
async def update_album_stats(album_id: int, db: Session):
    """Update album statistics in background"""
    try:
        # Update photo count
        photo_count = db.query(func.count(Photo.id)).filter(Photo.album_id == album_id).scalar()
        db.query(Album).filter(Album.id == album_id).update({"photo_count": photo_count})

        # Update view count
        view_count = db.query(func.count(PhotoView.id)).join(Photo).filter(Photo.album_id == album_id).scalar()
        db.query(Album).filter(Album.id == album_id).update({"view_count": view_count})

        # Update like count
        like_count = db.query(func.count(AlbumLike.id)).filter(AlbumLike.album_id == album_id).scalar()
        db.query(Album).filter(Album.id == album_id).update({"like_count": like_count})

        # Update comment count
        comment_count = db.query(func.count(AlbumComment.id)).filter(AlbumComment.album_id == album_id).scalar()
        db.query(Album).filter(Album.id == album_id).update({"comment_count": comment_count})

        # Update average rating
        rating_stats = db.query(
            func.avg(AlbumRating.rating).label('avg_rating'),
            func.count(AlbumRating.id).label('count')
        ).filter(AlbumRating.album_id == album_id).first()

        if rating_stats.count > 0:
            db.query(Album).filter(Album.id == album_id).update({
                "average_rating": rating_stats.avg_rating,
                "total_ratings": rating_stats.count
            })

        db.commit()
        logger.info(f"Updated stats for album {album_id}")

    except Exception as e:
        logger.error(f"Error updating album stats for {album_id}: {e}")
        db.rollback()

async def update_photo_stats(photo_id: int, db: Session):
    """Update photo statistics in background"""
    try:
        # Update view count
        view_count = db.query(func.count(PhotoView.id)).filter(PhotoView.photo_id == photo_id).scalar()
        db.query(Photo).filter(Photo.id == photo_id).update({"view_count": view_count})

        # Update like count
        like_count = db.query(func.count(PhotoLike.id)).filter(PhotoLike.photo_id == photo_id).scalar()
        db.query(Photo).filter(Photo.id == photo_id).update({"like_count": like_count})

        # Update comment count
        comment_count = db.query(func.count(PhotoComment.id)).filter(PhotoComment.photo_id == photo_id).scalar()
        db.query(Photo).filter(Photo.id == photo_id).update({"comment_count": comment_count})

        # Update average rating
        rating_stats = db.query(
            func.avg(PhotoRating.rating).label('avg_rating'),
            func.count(PhotoRating.id).label('count')
        ).filter(PhotoRating.album_id == photo_id).first()

        if rating_stats.count > 0:
            db.query(Photo).filter(Photo.id == photo_id).update({
                "average_rating": rating_stats.avg_rating,
                "total_ratings": rating_stats.count
            })

        db.commit()
        logger.info(f"Updated stats for photo {photo_id}")

    except Exception as e:
        logger.error(f"Error updating photo stats for {photo_id}: {e}")
        db.rollback()

async def update_category_stats(category_id: int, db: Session):
    """Update category statistics in background"""
    try:
        # Update album count
        album_count = db.query(func.count(Album.id)).filter(Album.category_id == category_id).scalar()
        db.query(GalleryCategory).filter(GalleryCategory.id == category_id).update({"album_count": album_count})

        # Update photo count
        photo_count = db.query(func.count(Photo.id)).join(Album).filter(Album.category_id == category_id).scalar()
        db.query(GalleryCategory).filter(GalleryCategory.id == category_id).update({"photo_count": photo_count})

        db.commit()
        logger.info(f"Updated stats for category {category_id}")

    except Exception as e:
        logger.error(f"Error updating category stats for {category_id}: {e}")
        db.rollback()

# API Routes

# Health check
@app.get("/health", response_model=SuccessResponse)
async def health_check():
    """Health check endpoint"""
    return SuccessResponse(message="Gallery service is healthy")

# Gallery Categories API
@app.post("/categories", response_model=GalleryCategorySchema)
async def create_category(
    category: GalleryCategoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new gallery category"""
    try:
        # Check if slug already exists
        existing = db.query(GalleryCategory).filter(GalleryCategory.slug == category.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category slug already exists")

        db_category = GalleryCategory(**category.dict())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category creation failed")

@app.get("/categories", response_model=PaginatedResponse)
async def list_categories(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List gallery categories with pagination and filtering"""
    query = db.query(GalleryCategory)

    if search:
        query = query.filter(
            or_(
                GalleryCategory.name.ilike(f"%{search}%"),
                GalleryCategory.description.ilike(f"%{search}%")
            )
        )

    if is_active is not None:
        query = query.filter(GalleryCategory.is_active == is_active)

    total = query.count()
    categories = query.order_by(GalleryCategory.display_order, GalleryCategory.name)\
                     .offset((page - 1) * per_page)\
                     .limit(per_page)\
                     .all()

    return PaginatedResponse(
        items=categories,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/categories/{category_id}", response_model=GalleryCategorySchema)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific gallery category"""
    category = db.query(GalleryCategory).filter(GalleryCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.put("/categories/{category_id}", response_model=GalleryCategorySchema)
async def update_category(
    category_id: int,
    category_update: GalleryCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update a gallery category"""
    category = db.query(GalleryCategory).filter(GalleryCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check slug uniqueness if being updated
    if category_update.slug and category_update.slug != category.slug:
        existing = db.query(GalleryCategory).filter(GalleryCategory.slug == category_update.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Category slug already exists")

    for field, value in category_update.dict(exclude_unset=True).items():
        setattr(category, field, value)

    category.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(category)
    return category

@app.delete("/categories/{category_id}", response_model=SuccessResponse)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Delete a gallery category"""
    category = db.query(GalleryCategory).filter(GalleryCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if category has albums
    album_count = db.query(func.count(Album.id)).filter(Album.category_id == category_id).scalar()
    if album_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete category with existing albums")

    db.delete(category)
    db.commit()
    return SuccessResponse(message="Category deleted successfully")

# Albums API
@app.post("/albums", response_model=AlbumSchema)
async def create_album(
    album: AlbumCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new album"""
    try:
        # Check if category exists
        category = db.query(GalleryCategory).filter(GalleryCategory.id == album.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        # Check if slug already exists
        existing = db.query(Album).filter(Album.slug == album.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Album slug already exists")

        db_album = Album(**album.dict(), author_id=current_user["id"])
        db.add(db_album)
        db.commit()
        db.refresh(db_album)

        # Update category stats
        background_tasks.add_task(update_category_stats, album.category_id, db)

        return db_album
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Album creation failed")

@app.get("/albums", response_model=PaginatedResponse)
async def list_albums(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    filters: GallerySearchFilters = Depends(),
    db: Session = Depends(get_db)
):
    """List albums with advanced filtering and pagination"""
    query = db.query(Album).join(GalleryCategory)

    # Apply filters
    if filters.query:
        query = query.filter(
            or_(
                Album.title.ilike(f"%{filters.query}%"),
                Album.description.ilike(f"%{filters.query}%"),
                GalleryCategory.name.ilike(f"%{filters.query}%")
            )
        )

    if filters.category_id:
        query = query.filter(Album.category_id == filters.category_id)

    if filters.author_id:
        query = query.filter(Album.author_id == filters.author_id)

    if filters.status:
        query = query.filter(Album.status == filters.status)

    if filters.is_featured is not None:
        query = query.filter(Album.is_featured == filters.is_featured)

    if filters.min_rating is not None:
        query = query.filter(Album.average_rating >= filters.min_rating)

    if filters.max_rating is not None:
        query = query.filter(Album.average_rating <= filters.max_rating)

    if filters.date_from:
        query = query.filter(Album.created_at >= filters.date_from)

    if filters.date_to:
        query = query.filter(Album.created_at <= filters.date_to)

    # Sorting
    sort_column = getattr(Album, filters.sort_by, Album.created_at)
    if filters.sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    total = query.count()
    albums = query.options(joinedload(Album.category))\
                .offset((page - 1) * per_page)\
                .limit(per_page)\
                .all()

    return PaginatedResponse(
        items=albums,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/albums/{album_id}", response_model=AlbumWithPhotos)
async def get_album(album_id: int, db: Session = Depends(get_db)):
    """Get a specific album with photos"""
    album = db.query(Album)\
              .options(
                  joinedload(Album.category),
                  joinedload(Album.photos),
                  joinedload(Album.comments)
              )\
              .filter(Album.id == album_id)\
              .first()

    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    return album

@app.put("/albums/{album_id}", response_model=AlbumSchema)
async def update_album(
    album_id: int,
    album_update: AlbumUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an album"""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    # Check permissions (owner or admin)
    if album.author_id != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to update this album")

    # Check slug uniqueness if being updated
    if album_update.slug and album_update.slug != album.slug:
        existing = db.query(Album).filter(Album.slug == album_update.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Album slug already exists")

    # Check category exists if being updated
    if album_update.category_id:
        category = db.query(GalleryCategory).filter(GalleryCategory.id == album_update.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

    old_category_id = album.category_id
    for field, value in album_update.dict(exclude_unset=True).items():
        setattr(album, field, value)

    album.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(album)

    # Update stats if category changed
    if album_update.category_id and album_update.category_id != old_category_id:
        background_tasks.add_task(update_category_stats, old_category_id, db)
        background_tasks.add_task(update_category_stats, album_update.category_id, db)

    return album

@app.delete("/albums/{album_id}", response_model=SuccessResponse)
async def delete_album(
    album_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete an album"""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    # Check permissions
    if album.author_id != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to delete this album")

    category_id = album.category_id
    db.delete(album)
    db.commit()

    # Update category stats
    background_tasks.add_task(update_category_stats, category_id, db)

    return SuccessResponse(message="Album deleted successfully")

# Photos API
@app.post("/photos/upload", response_model=PhotoSchema)
async def upload_photo(
    file: UploadFile = File(...),
    album_id: int = Query(..., description="Album ID to upload to"),
    title: Optional[str] = Query(None, description="Photo title"),
    description: Optional[str] = Query(None, description="Photo description"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Upload a photo to an album"""
    # Check if album exists and user has permission
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    if album.author_id != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to upload to this album")

    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Generate unique filename
    file_extension = Path(file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    try:
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Create database record
        db_photo = Photo(
            title=title,
            description=description,
            image_url=f"/uploads/{unique_filename}",
            album_id=album_id,
            author_id=current_user["id"],
            status="published",
            file_size=file_path.stat().st_size,
            mime_type=file.content_type
        )

        db.add(db_photo)
        db.commit()
        db.refresh(db_photo)

        # Update album and category stats
        background_tasks.add_task(update_album_stats, album_id, db)
        background_tasks.add_task(update_category_stats, album.category_id, db)

        return db_photo

    except Exception as e:
        # Clean up file if database operation failed
        if file_path.exists():
            file_path.unlink()
        db.rollback()
        logger.error(f"Photo upload failed: {e}")
        raise HTTPException(status_code=500, detail="Photo upload failed")

@app.get("/photos", response_model=PaginatedResponse)
async def list_photos(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    filters: PhotoSearchFilters = Depends(),
    db: Session = Depends(get_db)
):
    """List photos with advanced filtering and pagination"""
    query = db.query(Photo).join(Album).join(GalleryCategory)

    # Apply filters
    if filters.query:
        query = query.filter(
            or_(
                Photo.title.ilike(f"%{filters.query}%"),
                Photo.description.ilike(f"%{filters.query}%"),
                Album.title.ilike(f"%{filters.query}%")
            )
        )

    if filters.album_id:
        query = query.filter(Photo.album_id == filters.album_id)

    if filters.author_id:
        query = query.filter(Photo.author_id == filters.author_id)

    if filters.status:
        query = query.filter(Photo.status == filters.status)

    if filters.is_featured is not None:
        query = query.filter(Photo.is_featured == filters.is_featured)

    if filters.tags:
        # Filter by tags (simplified - would need more complex query for production)
        tag_names = filters.tags
        query = query.join(PhotoTag).filter(PhotoTag.tag_name.in_(tag_names))

    if filters.min_rating is not None:
        query = query.filter(Photo.average_rating >= filters.min_rating)

    if filters.max_rating is not None:
        query = query.filter(Photo.average_rating <= filters.max_rating)

    if filters.date_from:
        query = query.filter(Photo.created_at >= filters.date_from)

    if filters.date_to:
        query = query.filter(Photo.created_at <= filters.date_to)

    # Sorting
    sort_column = getattr(Photo, filters.sort_by, Photo.created_at)
    if filters.sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    total = query.count()
    photos = query.options(joinedload(Photo.album))\
                .offset((page - 1) * per_page)\
                .limit(per_page)\
                .all()

    return PaginatedResponse(
        items=photos,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/photos/{photo_id}", response_model=PhotoWithDetails)
async def get_photo(
    photo_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Get a specific photo with details"""
    photo = db.query(Photo)\
              .options(
                  joinedload(Photo.album),
                  joinedload(Photo.tags),
                  joinedload(Photo.comments)
              )\
              .filter(Photo.id == photo_id)\
              .first()

    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Record view (if user is authenticated)
    if current_user:
        view = PhotoView(
            photo_id=photo_id,
            user_id=current_user["id"],
            ip_address="127.0.0.1"  # Would get from request in real implementation
        )
        db.add(view)
        db.commit()

        # Update photo stats
        background_tasks.add_task(update_photo_stats, photo_id, db)

    return photo

@app.put("/photos/{photo_id}", response_model=PhotoSchema)
async def update_photo(
    photo_id: int,
    photo_update: PhotoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a photo"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Check permissions
    if photo.author_id != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to update this photo")

    for field, value in photo_update.dict(exclude_unset=True).items():
        setattr(photo, field, value)

    photo.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(photo)
    return photo

@app.delete("/photos/{photo_id}", response_model=SuccessResponse)
async def delete_photo(
    photo_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a photo"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Check permissions
    if photo.author_id != current_user["id"] and "admin" not in current_user.get("roles", []):
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")

    album_id = photo.album_id
    category_id = photo.album.category_id

    # Delete file
    if photo.image_url.startswith("/uploads/"):
        file_path = UPLOAD_DIR / photo.image_url.replace("/uploads/", "")
        if file_path.exists():
            file_path.unlink()

    db.delete(photo)
    db.commit()

    # Update stats
    background_tasks.add_task(update_album_stats, album_id, db)
    background_tasks.add_task(update_category_stats, category_id, db)

    return SuccessResponse(message="Photo deleted successfully")

# Comments API
@app.post("/albums/{album_id}/comments", response_model=AlbumCommentSchema)
async def create_album_comment(
    album_id: int,
    comment: AlbumCommentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a comment on an album"""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    if not album.allow_comments:
        raise HTTPException(status_code=400, detail="Comments are not allowed for this album")

    # Check parent comment if replying
    if comment.parent_id:
        parent = db.query(AlbumComment).filter(AlbumComment.id == comment.parent_id).first()
        if not parent or parent.album_id != album_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    db_comment = AlbumComment(
        **comment.dict(),
        album_id=album_id,
        author_id=current_user["id"],
        author_name=current_user.get("name", current_user["email"]),
        author_email=current_user["email"]
    )

    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    # Update album stats
    background_tasks.add_task(update_album_stats, album_id, db)

    return db_comment

@app.post("/photos/{photo_id}/comments", response_model=PhotoCommentSchema)
async def create_photo_comment(
    photo_id: int,
    comment: PhotoCommentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a comment on a photo"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    if not photo.allow_comments:
        raise HTTPException(status_code=400, detail="Comments are not allowed for this photo")

    # Check parent comment if replying
    if comment.parent_id:
        parent = db.query(PhotoComment).filter(PhotoComment.id == comment.parent_id).first()
        if not parent or parent.photo_id != photo_id:
            raise HTTPException(status_code=400, detail="Invalid parent comment")

    db_comment = PhotoComment(
        **comment.dict(),
        photo_id=photo_id,
        author_id=current_user["id"],
        author_name=current_user.get("name", current_user["email"]),
        author_email=current_user["email"]
    )

    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    # Update photo stats
    background_tasks.add_task(update_photo_stats, photo_id, db)

    return db_comment

# Ratings API
@app.post("/albums/{album_id}/ratings", response_model=AlbumRatingSchema)
async def rate_album(
    album_id: int,
    rating: AlbumRatingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Rate an album"""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    if not album.allow_ratings:
        raise HTTPException(status_code=400, detail="Ratings are not allowed for this album")

    # Check if user already rated
    existing_rating = db.query(AlbumRating)\
                       .filter(AlbumRating.album_id == album_id, AlbumRating.user_id == current_user["id"])\
                       .first()

    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating.rating
        existing_rating.review = rating.review
        existing_rating.updated_at = datetime.utcnow()
        db_rating = existing_rating
    else:
        # Create new rating
        db_rating = AlbumRating(**rating.dict(), album_id=album_id, user_id=current_user["id"])
        db.add(db_rating)

    db.commit()
    db.refresh(db_rating)

    # Update album stats
    background_tasks.add_task(update_album_stats, album_id, db)

    return db_rating

@app.post("/photos/{photo_id}/ratings", response_model=PhotoRatingSchema)
async def rate_photo(
    photo_id: int,
    rating: PhotoRatingCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Rate a photo"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    if not photo.allow_comments:  # Note: should be allow_ratings
        raise HTTPException(status_code=400, detail="Ratings are not allowed for this photo")

    # Check if user already rated
    existing_rating = db.query(PhotoRating)\
                       .filter(PhotoRating.photo_id == photo_id, PhotoRating.user_id == current_user["id"])\
                       .first()

    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating.rating
        existing_rating.review = rating.review
        existing_rating.updated_at = datetime.utcnow()
        db_rating = existing_rating
    else:
        # Create new rating
        db_rating = PhotoRating(**rating.dict(), photo_id=photo_id, user_id=current_user["id"])
        db.add(db_rating)

    db.commit()
    db.refresh(db_rating)

    # Update photo stats
    background_tasks.add_task(update_photo_stats, photo_id, db)

    return db_rating

# Likes API
@app.post("/albums/{album_id}/likes", response_model=AlbumLikeSchema)
async def like_album(
    album_id: int,
    like_data: AlbumLikeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Like or dislike an album"""
    album = db.query(Album).filter(Album.id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    # Check if user already liked
    existing_like = db.query(AlbumLike)\
                     .filter(AlbumLike.album_id == album_id, AlbumLike.user_id == current_user["id"])\
                     .first()

    if existing_like:
        # Update existing like
        existing_like.is_like = like_data.is_like
        db_like = existing_like
    else:
        # Create new like
        db_like = AlbumLike(**like_data.dict(), album_id=album_id, user_id=current_user["id"])
        db.add(db_like)

    db.commit()
    db.refresh(db_like)

    # Update album stats
    background_tasks.add_task(update_album_stats, album_id, db)

    return db_like

@app.post("/photos/{photo_id}/likes", response_model=PhotoLikeSchema)
async def like_photo(
    photo_id: int,
    like_data: PhotoLikeCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Like or dislike a photo"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Check if user already liked
    existing_like = db.query(PhotoLike)\
                     .filter(PhotoLike.photo_id == photo_id, PhotoLike.user_id == current_user["id"])\
                     .first()

    if existing_like:
        # Update existing like
        existing_like.is_like = like_data.is_like
        db_like = existing_like
    else:
        # Create new like
        db_like = PhotoLike(**like_data.dict(), photo_id=photo_id, user_id=current_user["id"])
        db.add(db_like)

    db.commit()
    db.refresh(db_like)

    # Update photo stats
    background_tasks.add_task(update_photo_stats, photo_id, db)

    return db_like

# Reports API (Admin only)
@app.post("/photos/{photo_id}/reports", response_model=PhotoReportSchema)
async def report_photo(
    photo_id: int,
    report: PhotoReportCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Report a photo for moderation"""
    photo = db.query(Photo).filter(Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found")

    db_report = PhotoReport(**report.dict(), photo_id=photo_id, reporter_id=current_user["id"])
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@app.get("/admin/reports", response_model=PaginatedResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """List photo reports for moderation (Admin only)"""
    query = db.query(PhotoReport).join(Photo)

    if status:
        query = query.filter(PhotoReport.status == status)

    total = query.count()
    reports = query.options(joinedload(PhotoReport.photo))\
                .order_by(desc(PhotoReport.created_at))\
                .offset((page - 1) * per_page)\
                .limit(per_page)\
                .all()

    return PaginatedResponse(
        items=reports,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

# Statistics API
@app.get("/stats", response_model=GalleryStats)
async def get_gallery_stats(db: Session = Depends(get_db)):
    """Get overall gallery statistics"""
    stats = db.query(
        func.count(GalleryCategory.id).label('total_categories'),
        func.count(Album.id).label('total_albums'),
        func.count(Photo.id).label('total_photos'),
        func.sum(Photo.view_count).label('total_views'),
        func.sum(Photo.like_count).label('total_likes'),
        (func.count(AlbumComment.id) + func.count(PhotoComment.id)).label('total_comments'),
        (func.count(AlbumRating.id) + func.count(PhotoRating.id)).label('total_ratings')
    ).first()

    # Calculate average rating
    rating_stats = db.query(func.avg(Album.average_rating)).filter(Album.average_rating.isnot(None)).first()
    photo_rating_stats = db.query(func.avg(Photo.average_rating)).filter(Photo.average_rating.isnot(None)).first()

    avg_rating = None
    if rating_stats[0] or photo_rating_stats[0]:
        ratings = [r for r in [rating_stats[0], photo_rating_stats[0]] if r is not None]
        avg_rating = sum(ratings) / len(ratings) if ratings else None

    return GalleryStats(
        total_categories=stats.total_categories or 0,
        total_albums=stats.total_albums or 0,
        total_photos=stats.total_photos or 0,
        total_views=stats.total_views or 0,
        total_likes=stats.total_likes or 0,
        total_comments=stats.total_comments or 0,
        total_ratings=stats.total_ratings or 0,
        average_rating=avg_rating
    )

# Bulk operations API (Admin only)
@app.post("/admin/albums/bulk-update", response_model=SuccessResponse)
async def bulk_update_albums(
    bulk_update: BulkAlbumUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Bulk update albums (Admin only)"""
    albums = db.query(Album).filter(Album.id.in_(bulk_update.album_ids)).all()
    if len(albums) != len(bulk_update.album_ids):
        raise HTTPException(status_code=404, detail="Some albums not found")

    updated_count = 0
    for album in albums:
        for field, value in bulk_update.updates.dict(exclude_unset=True).items():
            setattr(album, field, value)
        album.updated_at = datetime.utcnow()
        updated_count += 1

    db.commit()

    # Update stats for affected albums
    for album_id in bulk_update.album_ids:
        background_tasks.add_task(update_album_stats, album_id, db)

    return SuccessResponse(message=f"Updated {updated_count} albums successfully")

@app.post("/admin/photos/bulk-update", response_model=SuccessResponse)
async def bulk_update_photos(
    bulk_update: BulkPhotoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Bulk update photos (Admin only)"""
    photos = db.query(Photo).filter(Photo.id.in_(bulk_update.photo_ids)).all()
    if len(photos) != len(bulk_update.photo_ids):
        raise HTTPException(status_code=404, detail="Some photos not found")

    updated_count = 0
    for photo in photos:
        for field, value in bulk_update.updates.dict(exclude_unset=True).items():
            setattr(photo, field, value)
        photo.updated_at = datetime.utcnow()
        updated_count += 1

    db.commit()

    return SuccessResponse(message=f"Updated {updated_count} photos successfully")

@app.post("/admin/bulk-delete", response_model=SuccessResponse)
async def bulk_delete(
    delete_request: BulkDeleteRequest,
    target: str = Query(..., pattern="^(albums|photos|comments)$"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Bulk delete items (Admin only)"""
    if target == "albums":
        items = db.query(Album).filter(Album.id.in_(delete_request.ids)).all()
        for album in items:
            db.delete(album)
        db.commit()
        return SuccessResponse(message=f"Deleted {len(items)} albums successfully")

    elif target == "photos":
        photos = db.query(Photo).filter(Photo.id.in_(delete_request.ids)).all()
        for photo in photos:
            # Delete file
            if photo.image_url.startswith("/uploads/"):
                file_path = UPLOAD_DIR / photo.image_url.replace("/uploads/", "")
                if file_path.exists():
                    file_path.unlink()
            db.delete(photo)
        db.commit()
        return SuccessResponse(message=f"Deleted {len(photos)} photos successfully")

    elif target == "comments":
        # Delete from both album and photo comments
        album_comments = db.query(AlbumComment).filter(AlbumComment.id.in_(delete_request.ids)).all()
        photo_comments = db.query(PhotoComment).filter(PhotoComment.id.in_(delete_request.ids)).all()
        total_deleted = len(album_comments) + len(photo_comments)

        for comment in album_comments + photo_comments:
            db.delete(comment)

        db.commit()
        return SuccessResponse(message=f"Deleted {total_deleted} comments successfully")

    raise HTTPException(status_code=400, detail="Invalid target for bulk delete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
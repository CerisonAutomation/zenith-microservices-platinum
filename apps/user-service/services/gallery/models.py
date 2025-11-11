"""
Gallery Service Models - SQLAlchemy ORM models
Senior-level implementation with comprehensive relationships and constraints
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey,
    Index, CheckConstraint, text, func, Float, BigInteger
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class GalleryCategory(Base):
    """Gallery category model"""
    __tablename__ = "gallery_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    album_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    photo_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    albums: Mapped[List["Album"]] = relationship("Album", back_populates="category", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(name) > 0', name='gallery_categories_name_length_check'),
        CheckConstraint('length(slug) > 0', name='gallery_categories_slug_length_check'),
        CheckConstraint('display_order >= 0', name='gallery_categories_display_order_check'),
        CheckConstraint('album_count >= 0', name='gallery_categories_album_count_check'),
        CheckConstraint('photo_count >= 0', name='gallery_categories_photo_count_check'),
        Index('idx_gallery_categories_active_order', 'is_active', 'display_order'),
        Index('idx_gallery_categories_slug', 'slug'),
    )

    def __repr__(self):
        return f"<GalleryCategory(id={self.id}, name='{self.name}', slug='{self.slug}')>"

class Album(Base):
    """Photo album model"""
    __tablename__ = "albums"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cover_photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("gallery_categories.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)  # published, draft, private, deleted
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_comments: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    allow_ratings: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    photo_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_ratings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    category: Mapped["GalleryCategory"] = relationship("GalleryCategory", back_populates="albums")
    photos: Mapped[List["Photo"]] = relationship("Photo", back_populates="album", cascade="all, delete-orphan")
    comments: Mapped[List["AlbumComment"]] = relationship("AlbumComment", back_populates="album", cascade="all, delete-orphan")
    ratings: Mapped[List["AlbumRating"]] = relationship("AlbumRating", back_populates="album", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(title) > 0', name='albums_title_length_check'),
        CheckConstraint('length(slug) > 0', name='albums_slug_length_check'),
        CheckConstraint('view_count >= 0', name='albums_view_count_check'),
        CheckConstraint('like_count >= 0', name='albums_like_count_check'),
        CheckConstraint('comment_count >= 0', name='albums_comment_count_check'),
        CheckConstraint('photo_count >= 0', name='albums_photo_count_check'),
        CheckConstraint('total_ratings >= 0', name='albums_total_ratings_check'),
        CheckConstraint("status IN ('published', 'draft', 'private', 'deleted')", name='albums_status_check'),
        Index('idx_albums_author', 'author_id'),
        Index('idx_albums_category', 'category_id'),
        Index('idx_albums_status', 'status'),
        Index('idx_albums_featured', 'is_featured'),
        Index('idx_albums_slug', 'slug'),
        Index('idx_albums_created', 'created_at'),
        Index('idx_albums_views', 'view_count'),
    )

    def __repr__(self):
        return f"<Album(id={self.id}, title='{self.title}', status='{self.status}')>"

class Photo(Base):
    """Photo model"""
    __tablename__ = "photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    medium_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    large_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    file_size: Mapped[Optional[BigInteger]] = mapped_column(BigInteger, nullable=True)  # File size in bytes
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    width: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Image width in pixels
    height: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Image height in pixels
    album_id: Mapped[int] = mapped_column(Integer, ForeignKey("albums.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="published", nullable=False)  # published, processing, failed, deleted
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_comments: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_ratings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processing_progress: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0-100
    processing_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    taken_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # EXIF capture time
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # GPS location
    camera_make: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    camera_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    album: Mapped["Album"] = relationship("Album", back_populates="photos")
    comments: Mapped[List["PhotoComment"]] = relationship("PhotoComment", back_populates="photo", cascade="all, delete-orphan")
    ratings: Mapped[List["PhotoRating"]] = relationship("PhotoRating", back_populates="photo", cascade="all, delete-orphan")
    tags: Mapped[List["PhotoTag"]] = relationship("PhotoTag", back_populates="photo", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(image_url) > 0', name='photos_image_url_length_check'),
        CheckConstraint('file_size > 0', name='photos_file_size_check'),
        CheckConstraint('width > 0', name='photos_width_check'),
        CheckConstraint('height > 0', name='photos_height_check'),
        CheckConstraint('view_count >= 0', name='photos_view_count_check'),
        CheckConstraint('like_count >= 0', name='photos_like_count_check'),
        CheckConstraint('comment_count >= 0', name='photos_comment_count_check'),
        CheckConstraint('total_ratings >= 0', name='photos_total_ratings_check'),
        CheckConstraint('processing_progress >= 0 AND processing_progress <= 100', name='photos_processing_progress_check'),
        CheckConstraint("status IN ('published', 'processing', 'failed', 'deleted')", name='photos_status_check'),
        Index('idx_photos_album', 'album_id'),
        Index('idx_photos_author', 'author_id'),
        Index('idx_photos_status', 'status'),
        Index('idx_photos_featured', 'is_featured'),
        Index('idx_photos_created', 'created_at'),
        Index('idx_photos_views', 'view_count'),
    )

    def __repr__(self):
        return f"<Photo(id={self.id}, title='{self.title}', status='{self.status}')>"

class PhotoTag(Base):
    """Photo tag model"""
    __tablename__ = "photo_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    photo_id: Mapped[int] = mapped_column(Integer, ForeignKey("photos.id"), nullable=False)
    tag_name: Mapped[str] = mapped_column(String(50), nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # AI confidence score 0-1
    is_ai_generated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    photo: Mapped["Photo"] = relationship("Photo", back_populates="tags")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(tag_name) > 0', name='photo_tags_tag_name_length_check'),
        CheckConstraint('confidence >= 0 AND confidence <= 1', name='photo_tags_confidence_check'),
        Index('idx_photo_tags_photo', 'photo_id'),
        Index('idx_photo_tags_name', 'tag_name'),
        Index('idx_photo_tags_ai', 'is_ai_generated'),
    )

    def __repr__(self):
        return f"<PhotoTag(photo_id={self.photo_id}, tag_name='{self.tag_name}')>"

class AlbumComment(Base):
    """Album comment model"""
    __tablename__ = "album_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    album_id: Mapped[int] = mapped_column(Integer, ForeignKey("albums.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    author_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="approved", nullable=False)  # approved, pending, rejected
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("album_comments.id"), nullable=True)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    edited_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4/IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    album: Mapped["Album"] = relationship("Album", back_populates="comments")
    replies: Mapped[List["AlbumComment"]] = relationship("AlbumComment", back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped[Optional["AlbumComment"]] = relationship("AlbumComment", back_populates="replies", remote_side=[id])

    # Constraints
    __table_args__ = (
        CheckConstraint('length(author_name) > 0', name='album_comments_author_name_length_check'),
        CheckConstraint('length(content) > 0', name='album_comments_content_length_check'),
        CheckConstraint("status IN ('approved', 'pending', 'rejected')", name='album_comments_status_check'),
        CheckConstraint("author_email IS NULL OR author_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'", name='album_comments_email_format_check'),
        Index('idx_album_comments_album', 'album_id'),
        Index('idx_album_comments_author', 'author_id'),
        Index('idx_album_comments_status', 'status'),
        Index('idx_album_comments_parent', 'parent_id'),
        Index('idx_album_comments_created', 'created_at'),
    )

    def __repr__(self):
        return f"<AlbumComment(id={self.id}, album_id={self.album_id}, author='{self.author_name}')>"

class PhotoComment(Base):
    """Photo comment model"""
    __tablename__ = "photo_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    photo_id: Mapped[int] = mapped_column(Integer, ForeignKey("photos.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    author_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="approved", nullable=False)  # approved, pending, rejected
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("photo_comments.id"), nullable=True)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    edited_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4/IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    photo: Mapped["Photo"] = relationship("Photo", back_populates="comments")
    replies: Mapped[List["PhotoComment"]] = relationship("PhotoComment", back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped[Optional["PhotoComment"]] = relationship("PhotoComment", back_populates="replies", remote_side=[id])

    # Constraints
    __table_args__ = (
        CheckConstraint('length(author_name) > 0', name='photo_comments_author_name_length_check'),
        CheckConstraint('length(content) > 0', name='photo_comments_content_length_check'),
        CheckConstraint("status IN ('approved', 'pending', 'rejected')", name='photo_comments_status_check'),
        CheckConstraint("author_email IS NULL OR author_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'", name='photo_comments_email_format_check'),
        Index('idx_photo_comments_photo', 'photo_id'),
        Index('idx_photo_comments_author', 'author_id'),
        Index('idx_photo_comments_status', 'status'),
        Index('idx_photo_comments_parent', 'parent_id'),
        Index('idx_photo_comments_created', 'created_at'),
    )

    def __repr__(self):
        return f"<PhotoComment(id={self.id}, photo_id={self.photo_id}, author='{self.author_name}')>"

class AlbumRating(Base):
    """Album rating model"""
    __tablename__ = "album_ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    album_id: Mapped[int] = mapped_column(Integer, ForeignKey("albums.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5 stars
    review: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_helpful: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    album: Mapped["Album"] = relationship("Album", back_populates="ratings")

    # Constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='album_ratings_rating_range_check'),
        CheckConstraint("review IS NULL OR length(review) > 0", name='album_ratings_review_length_check'),
        Index('idx_album_ratings_album', 'album_id'),
        Index('idx_album_ratings_user', 'user_id'),
        Index('idx_album_ratings_unique', 'album_id', 'user_id', unique=True),
        Index('idx_album_ratings_rating', 'rating'),
    )

    def __repr__(self):
        return f"<AlbumRating(album_id={self.album_id}, user_id={self.user_id}, rating={self.rating})>"

class PhotoRating(Base):
    """Photo rating model"""
    __tablename__ = "photo_ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    photo_id: Mapped[int] = mapped_column(Integer, ForeignKey("photos.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5 stars
    review: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_helpful: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    photo: Mapped["Photo"] = relationship("Photo", back_populates="ratings")

    # Constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='photo_ratings_rating_range_check'),
        CheckConstraint("review IS NULL OR length(review) > 0", name='photo_ratings_review_length_check'),
        Index('idx_photo_ratings_photo', 'photo_id'),
        Index('idx_photo_ratings_user', 'user_id'),
        Index('idx_photo_ratings_unique', 'photo_id', 'user_id', unique=True),
        Index('idx_photo_ratings_rating', 'rating'),
    )

    def __repr__(self):
        return f"<PhotoRating(photo_id={self.photo_id}, user_id={self.user_id}, rating={self.rating})>"

class PhotoView(Base):
    """Photo view tracking model"""
    __tablename__ = "photo_views"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    photo_id: Mapped[int] = mapped_column(Integer, ForeignKey("photos.id"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # NULL for anonymous views
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)  # IPv4/IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    viewed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    photo: Mapped["Photo"] = relationship("Photo")

    # Constraints
    __table_args__ = (
        Index('idx_photo_views_photo', 'photo_id'),
        Index('idx_photo_views_user', 'user_id'),
        Index('idx_photo_views_ip', 'ip_address'),
        Index('idx_photo_views_viewed', 'viewed_at'),
    )

    def __repr__(self):
        return f"<PhotoView(photo_id={self.photo_id}, user_id={self.user_id}, viewed_at={self.viewed_at})>"

class AlbumLike(Base):
    """Album like model"""
    __tablename__ = "album_likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    album_id: Mapped[int] = mapped_column(Integer, ForeignKey("albums.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    is_like: Mapped[bool] = mapped_column(Boolean, nullable=False)  # True for like, False for dislike
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    album: Mapped["Album"] = relationship("Album")

    # Constraints
    __table_args__ = (
        Index('idx_album_likes_album', 'album_id'),
        Index('idx_album_likes_user', 'user_id'),
        Index('idx_album_likes_unique', 'album_id', 'user_id', unique=True),
    )

    def __repr__(self):
        return f"<AlbumLike(album_id={self.album_id}, user_id={self.user_id}, is_like={self.is_like})>"

class PhotoLike(Base):
    """Photo like model"""
    __tablename__ = "photo_likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    photo_id: Mapped[int] = mapped_column(Integer, ForeignKey("photos.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    is_like: Mapped[bool] = mapped_column(Boolean, nullable=False)  # True for like, False for dislike
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    photo: Mapped["Photo"] = relationship("Photo")

    # Constraints
    __table_args__ = (
        Index('idx_photo_likes_photo', 'photo_id'),
        Index('idx_photo_likes_user', 'user_id'),
        Index('idx_photo_likes_unique', 'photo_id', 'user_id', unique=True),
    )

    def __repr__(self):
        return f"<PhotoLike(photo_id={self.photo_id}, user_id={self.user_id}, is_like={self.is_like})>"

class PhotoReport(Base):
    """Photo report model for moderation"""
    __tablename__ = "photo_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    photo_id: Mapped[int] = mapped_column(Integer, ForeignKey("photos.id"), nullable=False)
    reporter_id: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, investigating, resolved, dismissed
    moderator_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    moderator_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    photo: Mapped["Photo"] = relationship("Photo")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(reason) > 0', name='photo_reports_reason_length_check'),
        CheckConstraint("status IN ('pending', 'investigating', 'resolved', 'dismissed')", name='photo_reports_status_check'),
        Index('idx_photo_reports_photo', 'photo_id'),
        Index('idx_photo_reports_reporter', 'reporter_id'),
        Index('idx_photo_reports_status', 'status'),
        Index('idx_photo_reports_created', 'created_at'),
    )

    def __repr__(self):
        return f"<PhotoReport(photo_id={self.photo_id}, reporter_id={self.reporter_id}, reason='{self.reason}', status='{self.status}')>"
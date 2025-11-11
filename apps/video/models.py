"""
Video Service Models - SQLAlchemy ORM models
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

class VideoCategory(Base):
    """Video category model"""
    __tablename__ = "video_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    video_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    videos: Mapped[List["Video"]] = relationship("Video", back_populates="category", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(name) > 0', name='video_categories_name_length_check'),
        CheckConstraint('length(slug) > 0', name='video_categories_slug_length_check'),
        CheckConstraint('display_order >= 0', name='video_categories_display_order_check'),
        CheckConstraint('video_count >= 0', name='video_categories_video_count_check'),
        Index('idx_video_categories_active_order', 'is_active', 'display_order'),
        Index('idx_video_categories_slug', 'slug'),
    )

    def __repr__(self):
        return f"<VideoCategory(id={self.id}, name='{self.name}', slug='{self.slug}')>"


class Video(Base):
    """Video model"""
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    duration: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Duration in seconds
    file_size: Mapped[Optional[BigInteger]] = mapped_column(BigInteger, nullable=True)  # File size in bytes
    mime_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)  # e.g., "1080p", "720p"
    bitrate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Bitrate in kbps
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("video_categories.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="processing", nullable=False)  # processing, published, failed, deleted
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_comments: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    allow_ratings: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    dislike_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_ratings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    processing_progress: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0-100
    processing_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    category: Mapped["VideoCategory"] = relationship("VideoCategory", back_populates="videos")
    comments: Mapped[List["VideoComment"]] = relationship("VideoComment", back_populates="video", cascade="all, delete-orphan")
    ratings: Mapped[List["VideoRating"]] = relationship("VideoRating", back_populates="video", cascade="all, delete-orphan")
    playlists: Mapped[List["PlaylistVideo"]] = relationship("PlaylistVideo", back_populates="video", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(title) > 0', name='videos_title_length_check'),
        CheckConstraint('length(slug) > 0', name='videos_slug_length_check'),
        CheckConstraint('length(video_url) > 0', name='videos_video_url_length_check'),
        CheckConstraint('duration > 0', name='videos_duration_check'),
        CheckConstraint('file_size > 0', name='videos_file_size_check'),
        CheckConstraint('bitrate > 0', name='videos_bitrate_check'),
        CheckConstraint('view_count >= 0', name='videos_view_count_check'),
        CheckConstraint('like_count >= 0', name='videos_like_count_check'),
        CheckConstraint('dislike_count >= 0', name='videos_dislike_count_check'),
        CheckConstraint('comment_count >= 0', name='videos_comment_count_check'),
        CheckConstraint('total_ratings >= 0', name='videos_total_ratings_check'),
        CheckConstraint('processing_progress >= 0 AND processing_progress <= 100', name='videos_processing_progress_check'),
        CheckConstraint("status IN ('processing', 'published', 'failed', 'deleted')", name='videos_status_check'),
        CheckConstraint("resolution IN ('240p', '360p', '480p', '720p', '1080p', '1440p', '2160p')", name='videos_resolution_check'),
        Index('idx_videos_author', 'author_id'),
        Index('idx_videos_category', 'category_id'),
        Index('idx_videos_status', 'status'),
        Index('idx_videos_published', 'published_at'),
        Index('idx_videos_featured', 'is_featured'),
        Index('idx_videos_private', 'is_private'),
        Index('idx_videos_slug', 'slug'),
        Index('idx_videos_created', 'created_at'),
        Index('idx_videos_views', 'view_count'),
    )

    def __repr__(self):
        return f"<Video(id={self.id}, title='{self.title}', status='{self.status}')>"


class VideoComment(Base):
    """Video comment model"""
    __tablename__ = "video_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    author_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="approved", nullable=False)  # approved, pending, rejected
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("video_comments.id"), nullable=True)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    edited_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4/IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    video: Mapped["Video"] = relationship("Video", back_populates="comments")
    replies: Mapped[List["VideoComment"]] = relationship("VideoComment", back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped[Optional["VideoComment"]] = relationship("VideoComment", back_populates="replies", remote_side=[id])

    # Constraints
    __table_args__ = (
        CheckConstraint('length(author_name) > 0', name='video_comments_author_name_length_check'),
        CheckConstraint('length(content) > 0', name='video_comments_content_length_check'),
        CheckConstraint("status IN ('approved', 'pending', 'rejected')", name='video_comments_status_check'),
        CheckConstraint("author_email IS NULL OR author_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'", name='video_comments_email_format_check'),
        Index('idx_video_comments_video', 'video_id'),
        Index('idx_video_comments_author', 'author_id'),
        Index('idx_video_comments_status', 'status'),
        Index('idx_video_comments_parent', 'parent_id'),
        Index('idx_video_comments_created', 'created_at'),
    )

    def __repr__(self):
        return f"<VideoComment(id={self.id}, video_id={self.video_id}, author='{self.author_name}')>"


class VideoRating(Base):
    """Video rating model"""
    __tablename__ = "video_ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5 stars
    review: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_helpful: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    video: Mapped["Video"] = relationship("Video", back_populates="ratings")

    # Constraints
    __table_args__ = (
        CheckConstraint('rating >= 1 AND rating <= 5', name='video_ratings_rating_range_check'),
        CheckConstraint("review IS NULL OR length(review) > 0", name='video_ratings_review_length_check'),
        Index('idx_video_ratings_video', 'video_id'),
        Index('idx_video_ratings_user', 'user_id'),
        Index('idx_video_ratings_unique', 'video_id', 'user_id', unique=True),
        Index('idx_video_ratings_rating', 'rating'),
    )

    def __repr__(self):
        return f"<VideoRating(video_id={self.video_id}, user_id={self.user_id}, rating={self.rating})>"


class VideoView(Base):
    """Video view tracking model"""
    __tablename__ = "video_views"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # NULL for anonymous views
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)  # IPv4/IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    watch_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # Watch time in seconds
    completion_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0-100
    viewed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    video: Mapped["Video"] = relationship("Video")

    # Constraints
    __table_args__ = (
        CheckConstraint('watch_time >= 0', name='video_views_watch_time_check'),
        CheckConstraint('completion_rate >= 0 AND completion_rate <= 100', name='video_views_completion_rate_check'),
        Index('idx_video_views_video', 'video_id'),
        Index('idx_video_views_user', 'user_id'),
        Index('idx_video_views_ip', 'ip_address'),
        Index('idx_video_views_viewed', 'viewed_at'),
    )

    def __repr__(self):
        return f"<VideoView(video_id={self.video_id}, user_id={self.user_id}, completion_rate={self.completion_rate})>"


class Playlist(Base):
    """Video playlist model"""
    __tablename__ = "playlists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    video_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_duration: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # Total duration in seconds
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    videos: Mapped[List["PlaylistVideo"]] = relationship("PlaylistVideo", back_populates="playlist", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(title) > 0', name='playlists_title_length_check'),
        CheckConstraint('length(slug) > 0', name='playlists_slug_length_check'),
        CheckConstraint('video_count >= 0', name='playlists_video_count_check'),
        CheckConstraint('total_duration >= 0', name='playlists_total_duration_check'),
        CheckConstraint('view_count >= 0', name='playlists_view_count_check'),
        CheckConstraint('like_count >= 0', name='playlists_like_count_check'),
        Index('idx_playlists_author', 'author_id'),
        Index('idx_playlists_public', 'is_public'),
        Index('idx_playlists_featured', 'is_featured'),
        Index('idx_playlists_slug', 'slug'),
        Index('idx_playlists_created', 'created_at'),
    )

    def __repr__(self):
        return f"<Playlist(id={self.id}, title='{self.title}', video_count={self.video_count})>"


class PlaylistVideo(Base):
    """Many-to-many relationship between playlists and videos with ordering"""
    __tablename__ = "playlist_videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    playlist_id: Mapped[int] = mapped_column(Integer, ForeignKey("playlists.id"), nullable=False)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id"), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    added_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    playlist: Mapped["Playlist"] = relationship("Playlist", back_populates="videos")
    video: Mapped["Video"] = relationship("Video", back_populates="playlists")

    # Constraints
    __table_args__ = (
        CheckConstraint('position >= 0', name='playlist_videos_position_check'),
        Index('idx_playlist_videos_playlist', 'playlist_id'),
        Index('idx_playlist_videos_video', 'video_id'),
        Index('idx_playlist_videos_position', 'playlist_id', 'position'),
        Index('idx_playlist_videos_unique', 'playlist_id', 'video_id', unique=True),
    )

    def __repr__(self):
        return f"<PlaylistVideo(playlist_id={self.playlist_id}, video_id={self.video_id}, position={self.position})>"


class VideoLike(Base):
    """Video like model"""
    __tablename__ = "video_likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    is_like: Mapped[bool] = mapped_column(Boolean, nullable=False)  # True for like, False for dislike
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    video: Mapped["Video"] = relationship("Video")

    # Constraints
    __table_args__ = (
        Index('idx_video_likes_video', 'video_id'),
        Index('idx_video_likes_user', 'user_id'),
        Index('idx_video_likes_unique', 'video_id', 'user_id', unique=True),
    )

    def __repr__(self):
        return f"<VideoLike(video_id={self.video_id}, user_id={self.user_id}, is_like={self.is_like})>"


class VideoReport(Base):
    """Video report model for moderation"""
    __tablename__ = "video_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    video_id: Mapped[int] = mapped_column(Integer, ForeignKey("videos.id"), nullable=False)
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
    video: Mapped["Video"] = relationship("Video")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(reason) > 0', name='video_reports_reason_length_check'),
        CheckConstraint("status IN ('pending', 'investigating', 'resolved', 'dismissed')", name='video_reports_status_check'),
        Index('idx_video_reports_video', 'video_id'),
        Index('idx_video_reports_reporter', 'reporter_id'),
        Index('idx_video_reports_status', 'status'),
        Index('idx_video_reports_created', 'created_at'),
    )

    def __repr__(self):
        return f"<VideoReport(video_id={self.video_id}, reporter_id={self.reporter_id}, reason='{self.reason}', status='{self.status}')>"
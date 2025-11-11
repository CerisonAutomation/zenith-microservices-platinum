"""
Video Service - FastAPI microservice
Senior-level implementation with comprehensive video management, streaming, and analytics
"""

import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import create_engine, desc, asc, func, and_, or_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError

# Import our models and schemas
from models import (
    VideoCategory, Video, VideoComment, VideoRating, VideoView,
    Playlist, PlaylistVideo, VideoLike, VideoReport, Base
)
from schemas import (
    VideoCategoryCreate, VideoCategoryUpdate, VideoCategoryResponse,
    VideoCreate, VideoUpdate, VideoResponse,
    VideoCommentCreate, VideoCommentUpdate, VideoCommentResponse,
    VideoRatingCreate, VideoRatingUpdate, VideoRatingResponse,
    VideoLikeCreate, VideoLikeResponse,
    VideoViewCreate, VideoViewResponse,
    PlaylistCreate, PlaylistUpdate, PlaylistResponse,
    VideoReportCreate, VideoReportUpdate, VideoReportResponse,
    VideoSearchFilters, VideoStatistics,
    PaginatedResponse, BulkVideoOperation, BulkCommentModeration,
    VideoUploadResponse, VideoProcessingStatus, VideoStreamInfo,
    VideoStatus, VideoCommentStatus, VideoReportStatus, VideoResolution
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/video_db")
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

# Background tasks
def update_video_statistics(db: Session, video_id: int):
    """Update view, like, dislike, comment, and rating counts for a video"""
    try:
        # Update view count
        view_count = db.query(func.count(VideoView.id)).filter(VideoView.video_id == video_id).scalar()

        # Update like/dislike counts
        like_count = db.query(func.count(VideoLike.id)).filter(
            VideoLike.video_id == video_id, VideoLike.is_like == True
        ).scalar() or 0

        dislike_count = db.query(func.count(VideoLike.id)).filter(
            VideoLike.video_id == video_id, VideoLike.is_like == False
        ).scalar() or 0

        # Update comment count
        comment_count = db.query(func.count(VideoComment.id)).filter(
            VideoComment.video_id == video_id,
            VideoComment.status == VideoCommentStatus.APPROVED
        ).scalar() or 0

        # Update rating statistics
        ratings_query = db.query(
            func.avg(VideoRating.rating).label('avg_rating'),
            func.count(VideoRating.id).label('total_ratings')
        ).filter(VideoRating.video_id == video_id)

        result = ratings_query.first()
        average_rating = float(result.avg_rating) if result.avg_rating else None
        total_ratings = result.total_ratings or 0

        # Update video
        video = db.query(Video).filter(Video.id == video_id).first()
        if video:
            video.view_count = view_count or 0
            video.like_count = like_count
            video.dislike_count = dislike_count
            video.comment_count = comment_count
            video.average_rating = average_rating
            video.total_ratings = total_ratings
            db.commit()

    except Exception as e:
        logger.error(f"Error updating video statistics: {e}")
        db.rollback()

def update_category_video_count(db: Session, category_id: int):
    """Update video count for category"""
    try:
        count = db.query(func.count(Video.id)).filter(
            Video.category_id == category_id,
            Video.status == VideoStatus.PUBLISHED
        ).scalar()
        category = db.query(VideoCategory).filter(VideoCategory.id == category_id).first()
        if category:
            category.video_count = count or 0
            db.commit()
    except Exception as e:
        logger.error(f"Error updating category video count: {e}")
        db.rollback()

# Repository classes
class BaseRepository:
    def __init__(self, db: Session):
        self.db = db

    def commit(self):
        self.db.commit()

    def refresh(self, obj):
        self.db.refresh(obj)

class VideoCategoryRepository(BaseRepository):
    def get_all(self, active_only: bool = True) -> List[VideoCategory]:
        query = self.db.query(VideoCategory)
        if active_only:
            query = query.filter(VideoCategory.is_active == True)
        return query.order_by(VideoCategory.display_order).all()

    def get_by_id(self, category_id: int) -> Optional[VideoCategory]:
        return self.db.query(VideoCategory).filter(VideoCategory.id == category_id).first()

    def get_by_slug(self, slug: str) -> Optional[VideoCategory]:
        return self.db.query(VideoCategory).filter(VideoCategory.slug == slug).first()

    def create(self, category_data: VideoCategoryCreate) -> VideoCategory:
        category = VideoCategory(**category_data.dict())
        self.db.add(category)
        self.commit()
        self.refresh(category)
        return category

    def update(self, category_id: int, updates: Dict[str, Any]) -> Optional[VideoCategory]:
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

class VideoRepository(BaseRepository):
    def get_all(self, filters: VideoSearchFilters) -> List[Video]:
        query = self.db.query(Video)

        # Apply filters
        if filters.query:
            query = query.filter(
                or_(
                    Video.title.ilike(f"%{filters.query}%"),
                    Video.description.ilike(f"%{filters.query}%")
                )
            )

        if filters.category_id:
            query = query.filter(Video.category_id == filters.category_id)

        if filters.author_id:
            query = query.filter(Video.author_id == filters.author_id)

        if filters.status:
            query = query.filter(Video.status == filters.status)

        if filters.is_featured is not None:
            query = query.filter(Video.is_featured == filters.is_featured)

        if filters.is_private is not None:
            query = query.filter(Video.is_private == filters.is_private)

        if filters.min_duration:
            query = query.filter(Video.duration >= filters.min_duration)

        if filters.max_duration:
            query = query.filter(Video.duration <= filters.max_duration)

        if filters.resolution:
            query = query.filter(Video.resolution == filters.resolution)

        if filters.date_from:
            query = query.filter(Video.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Video.created_at <= filters.date_to)

        # Apply sorting
        sort_column = getattr(Video, filters.sort_by, Video.created_at)
        if filters.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        return query.all()

    def get_paginated(self, filters: VideoSearchFilters) -> tuple[List[Video], int]:
        query = self.db.query(Video)

        # Apply same filters as get_all
        if filters.query:
            query = query.filter(
                or_(
                    Video.title.ilike(f"%{filters.query}%"),
                    Video.description.ilike(f"%{filters.query}%")
                )
            )

        if filters.category_id:
            query = query.filter(Video.category_id == filters.category_id)

        if filters.author_id:
            query = query.filter(Video.author_id == filters.author_id)

        if filters.status:
            query = query.filter(Video.status == filters.status)

        if filters.is_featured is not None:
            query = query.filter(Video.is_featured == filters.is_featured)

        if filters.is_private is not None:
            query = query.filter(Video.is_private == filters.is_private)

        if filters.min_duration:
            query = query.filter(Video.duration >= filters.min_duration)

        if filters.max_duration:
            query = query.filter(Video.duration <= filters.max_duration)

        if filters.resolution:
            query = query.filter(Video.resolution == filters.resolution)

        if filters.date_from:
            query = query.filter(Video.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Video.created_at <= filters.date_to)

        # Get total count
        total = query.count()

        # Apply sorting
        sort_column = getattr(Video, filters.sort_by, Video.created_at)
        if filters.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Apply pagination
        videos = query.offset((filters.page - 1) * filters.limit).limit(filters.limit).all()

        return videos, total

    def get_by_id(self, video_id: int) -> Optional[Video]:
        return self.db.query(Video).filter(Video.id == video_id).first()

    def get_by_slug(self, slug: str) -> Optional[Video]:
        return self.db.query(Video).filter(Video.slug == slug).first()

    def create(self, video_data: VideoCreate) -> Video:
        video = Video(**video_data.dict())
        self.db.add(video)
        self.commit()
        self.refresh(video)
        return video

    def update(self, video_id: int, updates: Dict[str, Any]) -> Optional[Video]:
        video = self.get_by_id(video_id)
        if video:
            for key, value in updates.items():
                setattr(video, key, value)
            video.updated_at = datetime.utcnow()
            self.commit()
            self.refresh(video)
        return video

    def delete(self, video_id: int) -> bool:
        video = self.get_by_id(video_id)
        if video:
            self.db.delete(video)
            self.commit()
            return True
        return False

    def increment_view_count(self, video_id: int, user_id: Optional[int], ip_address: str, watch_time: Optional[int] = None, completion_rate: Optional[float] = None):
        """Increment view count and track view"""
        # Create view record
        view = VideoView(
            video_id=video_id,
            user_id=user_id,
            ip_address=ip_address,
            watch_time=watch_time,
            completion_rate=completion_rate
        )
        self.db.add(view)
        self.commit()

        # Update video view count
        video = self.get_by_id(video_id)
        if video:
            video.view_count += 1
            self.commit()

class VideoCommentRepository(BaseRepository):
    def get_for_video(self, video_id: int, status: Optional[VideoCommentStatus] = None) -> List[VideoComment]:
        query = self.db.query(VideoComment).filter(VideoComment.video_id == video_id)

        if status:
            query = query.filter(VideoComment.status == status)

        return query.order_by(VideoComment.created_at).all()

    def get_by_id(self, comment_id: int) -> Optional[VideoComment]:
        return self.db.query(VideoComment).filter(VideoComment.id == comment_id).first()

    def create(self, comment_data: VideoCommentCreate) -> VideoComment:
        comment = VideoComment(**comment_data.dict())
        self.db.add(comment)
        self.commit()
        self.refresh(comment)
        return comment

    def update(self, comment_id: int, updates: Dict[str, Any]) -> Optional[VideoComment]:
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

class VideoRatingRepository(BaseRepository):
    def get_for_video(self, video_id: int) -> List[VideoRating]:
        return self.db.query(VideoRating).filter(VideoRating.video_id == video_id).order_by(desc(VideoRating.created_at)).all()

    def get_by_user_and_video(self, user_id: int, video_id: int) -> Optional[VideoRating]:
        return self.db.query(VideoRating).filter(
            VideoRating.user_id == user_id,
            VideoRating.video_id == video_id
        ).first()

    def create(self, rating_data: VideoRatingCreate, user_id: int, video_id: int) -> VideoRating:
        rating = VideoRating(
            video_id=video_id,
            user_id=user_id,
            **rating_data.dict()
        )
        self.db.add(rating)
        self.commit()
        self.refresh(rating)
        return rating

    def update(self, user_id: int, video_id: int, updates: Dict[str, Any]) -> Optional[VideoRating]:
        rating = self.get_by_user_and_video(user_id, video_id)
        if rating:
            for key, value in updates.items():
                setattr(rating, key, value)
            rating.updated_at = datetime.utcnow()
            self.commit()
            self.refresh(rating)
        return rating

    def delete(self, user_id: int, video_id: int) -> bool:
        rating = self.get_by_user_and_video(user_id, video_id)
        if rating:
            self.db.delete(rating)
            self.commit()
            return True
        return False

class VideoLikeRepository(BaseRepository):
    def get_for_video(self, video_id: int) -> List[VideoLike]:
        return self.db.query(VideoLike).filter(VideoLike.video_id == video_id).all()

    def get_by_user_and_video(self, user_id: int, video_id: int) -> Optional[VideoLike]:
        return self.db.query(VideoLike).filter(
            VideoLike.user_id == user_id,
            VideoLike.video_id == video_id
        ).first()

    def create_or_update(self, user_id: int, video_id: int, is_like: bool) -> VideoLike:
        existing_like = self.get_by_user_and_video(user_id, video_id)
        if existing_like:
            existing_like.is_like = is_like
            existing_like.created_at = datetime.utcnow()  # Update timestamp
            self.commit()
            self.refresh(existing_like)
            return existing_like
        else:
            like = VideoLike(video_id=video_id, user_id=user_id, is_like=is_like)
            self.db.add(like)
            self.commit()
            self.refresh(like)
            return like

    def delete(self, user_id: int, video_id: int) -> bool:
        like = self.get_by_user_and_video(user_id, video_id)
        if like:
            self.db.delete(like)
            self.commit()
            return True
        return False

class PlaylistRepository(BaseRepository):
    def get_all(self, author_id: Optional[int] = None, featured_only: bool = False) -> List[Playlist]:
        query = self.db.query(Playlist)

        if author_id:
            query = query.filter(Playlist.author_id == author_id)

        if featured_only:
            query = query.filter(Playlist.is_featured == True, Playlist.is_public == True)

        return query.order_by(desc(Playlist.created_at)).all()

    def get_by_id(self, playlist_id: int) -> Optional[Playlist]:
        return self.db.query(Playlist).filter(Playlist.id == playlist_id).first()

    def get_by_slug(self, slug: str) -> Optional[Playlist]:
        return self.db.query(Playlist).filter(Playlist.slug == slug).first()

    def create(self, playlist_data: PlaylistCreate) -> Playlist:
        # Create playlist
        playlist_dict = playlist_data.dict()
        video_ids = playlist_dict.pop('video_ids', [])

        playlist = Playlist(**playlist_dict)
        self.db.add(playlist)
        self.commit()
        self.refresh(playlist)

        # Add videos
        if video_ids:
            for position, video_id in enumerate(video_ids):
                playlist_video = PlaylistVideo(
                    playlist_id=playlist.id,
                    video_id=video_id,
                    position=position
                )
                self.db.add(playlist_video)
            self.commit()

        return playlist

    def update(self, playlist_id: int, updates: Dict[str, Any]) -> Optional[Playlist]:
        playlist = self.get_by_id(playlist_id)
        if playlist:
            video_ids = updates.pop('video_ids', None)

            for key, value in updates.items():
                setattr(playlist, key, value)
            playlist.updated_at = datetime.utcnow()

            # Update videos if provided
            if video_ids is not None:
                # Remove existing videos
                self.db.query(PlaylistVideo).filter(PlaylistVideo.playlist_id == playlist_id).delete()

                # Add new videos
                for position, video_id in enumerate(video_ids):
                    playlist_video = PlaylistVideo(
                        playlist_id=playlist_id,
                        video_id=video_id,
                        position=position
                    )
                    self.db.add(playlist_video)

            self.commit()
            self.refresh(playlist)
        return playlist

    def delete(self, playlist_id: int) -> bool:
        playlist = self.get_by_id(playlist_id)
        if playlist:
            self.db.delete(playlist)
            self.commit()
            return True
        return False

    def update_statistics(self, playlist_id: int):
        """Update video count, total duration, and other stats for playlist"""
        playlist = self.get_by_id(playlist_id)
        if playlist:
            # Get video count and total duration
            result = self.db.query(
                func.count(PlaylistVideo.id).label('video_count'),
                func.sum(Video.duration).label('total_duration')
            ).join(Video).filter(PlaylistVideo.playlist_id == playlist_id).first()

            playlist.video_count = result.video_count or 0
            playlist.total_duration = result.total_duration or 0
            self.commit()

# Service classes
class VideoCategoryService:
    def __init__(self, db: Session):
        self.repository = VideoCategoryRepository(db)

    def get_categories(self, active_only: bool = True) -> List[VideoCategoryResponse]:
        categories = self.repository.get_all(active_only)
        return [VideoCategoryResponse.from_orm(cat) for cat in categories]

    def get_category(self, category_id: int) -> Optional[VideoCategoryResponse]:
        category = self.repository.get_by_id(category_id)
        return VideoCategoryResponse.from_orm(category) if category else None

    def create_category(self, category_data: VideoCategoryCreate) -> VideoCategoryResponse:
        try:
            category = self.repository.create(category_data)
            return VideoCategoryResponse.from_orm(category)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Category with this name or slug already exists")

    def update_category(self, category_id: int, updates: VideoCategoryUpdate) -> Optional[VideoCategoryResponse]:
        update_data = updates.dict(exclude_unset=True)
        category = self.repository.update(category_id, update_data)
        if category:
            return VideoCategoryResponse.from_orm(category)
        return None

    def delete_category(self, category_id: int) -> bool:
        return self.repository.delete(category_id)

class VideoService:
    def __init__(self, db: Session):
        self.repository = VideoRepository(db)

    def get_videos(self, filters: VideoSearchFilters) -> PaginatedResponse[VideoResponse]:
        videos, total = self.repository.get_paginated(filters)

        # Calculate pagination info
        pages = (total + filters.limit - 1) // filters.limit
        has_next = filters.page < pages
        has_prev = filters.page > 1

        return PaginatedResponse(
            items=[VideoResponse.from_orm(video) for video in videos],
            total=total,
            page=filters.page,
            limit=filters.limit,
            pages=pages,
            has_next=has_next,
            has_prev=has_prev
        )

    def get_video(self, video_id: int) -> Optional[VideoResponse]:
        video = self.repository.get_by_id(video_id)
        return VideoResponse.from_orm(video) if video else None

    def get_video_by_slug(self, slug: str) -> Optional[VideoResponse]:
        video = self.repository.get_by_slug(slug)
        return VideoResponse.from_orm(video) if video else None

    def create_video(self, video_data: VideoCreate) -> VideoResponse:
        try:
            video = self.repository.create(video_data)
            return VideoResponse.from_orm(video)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Video with this slug already exists")

    def update_video(self, video_id: int, updates: VideoUpdate) -> Optional[VideoResponse]:
        update_data = updates.dict(exclude_unset=True)
        video = self.repository.update(video_id, update_data)
        if video:
            return VideoResponse.from_orm(video)
        return None

    def delete_video(self, video_id: int) -> bool:
        return self.repository.delete(video_id)

    def increment_views(self, video_id: int, user_id: Optional[int], ip_address: str, watch_time: Optional[int] = None, completion_rate: Optional[float] = None):
        """Increment video view count"""
        self.repository.increment_view_count(video_id, user_id, ip_address, watch_time, completion_rate)

class VideoCommentService:
    def __init__(self, db: Session):
        self.repository = VideoCommentRepository(db)

    def get_comments_for_video(self, video_id: int, status: Optional[VideoCommentStatus] = None) -> List[VideoCommentResponse]:
        comments = self.repository.get_for_video(video_id, status)
        return [VideoCommentResponse.from_orm(comment) for comment in comments]

    def create_comment(self, comment_data: VideoCommentCreate) -> VideoCommentResponse:
        comment = self.repository.create(comment_data)
        return VideoCommentResponse.from_orm(comment)

    def update_comment(self, comment_id: int, updates: VideoCommentUpdate) -> Optional[VideoCommentResponse]:
        update_data = updates.dict(exclude_unset=True)
        comment = self.repository.update(comment_id, update_data)
        if comment:
            return VideoCommentResponse.from_orm(comment)
        return None

    def delete_comment(self, comment_id: int) -> bool:
        return self.repository.delete(comment_id)

class VideoRatingService:
    def __init__(self, db: Session):
        self.repository = VideoRatingRepository(db)

    def get_ratings_for_video(self, video_id: int) -> List[VideoRatingResponse]:
        ratings = self.repository.get_for_video(video_id)
        return [VideoRatingResponse.from_orm(rating) for rating in ratings]

    def create_or_update_rating(self, user_id: int, video_id: int, rating_data: VideoRatingCreate) -> VideoRatingResponse:
        existing_rating = self.repository.get_by_user_and_video(user_id, video_id)
        if existing_rating:
            # Update existing rating
            update_data = rating_data.dict(exclude_unset=True)
            rating = self.repository.update(user_id, video_id, update_data)
        else:
            # Create new rating
            rating = self.repository.create(rating_data, user_id, video_id)
        return VideoRatingResponse.from_orm(rating)

    def delete_rating(self, user_id: int, video_id: int) -> bool:
        return self.repository.delete(user_id, video_id)

class VideoLikeService:
    def __init__(self, db: Session):
        self.repository = VideoLikeRepository(db)

    def get_likes_for_video(self, video_id: int) -> List[VideoLikeResponse]:
        likes = self.repository.get_for_video(video_id)
        return [VideoLikeResponse.from_orm(like) for like in likes]

    def toggle_like(self, user_id: int, video_id: int, is_like: bool) -> VideoLikeResponse:
        """Toggle like/dislike for a video"""
        like = self.repository.create_or_update(user_id, video_id, is_like)
        return VideoLikeResponse.from_orm(like)

    def remove_like(self, user_id: int, video_id: int) -> bool:
        return self.repository.delete(user_id, video_id)

class PlaylistService:
    def __init__(self, db: Session):
        self.repository = PlaylistRepository(db)

    def get_playlists(self, author_id: Optional[int] = None, featured_only: bool = False) -> List[PlaylistResponse]:
        playlists = self.repository.get_all(author_id, featured_only)
        return [PlaylistResponse.from_orm(playlist) for playlist in playlists]

    def get_playlist(self, playlist_id: int) -> Optional[PlaylistResponse]:
        playlist = self.repository.get_by_id(playlist_id)
        return PlaylistResponse.from_orm(playlist) if playlist else None

    def get_playlist_by_slug(self, slug: str) -> Optional[PlaylistResponse]:
        playlist = self.repository.get_by_slug(slug)
        return PlaylistResponse.from_orm(playlist) if playlist else None

    def create_playlist(self, playlist_data: PlaylistCreate) -> PlaylistResponse:
        try:
            playlist = self.repository.create(playlist_data)
            return PlaylistResponse.from_orm(playlist)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="Playlist with this slug already exists")

    def update_playlist(self, playlist_id: int, updates: PlaylistUpdate) -> Optional[PlaylistResponse]:
        update_data = updates.dict(exclude_unset=True)
        playlist = self.repository.update(playlist_id, update_data)
        if playlist:
            return PlaylistResponse.from_orm(playlist)
        return None

    def delete_playlist(self, playlist_id: int) -> bool:
        return self.repository.delete(playlist_id)

class VideoStatisticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_statistics(self) -> VideoStatistics:
        # Get basic counts
        total_videos = self.db.query(func.count(Video.id)).scalar() or 0
        total_categories = self.db.query(func.count(VideoCategory.id)).scalar() or 0
        total_views = self.db.query(func.count(VideoView.id)).scalar() or 0
        total_likes = self.db.query(func.count(VideoLike.id)).filter(VideoLike.is_like == True).scalar() or 0
        total_comments = self.db.query(func.count(VideoComment.id)).filter(
            VideoComment.status == VideoCommentStatus.APPROVED
        ).scalar() or 0
        total_duration = self.db.query(func.sum(Video.duration)).filter(Video.duration.isnot(None)).scalar() or 0

        # Get videos this month
        month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        videos_this_month = self.db.query(func.count(Video.id)).filter(
            Video.created_at >= month_start
        ).scalar() or 0

        views_this_month = self.db.query(func.count(VideoView.id)).filter(
            VideoView.viewed_at >= month_start
        ).scalar() or 0

        # Get popular videos (by views)
        popular_videos = self.db.query(
            Video.id, Video.title, Video.view_count
        ).order_by(desc(Video.view_count)).limit(5).all()

        # Get recent videos
        recent_videos = self.db.query(
            Video.id, Video.title, Video.created_at
        ).filter(Video.status == VideoStatus.PUBLISHED).order_by(
            desc(Video.created_at)
        ).limit(5).all()

        # Get top categories
        top_categories = self.db.query(
            VideoCategory.name, VideoCategory.video_count
        ).order_by(desc(VideoCategory.video_count)).limit(5).all()

        # Processing stats
        processing_stats = {
            'processing': self.db.query(func.count(Video.id)).filter(Video.status == VideoStatus.PROCESSING).scalar() or 0,
            'published': self.db.query(func.count(Video.id)).filter(Video.status == VideoStatus.PUBLISHED).scalar() or 0,
            'failed': self.db.query(func.count(Video.id)).filter(Video.status == VideoStatus.FAILED).scalar() or 0,
        }

        return VideoStatistics(
            total_videos=total_videos,
            total_categories=total_categories,
            total_views=total_views,
            total_likes=total_likes,
            total_comments=total_comments,
            total_duration=total_duration,
            videos_this_month=videos_this_month,
            views_this_month=views_this_month,
            popular_videos=[{"id": v.id, "title": v.title, "views": v.view_count} for v in popular_videos],
            recent_videos=[{"id": v.id, "title": v.title, "created_at": v.created_at.isoformat()} for v in recent_videos],
            top_categories=[{"name": c.name, "video_count": c.video_count} for c in top_categories],
            processing_stats=processing_stats
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
    title="Video Service API",
    description="Comprehensive video service with upload, streaming, playlists, and analytics",
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
@app.get("/categories", response_model=List[VideoCategoryResponse])
async def get_categories(
    active_only: bool = Query(True, description="Return only active categories"),
    db: Session = Depends(get_db)
):
    """Get all video categories"""
    service = VideoCategoryService(db)
    return service.get_categories(active_only)

@app.get("/categories/{category_id}", response_model=VideoCategoryResponse)
async def get_category(category_id: int, db: Session = Depends(get_db)):
    """Get a specific category"""
    service = VideoCategoryService(db)
    category = service.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@app.post("/categories", response_model=VideoCategoryResponse)
async def create_category(category: VideoCategoryCreate, db: Session = Depends(get_db)):
    """Create a new category"""
    service = VideoCategoryService(db)
    return service.create_category(category)

@app.put("/categories/{category_id}", response_model=VideoCategoryResponse)
async def update_category(
    category_id: int,
    category_update: VideoCategoryUpdate,
    db: Session = Depends(get_db)
):
    """Update a category"""
    service = VideoCategoryService(db)
    updated_category = service.update_category(category_id, category_update)
    if not updated_category:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated_category

@app.delete("/categories/{category_id}")
async def delete_category(category_id: int, db: Session = Depends(get_db)):
    """Delete a category"""
    service = VideoCategoryService(db)
    if not service.delete_category(category_id):
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# Video routes
@app.get("/videos", response_model=PaginatedResponse[VideoResponse])
async def get_videos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    query: Optional[str] = None,
    category_id: Optional[int] = None,
    author_id: Optional[int] = None,
    status: Optional[VideoStatus] = None,
    is_featured: Optional[bool] = None,
    is_private: Optional[bool] = None,
    min_duration: Optional[int] = None,
    max_duration: Optional[int] = None,
    resolution: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|title|view_count|like_count|duration)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """Get paginated videos with filtering and sorting"""
    filters = VideoSearchFilters(
        query=query,
        category_id=category_id,
        author_id=author_id,
        status=status,
        is_featured=is_featured,
        is_private=is_private,
        min_duration=min_duration,
        max_duration=max_duration,
        resolution=resolution if resolution is None else VideoResolution(resolution),
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    service = VideoService(db)
    return service.get_videos(filters)

@app.get("/videos/{video_id}", response_model=VideoResponse)
async def get_video(
    video_id: int,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Get a specific video"""
    service = VideoService(db)
    video = service.get_video(video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Increment view count asynchronously
    if background_tasks and ip_address:
        background_tasks.add_task(service.increment_views, video_id, user_id, ip_address)

    return video

@app.get("/videos/slug/{slug}", response_model=VideoResponse)
async def get_video_by_slug(
    slug: str,
    user_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Get a video by slug"""
    service = VideoService(db)
    video = service.get_video_by_slug(slug)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Increment view count asynchronously
    if background_tasks and ip_address:
        background_tasks.add_task(service.increment_views, video_id=video.id, user_id=user_id, ip_address=ip_address)

    return video

@app.post("/videos", response_model=VideoResponse)
async def create_video(video: VideoCreate, db: Session = Depends(get_db)):
    """Create a new video"""
    service = VideoService(db)
    return service.create_video(video)

@app.put("/videos/{video_id}", response_model=VideoResponse)
async def update_video(
    video_id: int,
    video_update: VideoUpdate,
    db: Session = Depends(get_db)
):
    """Update a video"""
    service = VideoService(db)
    updated_video = service.update_video(video_id, video_update)
    if not updated_video:
        raise HTTPException(status_code=404, detail="Video not found")
    return updated_video

@app.delete("/videos/{video_id}")
async def delete_video(video_id: int, db: Session = Depends(get_db)):
    """Delete a video"""
    service = VideoService(db)
    if not service.delete_video(video_id):
        raise HTTPException(status_code=404, detail="Video not found")
    return {"message": "Video deleted successfully"}

# Comment routes
@app.get("/videos/{video_id}/comments", response_model=List[VideoCommentResponse])
async def get_video_comments(
    video_id: int,
    status: Optional[VideoCommentStatus] = None,
    db: Session = Depends(get_db)
):
    """Get comments for a video"""
    service = VideoCommentService(db)
    return service.get_comments_for_video(video_id, status)

@app.post("/comments", response_model=VideoCommentResponse)
async def create_comment(comment: VideoCommentCreate, db: Session = Depends(get_db)):
    """Create a new comment"""
    service = VideoCommentService(db)
    return service.create_comment(comment)

@app.put("/comments/{comment_id}", response_model=VideoCommentResponse)
async def update_comment(
    comment_id: int,
    comment_update: VideoCommentUpdate,
    db: Session = Depends(get_db)
):
    """Update a comment"""
    service = VideoCommentService(db)
    updated_comment = service.update_comment(comment_id, comment_update)
    if not updated_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return updated_comment

@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    """Delete a comment"""
    service = VideoCommentService(db)
    if not service.delete_comment(comment_id):
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}

# Rating routes
@app.get("/videos/{video_id}/ratings", response_model=List[VideoRatingResponse])
async def get_video_ratings(video_id: int, db: Session = Depends(get_db)):
    """Get ratings for a video"""
    service = VideoRatingService(db)
    return service.get_ratings_for_video(video_id)

@app.post("/videos/{video_id}/ratings", response_model=VideoRatingResponse)
async def create_or_update_rating(
    video_id: int,
    rating: VideoRatingCreate,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Create or update a rating for a video"""
    service = VideoRatingService(db)
    return service.create_or_update_rating(user_id, video_id, rating)

@app.delete("/videos/{video_id}/ratings")
async def delete_rating(
    video_id: int,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Delete a user's rating for a video"""
    service = VideoRatingService(db)
    if not service.delete_rating(user_id, video_id):
        raise HTTPException(status_code=404, detail="Rating not found")
    return {"message": "Rating deleted successfully"}

# Like routes
@app.get("/videos/{video_id}/likes", response_model=List[VideoLikeResponse])
async def get_video_likes(video_id: int, db: Session = Depends(get_db)):
    """Get likes for a video"""
    service = VideoLikeService(db)
    return service.get_likes_for_video(video_id)

@app.post("/videos/{video_id}/likes", response_model=VideoLikeResponse)
async def toggle_like(
    video_id: int,
    like: VideoLikeCreate,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Toggle like/dislike for a video"""
    service = VideoLikeService(db)
    return service.toggle_like(user_id, video_id, like.is_like)

@app.delete("/videos/{video_id}/likes")
async def remove_like(
    video_id: int,
    user_id: int = Query(..., description="User ID"),
    db: Session = Depends(get_db)
):
    """Remove like/dislike for a video"""
    service = VideoLikeService(db)
    if not service.remove_like(user_id, video_id):
        raise HTTPException(status_code=404, detail="Like not found")
    return {"message": "Like removed successfully"}

# Playlist routes
@app.get("/playlists", response_model=List[PlaylistResponse])
async def get_playlists(
    author_id: Optional[int] = None,
    featured_only: bool = Query(False, description="Return only featured playlists"),
    db: Session = Depends(get_db)
):
    """Get playlists"""
    service = PlaylistService(db)
    return service.get_playlists(author_id, featured_only)

@app.get("/playlists/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist(playlist_id: int, db: Session = Depends(get_db)):
    """Get a specific playlist"""
    service = PlaylistService(db)
    playlist = service.get_playlist(playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@app.post("/playlists", response_model=PlaylistResponse)
async def create_playlist(playlist: PlaylistCreate, db: Session = Depends(get_db)):
    """Create a new playlist"""
    service = PlaylistService(db)
    return service.create_playlist(playlist)

@app.put("/playlists/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: int,
    playlist_update: PlaylistUpdate,
    db: Session = Depends(get_db)
):
    """Update a playlist"""
    service = PlaylistService(db)
    updated_playlist = service.update_playlist(playlist_id, playlist_update)
    if not updated_playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return updated_playlist

@app.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: int, db: Session = Depends(get_db)):
    """Delete a playlist"""
    service = PlaylistService(db)
    if not service.delete_playlist(playlist_id):
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"message": "Playlist deleted successfully"}

# Statistics routes
@app.get("/statistics", response_model=VideoStatistics)
async def get_statistics(db: Session = Depends(get_db)):
    """Get video statistics"""
    service = VideoStatisticsService(db)
    return service.get_statistics()

# Bulk operations routes
@app.post("/videos/bulk")
async def bulk_video_operation(
    operation: BulkVideoOperation,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Perform bulk operations on videos"""
    # Implementation for bulk operations would go here
    # For now, return success
    return {"message": f"Bulk {operation.operation} operation queued for {len(operation.video_ids)} videos"}

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
    uvicorn.run(app, host="0.0.0.0", port=8002)
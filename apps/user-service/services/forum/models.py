"""
Forum Service Models - Senior Level Implementation
Provides comprehensive forum functionality with categories, forums, topics, and posts
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ForumCategory(Base):
    """Forum category model - top level organization"""
    __tablename__ = "forum_categories"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    name: Mapped[str] = Column(String(100), nullable=False, unique=True)
    description: Mapped[Optional[str]] = Column(Text)
    display_order: Mapped[int] = Column(Integer, default=0)
    is_active: Mapped[bool] = Column(Boolean, default=True)
    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    forums: Mapped[List["Forum"]] = relationship("Forum", back_populates="category", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_category_active_order', 'is_active', 'display_order'),
    )

class Forum(Base):
    """Forum model - contains topics"""
    __tablename__ = "forums"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    category_id: Mapped[int] = Column(Integer, ForeignKey("forum_categories.id"), nullable=False)
    name: Mapped[str] = Column(String(100), nullable=False)
    description: Mapped[Optional[str]] = Column(Text)
    slug: Mapped[str] = Column(String(100), nullable=False, unique=True)
    display_order: Mapped[int] = Column(Integer, default=0)
    is_active: Mapped[bool] = Column(Boolean, default=True)
    is_locked: Mapped[bool] = Column(Boolean, default=False)
    requires_moderation: Mapped[bool] = Column(Boolean, default=False)

    # Statistics
    topic_count: Mapped[int] = Column(Integer, default=0)
    post_count: Mapped[int] = Column(Integer, default=0)
    last_post_at: Mapped[Optional[datetime]] = Column(DateTime)
    last_post_user_id: Mapped[Optional[int]] = Column(Integer)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    category: Mapped["ForumCategory"] = relationship("ForumCategory", back_populates="forums")
    topics: Mapped[List["ForumTopic"]] = relationship("ForumTopic", back_populates="forum", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_forum_category_active', 'category_id', 'is_active'),
        Index('idx_forum_slug', 'slug'),
        Index('idx_forum_last_post', 'last_post_at'),
    )

class ForumTopic(Base):
    """Forum topic model - contains posts"""
    __tablename__ = "forum_topics"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    forum_id: Mapped[int] = Column(Integer, ForeignKey("forums.id"), nullable=False)
    title: Mapped[str] = Column(String(200), nullable=False)
    slug: Mapped[str] = Column(String(200), nullable=False, unique=True)

    # Content
    first_post_content: Mapped[Text] = Column(Text, nullable=False)  # Cached first post content

    # Status
    is_pinned: Mapped[bool] = Column(Boolean, default=False)
    is_locked: Mapped[bool] = Column(Boolean, default=False)
    is_approved: Mapped[bool] = Column(Boolean, default=True)
    is_deleted: Mapped[bool] = Column(Boolean, default=False)

    # Author
    author_id: Mapped[int] = Column(Integer, nullable=False)
    author_username: Mapped[str] = Column(String(50), nullable=False)

    # Statistics
    view_count: Mapped[int] = Column(Integer, default=0)
    post_count: Mapped[int] = Column(Integer, default=1)  # Includes first post
    last_post_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    last_post_user_id: Mapped[int] = Column(Integer, nullable=False)
    last_post_username: Mapped[str] = Column(String(50), nullable=False)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    forum: Mapped["Forum"] = relationship("Forum", back_populates="topics")
    posts: Mapped[List["ForumPost"]] = relationship("ForumPost", back_populates="topic", cascade="all, delete-orphan")

    # Indexes
    __table_args__ = (
        Index('idx_topic_forum_approved', 'forum_id', 'is_approved', 'is_deleted'),
        Index('idx_topic_pinned_updated', 'is_pinned', 'updated_at'),
        Index('idx_topic_slug', 'slug'),
        Index('idx_topic_last_post', 'last_post_at'),
        Index('idx_topic_author', 'author_id'),
    )

class ForumPost(Base):
    """Forum post model - individual replies"""
    __tablename__ = "forum_posts"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    topic_id: Mapped[int] = Column(Integer, ForeignKey("forum_topics.id"), nullable=False)
    content: Mapped[Text] = Column(Text, nullable=False)

    # Author
    author_id: Mapped[int] = Column(Integer, nullable=False)
    author_username: Mapped[str] = Column(String(50), nullable=False)

    # Status
    is_approved: Mapped[bool] = Column(Boolean, default=True)
    is_deleted: Mapped[bool] = Column(Boolean, default=False)
    is_edited: Mapped[bool] = Column(Boolean, default=False)
    edited_at: Mapped[Optional[datetime]] = Column(DateTime)

    # Moderation
    moderator_id: Mapped[Optional[int]] = Column(Integer)
    moderated_at: Mapped[Optional[datetime]] = Column(DateTime)
    moderation_reason: Mapped[Optional[str]] = Column(String(500))

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    topic: Mapped["ForumTopic"] = relationship("ForumTopic", back_populates="posts")

    # Indexes
    __table_args__ = (
        Index('idx_post_topic_approved', 'topic_id', 'is_approved', 'is_deleted'),
        Index('idx_post_author', 'author_id'),
        Index('idx_post_created', 'created_at'),
    )

class ForumModerationLog(Base):
    """Moderation actions log"""
    __tablename__ = "forum_moderation_logs"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    moderator_id: Mapped[int] = Column(Integer, nullable=False)
    moderator_username: Mapped[str] = Column(String(50), nullable=False)

    # Action details
    action_type: Mapped[str] = Column(String(50), nullable=False)  # ban, unban, delete, edit, etc.
    entity_type: Mapped[str] = Column(String(20), nullable=False)  # topic, post, user
    entity_id: Mapped[int] = Column(Integer, nullable=False)

    # Context
    forum_id: Mapped[Optional[int]] = Column(Integer)
    topic_id: Mapped[Optional[int]] = Column(Integer)
    reason: Mapped[Optional[str]] = Column(String(500))

    # IP and metadata
    ip_address: Mapped[Optional[str]] = Column(String(45))
    user_agent: Mapped[Optional[str]] = Column(String(500))

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_modlog_moderator', 'moderator_id'),
        Index('idx_modlog_entity', 'entity_type', 'entity_id'),
        Index('idx_modlog_created', 'created_at'),
    )

class ForumReport(Base):
    """User reports for moderation"""
    __tablename__ = "forum_reports"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    reporter_id: Mapped[int] = Column(Integer, nullable=False)
    reporter_username: Mapped[str] = Column(String(50), nullable=False)

    # Reported content
    entity_type: Mapped[str] = Column(String(20), nullable=False)  # topic, post, user
    entity_id: Mapped[int] = Column(Integer, nullable=False)
    entity_title: Mapped[str] = Column(String(200), nullable=False)

    # Report details
    reason: Mapped[str] = Column(String(100), nullable=False)
    description: Mapped[Text] = Column(Text, nullable=False)

    # Status
    status: Mapped[str] = Column(String(20), default='pending')  # pending, investigating, resolved, dismissed
    moderator_id: Mapped[Optional[int]] = Column(Integer)
    moderator_notes: Mapped[Optional[Text]] = Column(Text)
    resolved_at: Mapped[Optional[datetime]] = Column(DateTime)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Indexes
    __table_args__ = (
        Index('idx_report_status_created', 'status', 'created_at'),
        Index('idx_report_entity', 'entity_type', 'entity_id'),
        Index('idx_report_reporter', 'reporter_id'),
    )
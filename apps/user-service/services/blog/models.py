"""
Blog Service Models - SQLAlchemy ORM models
Senior-level implementation with comprehensive relationships and constraints
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey,
    Index, CheckConstraint, text, func
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class BlogCategory(Base):
    """Blog category model"""
    __tablename__ = "blog_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    post_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    posts: Mapped[List["BlogPost"]] = relationship("BlogPost", back_populates="category", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(name) > 0', name='blog_categories_name_length_check'),
        CheckConstraint('length(slug) > 0', name='blog_categories_slug_length_check'),
        CheckConstraint('display_order >= 0', name='blog_categories_display_order_check'),
        Index('idx_blog_categories_active_order', 'is_active', 'display_order'),
        Index('idx_blog_categories_slug', 'slug'),
    )

    def __repr__(self):
        return f"<BlogCategory(id={self.id}, name='{self.name}', slug='{self.slug}')>"


class BlogTag(Base):
    """Blog tag model"""
    __tablename__ = "blog_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(60), nullable=False, unique=True)
    color: Mapped[Optional[str]] = mapped_column(String(7), nullable=True)  # Hex color code
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post_tags: Mapped[List["BlogPostTag"]] = relationship("BlogPostTag", back_populates="tag", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(name) > 0', name='blog_tags_name_length_check'),
        CheckConstraint('length(slug) > 0', name='blog_tags_slug_length_check'),
        CheckConstraint('usage_count >= 0', name='blog_tags_usage_count_check'),
        CheckConstraint("color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'", name='blog_tags_color_format_check'),
        Index('idx_blog_tags_slug', 'slug'),
        Index('idx_blog_tags_usage', 'usage_count'),
    )

    def __repr__(self):
        return f"<BlogTag(id={self.id}, name='{self.name}', slug='{self.slug}')>"


class BlogPost(Base):
    """Blog post model"""
    __tablename__ = "blog_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(220), nullable=False, unique=True)
    excerpt: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    featured_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("blog_categories.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)  # draft, published, archived
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_comments: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    comment_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    category: Mapped["BlogCategory"] = relationship("BlogCategory", back_populates="posts")
    comments: Mapped[List["BlogComment"]] = relationship("BlogComment", back_populates="post", cascade="all, delete-orphan")
    tags: Mapped[List["BlogTag"]] = relationship("BlogTag", secondary="blog_post_tags", back_populates="posts")
    post_tags: Mapped[List["BlogPostTag"]] = relationship("BlogPostTag", back_populates="post", cascade="all, delete-orphan")

    # Constraints
    __table_args__ = (
        CheckConstraint('length(title) > 0', name='blog_posts_title_length_check'),
        CheckConstraint('length(slug) > 0', name='blog_posts_slug_length_check'),
        CheckConstraint('length(content) > 0', name='blog_posts_content_length_check'),
        CheckConstraint('view_count >= 0', name='blog_posts_view_count_check'),
        CheckConstraint('like_count >= 0', name='blog_posts_like_count_check'),
        CheckConstraint('comment_count >= 0', name='blog_posts_comment_count_check'),
        CheckConstraint("status IN ('draft', 'published', 'archived')", name='blog_posts_status_check'),
        CheckConstraint("featured_image_url IS NULL OR length(featured_image_url) > 0", name='blog_posts_featured_image_check'),
        Index('idx_blog_posts_author', 'author_id'),
        Index('idx_blog_posts_category', 'category_id'),
        Index('idx_blog_posts_status', 'status'),
        Index('idx_blog_posts_published', 'published_at'),
        Index('idx_blog_posts_featured', 'is_featured'),
        Index('idx_blog_posts_pinned', 'is_pinned'),
        Index('idx_blog_posts_slug', 'slug'),
        Index('idx_blog_posts_created', 'created_at'),
    )

    def __repr__(self):
        return f"<BlogPost(id={self.id}, title='{self.title}', status='{self.status}')>"


class BlogPostTag(Base):
    """Many-to-many relationship between posts and tags"""
    __tablename__ = "blog_post_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("blog_posts.id"), nullable=False)
    tag_id: Mapped[int] = mapped_column(Integer, ForeignKey("blog_tags.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post: Mapped["BlogPost"] = relationship("BlogPost", back_populates="post_tags")
    tag: Mapped["BlogTag"] = relationship("BlogTag", back_populates="post_tags")

    # Constraints
    __table_args__ = (
        Index('idx_blog_post_tags_post', 'post_id'),
        Index('idx_blog_post_tags_tag', 'tag_id'),
        Index('idx_blog_post_tags_unique', 'post_id', 'tag_id', unique=True),
    )

    def __repr__(self):
        return f"<BlogPostTag(post_id={self.post_id}, tag_id={self.tag_id})>"


class BlogComment(Base):
    """Blog comment model"""
    __tablename__ = "blog_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("blog_posts.id"), nullable=False)
    author_id: Mapped[int] = mapped_column(Integer, nullable=False)
    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    author_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="approved", nullable=False)  # approved, pending, rejected
    parent_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("blog_comments.id"), nullable=True)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    edited_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)  # IPv4/IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    post: Mapped["BlogPost"] = relationship("BlogPost", back_populates="comments")
    replies: Mapped[List["BlogComment"]] = relationship("BlogComment", back_populates="parent", cascade="all, delete-orphan")
    parent: Mapped[Optional["BlogComment"]] = relationship("BlogComment", back_populates="replies", remote_side=[id])

    # Constraints
    __table_args__ = (
        CheckConstraint('length(author_name) > 0', name='blog_comments_author_name_length_check'),
        CheckConstraint('length(content) > 0', name='blog_comments_content_length_check'),
        CheckConstraint("status IN ('approved', 'pending', 'rejected')", name='blog_comments_status_check'),
        CheckConstraint("author_email IS NULL OR author_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}$'", name='blog_comments_email_format_check'),
        Index('idx_blog_comments_post', 'post_id'),
        Index('idx_blog_comments_author', 'author_id'),
        Index('idx_blog_comments_status', 'status'),
        Index('idx_blog_comments_parent', 'parent_id'),
        Index('idx_blog_comments_created', 'created_at'),
    )

    def __repr__(self):
        return f"<BlogComment(id={self.id}, post_id={self.post_id}, author='{self.author_name}')>"


class BlogLike(Base):
    """Blog post like model"""
    __tablename__ = "blog_likes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("blog_posts.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post: Mapped["BlogPost"] = relationship("BlogPost")

    # Constraints
    __table_args__ = (
        Index('idx_blog_likes_post', 'post_id'),
        Index('idx_blog_likes_user', 'user_id'),
        Index('idx_blog_likes_unique', 'post_id', 'user_id', unique=True),
    )

    def __repr__(self):
        return f"<BlogLike(post_id={self.post_id}, user_id={self.user_id})>"


class BlogView(Base):
    """Blog post view tracking model"""
    __tablename__ = "blog_views"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    post_id: Mapped[int] = mapped_column(Integer, ForeignKey("blog_posts.id"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # NULL for anonymous views
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)  # IPv4/IPv6
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    viewed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    post: Mapped["BlogPost"] = relationship("BlogPost")

    # Constraints
    __table_args__ = (
        Index('idx_blog_views_post', 'post_id'),
        Index('idx_blog_views_user', 'user_id'),
        Index('idx_blog_views_ip', 'ip_address'),
        Index('idx_blog_views_viewed', 'viewed_at'),
    )

    def __repr__(self):
        return f"<BlogView(post_id={self.post_id}, user_id={self.user_id}, viewed_at={self.viewed_at})>"


# Add reverse relationships for BlogPost.tags
BlogPost.tags = relationship(
    "BlogTag",
    secondary="blog_post_tags",
    back_populates="posts"
)
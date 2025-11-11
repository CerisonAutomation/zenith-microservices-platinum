"""
Newsletter Service Models - SQLAlchemy models for newsletter functionality
Senior-level implementation with comprehensive newsletter features
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum, Float, JSON, Index
from sqlalchemy.orm import relationship, validates
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import enum
from datetime import datetime
from typing import List, Optional, Dict, Any
from base import Base

class NewsletterStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    CANCELLED = "cancelled"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    UNSUBSCRIBED = "unsubscribed"
    BOUNCED = "bounced"
    COMPLAINT = "complaint"

class CampaignType(str, enum.Enum):
    NEWSLETTER = "newsletter"
    PROMOTIONAL = "promotional"
    ANNOUNCEMENT = "announcement"
    WELCOME = "welcome"
    REENGAGEMENT = "reengagement"

class SendStatus(str, enum.Enum):
    PENDING = "pending"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"

class BounceType(str, enum.Enum):
    HARD = "hard"
    SOFT = "soft"
    COMPLAINT = "complaint"

class NewsletterTemplate(Base):
    """Newsletter template model"""
    __tablename__ = "newsletter_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    subject_template = Column(String(500), nullable=False)
    html_content = Column(Text, nullable=False)
    text_content = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_by = Column(Integer, nullable=False)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    newsletters = relationship("Newsletter", back_populates="template")

    @validates('slug')
    def validate_slug(self, key, value):
        if not value or len(value) < 3:
            raise ValueError("Slug must be at least 3 characters long")
        return value.lower().replace(' ', '-')

class Newsletter(Base):
    """Newsletter campaign model"""
    __tablename__ = "newsletters"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    subject = Column(String(500), nullable=False)
    html_content = Column(Text, nullable=False)
    text_content = Column(Text, nullable=True)
    preview_text = Column(String(160), nullable=True)  # SMS/email preview
    campaign_type = Column(Enum(CampaignType), nullable=False, default=CampaignType.NEWSLETTER)
    status = Column(Enum(NewsletterStatus), nullable=False, default=NewsletterStatus.DRAFT)
    template_id = Column(Integer, ForeignKey("newsletter_templates.id"), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, nullable=False)  # User ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Statistics
    total_recipients = Column(Integer, default=0)
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    bounced_count = Column(Integer, default=0)
    complained_count = Column(Integer, default=0)
    unsubscribed_count = Column(Integer, default=0)

    # Performance metrics
    open_rate = Column(Float, default=0.0)
    click_rate = Column(Float, default=0.0)
    bounce_rate = Column(Float, default=0.0)
    unsubscribe_rate = Column(Float, default=0.0)

    # Relationships
    template = relationship("NewsletterTemplate", back_populates="newsletters")
    segments = relationship("NewsletterSegment", secondary="newsletter_segment_associations", back_populates="newsletters")
    sends = relationship("NewsletterSend", back_populates="newsletter", cascade="all, delete-orphan")
    links = relationship("NewsletterLink", back_populates="newsletter", cascade="all, delete-orphan")

    @validates('slug')
    def validate_slug(self, key, value):
        if not value or len(value) < 3:
            raise ValueError("Slug must be at least 3 characters long")
        return value.lower().replace(' ', '-')

    def update_stats(self):
        """Update performance statistics"""
        if self.sent_count > 0:
            self.open_rate = (self.opened_count / self.sent_count) * 100
            self.click_rate = (self.clicked_count / self.sent_count) * 100
            self.bounce_rate = (self.bounced_count / self.sent_count) * 100
            self.unsubscribe_rate = (self.unsubscribed_count / self.sent_count) * 100

class NewsletterSegment(Base):
    """Newsletter segment model for targeted campaigns"""
    __tablename__ = "newsletter_segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    criteria = Column(JSON, nullable=True)  # Flexible criteria for segmenting
    is_dynamic = Column(Boolean, default=True)  # Dynamic vs static segments
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Statistics
    subscriber_count = Column(Integer, default=0)
    last_calculated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    newsletters = relationship("Newsletter", secondary="newsletter_segment_associations", back_populates="segments")
    subscribers = relationship("Subscriber", secondary="subscriber_segment_associations", back_populates="segments")

    @validates('slug')
    def validate_slug(self, key, value):
        if not value or len(value) < 3:
            raise ValueError("Slug must be at least 3 characters long")
        return value.lower().replace(' ', '-')

class Subscriber(Base):
    """Newsletter subscriber model"""
    __tablename__ = "subscribers"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.PENDING)
    subscription_source = Column(String(100), nullable=True)  # How they subscribed
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    user_agent = Column(Text, nullable=True)
    preferences = Column(JSON, nullable=True)  # Subscription preferences
    custom_fields = Column(JSON, nullable=True)  # Additional subscriber data
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    last_activity_at = Column(DateTime(timezone=True), nullable=True)

    # Bounce and complaint tracking
    bounce_count = Column(Integer, default=0)
    last_bounce_at = Column(DateTime(timezone=True), nullable=True)
    complaint_count = Column(Integer, default=0)
    last_complaint_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    segments = relationship("NewsletterSegment", secondary="subscriber_segment_associations", back_populates="subscribers")
    sends = relationship("NewsletterSend", back_populates="subscriber", cascade="all, delete-orphan")
    activities = relationship("SubscriberActivity", back_populates="subscriber", cascade="all, delete-orphan")

    def full_name(self) -> str:
        """Get subscriber's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.email

class NewsletterSend(Base):
    """Individual newsletter send tracking"""
    __tablename__ = "newsletter_sends"

    id = Column(Integer, primary_key=True, index=True)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id"), nullable=False)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id"), nullable=False)
    status = Column(Enum(SendStatus), nullable=False, default=SendStatus.PENDING)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(DateTime(timezone=True), nullable=True)
    first_opened_at = Column(DateTime(timezone=True), nullable=True)
    clicked_at = Column(DateTime(timezone=True), nullable=True)
    bounced_at = Column(DateTime(timezone=True), nullable=True)
    complaint_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    message_id = Column(String(255), nullable=True, index=True)  # Provider message ID
    provider_response = Column(JSON, nullable=True)

    # Relationships
    newsletter = relationship("Newsletter", back_populates="sends")
    subscriber = relationship("Subscriber", back_populates="sends")
    clicks = relationship("NewsletterClick", back_populates="send", cascade="all, delete-orphan")

    __table_args__ = (
        Index('idx_newsletter_send_unique', 'newsletter_id', 'subscriber_id', unique=True),
    )

class NewsletterLink(Base):
    """Newsletter link tracking"""
    __tablename__ = "newsletter_links"

    id = Column(Integer, primary_key=True, index=True)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id"), nullable=False)
    url = Column(String(2000), nullable=False)
    title = Column(String(255), nullable=True)
    click_count = Column(Integer, default=0)
    unique_click_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    newsletter = relationship("Newsletter", back_populates="links")
    clicks = relationship("NewsletterClick", back_populates="link", cascade="all, delete-orphan")

class NewsletterClick(Base):
    """Individual link click tracking"""
    __tablename__ = "newsletter_clicks"

    id = Column(Integer, primary_key=True, index=True)
    send_id = Column(Integer, ForeignKey("newsletter_sends.id"), nullable=False)
    link_id = Column(Integer, ForeignKey("newsletter_links.id"), nullable=False)
    clicked_at = Column(DateTime(timezone=True), server_default=func.now())
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    referrer = Column(String(2000), nullable=True)

    # Relationships
    send = relationship("NewsletterSend", back_populates="clicks")
    link = relationship("NewsletterLink", back_populates="clicks")

class SubscriberActivity(Base):
    """Subscriber activity tracking"""
    __tablename__ = "subscriber_activities"

    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id"), nullable=False)
    activity_type = Column(String(50), nullable=False)  # open, click, bounce, complaint, unsubscribe
    newsletter_id = Column(Integer, ForeignKey("newsletters.id"), nullable=True)
    metadata = Column(JSON, nullable=True)  # Additional activity data
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    subscriber = relationship("Subscriber", back_populates="activities")

class BounceEvent(Base):
    """Email bounce tracking"""
    __tablename__ = "bounce_events"

    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, ForeignKey("subscribers.id"), nullable=False)
    newsletter_id = Column(Integer, ForeignKey("newsletters.id"), nullable=True)
    bounce_type = Column(Enum(BounceType), nullable=False)
    bounce_reason = Column(String(255), nullable=True)
    bounce_code = Column(String(10), nullable=True)
    provider_message = Column(Text, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    subscriber = relationship("Subscriber")

# Association tables
class NewsletterSegmentAssociation(Base):
    """Association table for newsletters and segments"""
    __tablename__ = "newsletter_segment_associations"

    newsletter_id = Column(Integer, ForeignKey("newsletters.id"), primary_key=True)
    segment_id = Column(Integer, ForeignKey("newsletter_segments.id"), primary_key=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

class SubscriberSegmentAssociation(Base):
    """Association table for subscribers and segments"""
    __tablename__ = "subscriber_segment_associations"

    subscriber_id = Column(Integer, ForeignKey("subscribers.id"), primary_key=True)
    segment_id = Column(Integer, ForeignKey("newsletter_segments.id"), primary_key=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    added_by = Column(Integer, nullable=True)  # User who added them to segment
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class ConciergeRequest(Base):
    __tablename__ = "concierge_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    request_type = Column(String, nullable=False)  # profile_optimization, date_planning, gift_service, etc.
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    priority = Column(String, default="normal")  # low, normal, high, urgent
    status = Column(String, default="pending")  # pending, in_progress, completed, cancelled
    assigned_concierge_id = Column(String, ForeignKey("users.id"), nullable=True)
    estimated_completion = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    concierge = relationship("User", foreign_keys=[assigned_concierge_id])

class VIPService(Base):
    __tablename__ = "vip_services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    category = Column(String, nullable=False)  # profile, dating, gifts, events
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class VIPPackage(Base):
    __tablename__ = "vip_packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    duration_days = Column(Integer, nullable=False)
    services_included = Column(Text)  # JSON string of service IDs
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class VIPSubscription(Base):
    __tablename__ = "vip_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    package_id = Column(Integer, ForeignKey("vip_packages.id"), nullable=False)
    status = Column(String, default="active")  # active, expired, cancelled
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    auto_renew = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="vip_subscriptions")
    package = relationship("VIPPackage")

class ConciergeMessage(Base):
    __tablename__ = "concierge_messages"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("concierge_requests.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    message_type = Column(String, default="text")  # text, image, file
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    request = relationship("ConciergeRequest")
    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])
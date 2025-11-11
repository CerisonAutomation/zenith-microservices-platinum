from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    plan = Column(String, nullable=False)  # e.g., "basic", "premium", "vip"
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(String, default="active")  # active, cancelled, expired, pending
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    auto_renew = Column(Boolean, default=True)
    payment_method_id = Column(String)  # Reference to payment service
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subscriptions")

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    duration_days = Column(Integer, nullable=False)  # e.g., 30, 90, 365
    features = Column(Text)  # JSON string of features
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

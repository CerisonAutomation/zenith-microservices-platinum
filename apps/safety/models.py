from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class SafetyReport(Base):
    __tablename__ = "safety_reports"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    reported_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    report_type = Column(String, nullable=False)  # harassment, fake_profile, inappropriate_content, etc.
    description = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, investigating, resolved, dismissed
    severity = Column(String, default="medium")  # low, medium, high, critical
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    admin_notes = Column(Text)

    # Relationships
    reporter = relationship("User", foreign_keys=[reporter_id])
    reported_user = relationship("User", foreign_keys=[reported_user_id])

class SafetyIncident(Base):
    __tablename__ = "safety_incidents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    incident_type = Column(String, nullable=False)  # suspicious_activity, account_compromise, etc.
    description = Column(Text, nullable=False)
    risk_score = Column(Float, default=0.0)  # 0.0 to 1.0
    status = Column(String, default="active")  # active, resolved, monitoring
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="safety_incidents")

class BlockedUser(Base):
    __tablename__ = "blocked_users"

    id = Column(Integer, primary_key=True, index=True)
    blocker_id = Column(String, ForeignKey("users.id"), nullable=False)
    blocked_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    blocker = relationship("User", foreign_keys=[blocker_id])
    blocked_user = relationship("User", foreign_keys=[blocked_user_id])

class SafetySetting(Base):
    __tablename__ = "safety_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    show_online_status = Column(Boolean, default=True)
    allow_messages_from_strangers = Column(Boolean, default=False)
    require_verification_for_bookings = Column(Boolean, default=True)
    enable_two_factor = Column(Boolean, default=False)
    share_location = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="safety_settings")
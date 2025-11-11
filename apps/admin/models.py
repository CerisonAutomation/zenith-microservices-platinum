from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    role = Column(String, default="moderator")  # admin, moderator, support
    permissions = Column(Text)  # JSON string of permissions
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User")

class AdminAction(Base):
    __tablename__ = "admin_actions"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("admin_users.id"), nullable=False)
    action_type = Column(String, nullable=False)  # user_ban, content_removal, report_resolution, etc.
    target_type = Column(String, nullable=False)  # user, content, report
    target_id = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    metadata = Column(Text)  # JSON string with additional data
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    admin = relationship("AdminUser")

class SystemMetric(Base):
    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String, nullable=False)
    metric_value = Column(Float, nullable=False)
    metric_unit = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    category = Column(String, default="general")  # users, bookings, revenue, performance

class DashboardWidget(Base):
    __tablename__ = "dashboard_widgets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    widget_type = Column(String, nullable=False)  # chart, table, metric, list
    config = Column(Text)  # JSON string with widget configuration
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    announcement_type = Column(String, default="info")  # info, warning, success, error
    target_audience = Column(String, default="all")  # all, users, providers, admins
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("admin_users.id"), nullable=False)

    # Relationships
    creator = relationship("AdminUser")

class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String, nullable=False, unique=True)
    setting_value = Column(Text, nullable=False)
    setting_type = Column(String, default="string")  # string, number, boolean, json
    description = Column(Text)
    is_public = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by = Column(Integer, ForeignKey("admin_users.id"), nullable=False)

    # Relationships
    updater = relationship("AdminUser")
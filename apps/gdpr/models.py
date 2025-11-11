"""
GDPR Compliance Models
Implements right to be forgotten, data portability, and consent management
"""
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()


class ConsentType(str, enum.Enum):
    """Types of user consent"""
    MARKETING = "marketing"
    ANALYTICS = "analytics"
    DATA_SHARING = "data_sharing"
    PROFILING = "profiling"
    THIRD_PARTY = "third_party"


class ConsentLog(Base):
    """Track all consent events for GDPR audit trail"""
    __tablename__ = "consent_logs"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    consent_type = Column(Enum(ConsentType), nullable=False)
    given = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    withdrawn_at = Column(DateTime, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    legal_basis = Column(String)  # "consent", "contract", "legal_obligation", "vital_interest", "public_task", "legitimate_interest"
    language = Column(String, default="en")
    version = Column(String)  # Version of policy user consented to


class DataSubjectRequest(Base):
    """GDPR Data Subject Access Requests (DSARs)"""
    __tablename__ = "data_subject_requests"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    request_type = Column(String)  # "access", "rectification", "erasure", "portability", "restriction", "objection"
    status = Column(String, default="pending")  # pending, processing, completed, rejected
    requested_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    deadline = Column(DateTime)  # 30-day GDPR deadline
    reason = Column(Text, nullable=True)
    data_categories = Column(String)  # JSON: list of data categories
    processed_by = Column(String, nullable=True)  # Operator who processed the request
    notes = Column(Text, nullable=True)


class DataProcessingRecord(Base):
    """Record of data processing activities for Privacy Impact Assessment"""
    __tablename__ = "data_processing_records"
    
    id = Column(String, primary_key=True)
    processor_name = Column(String)  # Name of data processor/controller
    purpose = Column(String)  # Purpose of processing
    legal_basis = Column(String)  # Legal basis for processing
    data_categories = Column(String)  # JSON: list of data categories
    recipient_categories = Column(String)  # JSON: who data is shared with
    retention_period = Column(String)  # How long data is kept
    security_measures = Column(String)  # JSON: security measures
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dpia_required = Column(Boolean, default=False)
    dpia_completed = Column(Boolean, default=False)


class DPATemplate(Base):
    """Data Processing Agreement templates per region"""
    __tablename__ = "dpa_templates"
    
    id = Column(String, primary_key=True)
    vendor_name = Column(String)
    jurisdiction = Column(String)  # "EU", "UK", "US"
    template_version = Column(String)
    signed_date = Column(DateTime, nullable=True)
    effective_date = Column(DateTime)
    expiration_date = Column(DateTime)
    clauses = Column(Text)  # JSON: DPA clauses
    sub_processors = Column(String)  # JSON: list of sub-processors
    contact_person = Column(String)
    contact_email = Column(String)


class DeletionSchedule(Base):
    """Manage scheduled account deletions (GDPR Right to be Forgotten)"""
    __tablename__ = "deletion_schedules"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow)
    scheduled_deletion = Column(DateTime)  # 30-day grace period
    status = Column(String, default="pending")  # pending, confirmed, cancelled, completed
    reason = Column(Text, nullable=True)
    can_reactivate_until = Column(DateTime)  # When reactivation is no longer possible
    confirmed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    """Complete audit trail of data access and modifications"""
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String)  # "LOGIN", "DATA_ACCESS", "DATA_MODIFY", "EXPORT", "DELETE", etc.
    resource_type = Column(String)  # "profile", "booking", "message", etc.
    resource_id = Column(String, nullable=True)
    old_values = Column(Text, nullable=True)  # JSON: old data (for modifications)
    new_values = Column(Text, nullable=True)  # JSON: new data (for modifications)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String)
    user_agent = Column(String)
    status = Column(String)  # "success", "failure"
    error_message = Column(Text, nullable=True)
    actor_id = Column(String, nullable=True)  # Who performed the action
    actor_role = Column(String, nullable=True)  # "admin", "system", "user"


class DataExport(Base):
    """Track data export requests and status"""
    __tablename__ = "data_exports"
    
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    requested_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, processing, ready, expired
    file_url = Column(String, nullable=True)
    file_format = Column(String, default="json")  # json, csv, xml
    expires_at = Column(DateTime)  # 30 days
    download_count = Column(Integer, default=0)
    completed_at = Column(DateTime, nullable=True)


class BreachNotification(Base):
    """GDPR Data Breach Notifications (72-hour rule)"""
    __tablename__ = "breach_notifications"
    
    id = Column(String, primary_key=True)
    breach_date = Column(DateTime)
    discovery_date = Column(DateTime, default=datetime.utcnow)
    notification_deadline = Column(DateTime)  # breach_date + 72 hours
    affected_users = Column(String)  # JSON: list of user IDs
    data_categories = Column(String)  # What data was affected
    description = Column(Text)  # What happened
    cause = Column(Text)  # Root cause analysis
    measures_taken = Column(Text)  # JSON: remediation steps
    authority_notified = Column(Boolean, default=False)
    authority_notified_at = Column(DateTime, nullable=True)
    authority_reference = Column(String, nullable=True)
    users_notified = Column(Boolean, default=False)
    users_notified_at = Column(DateTime, nullable=True)
    status = Column(String, default="reported")  # reported, remediated, closed

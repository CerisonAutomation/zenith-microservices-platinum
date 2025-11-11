from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    admin_id = Column(String)
    action = Column(String)
    entity = Column(String)
    notes = Column(Text)
    timestamp = Column(DateTime, server_default=func.now())

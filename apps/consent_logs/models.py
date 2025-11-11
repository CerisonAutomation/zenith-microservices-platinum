from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class ConsentLog(Base):
    __tablename__ = "consent_logs"
    id = Column(String, primary_key=True)
    user_id = Column(String)
    action = Column(String)
    details = Column(Text)
    timestamp = Column(DateTime, server_default=func.now())

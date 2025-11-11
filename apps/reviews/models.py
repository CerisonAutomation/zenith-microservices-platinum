from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class Review(Base):
    __tablename__ = "reviews"
    id = Column(String, primary_key=True)
    reviewer_id = Column(String, ForeignKey("users.id"))
    provider_id = Column(String, ForeignKey("users.id"))
    rating = Column(Integer)
    comment = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

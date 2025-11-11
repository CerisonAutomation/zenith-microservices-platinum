from sqlalchemy import Column, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Booking(Base):
    __tablename__ = "bookings"
    id = Column(String, primary_key=True)
    seeker_id = Column(String, ForeignKey("users.id"))
    provider_id = Column(String, ForeignKey("users.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    location = Column(String)
    price = Column(Float)
    created_at = Column(DateTime, server_default=func.now())

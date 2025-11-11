from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, Time, Date
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, date, time

class ProviderAvailability(Base):
    __tablename__ = "provider_availability"

    id = Column(String, primary_key=True, index=True)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)

    # Date and time range
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Availability type
    availability_type = Column(String, default="available")  # available, busy, blocked
    is_recurring = Column(Boolean, default=False)
    recurring_pattern = Column(String)  # daily, weekly, monthly

    # Booking info (if booked)
    booking_id = Column(String, ForeignKey("bookings.id"))

    # Notes
    notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("ProviderProfile", back_populates="availability")
    booking = relationship("Booking")

class ProviderService(Base):
    __tablename__ = "provider_services"

    id = Column(String, primary_key=True, index=True)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)

    # Service details
    name = Column(String, nullable=False)
    description = Column(Text)
    category = Column(String, nullable=False)  # companionship, events, travel, etc.

    # Pricing
    hourly_rate = Column(Float, nullable=False)
    minimum_hours = Column(Integer, default=1)
    maximum_hours = Column(Integer, default=24)

    # Availability
    is_active = Column(Boolean, default=True)
    requires_deposit = Column(Boolean, default=False)
    deposit_percentage = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("ProviderProfile", back_populates="services")

class ProviderEarning(Base):
    __tablename__ = "provider_earnings"

    id = Column(String, primary_key=True, index=True)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False)

    # Earning details
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    platform_fee = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)

    # Payment status
    payment_status = Column(String, default="pending")  # pending, paid, failed
    payment_date = Column(DateTime)
    stripe_transfer_id = Column(String)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("ProviderProfile", back_populates="earnings")
    booking = relationship("Booking", back_populates="earnings")

class ProviderStats(Base):
    __tablename__ = "provider_stats"

    id = Column(String, primary_key=True, index=True)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False, unique=True)

    # Overall stats
    total_earnings = Column(Float, default=0.0)
    total_bookings = Column(Integer, default=0)
    completed_bookings = Column(Integer, default=0)
    cancelled_bookings = Column(Integer, default=0)

    # Rating stats
    average_rating = Column(Float, default=0.0)
    total_reviews = Column(Integer, default=0)
    five_star_reviews = Column(Integer, default=0)
    four_star_reviews = Column(Integer, default=0)
    three_star_reviews = Column(Integer, default=0)
    two_star_reviews = Column(Integer, default=0)
    one_star_reviews = Column(Integer, default=0)

    # Response time stats
    average_response_time_minutes = Column(Float, default=60)
    total_responses = Column(Integer, default=0)

    # Availability stats
    total_available_hours = Column(Float, default=0.0)
    booked_hours = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("ProviderProfile", back_populates="stats")

class ProviderCalendarSettings(Base):
    __tablename__ = "provider_calendar_settings"

    id = Column(String, primary_key=True, index=True)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False, unique=True)

    # Calendar preferences
    timezone = Column(String, default="UTC")
    working_hours_start = Column(Time, default="09:00:00")
    working_hours_end = Column(Time, default="17:00:00")
    working_days = Column(Text, default='["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]')  # JSON array

    # Booking preferences
    advance_notice_hours = Column(Integer, default=24)  # Minimum hours notice required
    max_consecutive_hours = Column(Integer, default=8)
    buffer_time_minutes = Column(Integer, default=30)  # Buffer between bookings

    # Cancellation policy
    cancellation_policy = Column(String, default="flexible")  # flexible, moderate, strict
    cancellation_deadline_hours = Column(Integer, default=24)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    provider = relationship("ProviderProfile", back_populates="calendar_settings")
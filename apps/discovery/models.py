from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)

    # Basic Info
    display_name = Column(String, nullable=False)
    bio = Column(Text)
    age = Column(Integer)
    gender = Column(String)
    location = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)

    # Appearance
    height = Column(Integer)  # in cm
    body_type = Column(String)
    hair_color = Column(String)
    eye_color = Column(String)

    # Services & Rates
    hourly_rate = Column(Float)
    services_offered = Column(Text)  # JSON array of services
    availability_status = Column(String, default="available")  # available, busy, offline

    # Verification & Safety
    is_verified = Column(Boolean, default=False)
    verification_level = Column(String, default="basic")  # basic, premium, elite
    background_check_status = Column(String, default="pending")  # pending, approved, rejected

    # Stats
    total_reviews = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)
    total_bookings = Column(Integer, default=0)
    response_time_minutes = Column(Integer, default=60)

    # Preferences
    accepts_international = Column(Boolean, default=True)
    accepts_crypto = Column(Boolean, default=False)
    minimum_booking_hours = Column(Integer, default=1)

    # Media
    profile_image_url = Column(String)
    gallery_images = Column(Text)  # JSON array of image URLs

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="provider_profile")
    tags = relationship("ProviderTag", back_populates="provider")

class ProviderTag(Base):
    __tablename__ = "provider_tags"

    id = Column(String, primary_key=True, index=True)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)
    tag_id = Column(String, ForeignKey("tags.id"), nullable=False)

    # Relationships
    provider = relationship("ProviderProfile", back_populates="tags")
    tag = relationship("Tag", back_populates="provider_tags")

class DiscoveryPreference(Base):
    __tablename__ = "discovery_preferences"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Location preferences
    max_distance_km = Column(Integer, default=50)
    preferred_location = Column(String)

    # Physical preferences
    min_age = Column(Integer, default=18)
    max_age = Column(Integer, default=99)
    preferred_genders = Column(Text)  # JSON array

    # Service preferences
    max_hourly_rate = Column(Float, default=500.0)
    preferred_services = Column(Text)  # JSON array

    # Other filters
    verification_required = Column(Boolean, default=True)
    accepts_international = Column(Boolean, default=True)
    accepts_crypto = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DiscoveryInteraction(Base):
    __tablename__ = "discovery_interactions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider_id = Column(String, ForeignKey("provider_profiles.id"), nullable=False)

    interaction_type = Column(String, nullable=False)  # like, pass, super_like, block
    interaction_value = Column(Float, default=1.0)  # For ranking algorithm

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    provider = relationship("ProviderProfile")
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Provider Profile Schemas
class ProviderProfileBase(BaseModel):
    display_name: str
    bio: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    height: Optional[int] = None
    body_type: Optional[str] = None
    hair_color: Optional[str] = None
    eye_color: Optional[str] = None
    hourly_rate: Optional[float] = None
    services_offered: Optional[List[str]] = []
    availability_status: str = "available"
    is_verified: bool = False
    verification_level: str = "basic"
    background_check_status: str = "pending"
    accepts_international: bool = True
    accepts_crypto: bool = False
    minimum_booking_hours: int = 1
    profile_image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = []

class ProviderProfileCreate(ProviderProfileBase):
    user_id: str

class ProviderProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    bio: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    height: Optional[int] = None
    body_type: Optional[str] = None
    hair_color: Optional[str] = None
    eye_color: Optional[str] = None
    hourly_rate: Optional[float] = None
    services_offered: Optional[List[str]] = None
    availability_status: Optional[str] = None
    accepts_international: Optional[bool] = None
    accepts_crypto: Optional[bool] = None
    minimum_booking_hours: Optional[int] = None
    profile_image_url: Optional[str] = None
    gallery_images: Optional[List[str]] = None

class ProviderProfileOut(ProviderProfileBase):
    id: str
    user_id: str
    total_reviews: int = 0
    average_rating: float = 0.0
    total_bookings: int = 0
    response_time_minutes: int = 60
    created_at: datetime
    updated_at: datetime
    last_active: datetime

    class Config:
        orm_mode = True

# Discovery Schemas
class DiscoveryCard(BaseModel):
    id: str
    display_name: str
    age: Optional[int]
    location: Optional[str]
    profile_image_url: Optional[str]
    hourly_rate: Optional[float]
    is_verified: bool
    verification_level: str
    average_rating: float
    total_reviews: int
    distance_km: Optional[float]
    tags: List[str] = []
    bio: Optional[str]

class DiscoveryFilters(BaseModel):
    min_age: Optional[int] = 18
    max_age: Optional[int] = 99
    max_distance_km: Optional[int] = 50
    min_hourly_rate: Optional[float] = 0
    max_hourly_rate: Optional[float] = 1000
    preferred_genders: Optional[List[str]] = []
    preferred_services: Optional[List[str]] = []
    verification_required: bool = True
    accepts_international: bool = True
    accepts_crypto: bool = False
    tags: Optional[List[str]] = []
    sort_by: str = "compatibility"  # compatibility, distance, rating, price_low, price_high

class DiscoveryResponse(BaseModel):
    providers: List[DiscoveryCard]
    total_count: int
    has_more: bool
    next_cursor: Optional[str]

# Interaction Schemas
class DiscoveryInteractionCreate(BaseModel):
    provider_id: str
    interaction_type: str  # like, pass, super_like, block

class DiscoveryInteractionOut(BaseModel):
    id: str
    user_id: str
    provider_id: str
    interaction_type: str
    created_at: datetime

# Preferences Schemas
class DiscoveryPreferencesUpdate(BaseModel):
    max_distance_km: Optional[int] = None
    preferred_location: Optional[str] = None
    min_age: Optional[int] = None
    max_age: Optional[int] = None
    preferred_genders: Optional[List[str]] = None
    max_hourly_rate: Optional[float] = None
    preferred_services: Optional[List[str]] = None
    verification_required: Optional[bool] = None
    accepts_international: Optional[bool] = None
    accepts_crypto: Optional[bool] = None

class DiscoveryPreferencesOut(BaseModel):
    id: str
    user_id: str
    max_distance_km: int
    preferred_location: Optional[str]
    min_age: int
    max_age: int
    preferred_genders: List[str]
    max_hourly_rate: float
    preferred_services: List[str]
    verification_required: bool
    accepts_international: bool
    accepts_crypto: bool
    created_at: datetime
    updated_at: datetime

# Tag Schemas
class ProviderTagCreate(BaseModel):
    provider_id: str
    tag_id: str

class ProviderTagOut(BaseModel):
    id: str
    provider_id: str
    tag_id: str
    tag_name: str

    class Config:
        orm_mode = True
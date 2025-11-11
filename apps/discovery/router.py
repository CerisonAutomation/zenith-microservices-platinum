from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, text
from database import get_db
from supabase_client import get_current_user
import models, schemas
from typing import List, Optional
import uuid
import math

router = APIRouter()

# Helper function to calculate distance between two points
def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula."""
    R = 6371  # Earth's radius in kilometers

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dlon/2) * math.sin(dlon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c

@router.get("/cards", response_model=schemas.DiscoveryResponse)
async def get_discovery_cards(
    filters: schemas.DiscoveryFilters = Depends(),
    cursor: Optional[str] = None,
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get discovery cards for swiping with filtering and pagination."""
    user_id = current_user["id"]

    # Get user preferences
    user_prefs = db.query(models.DiscoveryPreference).filter(
        models.DiscoveryPreference.user_id == user_id
    ).first()

    # Merge user preferences with filters
    if user_prefs:
        if not filters.min_age and user_prefs.min_age:
            filters.min_age = user_prefs.min_age
        if not filters.max_age and user_prefs.max_age:
            filters.max_age = user_prefs.max_age
        if not filters.max_distance_km and user_prefs.max_distance_km:
            filters.max_distance_km = user_prefs.max_distance_km
        if not filters.max_hourly_rate and user_prefs.max_hourly_rate:
            filters.max_hourly_rate = user_prefs.max_hourly_rate

    # Build base query
    query = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id != user_id,  # Don't show own profile
        models.ProviderProfile.availability_status == "available"
    )

    # Apply filters
    if filters.min_age:
        query = query.filter(models.ProviderProfile.age >= filters.min_age)
    if filters.max_age:
        query = query.filter(models.ProviderProfile.age <= filters.max_age)
    if filters.min_hourly_rate is not None:
        query = query.filter(models.ProviderProfile.hourly_rate >= filters.min_hourly_rate)
    if filters.max_hourly_rate is not None:
        query = query.filter(models.ProviderProfile.hourly_rate <= filters.max_hourly_rate)
    if filters.verification_required:
        query = query.filter(models.ProviderProfile.is_verified == True)
    if filters.accepts_international is not None:
        query = query.filter(models.ProviderProfile.accepts_international == filters.accepts_international)
    if filters.accepts_crypto is not None:
        query = query.filter(models.ProviderProfile.accepts_crypto == filters.accepts_crypto)

    # Gender filter
    if filters.preferred_genders:
        query = query.filter(models.ProviderProfile.gender.in_(filters.preferred_genders))

    # Location-based filtering (if user location is available)
    # This would need to be enhanced with user's current location
    # For now, we'll skip distance filtering in the query

    # Exclude already interacted providers (liked, passed, blocked)
    interacted_provider_ids = db.query(models.DiscoveryInteraction.provider_id).filter(
        models.DiscoveryInteraction.user_id == user_id,
        models.DiscoveryInteraction.interaction_type.in_(["like", "pass", "block"])
    ).subquery()

    query = query.filter(~models.ProviderProfile.id.in_(interacted_provider_ids))

    # Apply sorting
    if filters.sort_by == "rating":
        query = query.order_by(models.ProviderProfile.average_rating.desc())
    elif filters.sort_by == "price_low":
        query = query.order_by(models.ProviderProfile.hourly_rate.asc())
    elif filters.sort_by == "price_high":
        query = query.order_by(models.ProviderProfile.hourly_rate.desc())
    elif filters.sort_by == "distance":
        # Would need user's location for proper distance sorting
        query = query.order_by(models.ProviderProfile.created_at.desc())
    else:  # compatibility (default)
        query = query.order_by(models.ProviderProfile.average_rating.desc(), models.ProviderProfile.total_reviews.desc())

    # Pagination
    if cursor:
        # Parse cursor (could be provider ID or timestamp)
        query = query.filter(models.ProviderProfile.id > cursor)

    providers = query.limit(limit + 1).all()  # +1 to check if there are more

    # Check if there are more results
    has_more = len(providers) > limit
    providers = providers[:limit]

    # Convert to discovery cards
    discovery_cards = []
    for provider in providers:
        # Get tags for this provider
        provider_tags = db.query(models.ProviderTag).filter(
            models.ProviderTag.provider_id == provider.id
        ).all()

        tag_names = []
        for pt in provider_tags:
            tag = db.query(models.Tag).filter(models.Tag.id == pt.tag_id).first()
            if tag:
                tag_names.append(tag.name)

        card = schemas.DiscoveryCard(
            id=provider.id,
            display_name=provider.display_name,
            age=provider.age,
            location=provider.location,
            profile_image_url=provider.profile_image_url,
            hourly_rate=provider.hourly_rate,
            is_verified=provider.is_verified,
            verification_level=provider.verification_level,
            average_rating=provider.average_rating,
            total_reviews=provider.total_reviews,
            distance_km=None,  # Would calculate based on user location
            tags=tag_names,
            bio=provider.bio
        )
        discovery_cards.append(card)

    # Generate next cursor
    next_cursor = providers[-1].id if providers and has_more else None

    return schemas.DiscoveryResponse(
        providers=discovery_cards,
        total_count=len(discovery_cards),
        has_more=has_more,
        next_cursor=next_cursor
    )

@router.post("/interact", response_model=schemas.DiscoveryInteractionOut)
async def create_interaction(
    interaction: schemas.DiscoveryInteractionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record user interaction with a provider (like, pass, super_like, block)."""
    user_id = current_user["id"]

    # Validate interaction type
    valid_types = ["like", "pass", "super_like", "block"]
    if interaction.interaction_type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid interaction type")

    # Check if provider exists
    provider = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.id == interaction.provider_id
    ).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Check if user already interacted with this provider
    existing_interaction = db.query(models.DiscoveryInteraction).filter(
        models.DiscoveryInteraction.user_id == user_id,
        models.DiscoveryInteraction.provider_id == interaction.provider_id
    ).first()

    if existing_interaction:
        # Update existing interaction
        existing_interaction.interaction_type = interaction.interaction_type
        db.commit()
        db.refresh(existing_interaction)
        return existing_interaction
    else:
        # Create new interaction
        interaction_value = 1.0
        if interaction.interaction_type == "super_like":
            interaction_value = 2.0
        elif interaction.interaction_type == "block":
            interaction_value = -1.0

        db_interaction = models.DiscoveryInteraction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            provider_id=interaction.provider_id,
            interaction_type=interaction.interaction_type,
            interaction_value=interaction_value
        )

        db.add(db_interaction)
        db.commit()
        db.refresh(db_interaction)
        return db_interaction

@router.get("/preferences", response_model=schemas.DiscoveryPreferencesOut)
async def get_discovery_preferences(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's discovery preferences."""
    user_id = current_user["id"]

    prefs = db.query(models.DiscoveryPreference).filter(
        models.DiscoveryPreference.user_id == user_id
    ).first()

    if not prefs:
        # Create default preferences
        prefs = models.DiscoveryPreference(
            id=str(uuid.uuid4()),
            user_id=user_id
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return prefs

@router.put("/preferences", response_model=schemas.DiscoveryPreferencesOut)
async def update_discovery_preferences(
    preferences: schemas.DiscoveryPreferencesUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's discovery preferences."""
    user_id = current_user["id"]

    prefs = db.query(models.DiscoveryPreference).filter(
        models.DiscoveryPreference.user_id == user_id
    ).first()

    if not prefs:
        prefs = models.DiscoveryPreference(
            id=str(uuid.uuid4()),
            user_id=user_id
        )
        db.add(prefs)

    # Update preferences
    for field, value in preferences.dict(exclude_unset=True).items():
        setattr(prefs, field, value)

    db.commit()
    db.refresh(prefs)
    return prefs

# Provider Profile Management
@router.post("/providers", response_model=schemas.ProviderProfileOut)
async def create_provider_profile(
    profile: schemas.ProviderProfileCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a provider profile."""
    user_id = current_user["id"]

    # Check if user already has a provider profile
    existing = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Provider profile already exists")

    db_profile = models.ProviderProfile(
        id=str(uuid.uuid4()),
        user_id=user_id,
        **profile.dict()
    )

    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile

@router.get("/providers/me", response_model=schemas.ProviderProfileOut)
async def get_my_provider_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's provider profile."""
    user_id = current_user["id"]

    profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    return profile

@router.put("/providers/me", response_model=schemas.ProviderProfileOut)
async def update_provider_profile(
    updates: schemas.ProviderProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's provider profile."""
    user_id = current_user["id"]

    profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == user_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Update fields
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/providers/{provider_id}", response_model=schemas.ProviderProfileOut)
async def get_provider_profile(
    provider_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a provider profile by ID."""
    profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.id == provider_id
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    return profile

@router.post("/providers/{provider_id}/tags", response_model=schemas.ProviderTagOut)
async def add_provider_tag(
    provider_id: str,
    tag_data: schemas.ProviderTagCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a tag to a provider profile."""
    # Verify the provider profile belongs to current user
    profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.id == provider_id,
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Check if tag exists
    tag = db.query(models.Tag).filter(models.Tag.id == tag_data.tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    # Check if tag already exists for this provider
    existing = db.query(models.ProviderTag).filter(
        models.ProviderTag.provider_id == provider_id,
        models.ProviderTag.tag_id == tag_data.tag_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Tag already added to provider")

    db_tag = models.ProviderTag(
        id=str(uuid.uuid4()),
        provider_id=provider_id,
        tag_id=tag_data.tag_id
    )

    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)

    return schemas.ProviderTagOut(
        id=db_tag.id,
        provider_id=db_tag.provider_id,
        tag_id=db_tag.tag_id,
        tag_name=tag.name
    )

@router.delete("/providers/{provider_id}/tags/{tag_id}")
async def remove_provider_tag(
    provider_id: str,
    tag_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a tag from a provider profile."""
    # Verify the provider profile belongs to current user
    profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.id == provider_id,
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    tag = db.query(models.ProviderTag).filter(
        models.ProviderTag.provider_id == provider_id,
        models.ProviderTag.tag_id == tag_id
    ).first()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found for this provider")

    db.delete(tag)
    db.commit()

    return {"message": "Tag removed successfully"}
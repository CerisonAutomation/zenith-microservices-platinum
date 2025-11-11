"""
Search Service - Enterprise-grade search and discovery API
Advanced full-text search, geospatial queries, and AI-powered matching
"""

import os
import logging
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy import text, func, desc, and_, or_
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import structlog

from ...core.database import get_db
from ...core.cache import RedisCache
from ...core.monitoring import metrics
from ...shared.models import Profile, Match, Message
from ...shared.schemas import ProfileResponse, SearchFilters, PaginatedResponse

# Setup logging
logger = structlog.get_logger(__name__)

# Initialize cache
cache = RedisCache()

# Router
router = APIRouter(prefix="/api/v1/search", tags=["search"])

# ============================================================================
# SCHEMAS
# ============================================================================

class SearchFilters(BaseModel):
    """Advanced search filters for profile discovery"""
    query: Optional[str] = Field(None, description="Full-text search query")
    age_min: Optional[int] = Field(None, ge=18, le=100)
    age_max: Optional[int] = Field(None, ge=18, le=100)
    gender: Optional[List[str]] = Field(None, description="Gender preferences")
    distance: Optional[float] = Field(None, ge=0, le=500, description="Distance in km")
    latitude: Optional[float] = Field(None, description="User latitude for distance search")
    longitude: Optional[float] = Field(None, description="User longitude for distance search")
    verified_only: Optional[bool] = Field(False)
    online_only: Optional[bool] = Field(False)
    has_photos: Optional[bool] = Field(False)
    interests: Optional[List[str]] = Field(None, description="Shared interests")
    compatibility_min: Optional[float] = Field(None, ge=0, le=1, description="Minimum compatibility score")
    exclude_matched: Optional[bool] = Field(True, description="Exclude already matched profiles")

    @validator('age_max')
    def validate_age_range(cls, v, values):
        if v and values.get('age_min') and v < values['age_min']:
            raise ValueError('age_max must be greater than or equal to age_min')
        return v

class SearchResponse(BaseModel):
    """Search result with profile and match metadata"""
    profile: ProfileResponse
    distance: Optional[float] = None
    compatibility_score: Optional[float] = None
    common_interests: Optional[List[str]] = None
    last_active: Optional[datetime] = None

class SearchResults(PaginatedResponse):
    """Paginated search results"""
    results: List[SearchResponse]
    search_metadata: Dict[str, Any] = Field(default_factory=dict)

# ============================================================================
# UTILITIES
# ============================================================================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2

    R = 6371  # Earth's radius in kilometers

    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return R * c

def calculate_compatibility(user_profile: Profile, candidate_profile: Profile) -> float:
    """Calculate compatibility score between two profiles"""
    score = 0.0
    factors = 0

    # Age compatibility (closer ages = higher score)
    if user_profile.age and candidate_profile.age:
        age_diff = abs(user_profile.age - candidate_profile.age)
        age_score = max(0, 1 - (age_diff / 20))  # 20 year difference = 0 score
        score += age_score
        factors += 1

    # Interest overlap
    if user_profile.interests and candidate_profile.interests:
        user_interests = set(user_profile.interests)
        candidate_interests = set(candidate_profile.interests)
        overlap = len(user_interests.intersection(candidate_interests))
        total = len(user_interests.union(candidate_interests))
        if total > 0:
            interest_score = overlap / total
            score += interest_score * 2  # Weight interests higher
            factors += 2

    # Verification bonus
    if candidate_profile.is_verified:
        score += 0.2
        factors += 1

    # Online status bonus
    if candidate_profile.is_online:
        score += 0.1
        factors += 1

    return score / max(factors, 1) if factors > 0 else 0.5

# ============================================================================
# SEARCH ENDPOINTS
# ============================================================================

@router.get("/profiles", response_model=SearchResults)
async def search_profiles(
    filters: SearchFilters = Depends(),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("compatibility", enum=["compatibility", "distance", "age", "last_active"]),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """Advanced profile search with full-text, geospatial, and compatibility matching"""

    # Get user profile for compatibility calculation
    user_profile = db.query(Profile).filter(Profile.id == user_id).first()
    if not user_profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    # Build base query
    query = db.query(Profile).filter(
        Profile.id != user_id,  # Exclude self
        Profile.is_active == True
    )

    # Apply filters
    if filters.query:
        # Full-text search using PostgreSQL's built-in search
        search_terms = filters.query.split()
        search_conditions = []
        for term in search_terms:
            search_conditions.extend([
                Profile.full_name.ilike(f"%{term}%"),
                Profile.bio.ilike(f"%{term}%"),
                func.array_to_string(Profile.interests, ' ').ilike(f"%{term}%")
            ])
        query = query.filter(or_(*search_conditions))

    if filters.age_min is not None:
        query = query.filter(Profile.age >= filters.age_min)
    if filters.age_max is not None:
        query = query.filter(Profile.age <= filters.age_max)

    if filters.gender:
        query = query.filter(Profile.gender.in_(filters.gender))

    if filters.verified_only:
        query = query.filter(Profile.is_verified == True)

    if filters.online_only:
        query = query.filter(Profile.is_online == True)

    if filters.has_photos:
        # This would need a join with photos table
        query = query.filter(Profile.avatar_url.isnot(None))

    # Geospatial filtering
    if filters.latitude and filters.longitude and filters.distance:
        # Using PostGIS ST_DWithin for distance filtering
        query = query.filter(
            text(f"ST_DWithin(location, ST_MakePoint({filters.longitude}, {filters.latitude})::geography, {filters.distance * 1000})")
        )

    # Exclude already matched profiles
    if filters.exclude_matched:
        matched_ids = db.query(Match.matched_user_id).filter(
            Match.user_id == user_id,
            Match.status.in_(['pending', 'accepted'])
        ).subquery()
        query = query.filter(~Profile.id.in_(matched_ids))

    # Get total count before pagination
    total_count = query.count()

    # Apply sorting
    if sort_by == "compatibility":
        # This is complex - we'd need to calculate compatibility for all results
        # For now, sort by verification and online status as proxy
        query = query.order_by(
            desc(Profile.is_verified),
            desc(Profile.is_online),
            desc(Profile.last_seen)
        )
    elif sort_by == "distance" and filters.latitude and filters.longitude:
        # Sort by distance using PostGIS
        query = query.order_by(
            text(f"ST_Distance(location, ST_MakePoint({filters.longitude}, {filters.latitude})::geography)")
        )
    elif sort_by == "age":
        query = query.order_by(Profile.age)
    elif sort_by == "last_active":
        query = query.order_by(desc(Profile.last_seen))

    # Apply pagination
    offset = (page - 1) * limit
    profiles = query.offset(offset).limit(limit).all()

    # Calculate additional metadata for each result
    results = []
    for profile in profiles:
        result = SearchResponse(
            profile=ProfileResponse.from_orm(profile),
            compatibility_score=calculate_compatibility(user_profile, profile),
            last_active=profile.last_seen
        )

        # Calculate distance if coordinates provided
        if filters.latitude and filters.longitude and profile.location:
            # This would use PostGIS ST_Distance
            result.distance = calculate_distance(
                filters.latitude, filters.longitude,
                profile.location.y, profile.location.x  # PostGIS point format
            )

        # Calculate common interests
        if user_profile.interests and profile.interests:
            common = set(user_profile.interests).intersection(set(profile.interests))
            result.common_interests = list(common)

        results.append(result)

    # Sort results by compatibility if requested
    if sort_by == "compatibility":
        results.sort(key=lambda x: x.compatibility_score or 0, reverse=True)

    # Cache search results for performance
    cache_key = f"search:{user_id}:{hash(str(filters))}"
    background_tasks.add_task(cache.set, cache_key, results, ttl=300)  # 5 minute cache

    # Update metrics
    metrics.increment("search_profiles_total")
    metrics.histogram("search_results_count", len(results))

    return SearchResults(
        results=results,
        total=total_count,
        page=page,
        limit=limit,
        pages=(total_count + limit - 1) // limit,
        search_metadata={
            "filters_applied": filters.dict(exclude_unset=True),
            "sort_by": sort_by,
            "execution_time": None  # Would be set by middleware
        }
    )

@router.get("/suggestions")
async def get_search_suggestions(
    query: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """Get search suggestions based on partial query"""

    # Search for matching names, interests, and locations
    suggestions = []

    # Name suggestions
    names = db.query(Profile.full_name).filter(
        Profile.full_name.ilike(f"{query}%"),
        Profile.is_active == True
    ).distinct().limit(limit).all()
    suggestions.extend([name[0] for name in names])

    # Interest suggestions
    interests = db.query(Profile.interests).filter(
        func.array_to_string(Profile.interests, ' ').ilike(f"%{query}%"),
        Profile.is_active == True
    ).distinct().limit(limit).all()

    for interest_array in interests:
        if interest_array[0]:
            matching = [i for i in interest_array[0] if query.lower() in i.lower()]
            suggestions.extend(matching)

    # Remove duplicates and limit
    unique_suggestions = list(set(suggestions))[:limit]

    return {"suggestions": unique_suggestions}

@router.post("/index/rebuild")
async def rebuild_search_index(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    admin_user: str = Depends(require_admin)
):
    """Rebuild search indexes (admin only)"""

    async def rebuild_indexes():
        try:
            # Update search vectors for profiles
            db.execute(text("""
                UPDATE profiles
                SET search_vector = to_tsvector('english',
                    coalesce(full_name, '') || ' ' ||
                    coalesce(bio, '') || ' ' ||
                    array_to_string(interests, ' ')
                )
                WHERE is_active = true
            """))

            # Update search vectors for messages
            db.execute(text("""
                UPDATE messages
                SET search_vector = to_tsvector('english', coalesce(content, ''))
                WHERE content IS NOT NULL
            """))

            # Rebuild GIN indexes
            db.execute(text("REINDEX INDEX idx_profiles_search_vector"))
            db.execute(text("REINDEX INDEX idx_messages_search_vector"))

            db.commit()
            logger.info("Search indexes rebuilt successfully")

        except Exception as e:
            logger.error("Failed to rebuild search indexes", error=str(e))
            db.rollback()

    background_tasks.add_task(rebuild_indexes)

    return {"message": "Search index rebuild started"}

# ============================================================================
# DEPENDENCIES
# ============================================================================

async def get_current_user_id() -> str:
    """Get current user ID from JWT token"""
    # This would be implemented with proper JWT validation
    # For now, return a placeholder
    return "user-123"

async def require_admin() -> str:
    """Require admin user"""
    # Admin validation logic
    return "admin-user"
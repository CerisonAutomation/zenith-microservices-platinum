"""
Search Service Router - Advanced profile discovery and search using Elasticsearch
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
import structlog

from ...core.database import get_db
from ...core.elasticsearch import SearchService
from .schemas import SearchFilters, SearchResult, SearchResponse

router = APIRouter()

# Setup logging
logger = structlog.get_logger(__name__)

# Initialize search service
search_service = SearchService()

class LocationFilter(BaseModel):
    """Location coordinates for distance-based search"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

class AdvancedSearchFilters(BaseModel):
    """Advanced search filters for Elasticsearch"""
    query: Optional[str] = Field(None, description="Full-text search query")
    age_min: Optional[int] = Field(None, ge=18, le=100)
    age_max: Optional[int] = Field(None, ge=18, le=100)
    gender: Optional[List[str]] = Field(None, description="Gender preferences")
    distance: Optional[float] = Field(None, ge=0, le=500, description="Distance in km")
    location: Optional[LocationFilter] = Field(None, description="Location coordinates")
    verified_only: Optional[bool] = Field(False)
    online_only: Optional[bool] = Field(False)
    interests: Optional[List[str]] = Field(None, description="Interests to search")

    @validator('age_max')
    def validate_age_range(cls, v, values):
        if v and values.get('age_min') and v < values['age_min']:
            raise ValueError('age_max must be greater than or equal to age_min')
        return v

class EnhancedSearchResult(BaseModel):
    """Extended search result with relevance scoring"""
    id: str
    full_name: str
    age: Optional[int]
    gender: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    is_online: bool
    is_verified: bool
    distance: Optional[float] = None
    relevance_score: Optional[float] = Field(None, description="Elasticsearch relevance score")
    interests: Optional[List[str]] = None

class EnhancedSearchResponse(BaseModel):
    """Enhanced search response with metadata"""
    results: List[EnhancedSearchResult]
    total: int
    page: int
    limit: int
    pages: int
    metadata: Dict[str, Any] = Field(default_factory=dict)

@router.get("/profiles", response_model=EnhancedSearchResponse)
async def search_profiles(
    query: Optional[str] = Query(None, description="Full-text search query"),
    age_min: Optional[int] = Query(None, ge=18, le=100, description="Minimum age"),
    age_max: Optional[int] = Query(None, ge=18, le=100, description="Maximum age"),
    gender: Optional[List[str]] = Query(None, description="Gender preferences"),
    distance: Optional[float] = Query(None, ge=0, le=500, description="Distance in km"),
    latitude: Optional[float] = Query(None, ge=-90, le=90, description="Latitude"),
    longitude: Optional[float] = Query(None, ge=-180, le=180, description="Longitude"),
    verified_only: bool = Query(False, description="Only verified profiles"),
    online_only: bool = Query(False, description="Only online users"),
    interests: Optional[List[str]] = Query(None, description="Interests to match"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    sort_by: str = Query("_score", description="Sort by field (_score, age, last_seen)"),
    db: Session = Depends(get_db)
):
    """
    Advanced profile search with Elasticsearch-powered full-text search,
    geospatial filtering, and relevance ranking.

    Features:
    - Full-text search across profiles
    - Age range filtering
    - Gender preferences
    - Geographic proximity search
    - Interest-based matching
    - Verification status filtering
    - Online status filtering
    - Pagination and sorting
    - Relevance scoring
    """

    try:
        # Build filter dictionary
        filters = {}

        if age_min is not None:
            filters["age_min"] = age_min
        if age_max is not None:
            filters["age_max"] = age_max
        if gender:
            filters["gender"] = gender
        if verified_only:
            filters["verified_only"] = True
        if online_only:
            filters["online_only"] = True
        if interests:
            filters["interests"] = interests

        # Add location-based filtering
        if latitude is not None and longitude is not None and distance is not None:
            filters["location"] = {
                "latitude": latitude,
                "longitude": longitude
            }
            filters["distance"] = distance

        # Determine sort order
        sort_order = "desc" if sort_by == "_score" else "asc"
        if sort_by not in ["_score", "age", "last_seen"]:
            sort_by = "_score"

        # Perform search
        search_results = await search_service.search(
            query=query,
            doc_type="profiles",
            filters=filters if filters else None,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Transform results
        results = []
        for hit in search_results.get("results", []):
            result = EnhancedSearchResult(
                id=hit.get("id"),
                full_name=hit.get("full_name", ""),
                age=hit.get("age"),
                gender=hit.get("gender"),
                avatar_url=hit.get("avatar_url"),
                bio=hit.get("bio"),
                is_online=hit.get("is_online", False),
                is_verified=hit.get("is_verified", False),
                distance=hit.get("distance"),
                relevance_score=hit.get("_score"),
                interests=hit.get("interests")
            )
            results.append(result)

        # Log search metrics
        logger.info(
            "Profile search executed",
            query=query,
            results_count=len(results),
            total=search_results.get("total", 0),
            page=page,
            filters=list(filters.keys()) if filters else []
        )

        return EnhancedSearchResponse(
            results=results,
            total=search_results.get("total", 0),
            page=page,
            limit=limit,
            pages=search_results.get("pages", 0),
            metadata=search_results.get("metadata", {})
        )

    except Exception as e:
        logger.error(
            "Profile search failed",
            error=str(e),
            query=query,
            exc_info=e
        )
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1, max_length=100, description="Query string"),
    doc_type: str = Query("profiles", description="Document type (profiles or content)"),
    limit: int = Query(10, ge=1, le=50, description="Number of suggestions")
):
    """
    Get search suggestions with Elasticsearch autocomplete

    Supports:
    - Profile name suggestions
    - Interest suggestions
    - Content title suggestions
    - Fuzzy matching for typos
    """

    try:
        # Validate document type
        if doc_type not in ["profiles", "content"]:
            doc_type = "profiles"

        # Get suggestions from Elasticsearch
        suggestions = await search_service.suggest(
            query=q,
            doc_type=doc_type,
            limit=limit
        )

        logger.info(
            "Search suggestions retrieved",
            query=q,
            doc_type=doc_type,
            suggestions_count=len(suggestions)
        )

        return {"suggestions": suggestions}

    except Exception as e:
        logger.error(
            "Failed to get search suggestions",
            error=str(e),
            query=q
        )
        # Return empty suggestions on error instead of failing
        return {"suggestions": []}


@router.get("/content", response_model=EnhancedSearchResponse)
async def search_content(
    query: Optional[str] = Query(None, description="Full-text search query"),
    content_type: Optional[str] = Query(None, description="Content type (blog, forum, gallery)"),
    is_published: bool = Query(True, description="Only published content"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    sort_by: str = Query("_score", description="Sort by field (_score, created_at, view_count)"),
):
    """
    Search for content (blog posts, forum threads, gallery items) using Elasticsearch

    Features:
    - Full-text search across titles and content
    - Content type filtering
    - Publication status filtering
    - Pagination and sorting
    - Relevance-based ranking
    """

    try:
        # Build filters
        filters = {}

        if is_published:
            filters["is_published"] = True

        if content_type:
            filters["content_type"] = content_type

        # Determine sort order
        sort_order = "desc" if sort_by == "_score" else "desc"
        if sort_by not in ["_score", "created_at", "view_count"]:
            sort_by = "_score"

        # Perform search
        search_results = await search_service.search(
            query=query,
            doc_type="content",
            filters=filters if filters else None,
            page=page,
            limit=limit,
            sort_by=sort_by,
            sort_order=sort_order
        )

        # Transform results
        results = []
        for hit in search_results.get("results", []):
            result = EnhancedSearchResult(
                id=hit.get("id"),
                full_name=hit.get("title", ""),
                age=None,
                gender=None,
                avatar_url=None,
                bio=hit.get("content"),
                is_online=False,
                is_verified=hit.get("is_published", False),
                distance=None,
                relevance_score=hit.get("_score"),
                interests=hit.get("tags")
            )
            results.append(result)

        logger.info(
            "Content search executed",
            query=query,
            results_count=len(results),
            total=search_results.get("total", 0),
            page=page,
            content_type=content_type
        )

        return EnhancedSearchResponse(
            results=results,
            total=search_results.get("total", 0),
            page=page,
            limit=limit,
            pages=search_results.get("pages", 0),
            metadata=search_results.get("metadata", {})
        )

    except Exception as e:
        logger.error(
            "Content search failed",
            error=str(e),
            query=query,
            exc_info=e
        )
        raise HTTPException(
            status_code=500,
            detail=f"Content search failed: {str(e)}"
        )
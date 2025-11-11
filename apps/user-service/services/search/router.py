"""
Search Service Router - Advanced profile discovery and search
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from ...core.database import get_db
from .schemas import SearchFilters, SearchResult, SearchResponse

router = APIRouter()

class SearchFilters(BaseModel):
    query: Optional[str] = None
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    gender: Optional[List[str]] = None
    distance: Optional[float] = None
    verified_only: Optional[bool] = False
    online_only: Optional[bool] = False

class SearchResult(BaseModel):
    id: str
    full_name: str
    age: Optional[int]
    gender: Optional[str]
    avatar_url: Optional[str]
    bio: Optional[str]
    is_online: bool
    is_verified: bool
    distance: Optional[float] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    page: int
    limit: int

@router.get("/profiles", response_model=SearchResponse)
async def search_profiles(
    query: Optional[str] = None,
    age_min: Optional[int] = Query(None, ge=18, le=100),
    age_max: Optional[int] = Query(None, ge=18, le=100),
    gender: Optional[List[str]] = Query(None),
    distance: Optional[float] = Query(None, ge=0, le=500),
    verified_only: bool = False,
    online_only: bool = False,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Search profiles with advanced filtering"""

    # This is a simplified implementation
    # In production, this would use Supabase client or direct DB queries
    # with full-text search, PostGIS, and advanced ranking

    try:
        # For now, return mock results
        # TODO: Implement real search logic
        mock_results = [
            SearchResult(
                id="user-1",
                full_name="Alice Johnson",
                age=28,
                gender="female",
                avatar_url="https://example.com/avatar1.jpg",
                bio="Love hiking and coffee",
                is_online=True,
                is_verified=True,
                distance=2.5
            ),
            SearchResult(
                id="user-2",
                full_name="Bob Smith",
                age=32,
                gender="male",
                avatar_url="https://example.com/avatar2.jpg",
                bio="Tech enthusiast and gamer",
                is_online=False,
                is_verified=True,
                distance=5.1
            )
        ]

        return SearchResponse(
            results=mock_results,
            total=len(mock_results),
            page=page,
            limit=limit
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50)
):
    """Get search suggestions"""

    # Mock suggestions
    suggestions = [
        "hiking", "coffee", "gaming", "travel",
        "photography", "music", "cooking", "sports"
    ]

    # Filter by query
    filtered = [s for s in suggestions if q.lower() in s.lower()][:limit]

    return {"suggestions": filtered}
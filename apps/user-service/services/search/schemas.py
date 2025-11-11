"""
Search Service Schemas
"""

from typing import List, Optional
from pydantic import BaseModel

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
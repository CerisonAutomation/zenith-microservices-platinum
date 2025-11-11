from pydantic import BaseModel
from datetime import datetime

class ReviewCreate(BaseModel):
    reviewer_id: str
    provider_id: str
    rating: int
    comment: str

class ReviewOut(BaseModel):
    id: str
    reviewer_id: str
    provider_id: str
    rating: int
    comment: str
    created_at: datetime

    class Config:
        orm_mode = True

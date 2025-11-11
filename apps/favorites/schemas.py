from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class FavoriteCreate(BaseModel):
    user_id: str
    provider_id: str

class FavoriteOut(BaseModel):
    id: int
    user_id: str
    provider_id: str
    created_at: datetime
    is_active: bool

    class Config:
        orm_mode = True

class FavoriteUpdate(BaseModel):
    is_active: Optional[bool] = None

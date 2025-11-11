from pydantic import BaseModel
from datetime import datetime

class BookingCreate(BaseModel):
    seeker_id: str
    provider_id: str
    start_time: datetime
    end_time: datetime
    location: str
    price: float

class BookingOut(BaseModel):
    id: str
    seeker_id: str
    provider_id: str
    start_time: datetime
    end_time: datetime
    location: str
    price: float
    created_at: datetime

    class Config:
        orm_mode = True

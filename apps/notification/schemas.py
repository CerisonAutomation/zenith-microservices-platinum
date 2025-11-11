from pydantic import BaseModel
from datetime import datetime

class NotificationCreate(BaseModel):
    user_id: str
    message: str

class NotificationOut(BaseModel):
    id: str
    user_id: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        orm_mode = True

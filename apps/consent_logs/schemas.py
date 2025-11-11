from pydantic import BaseModel
from datetime import datetime

class ConsentLogCreate(BaseModel):
    user_id: str
    action: str
    details: str

class ConsentLogOut(BaseModel):
    id: str
    user_id: str
    action: str
    details: str
    timestamp: datetime

    class Config:
        orm_mode = True

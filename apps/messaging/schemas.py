from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict

class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    content: str
    media_url: Optional[str] = None
    emojis: Optional[str] = None

class MessageOut(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    media_url: Optional[str]
    reactions: Optional[Dict[str, int]] = {}
    emojis: Optional[str]
    timestamp: datetime

    class Config:
        orm_mode = True

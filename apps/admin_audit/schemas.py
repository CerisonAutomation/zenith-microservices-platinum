from pydantic import BaseModel
from datetime import datetime

class AuditLogCreate(BaseModel):
    admin_id: str
    action: str
    entity: str
    notes: str

class AuditLogOut(BaseModel):
    id: str
    admin_id: str
    action: str
    entity: str
    notes: str
    timestamp: datetime

    class Config:
        orm_mode = True

from pydantic import BaseModel

class TagCreate(BaseModel):
    name: str

class TagOut(BaseModel):
    id: str
    name: str

    class Config:
        orm_mode = True

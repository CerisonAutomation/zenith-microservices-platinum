from sqlalchemy import Column, String, Table, ForeignKey
from database import Base

class Tag(Base):
    __tablename__ = "tags"
    id = Column(String, primary_key=True)
    name = Column(String, unique=True)

class ProfileTag(Base):
    __tablename__ = "profile_tags"
    profile_id = Column(String, ForeignKey("users.id"), primary_key=True)
    tag_id = Column(String, ForeignKey("tags.id"), primary_key=True)

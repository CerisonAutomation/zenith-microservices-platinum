from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Message(Base):
    __tablename__ = "messages"
    id = Column(String, primary_key=True)
    sender_id = Column(String, ForeignKey("users.id"))
    receiver_id = Column(String, ForeignKey("users.id"))
    content = Column(Text)
    media_url = Column(String, nullable=True)
    reactions = Column(JSON, default=dict)  # e.g., {"👍": 3, "❤️": 5}
    emojis = Column(String, nullable=True)  # Optional string of parsed emoji tags
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])

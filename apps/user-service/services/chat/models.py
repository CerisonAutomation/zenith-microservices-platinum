"""
Chat Service Models - SQLAlchemy models for real-time messaging.
"""
import uuid
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, JSON, Float
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from ...core.database import Base
import datetime

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    type = Column(String, default="direct")  # direct, group
    name = Column(String, nullable=True)  # For group chats
    description = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    last_message_at = Column(DateTime, nullable=True)
    conversation_metadata = Column(JSON, nullable=True, default=dict)

    # Relationships
    participants = relationship("ConversationParticipant", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")

class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id = Column(Integer, primary_key=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"))
    user_id = Column(UUID(as_uuid=True), index=True)
    role = Column(String, default="member")  # admin, member
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_read_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    notifications_enabled = Column(Boolean, default=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="participants")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id"), nullable=True)
    sender_id = Column(UUID(as_uuid=True), index=True)
    receiver_id = Column(UUID(as_uuid=True), index=True)
    content = Column(Text, nullable=True)
    message_type = Column(String, default="text")  # text, image, file, voice, system
    attachment_url = Column(String, nullable=True)
    attachment_metadata = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    is_delivered = Column(Boolean, default=False)
    delivered_at = Column(DateTime, nullable=True)
    reply_to_message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=True)
    reactions = Column(JSON, nullable=True, default=dict)
    conversation_id = Column(UUID(as_uuid=True), nullable=True)  # Optional grouping for threads
    search_vector = Column(String, nullable=True)

class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id = Column(Integer, primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"))
    user_id = Column(UUID(as_uuid=True), index=True)
    reaction = Column(String)  # emoji or reaction type
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    message = relationship("Message", back_populates="reactions")

class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id = Column(Integer, primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"))
    file_url = Column(String)
    file_name = Column(String)
    file_size = Column(Integer)
    file_type = Column(String)  # image, video, document, etc.
    mime_type = Column(String)
    thumbnail_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    message = relationship("Message", back_populates="attachments")

class TypingIndicator(Base):
    __tablename__ = "typing_indicators"

    id = Column(Integer, primary_key=True)
    conversation_id = Column(UUID(as_uuid=True), index=True)
    user_id = Column(UUID(as_uuid=True), index=True)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class BlockedConversation(Base):
    __tablename__ = "blocked_conversations"

    id = Column(Integer, primary_key=True)
    conversation_id = Column(UUID(as_uuid=True), index=True)
    user_id = Column(UUID(as_uuid=True), index=True)
    blocked_at = Column(DateTime, default=datetime.datetime.utcnow)
    reason = Column(String, nullable=True)

class MessageReport(Base):
    __tablename__ = "message_reports"

    id = Column(Integer, primary_key=True)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"))
    reporter_id = Column(UUID(as_uuid=True), index=True)
    reason = Column(String)
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, reviewed, resolved
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), nullable=True)
    resolution = Column(Text, nullable=True)
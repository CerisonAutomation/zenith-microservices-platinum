"""
Chat Service Schemas - Pydantic models for API validation.
"""
from pydantic import BaseModel, UUID4, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ConversationBase(BaseModel):
    type: str = Field(default="direct", description="Conversation type: direct or group")
    name: Optional[str] = Field(None, description="Conversation name (for groups)")
    description: Optional[str] = Field(None, description="Conversation description")
    avatar_url: Optional[str] = Field(None, description="Conversation avatar URL")

class ConversationCreate(ConversationBase):
    participant_ids: List[UUID4] = Field(..., description="List of participant user IDs")

class ConversationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar_url: Optional[str] = None

class ConversationParticipant(BaseModel):
    user_id: UUID4
    role: str = "member"
    joined_at: datetime
    last_read_at: Optional[datetime] = None
    is_active: bool = True
    notifications_enabled: bool = True

class Conversation(ConversationBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    last_message_at: Optional[datetime] = None
    participants: List[ConversationParticipant] = []
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class MessageAttachment(BaseModel):
    file_url: str
    file_name: str
    file_size: int
    file_type: str
    mime_type: str
    thumbnail_url: Optional[str] = None

class MessageReaction(BaseModel):
    user_id: UUID4
    reaction: str
    created_at: datetime

class MessageBase(BaseModel):
    match_id: Optional[UUID4] = None
    sender_id: UUID4
    receiver_id: UUID4
    content: Optional[str] = None
    message_type: str = Field(default="text", description="Message type: text, image, file, voice, system")
    attachment_url: Optional[str] = None
    attachment_metadata: Optional[Dict[str, Any]] = None
    reply_to_message_id: Optional[UUID4] = None
    reactions: Optional[Dict[str, Any]] = None
    conversation_id: Optional[UUID4] = None

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    content: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class Message(MessageBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    is_read: bool = False
    read_at: Optional[datetime] = None
    is_delivered: bool = False
    delivered_at: Optional[datetime] = None
    search_vector: Optional[str] = None

    class Config:
        from_attributes = True

class TypingIndicator(BaseModel):
    conversation_id: UUID4
    user_id: UUID4
    is_typing: bool

class ReadReceipt(BaseModel):
    message_id: UUID4
    conversation_id: UUID4
    user_id: UUID4
    timestamp: datetime

class MessageReportCreate(BaseModel):
    message_id: UUID4
    reason: str = Field(..., description="Report reason: spam, harassment, inappropriate, etc.")
    description: Optional[str] = Field(None, description="Additional details about the report")

class MessageReport(BaseModel):
    id: int
    message_id: UUID4
    reporter_id: UUID4
    reason: str
    description: Optional[str] = None
    status: str = "pending"
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[UUID4] = None
    resolution: Optional[str] = None

# WebSocket message schemas
class WSMessage(BaseModel):
    type: str = Field(..., description="Message type")
    data: Dict[str, Any] = Field(..., description="Message payload")

class ChatMessageWS(WSMessage):
    type: str = "chat_message"
    conversation_id: UUID4
    content: str
    message_type: str = "text"

class TypingStartWS(WSMessage):
    type: str = "typing_start"
    conversation_id: UUID4

class TypingStopWS(WSMessage):
    type: str = "typing_stop"
    conversation_id: UUID4

class ReadReceiptWS(WSMessage):
    type: str = "read_receipt"
    message_id: UUID4
    conversation_id: UUID4

class UserStatusWS(WSMessage):
    type: str = "user_status"
    user_id: UUID4
    is_online: bool

# API Response schemas
class ConversationList(BaseModel):
    conversations: List[Conversation]
    total: int
    has_more: bool

class MessageList(BaseModel):
    messages: List[Message]
    total: int
    has_more: bool

class ChatStats(BaseModel):
    total_conversations: int
    total_messages: int
    active_users: int
    messages_today: int

class BlockedConversation(BaseModel):
    conversation_id: UUID4
    blocked_at: datetime
    reason: Optional[str] = None
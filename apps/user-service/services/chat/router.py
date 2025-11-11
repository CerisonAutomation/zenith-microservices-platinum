"""
Chat Service Router - REST API endpoints for messaging functionality.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models, schemas
from datetime import datetime, timedelta

router = APIRouter()

@router.post("/conversations", response_model=schemas.Conversation)
async def create_conversation(
    conversation: schemas.ConversationCreate,
    db: Session = Depends(get_db)
):
    """Create a new conversation."""
    # Create conversation
    db_conversation = models.Conversation(
        type=conversation.type,
        name=conversation.name,
        description=conversation.description,
        avatar_url=conversation.avatar_url
    )
    db.add(db_conversation)
    db.flush()  # Get the conversation ID

    # Add participants
    for participant_id in conversation.participant_ids:
        participant = models.ConversationParticipant(
            conversation_id=db_conversation.id,
            user_id=participant_id
        )
        db.add(participant)

    db.commit()
    db.refresh(db_conversation)
    return db_conversation

@router.get("/conversations", response_model=schemas.ConversationList)
async def get_user_conversations(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get all conversations for a user."""
    # Get conversations where user is a participant
    conversations_query = db.query(models.Conversation).join(
        models.ConversationParticipant
    ).filter(
        models.ConversationParticipant.user_id == user_id,
        models.ConversationParticipant.is_active == True,
        models.Conversation.is_active == True
    ).order_by(
        models.Conversation.last_message_at.desc().nulls_last()
    )

    total = conversations_query.count()
    conversations = conversations_query.offset(offset).limit(limit).all()

    return {
        "conversations": conversations,
        "total": total,
        "has_more": offset + len(conversations) < total
    }

@router.get("/conversations/{conversation_id}", response_model=schemas.Conversation)
async def get_conversation(
    conversation_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific conversation."""
    conversation = db.query(models.Conversation).join(
        models.ConversationParticipant
    ).filter(
        models.Conversation.id == conversation_id,
        models.ConversationParticipant.user_id == user_id,
        models.ConversationParticipant.is_active == True
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation

@router.put("/conversations/{conversation_id}", response_model=schemas.Conversation)
async def update_conversation(
    conversation_id: str,
    updates: schemas.ConversationUpdate,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Update a conversation."""
    # Check if user is admin/owner of the conversation
    participant = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == conversation_id,
        models.ConversationParticipant.user_id == user_id,
        models.ConversationParticipant.role.in_(["admin", "owner"])
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="Not authorized to update conversation")

    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Update fields
    update_data = updates.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(conversation, field, value)

    conversation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)
    return conversation

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Delete a conversation (soft delete)."""
    # Check if user is admin/owner
    participant = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == conversation_id,
        models.ConversationParticipant.user_id == user_id,
        models.ConversationParticipant.role.in_(["admin", "owner"])
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="Not authorized to delete conversation")

    conversation = db.query(models.Conversation).filter(
        models.Conversation.id == conversation_id
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.is_active = False
    db.commit()

    return {"message": "Conversation deleted successfully"}

@router.post("/conversations/{conversation_id}/participants")
async def add_participant(
    conversation_id: str,
    participant_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Add a participant to a conversation."""
    # Check if user is admin/owner
    participant_check = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == conversation_id,
        models.ConversationParticipant.user_id == user_id,
        models.ConversationParticipant.role.in_(["admin", "owner"])
    ).first()

    if not participant_check:
        raise HTTPException(status_code=403, detail="Not authorized to add participants")

    # Check if participant already exists
    existing = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == conversation_id,
        models.ConversationParticipant.user_id == participant_id
    ).first()

    if existing:
        if existing.is_active:
            raise HTTPException(status_code=400, detail="User is already a participant")
        else:
            # Reactivate participant
            existing.is_active = True
            db.commit()
            return {"message": "Participant reactivated"}

    # Add new participant
    new_participant = models.ConversationParticipant(
        conversation_id=conversation_id,
        user_id=participant_id
    )
    db.add(new_participant)
    db.commit()

    return {"message": "Participant added successfully"}

@router.delete("/conversations/{conversation_id}/participants/{participant_id}")
async def remove_participant(
    conversation_id: str,
    participant_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Remove a participant from a conversation."""
    # Check if user is admin/owner or removing themselves
    if user_id != participant_id:
        auth_check = db.query(models.ConversationParticipant).filter(
            models.ConversationParticipant.conversation_id == conversation_id,
            models.ConversationParticipant.user_id == user_id,
            models.ConversationParticipant.role.in_(["admin", "owner"])
        ).first()

        if not auth_check:
            raise HTTPException(status_code=403, detail="Not authorized to remove participants")

    participant = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == conversation_id,
        models.ConversationParticipant.user_id == participant_id,
        models.ConversationParticipant.is_active == True
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    participant.is_active = False
    db.commit()

    return {"message": "Participant removed successfully"}

@router.get("/conversations/{conversation_id}/messages", response_model=schemas.MessageList)
async def get_messages(
    conversation_id: str,
    user_id: str,
    limit: int = Query(50, ge=1, le=200),
    before: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Get messages for a conversation."""
    # Check if user is participant
    participant = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == conversation_id,
        models.ConversationParticipant.user_id == user_id,
        models.ConversationParticipant.is_active == True
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="Not authorized to view messages")

    # Build query
    query = db.query(models.Message).filter(
        models.Message.conversation_id == conversation_id,
        models.Message.is_deleted == False
    )

    if before:
        query = query.filter(models.Message.created_at < before)

    total = query.count()
    messages = query.order_by(
        models.Message.created_at.desc()
    ).limit(limit).all()

    # Reverse to get chronological order
    messages.reverse()

    return {
        "messages": messages,
        "total": total,
        "has_more": len(messages) == limit
    }

@router.post("/messages/{message_id}/read")
async def mark_message_read(
    message_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Mark a message as read."""
    message = db.query(models.Message).filter(
        models.Message.id == message_id
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check if user is participant in conversation
    participant = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == message.conversation_id,
        models.ConversationParticipant.user_id == user_id,
        models.ConversationParticipant.is_active == True
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Update read status
    if not message.read_at:
        message.read_at = datetime.utcnow()
        db.commit()

    # Update participant's last read timestamp
    participant.last_read_at = datetime.utcnow()
    db.commit()

    return {"message": "Message marked as read"}

@router.post("/messages/{message_id}/reactions")
async def add_reaction(
    message_id: str,
    reaction: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Add a reaction to a message."""
    message = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.is_deleted == False
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check if user is participant
    participant = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == message.conversation_id,
        models.ConversationParticipant.user_id == user_id,
        models.ConversationParticipant.is_active == True
    ).first()

    if not participant:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if reaction already exists
    existing = db.query(models.MessageReaction).filter(
        models.MessageReaction.message_id == message_id,
        models.MessageReaction.user_id == user_id,
        models.MessageReaction.reaction == reaction
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Reaction already exists")

    # Add reaction
    db_reaction = models.MessageReaction(
        message_id=message_id,
        user_id=user_id,
        reaction=reaction
    )
    db.add(db_reaction)
    db.commit()

    return {"message": "Reaction added successfully"}

@router.delete("/messages/{message_id}/reactions/{reaction}")
async def remove_reaction(
    message_id: str,
    reaction: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Remove a reaction from a message."""
    db_reaction = db.query(models.MessageReaction).filter(
        models.MessageReaction.message_id == message_id,
        models.MessageReaction.user_id == user_id,
        models.MessageReaction.reaction == reaction
    ).first()

    if not db_reaction:
        raise HTTPException(status_code=404, detail="Reaction not found")

    db.delete(db_reaction)
    db.commit()

    return {"message": "Reaction removed successfully"}

@router.post("/conversations/{conversation_id}/block")
async def block_conversation(
    conversation_id: str,
    reason: Optional[str] = None,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Block a conversation."""
    # Check if already blocked
    existing = db.query(models.BlockedConversation).filter(
        models.BlockedConversation.conversation_id == conversation_id,
        models.BlockedConversation.user_id == user_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Conversation already blocked")

    # Add block
    block = models.BlockedConversation(
        conversation_id=conversation_id,
        user_id=user_id,
        reason=reason
    )
    db.add(block)
    db.commit()

    return {"message": "Conversation blocked successfully"}

@router.delete("/conversations/{conversation_id}/block")
async def unblock_conversation(
    conversation_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Unblock a conversation."""
    block = db.query(models.BlockedConversation).filter(
        models.BlockedConversation.conversation_id == conversation_id,
        models.BlockedConversation.user_id == user_id
    ).first()

    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    db.delete(block)
    db.commit()

    return {"message": "Conversation unblocked successfully"}

@router.post("/messages/{message_id}/report")
async def report_message(
    message_id: str,
    report: schemas.MessageReportCreate,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Report a message for moderation."""
    message = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.is_deleted == False
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    # Check if user already reported this message
    existing = db.query(models.MessageReport).filter(
        models.MessageReport.message_id == message_id,
        models.MessageReport.reporter_id == user_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Message already reported")

    # Create report
    db_report = models.MessageReport(
        message_id=message_id,
        reporter_id=user_id,
        reason=report.reason,
        description=report.description
    )
    db.add(db_report)
    db.commit()

    return {"message": "Message reported successfully"}

@router.get("/stats", response_model=schemas.ChatStats)
async def get_chat_stats(db: Session = Depends(get_db)):
    """Get chat system statistics."""
    # This would aggregate real statistics from the database
    return {
        "total_conversations": 0,
        "total_messages": 0,
        "active_users": 0,
        "messages_today": 0
    }

# ============================================================================
# DIRECT MESSAGING ENDPOINTS (Supabase-compatible)
# ============================================================================

@router.post("/messages", response_model=schemas.Message)
async def send_message(
    message: schemas.MessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Send a direct message between users."""
    # Validate that sender and receiver are different
    if message.sender_id == message.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")

    # Create message
    db_message = models.Message(
        match_id=message.match_id,
        sender_id=message.sender_id,
        receiver_id=message.receiver_id,
        content=message.content,
        message_type=message.message_type,
        attachment_url=message.attachment_url,
        attachment_metadata=message.attachment_metadata,
        reply_to_message_id=message.reply_to_message_id,
        reactions=message.reactions,
        conversation_id=message.conversation_id,
        is_delivered=True,
        delivered_at=datetime.utcnow()
    )

    db.add(db_message)
    db.commit()
    db.refresh(db_message)

    # Background task to handle real-time notifications
    background_tasks.add_task(
        send_message_notification,
        db_message.id,
        message.receiver_id
    )

    return db_message

@router.get("/messages/{user_id}", response_model=List[schemas.Message])
async def get_user_messages(
    user_id: str,
    other_user_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get messages for a user (all conversations or with specific user)."""
    query = db.query(models.Message).filter(
        ((models.Message.sender_id == user_id) | (models.Message.receiver_id == user_id))
    )

    if other_user_id:
        query = query.filter(
            ((models.Message.sender_id == other_user_id) & (models.Message.receiver_id == user_id)) |
            ((models.Message.sender_id == user_id) & (models.Message.receiver_id == other_user_id))
        )

    messages = query.order_by(
        models.Message.created_at.desc()
    ).offset(offset).limit(limit).all()

    return messages

@router.put("/messages/{message_id}/read", response_model=schemas.Message)
async def mark_direct_message_read(
    message_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    """Mark a direct message as read."""
    message = db.query(models.Message).filter(
        models.Message.id == message_id,
        models.Message.receiver_id == user_id  # Only receiver can mark as read
    ).first()

    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    if not message.is_read:
        message.is_read = True
        message.read_at = datetime.utcnow()
        db.commit()
        db.refresh(message)

    return message

@router.get("/conversations/direct/{user_id}")
async def get_direct_conversations(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all direct message conversations for a user."""
    # Get the latest message from each conversation
    subquery = db.query(
        models.Message.sender_id.label('other_user_id'),
        models.Message.created_at.label('last_message_at'),
        models.Message.content.label('last_message'),
        models.Message.is_read.label('is_read')
    ).filter(
        models.Message.receiver_id == user_id
    ).union(
        db.query(
            models.Message.receiver_id.label('other_user_id'),
            models.Message.created_at.label('last_message_at'),
            models.Message.content.label('last_message'),
            models.Message.is_read.label('is_read')
        ).filter(
            models.Message.sender_id == user_id
        )
    ).subquery()

    # Group by other_user_id and get the latest message
    conversations = db.query(
        subquery.c.other_user_id,
        subquery.c.last_message_at,
        subquery.c.last_message,
        subquery.c.is_read
    ).group_by(
        subquery.c.other_user_id,
        subquery.c.last_message_at,
        subquery.c.last_message,
        subquery.c.is_read
    ).order_by(
        subquery.c.last_message_at.desc()
    ).limit(limit).all()

    return [
        {
            "user_id": conv.other_user_id,
            "last_message_at": conv.last_message_at,
            "last_message": conv.last_message,
            "unread_count": 0 if conv.is_read else 1  # Simplified
        }
        for conv in conversations
    ]

# Background task function
async def send_message_notification(message_id: str, receiver_id: str):
    """Send real-time notification for new message."""
    # This would integrate with your notification system
    # For now, just log it
    print(f"Message {message_id} sent to user {receiver_id}")
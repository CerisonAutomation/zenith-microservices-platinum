"""
Zenith Chat Service - Real-time Messaging System
WebSocket-based chat with encryption, moderation, and advanced features.
"""
import os
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from supabase_client import get_supabase_client
from database import get_db
import models, schemas
import uuid
import hashlib
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Zenith Chat Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}  # user_id -> {device_id: websocket}
        self.user_status: Dict[str, Dict] = {}  # user_id -> status info
        self.typing_users: Dict[str, Set[str]] = {}  # conversation_id -> set of typing user_ids

    async def connect(self, websocket: WebSocket, user_id: str, device_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = {}
        self.active_connections[user_id][device_id] = websocket

        # Update user status
        self.user_status[user_id] = {
            "is_online": True,
            "last_seen": datetime.utcnow(),
            "device_count": len(self.active_connections[user_id])
        }

        # Broadcast online status
        await self.broadcast_user_status(user_id, True)

    def disconnect(self, user_id: str, device_id: str):
        if user_id in self.active_connections:
            if device_id in self.active_connections[user_id]:
                del self.active_connections[user_id][device_id]

            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                # Update offline status
                self.user_status[user_id] = {
                    "is_online": False,
                    "last_seen": datetime.utcnow(),
                    "device_count": 0
                }
                # Broadcast offline status (async call needed)
                asyncio.create_task(self.broadcast_user_status(user_id, False))

    async def broadcast_user_status(self, user_id: str, is_online: bool):
        """Broadcast user online/offline status to all relevant users."""
        status_message = {
            "type": "user_status",
            "user_id": user_id,
            "is_online": is_online,
            "timestamp": datetime.utcnow().isoformat()
        }

        # Get all users who have conversations with this user
        # This would be optimized with a cache in production
        for connected_user_id in self.active_connections:
            if connected_user_id != user_id:
                for device_id, websocket in self.active_connections[connected_user_id].items():
                    try:
                        await websocket.send_json(status_message)
                    except:
                        pass

    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user."""
        if user_id in self.active_connections:
            for device_id, websocket in self.active_connections[user_id].items():
                try:
                    await websocket.send_json(message)
                except:
                    # Remove dead connection
                    self.disconnect(user_id, device_id)

    async def broadcast_to_conversation(self, message: dict, conversation_id: str, exclude_user: str = None):
        """Broadcast message to all participants in a conversation."""
        # Get conversation participants (would be cached in production)
        participants = await self.get_conversation_participants(conversation_id)

        for participant_id in participants:
            if participant_id != exclude_user and participant_id in self.active_connections:
                for device_id, websocket in self.active_connections[participant_id].items():
                    try:
                        await websocket.send_json(message)
                    except:
                        self.disconnect(participant_id, device_id)

    async def get_conversation_participants(self, conversation_id: str) -> List[str]:
        """Get all participants in a conversation."""
        # This would query the database in a real implementation
        # For now, return mock data
        return ["user1", "user2"]  # Mock participants

    async def broadcast_typing_status(self, conversation_id: str, user_id: str, is_typing: bool):
        """Broadcast typing status to conversation participants."""
        if is_typing:
            if conversation_id not in self.typing_users:
                self.typing_users[conversation_id] = set()
            self.typing_users[conversation_id].add(user_id)
        else:
            if conversation_id in self.typing_users:
                self.typing_users[conversation_id].discard(user_id)
                if not self.typing_users[conversation_id]:
                    del self.typing_users[conversation_id]

        typing_message = {
            "type": "typing_status",
            "conversation_id": conversation_id,
            "user_id": user_id,
            "is_typing": is_typing,
            "typing_users": list(self.typing_users.get(conversation_id, [])),
            "timestamp": datetime.utcnow().isoformat()
        }

        await self.broadcast_to_conversation(typing_message, conversation_id, exclude_user=user_id)

manager = ConnectionManager()

# Encryption utilities
class MessageEncryption:
    def __init__(self):
        self.key = self._generate_key()

    def _generate_key(self) -> bytes:
        """Generate encryption key from environment."""
        password = os.getenv("ENCRYPTION_KEY", "default-encryption-key").encode()
        salt = os.getenv("ENCRYPTION_SALT", "default-salt").encode()
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return base64.urlsafe_b64encode(kdf.derive(password))

    def encrypt_message(self, message: str, conversation_key: str) -> str:
        """Encrypt message content."""
        f = Fernet(self.key)
        encrypted = f.encrypt(message.encode())
        return encrypted.decode()

    def decrypt_message(self, encrypted_message: str, conversation_key: str) -> str:
        """Decrypt message content."""
        f = Fernet(self.key)
        decrypted = f.decrypt(encrypted_message.encode())
        return decrypted.decode()

encryption = MessageEncryption()

# WebSocket endpoint
@app.websocket("/ws/{user_id}/{device_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, device_id: str):
    """Main WebSocket endpoint for real-time chat."""
    await manager.connect(websocket, user_id, device_id)

    try:
        while True:
            data = await websocket.receive_json()

            message_type = data.get("type")

            if message_type == "chat_message":
                await handle_chat_message(websocket, user_id, device_id, data)
            elif message_type == "typing_start":
                await handle_typing_start(user_id, data)
            elif message_type == "typing_stop":
                await handle_typing_stop(user_id, data)
            elif message_type == "read_receipt":
                await handle_read_receipt(user_id, data)
            elif message_type == "user_status":
                await handle_status_request(user_id, data)

    except WebSocketDisconnect:
        manager.disconnect(user_id, device_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        manager.disconnect(user_id, device_id)

async def handle_chat_message(websocket: WebSocket, user_id: str, device_id: str, data: dict):
    """Handle incoming chat message."""
    try:
        conversation_id = data.get("conversation_id")
        content = data.get("content")
        message_type = data.get("message_type", "text")

        if not conversation_id or not content:
            await websocket.send_json({"type": "error", "message": "Missing required fields"})
            return

        # Encrypt message content
        encrypted_content = encryption.encrypt_message(content, conversation_id)

        # Create message record
        message_data = {
            "id": str(uuid.uuid4()),
            "conversation_id": conversation_id,
            "sender_id": user_id,
            "content": encrypted_content,
            "message_type": message_type,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "sent"
        }

        # Store in database (async)
        # await store_message(message_data)

        # Broadcast to conversation participants
        broadcast_message = {
            "type": "chat_message",
            "message": {
                **message_data,
                "content": content  # Send decrypted content to recipients
            }
        }

        await manager.broadcast_to_conversation(broadcast_message, conversation_id, exclude_user=user_id)

        # Send confirmation to sender
        await websocket.send_json({
            "type": "message_sent",
            "message_id": message_data["id"],
            "timestamp": message_data["timestamp"]
        })

    except Exception as e:
        logger.error(f"Error handling chat message: {str(e)}")
        await websocket.send_json({"type": "error", "message": "Failed to send message"})

async def handle_typing_start(user_id: str, data: dict):
    """Handle typing start event."""
    conversation_id = data.get("conversation_id")
    if conversation_id:
        await manager.broadcast_typing_status(conversation_id, user_id, True)

async def handle_typing_stop(user_id: str, data: dict):
    """Handle typing stop event."""
    conversation_id = data.get("conversation_id")
    if conversation_id:
        await manager.broadcast_typing_status(conversation_id, user_id, False)

async def handle_read_receipt(user_id: str, data: dict):
    """Handle message read receipt."""
    message_id = data.get("message_id")
    conversation_id = data.get("conversation_id")

    if message_id and conversation_id:
        # Update message read status in database
        # await mark_message_read(message_id, user_id)

        # Broadcast read receipt
        read_message = {
            "type": "read_receipt",
            "message_id": message_id,
            "conversation_id": conversation_id,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }

        await manager.broadcast_to_conversation(read_message, conversation_id, exclude_user=user_id)

async def handle_status_request(user_id: str, data: dict):
    """Handle user status request."""
    target_user_id = data.get("target_user_id")
    if target_user_id and target_user_id in manager.user_status:
        status = manager.user_status[target_user_id]
        await manager.send_personal_message({
            "type": "user_status_response",
            "user_id": target_user_id,
            "status": status
        }, user_id)

# REST API endpoints
@app.post("/api/v1/chat/conversations")
async def create_conversation(conversation: schemas.ConversationCreate, db: Session = Depends(get_db)):
    """Create a new conversation."""
    # Implementation for creating conversation
    pass

@app.get("/api/v1/chat/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    """Get messages for a conversation."""
    # Implementation for retrieving messages
    pass

@app.post("/api/v1/chat/messages/{message_id}/read")
async def mark_message_read(message_id: str, user_id: str, db: Session = Depends(get_db)):
    """Mark message as read."""
    # Implementation for marking message read
    pass

@app.post("/api/v1/chat/conversations/{conversation_id}/block")
async def block_conversation(conversation_id: str, user_id: str, db: Session = Depends(get_db)):
    """Block a conversation."""
    # Implementation for blocking conversation
    pass

@app.get("/api/v1/chat/users/{user_id}/conversations")
async def get_user_conversations(user_id: str, db: Session = Depends(get_db)):
    """Get all conversations for a user."""
    # Implementation for getting user conversations
    pass

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "zenith-chat",
        "active_connections": len(manager.active_connections),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
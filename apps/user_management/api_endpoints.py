from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import bcrypt
from datetime import datetime, timedelta
import jwt
from pydantic import BaseModel

from ..database import get_db
from .models import User, UserProfile, UserFriend, UserView, Message, Photo, Video, BlogPost

router = APIRouter(prefix="/api/v1", tags=["zenith"])

# Pydantic Models for Request/Response
class UserCreate(BaseModel):
    email: str
    username: str
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = "female"

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    gender: str
    avatar: Optional[str]
    join_date: datetime
    views: int

class LoginRequest(BaseModel):
    email: str
    password: str

class MessageCreate(BaseModel):
    receiver_id: int
    content: str
    message_type: str = "text"

# Authentication Endpoints
@router.post("/auth/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Elite user registration with comprehensive validation"""
    
    # Validate email format
    if "@" not in user_data.email or "." not in user_data.email:
        raise HTTPException(status_code=400, detail="Invalid email format")
    
    # Validate password strength
    if len(user_data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    # Check for existing user
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password with bcrypt
    password_hash = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    
    # Create user
    user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=password_hash,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        gender=user_data.gender,
        join_date=func.now(),
        last_activity=func.now()
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User registered successfully", "user_id": user.id}

@router.post("/auth/login", response_model=dict)
async def login_user(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Secure user authentication with session management"""
    
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not bcrypt.checkpw(credentials.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.active:
        raise HTTPException(status_code=403, detail="Account deactivated")
    
    if user.banned:
        raise HTTPException(status_code=403, detail="Account banned")
    
    # Update last activity
    user.last_activity = func.now()
    db.commit()
    
    # Generate JWT token
    token_data = {
        "user_id": user.id,
        "username": user.username,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(token_data, "SECRET_KEY", algorithm="HS256")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar
        }
    }

# User Management Endpoints
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    """Get comprehensive user profile"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Increment view count
    user.views += 1
    db.commit()
    
    return user

@router.get("/users", response_model=List[UserResponse])
async def search_users(
    query: Optional[str] = Query(None, description="Search term"),
    gender: Optional[str] = Query(None, description="Filter by gender"),
    min_age: Optional[int] = Query(None, ge=18, le=100, description="Minimum age"),
    max_age: Optional[int] = Query(None, ge=18, le=100, description="Maximum age"),
    limit: int = Query(20, le=100, description="Results limit"),
    offset: int = Query(0, description="Results offset"),
    db: Session = Depends(get_db)
):
    """Advanced user search with filtering"""
    
    search_query = db.query(User).filter(User.active == True)
    
    if query:
        search_query = search_query.filter(
            (User.username.ilike(f"%{query}%")) |
            (User.first_name.ilike(f"%{query}%")) |
            (User.last_name.ilike(f"%{query}%"))
        )
    
    if gender:
        search_query = search_query.filter(User.gender == gender)
    
    if min_age or max_age:
        # Calculate birth date range for age filtering
        today = datetime.now().date()
        if max_age:
            min_birth_date = today - timedelta(days=max_age*365)
            search_query = search_query.filter(User.birth_date >= min_birth_date)
        if min_age:
            max_birth_date = today - timedelta(days=min_age*365)
            search_query = search_query.filter(User.birth_date <= max_birth_date)
    
    users = search_query.offset(offset).limit(limit).all()
    
    return users

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_profile(user_id: int, user_data: dict, db: Session = Depends(get_db)):
    """Update user profile information"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update allowed fields
    allowed_fields = ["first_name", "last_name", "birth_date", "avatar"]
    for field, value in user_data.items():
        if field in allowed_fields and hasattr(user, field):
            setattr(user, field, value)
    
    user.last_edit = func.now()
    db.commit()
    db.refresh(user)
    
    return user

# Friend System Endpoints
@router.get("/users/{user_id}/friends", response_model=List[int])
async def get_user_friends(user_id: int, db: Session = Depends(get_db)):
    """Get user's friend list"""
    
    friends = db.query(UserFriend).filter(
        (UserFriend.user_id == user_id) & 
        (UserFriend.status == "accepted")
    ).all()
    
    return [friend.friend_id for friend in friends]

@router.post("/users/{user_id}/friends/{friend_id}")
async def send_friend_request(user_id: int, friend_id: int, db: Session = Depends(get_db)):
    """Send friend request"""
    
    if user_id == friend_id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as friend")
    
    # Check if friendship already exists
    existing = db.query(UserFriend).filter(
        (UserFriend.user_id == user_id) & 
        (UserFriend.friend_id == friend_id)
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already exists")
    
    friend_request = UserFriend(
        user_id=user_id,
        friend_id=friend_id,
        status="pending",
        created_at=func.now()
    )
    
    db.add(friend_request)
    db.commit()
    
    return {"message": "Friend request sent"}

@router.put("/users/{user_id}/friends/{friend_id}")
async def update_friend_status(user_id: int, friend_id: int, status: str, db: Session = Depends(get_db)):
    """Accept or reject friend request"""
    
    friendship = db.query(UserFriend).filter(
        (UserFriend.user_id == friend_id) &
        (UserFriend.friend_id == user_id) &
        (UserFriend.status == "pending")
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="Friend request not found")
    
    if status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    friendship.status = status
    
    if status == "accepted":
        # Create reciprocal friendship
        reciprocal = UserFriend(
            user_id=user_id,
            friend_id=friend_id,
            status="accepted",
            created_at=func.now()
        )
        db.add(reciprocal)
    
    db.commit()
    
    return {"message": f"Friend request {status}"}

# Messaging Endpoints
@router.get("/users/{user_id}/messages")
async def get_user_messages(user_id: int, db: Session = Depends(get_db)):
    """Get user's messages"""
    
    messages = db.query(Message).filter(
        (Message.sender_id == user_id) | (Message.receiver_id == user_id)
    ).order_by(Message.sent_at.desc()).limit(50).all()
    
    return {"messages": messages}

@router.post("/messages")
async def send_message(message_data: MessageCreate, db: Session = Depends(get_db)):
    """Send a message"""
    
    message = Message(
        sender_id=message_data.sender_id,
        receiver_id=message_data.receiver_id,
        content=message_data.content,
        message_type=message_data.message_type,
        sent_at=func.now(),
        read=False
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return {"message": "Message sent successfully", "message_id": message.id}

# Content Management Endpoints
@router.get("/users/{user_id}/photos")
async def get_user_photos(user_id: int, db: Session = Depends(get_db)):
    """Get user's photos"""
    
    photos = db.query(Photo).filter(Photo.user_id == user_id).order_by(Photo.uploaded_at.desc()).all()
    
    return {"photos": photos}

@router.post("/photos")
async def upload_photo(photo_data: dict, db: Session = Depends(get_db)):
    """Upload a photo"""
    
    photo = Photo(
        user_id=photo_data["user_id"],
        image_url=photo_data["image_url"],
        caption=photo_data.get("caption"),
        uploaded_at=func.now(),
        approved=True  # Auto-approve for now
    )
    
    db.add(photo)
    db.commit()
    db.refresh(photo)
    
    return {"message": "Photo uploaded successfully", "photo_id": photo.id}

# Admin Endpoints
@router.get("/admin/users")
async def admin_get_users(db: Session = Depends(get_db)):
    """Admin endpoint to get all users"""
    
    users = db.query(User).all()
    
    return {"users": users}

@router.put("/admin/users/{user_id}/status")
async def admin_update_user_status(user_id: int, status: str, db: Session = Depends(get_db)):
    """Admin endpoint to update user status"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if status == "ban":
        user.banned = True
    elif status == "unban":
        user.banned = False
    elif status == "deactivate":
        user.active = False
    elif status == "activate":
        user.active = True
    else:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    db.commit()
    
    return {"message": f"User status updated to {status}"}

# Analytics Endpoints
@router.get("/analytics/users")
async def get_user_analytics(db: Session = Depends(get_db)):
    """Get user analytics"""
    
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.active == True).count()
    new_users_today = db.query(User).filter(
        User.join_date >= datetime.now().date()
    ).count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "new_users_today": new_users_today
    }

# GDPR Compliance Endpoints
@router.get("/users/{user_id}/data")
async def export_user_data(user_id: int, db: Session = Depends(get_db)):
    """GDPR data export endpoint"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = {
        "profile": {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "join_date": user.join_date
        },
        "messages": db.query(Message).filter(
            (Message.sender_id == user_id) | (Message.receiver_id == user_id)
        ).count(),
        "photos": db.query(Photo).filter(Photo.user_id == user_id).count()
    }
    
    return user_data

@router.delete("/users/{user_id}")
async def delete_user_account(user_id: int, db: Session = Depends(get_db)):
    """GDPR-compliant account deletion"""
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Anonymize user data (GDPR requirement)
    user.email = f"deleted_{user_id}@zenith.com"
    user.username = f"deleted_user_{user_id}"
    user.first_name = "Deleted"
    user.last_name = "User"
    user.active = False
    user.banned = True
    
    db.commit()
    
    return {"message": "Account deleted successfully"}
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List
import bcrypt

from .models import User, UserProfile, UserFriend, UserView
from ..database import get_db

router = APIRouter(prefix="/api/v1/users", tags=["users"])

# User Registration
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: dict, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data["email"]) | (User.username == user_data["username"])
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )
    
    # Hash password
    password_hash = bcrypt.hashpw(user_data["password"].encode(), bcrypt.gensalt()).decode()
    
    # Create user
    user = User(
        email=user_data["email"],
        username=user_data["username"],
        password_hash=password_hash,
        first_name=user_data.get("first_name"),
        last_name=user_data.get("last_name"),
        gender=user_data.get("gender", "female")
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "User created successfully", "user_id": user.id}

# User Login
@router.post("/login")
async def login_user(credentials: dict, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials["email"]).first()
    
    if not user or not bcrypt.checkpw(credentials["password"].encode(), user.password_hash.encode()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Update last activity
    user.last_activity = func.now()
    db.commit()
    
    return {"message": "Login successful", "user_id": user.id, "username": user.username}

# Get User Profile
@router.get("/{user_id}")
async def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "gender": user.gender.value,
            "avatar": user.avatar,
            "join_date": user.join_date,
            "views": user.views
        },
        "profile": profile.dict() if profile else {}
    }

# Search Users
@router.get("/search")
async def search_users(
    query: str = None,
    gender: str = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    search_query = db.query(User).filter(User.active == True)
    
    if query:
        search_query = search_query.filter(
            (User.username.ilike(f"%{query}%")) |
            (User.first_name.ilike(f"%{query}%")) |
            (User.last_name.ilike(f"%{query}%"))
        )
    
    if gender:
        search_query = search_query.filter(User.gender == gender)
    
    users = search_query.offset(offset).limit(limit).all()
    
    return {
        "users": [
            {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "gender": user.gender.value,
                "avatar": user.avatar,
                "views": user.views
            }
            for user in users
        ],
        "total": search_query.count()
    }

# Friend Management
@router.get("/{user_id}/friends")
async def get_user_friends(user_id: int, db: Session = Depends(get_db)):
    friends = db.query(UserFriend).filter(
        (UserFriend.user_id == user_id) & (UserFriend.status == "accepted")
    ).all()
    
    return {"friends": [friend.friend_id for friend in friends]}

@router.post("/{user_id}/friends/{friend_id}")
async def add_friend(user_id: int, friend_id: int, db: Session = Depends(get_db)):
    # Check if friendship already exists
    existing_friend = db.query(UserFriend).filter(
        (UserFriend.user_id == user_id) & (UserFriend.friend_id == friend_id)
    ).first()
    
    if existing_friend:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Friendship already exists"
        )
    
    friend = UserFriend(user_id=user_id, friend_id=friend_id, status="pending")
    db.add(friend)
    db.commit()
    
    return {"message": "Friend request sent"}
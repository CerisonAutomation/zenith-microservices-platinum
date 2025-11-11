from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
import enum

Base = declarative_base()

class UserGender(enum.Enum):
    MALE = "male"
    FEMALE = "female" 
    COUPLE = "couple"

class UserStatus(enum.Enum):
    ACTIVE = 1
    INACTIVE = 0
    BANNED = 2

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    username = Column(String(40), unique=True, index=True, nullable=False)
    password_hash = Column(String(120), nullable=False)
    first_name = Column(String(50))
    last_name = Column(String(50))
    birth_date = Column(DateTime)
    gender = Column(Enum(UserGender), nullable=False, default=UserGender.FEMALE)
    match_gender = Column(String(50), nullable=False, default="male")  # Set of genders
    
    # Profile info
    avatar = Column(String(5))
    approved_avatar = Column(Boolean, default=True)
    featured = Column(Boolean, default=False)
    language = Column(String(5), default="en_US")
    
    # Status and tracking
    user_status = Column(Integer, nullable=False, default=1)
    last_activity = Column(DateTime, default=func.now())
    join_date = Column(DateTime, default=func.now())
    
    # Additional fields
    views = Column(Integer, default=0)
    credits = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    banned = Column(Boolean, default=False)
    
class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    
    # Extended profile info
    description = Column(Text)
    punchline = Column(String(191))
    address = Column(String(191))
    city = Column(String(150))
    state = Column(String(150))
    country = Column(String(2))
    phone = Column(String(100))
    website = Column(String(120))
    
    # Physical attributes
    height = Column(Integer)  # in cm
    weight = Column(Integer)  # in kg
    
class UserFriend(Base):
    __tablename__ = "user_friends"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    friend_id = Column(Integer, index=True, nullable=False)
    status = Column(String(20), default="pending")  # pending, accepted, blocked
    created_at = Column(DateTime, default=func.now())

class UserView(Base):
    __tablename__ = "user_views"
    
    id = Column(Integer, primary_key=True, index=True)
    viewer_id = Column(Integer, index=True, nullable=False)
    viewed_id = Column(Integer, index=True, nullable=False)
    viewed_at = Column(DateTime, default=func.now())
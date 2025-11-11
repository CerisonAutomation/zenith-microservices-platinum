from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class ReferralCode(Base):
    __tablename__ = "referral_codes"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)

    # Referral code details
    code = Column(String, unique=True, nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime)

    # Usage limits
    max_uses = Column(Integer, default=100)
    current_uses = Column(Integer, default=0)

    # Rewards
    referrer_reward_amount = Column(Float, default=25.0)  # Credit for referrer
    referee_reward_amount = Column(Float, default=10.0)  # Credit for new user

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="referral_code")
    referrals = relationship("Referral", back_populates="referral_code")

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String, primary_key=True, index=True)
    referral_code_id = Column(String, ForeignKey("referral_codes.id"), nullable=False)
    referrer_id = Column(String, ForeignKey("users.id"), nullable=False)
    referee_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Referral status
    status = Column(String, default="pending")  # pending, completed, expired, cancelled
    completed_at = Column(DateTime)

    # Rewards tracking
    referrer_reward_granted = Column(Boolean, default=False)
    referee_reward_granted = Column(Boolean, default=False)
    referrer_reward_amount = Column(Float, default=0.0)
    referee_reward_amount = Column(Float, default=0.0)

    # Tracking
    source = Column(String)  # How they found the referral (email, social, etc.)
    ip_address = Column(String)
    user_agent = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    referral_code = relationship("ReferralCode", back_populates="referrals")
    referrer = relationship("User", foreign_keys=[referrer_id])
    referee = relationship("User", foreign_keys=[referee_id])

class ReferralReward(Base):
    __tablename__ = "referral_rewards"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    referral_id = Column(String, ForeignKey("referrals.id"), nullable=False)

    # Reward details
    reward_type = Column(String, nullable=False)  # credit, discount, premium_days
    amount = Column(Float, default=0.0)
    description = Column(Text)

    # Status
    is_claimed = Column(Boolean, default=False)
    claimed_at = Column(DateTime)
    expires_at = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    referral = relationship("Referral")

class ReferralStats(Base):
    __tablename__ = "referral_stats"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)

    # Statistics
    total_referrals = Column(Integer, default=0)
    successful_referrals = Column(Integer, default=0)
    pending_referrals = Column(Integer, default=0)
    total_earned = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)

    # Performance metrics
    conversion_rate = Column(Float, default=0.0)  # successful/total
    average_reward_per_referral = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="referral_stats")
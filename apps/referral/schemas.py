from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Referral Code Schemas
class ReferralCodeBase(BaseModel):
    code: str
    is_active: bool = True
    expires_at: Optional[datetime] = None
    max_uses: int = 100
    referrer_reward_amount: float = 25.0
    referee_reward_amount: float = 10.0

class ReferralCodeCreate(BaseModel):
    custom_code: Optional[str] = None  # Optional custom code

class ReferralCodeUpdate(BaseModel):
    is_active: Optional[bool] = None
    expires_at: Optional[datetime] = None
    max_uses: Optional[int] = None
    referrer_reward_amount: Optional[float] = None
    referee_reward_amount: Optional[float] = None

class ReferralCodeOut(ReferralCodeBase):
    id: str
    user_id: str
    current_uses: int
    created_at: datetime
    updated_at: datetime

# Referral Schemas
class ReferralBase(BaseModel):
    referral_code_id: str
    referrer_id: str
    referee_id: str
    status: str = "pending"
    source: Optional[str] = None

class ReferralCreate(BaseModel):
    referral_code: str
    source: Optional[str] = None

class ReferralUpdate(BaseModel):
    status: Optional[str] = None

class ReferralOut(ReferralBase):
    id: str
    completed_at: Optional[datetime]
    referrer_reward_granted: bool
    referee_reward_granted: bool
    referrer_reward_amount: float
    referee_reward_amount: float
    created_at: datetime
    updated_at: datetime

# Reward Schemas
class ReferralRewardOut(BaseModel):
    id: str
    user_id: str
    referral_id: str
    reward_type: str
    amount: float
    description: Optional[str]
    is_claimed: bool
    claimed_at: Optional[datetime]
    expires_at: Optional[datetime]
    created_at: datetime

# Stats Schemas
class ReferralStatsOut(BaseModel):
    id: str
    user_id: str
    total_referrals: int
    successful_referrals: int
    pending_referrals: int
    total_earned: float
    available_balance: float
    conversion_rate: float
    average_reward_per_referral: float
    created_at: datetime
    updated_at: datetime

# Dashboard Schemas
class ReferralDashboard(BaseModel):
    referral_code: Optional[ReferralCodeOut]
    stats: ReferralStatsOut
    recent_referrals: List[ReferralOut]
    available_rewards: List[ReferralRewardOut]
    leaderboard_position: Optional[int]

class ReferralLeaderboardEntry(BaseModel):
    user_id: str
    display_name: str
    total_referrals: int
    total_earned: float
    rank: int

class ReferralLeaderboard(BaseModel):
    entries: List[ReferralLeaderboardEntry]
    user_rank: Optional[int]

# Public Referral Schemas
class PublicReferralInfo(BaseModel):
    code: str
    referrer_name: str
    referrer_avatar: Optional[str]
    total_referrals: int
    success_rate: float

# Claim Reward Schema
class ClaimRewardRequest(BaseModel):
    reward_id: str
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from database import get_db
from supabase_client import get_current_user
import models, schemas
from typing import List, Optional
import uuid
import random
import string
from datetime import datetime, timedelta

router = APIRouter()

def generate_referral_code(length: int = 8) -> str:
    """Generate a random referral code."""
    characters = string.ascii_uppercase + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

@router.post("/code", response_model=schemas.ReferralCodeOut)
async def create_referral_code(
    code_data: schemas.ReferralCodeCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a referral code for the current user."""
    user_id = current_user["id"]

    # Check if user already has a referral code
    existing_code = db.query(models.ReferralCode).filter(
        models.ReferralCode.user_id == user_id
    ).first()

    if existing_code:
        raise HTTPException(status_code=400, detail="User already has a referral code")

    # Generate code
    code = code_data.custom_code if code_data.custom_code else generate_referral_code()

    # Check if code is unique
    while db.query(models.ReferralCode).filter(models.ReferralCode.code == code).first():
        code = generate_referral_code()

    # Set default expiration (1 year from now)
    expires_at = datetime.utcnow() + timedelta(days=365)

    db_code = models.ReferralCode(
        id=str(uuid.uuid4()),
        user_id=user_id,
        code=code,
        expires_at=expires_at
    )

    db.add(db_code)
    db.commit()
    db.refresh(db_code)

    # Create initial stats
    stats = models.ReferralStats(
        id=str(uuid.uuid4()),
        user_id=user_id
    )
    db.add(stats)
    db.commit()

    return db_code

@router.get("/code", response_model=schemas.ReferralCodeOut)
async def get_my_referral_code(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's referral code."""
    user_id = current_user["id"]

    code = db.query(models.ReferralCode).filter(
        models.ReferralCode.user_id == user_id
    ).first()

    if not code:
        raise HTTPException(status_code=404, detail="Referral code not found")

    return code

@router.put("/code", response_model=schemas.ReferralCodeOut)
async def update_referral_code(
    updates: schemas.ReferralCodeUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update referral code settings."""
    user_id = current_user["id"]

    code = db.query(models.ReferralCode).filter(
        models.ReferralCode.user_id == user_id
    ).first()

    if not code:
        raise HTTPException(status_code=404, detail="Referral code not found")

    # Update fields
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(code, field, value)

    db.commit()
    db.refresh(code)
    return code

@router.post("/use", response_model=schemas.ReferralOut)
async def use_referral_code(
    referral_data: schemas.ReferralCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Use a referral code during registration."""
    user_id = current_user["id"]

    # Find the referral code
    referral_code = db.query(models.ReferralCode).filter(
        models.ReferralCode.code == referral_data.referral_code,
        models.ReferralCode.is_active == True
    ).first()

    if not referral_code:
        raise HTTPException(status_code=404, detail="Invalid or inactive referral code")

    # Check if code has expired
    if referral_code.expires_at and referral_code.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Referral code has expired")

    # Check usage limits
    if referral_code.current_uses >= referral_code.max_uses:
        raise HTTPException(status_code=400, detail="Referral code usage limit exceeded")

    # Check if user already used a referral
    existing_referral = db.query(models.Referral).filter(
        models.Referral.referee_id == user_id
    ).first()

    if existing_referral:
        raise HTTPException(status_code=400, detail="User has already used a referral code")

    # Check if user is trying to refer themselves
    if referral_code.user_id == user_id:
        raise HTTPException(status_code=400, detail="Cannot use your own referral code")

    # Create referral record
    db_referral = models.Referral(
        id=str(uuid.uuid4()),
        referral_code_id=referral_code.id,
        referrer_id=referral_code.user_id,
        referee_id=user_id,
        source=referral_data.source,
        referrer_reward_amount=referral_code.referrer_reward_amount,
        referee_reward_amount=referral_code.referee_reward_amount
    )

    # Update code usage
    referral_code.current_uses += 1

    db.add(db_referral)
    db.commit()
    db.refresh(db_referral)

    # Create reward records
    referrer_reward = models.ReferralReward(
        id=str(uuid.uuid4()),
        user_id=referral_code.user_id,
        referral_id=db_referral.id,
        reward_type="credit",
        amount=referral_code.referrer_reward_amount,
        description=f"Referral reward for bringing {current_user.get('email', 'new user')}"
    )

    referee_reward = models.ReferralReward(
        id=str(uuid.uuid4()),
        user_id=user_id,
        referral_id=db_referral.id,
        reward_type="credit",
        amount=referral_code.referee_reward_amount,
        description="Welcome bonus for using referral code"
    )

    db.add(referrer_reward)
    db.add(referee_reward)
    db.commit()

    return db_referral

@router.get("/stats", response_model=schemas.ReferralStatsOut)
async def get_referral_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's referral statistics."""
    user_id = current_user["id"]

    stats = db.query(models.ReferralStats).filter(
        models.ReferralStats.user_id == user_id
    ).first()

    if not stats:
        # Create initial stats
        stats = models.ReferralStats(
            id=str(uuid.uuid4()),
            user_id=user_id
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)

    # Update stats with current data
    total_referrals = db.query(func.count(models.Referral.id)).filter(
        models.Referral.referrer_id == user_id
    ).scalar() or 0

    successful_referrals = db.query(func.count(models.Referral.id)).filter(
        models.Referral.referrer_id == user_id,
        models.Referral.status == "completed"
    ).scalar() or 0

    pending_referrals = db.query(func.count(models.Referral.id)).filter(
        models.Referral.referrer_id == user_id,
        models.Referral.status == "pending"
    ).scalar() or 0

    total_earned = db.query(func.sum(models.ReferralReward.amount)).filter(
        models.ReferralReward.user_id == user_id,
        models.ReferralReward.is_claimed == True
    ).scalar() or 0.0

    available_balance = db.query(func.sum(models.ReferralReward.amount)).filter(
        models.ReferralReward.user_id == user_id,
        models.ReferralReward.is_claimed == False
    ).scalar() or 0.0

    conversion_rate = (successful_referrals / total_referrals * 100) if total_referrals > 0 else 0.0
    avg_reward = total_earned / successful_referrals if successful_referrals > 0 else 0.0

    stats.total_referrals = total_referrals
    stats.successful_referrals = successful_referrals
    stats.pending_referrals = pending_referrals
    stats.total_earned = total_earned
    stats.available_balance = available_balance
    stats.conversion_rate = conversion_rate
    stats.average_reward_per_referral = avg_reward

    db.commit()

    return stats

@router.get("/referrals", response_model=List[schemas.ReferralOut])
async def get_my_referrals(
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's referral history."""
    user_id = current_user["id"]

    query = db.query(models.Referral).filter(
        models.Referral.referrer_id == user_id
    )

    if status:
        query = query.filter(models.Referral.status == status)

    referrals = query.order_by(models.Referral.created_at.desc()).offset(offset).limit(limit).all()
    return referrals

@router.get("/rewards", response_model=List[schemas.ReferralRewardOut])
async def get_my_rewards(
    claimed: Optional[bool] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's referral rewards."""
    user_id = current_user["id"]

    query = db.query(models.ReferralReward).filter(
        models.ReferralReward.user_id == user_id
    )

    if claimed is not None:
        query = query.filter(models.ReferralReward.is_claimed == claimed)

    rewards = query.order_by(models.ReferralReward.created_at.desc()).all()
    return rewards

@router.post("/rewards/{reward_id}/claim")
async def claim_reward(
    reward_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Claim a referral reward."""
    user_id = current_user["id"]

    reward = db.query(models.ReferralReward).filter(
        models.ReferralReward.id == reward_id,
        models.ReferralReward.user_id == user_id
    ).first()

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    if reward.is_claimed:
        raise HTTPException(status_code=400, detail="Reward already claimed")

    if reward.expires_at and reward.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reward has expired")

    reward.is_claimed = True
    reward.claimed_at = datetime.utcnow()

    db.commit()

    return {"message": "Reward claimed successfully", "amount": reward.amount}

@router.get("/leaderboard", response_model=schemas.ReferralLeaderboard)
async def get_referral_leaderboard(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get referral leaderboard."""
    user_id = current_user["id"]

    # Get top referrers
    leaderboard_query = db.query(
        models.ReferralStats.user_id,
        models.ReferralStats.total_referrals,
        models.ReferralStats.total_earned,
        func.row_number().over(order_by=desc(models.ReferralStats.total_referrals)).label('rank')
    ).order_by(desc(models.ReferralStats.total_referrals)).limit(limit).subquery()

    leaderboard_entries = db.query(leaderboard_query).all()

    entries = []
    user_rank = None

    for entry in leaderboard_entries:
        # Get user display name (simplified - would need to join with users table)
        display_name = f"User {entry.user_id[:8]}"  # Placeholder

        leaderboard_entry = schemas.ReferralLeaderboardEntry(
            user_id=entry.user_id,
            display_name=display_name,
            total_referrals=entry.total_referrals,
            total_earned=entry.total_earned,
            rank=entry.rank
        )
        entries.append(leaderboard_entry)

        if entry.user_id == user_id:
            user_rank = entry.rank

    return schemas.ReferralLeaderboard(
        entries=entries,
        user_rank=user_rank
    )

@router.get("/dashboard", response_model=schemas.ReferralDashboard)
async def get_referral_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comprehensive referral dashboard data."""
    user_id = current_user["id"]

    # Get referral code
    referral_code = db.query(models.ReferralCode).filter(
        models.ReferralCode.user_id == user_id
    ).first()

    # Get stats
    stats = await get_referral_stats(current_user, db)

    # Get recent referrals
    recent_referrals = db.query(models.Referral).filter(
        models.Referral.referrer_id == user_id
    ).order_by(models.Referral.created_at.desc()).limit(10).all()

    # Get available rewards
    available_rewards = db.query(models.ReferralReward).filter(
        models.ReferralReward.user_id == user_id,
        models.ReferralReward.is_claimed == False,
        or_(
            models.ReferralReward.expires_at.is_(None),
            models.ReferralReward.expires_at > datetime.utcnow()
        )
    ).order_by(models.ReferralReward.created_at.desc()).all()

    # Get leaderboard position
    user_rank_query = db.query(
        func.row_number().over(order_by=desc(models.ReferralStats.total_referrals)).label('rank')
    ).filter(
        models.ReferralStats.user_id == user_id
    ).scalar()

    return schemas.ReferralDashboard(
        referral_code=referral_code,
        stats=stats,
        recent_referrals=recent_referrals,
        available_rewards=available_rewards,
        leaderboard_position=user_rank_query
    )

@router.get("/public/{code}", response_model=schemas.PublicReferralInfo)
async def get_public_referral_info(code: str, db: Session = Depends(get_db)):
    """Get public information about a referral code."""
    referral_code = db.query(models.ReferralCode).filter(
        models.ReferralCode.code == code,
        models.ReferralCode.is_active == True
    ).first()

    if not referral_code:
        raise HTTPException(status_code=404, detail="Referral code not found")

    # Get referrer info (simplified)
    referrer_name = f"User {referral_code.user_id[:8]}"  # Placeholder

    # Get stats
    total_referrals = db.query(func.count(models.Referral.id)).filter(
        models.Referral.referral_code_id == referral_code.id
    ).scalar() or 0

    successful_referrals = db.query(func.count(models.Referral.id)).filter(
        models.Referral.referral_code_id == referral_code.id,
        models.Referral.status == "completed"
    ).scalar() or 0

    success_rate = (successful_referrals / total_referrals * 100) if total_referrals > 0 else 0.0

    return schemas.PublicReferralInfo(
        code=referral_code.code,
        referrer_name=referrer_name,
        referrer_avatar=None,  # Would need to join with user profile
        total_referrals=total_referrals,
        success_rate=success_rate
    )
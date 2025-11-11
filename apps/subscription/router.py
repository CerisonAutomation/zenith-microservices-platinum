from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from typing import List
from datetime import datetime, timedelta
import models, schemas

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Subscription Plan endpoints
@router.post("/plans", response_model=schemas.SubscriptionPlanOut)
def create_plan(plan: schemas.SubscriptionPlanCreate, db: Session = Depends(get_db)):
    db_plan = models.SubscriptionPlan(**plan.dict())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.get("/plans", response_model=List[schemas.SubscriptionPlanOut])
def get_plans(db: Session = Depends(get_db)):
    return db.query(models.SubscriptionPlan).filter(models.SubscriptionPlan.is_active == True).all()

@router.get("/plans/{plan_id}", response_model=schemas.SubscriptionPlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(models.SubscriptionPlan).filter(models.SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

# Subscription endpoints
@router.post("/", response_model=schemas.SubscriptionOut)
def create_subscription(subscription: schemas.SubscriptionCreate, db: Session = Depends(get_db)):
    # Check if user already has an active subscription
    existing = db.query(models.Subscription).filter(
        models.Subscription.user_id == subscription.user_id,
        models.Subscription.status == "active"
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already has an active subscription")

    db_subscription = models.Subscription(**subscription.dict())
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription

@router.get("/user/{user_id}", response_model=List[schemas.SubscriptionOut])
def get_user_subscriptions(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.Subscription).filter(models.Subscription.user_id == user_id).all()

@router.get("/{subscription_id}", response_model=schemas.SubscriptionOut)
def get_subscription(subscription_id: int, db: Session = Depends(get_db)):
    subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription

@router.put("/{subscription_id}", response_model=schemas.SubscriptionOut)
def update_subscription(subscription_id: int, update: schemas.SubscriptionUpdate, db: Session = Depends(get_db)):
    subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(subscription, field, value)

    db.commit()
    db.refresh(subscription)
    return subscription

@router.post("/{subscription_id}/cancel")
def cancel_subscription(subscription_id: int, db: Session = Depends(get_db)):
    subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    subscription.status = "cancelled"
    subscription.auto_renew = False
    db.commit()
    return {"message": "Subscription cancelled"}

@router.post("/{subscription_id}/renew")
def renew_subscription(subscription_id: int, db: Session = Depends(get_db)):
    subscription = db.query(models.Subscription).filter(models.Subscription.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Extend expiration date based on plan
    plan = db.query(models.SubscriptionPlan).filter(models.SubscriptionPlan.name == subscription.plan).first()
    if plan:
        subscription.expires_at = subscription.expires_at + timedelta(days=plan.duration_days)
        subscription.status = "active"
        db.commit()
        return {"message": "Subscription renewed"}
    else:
        raise HTTPException(status_code=404, detail="Plan not found")

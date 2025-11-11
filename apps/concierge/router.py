from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from typing import List
from datetime import datetime
import models, schemas

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# VIP Services
@router.post("/services", response_model=schemas.VIPServiceOut)
def create_vip_service(service: schemas.VIPServiceCreate, db: Session = Depends(get_db)):
    db_service = models.VIPService(**service.dict())
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.get("/services", response_model=List[schemas.VIPServiceOut])
def get_vip_services(category: str = None, db: Session = Depends(get_db)):
    query = db.query(models.VIPService).filter(models.VIPService.is_active == True)
    if category:
        query = query.filter(models.VIPService.category == category)
    return query.all()

# VIP Packages
@router.post("/packages", response_model=schemas.VIPPackageOut)
def create_vip_package(package: schemas.VIPPackageCreate, db: Session = Depends(get_db)):
    db_package = models.VIPPackage(**package.dict())
    db.add(db_package)
    db.commit()
    db.refresh(db_package)
    return db_package

@router.get("/packages", response_model=List[schemas.VIPPackageOut])
def get_vip_packages(db: Session = Depends(get_db)):
    return db.query(models.VIPPackage).filter(models.VIPPackage.is_active == True).all()

@router.get("/packages/{package_id}", response_model=schemas.VIPPackageOut)
def get_vip_package(package_id: int, db: Session = Depends(get_db)):
    package = db.query(models.VIPPackage).filter(models.VIPPackage.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="VIP package not found")
    return package

# VIP Subscriptions
@router.post("/subscriptions", response_model=schemas.VIPSubscriptionOut)
def create_vip_subscription(subscription: schemas.VIPSubscriptionCreate, db: Session = Depends(get_db)):
    # Check if user already has active VIP subscription
    existing = db.query(models.VIPSubscription).filter(
        models.VIPSubscription.user_id == subscription.user_id,
        models.VIPSubscription.status == "active"
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already has active VIP subscription")

    db_subscription = models.VIPSubscription(**subscription.dict())
    db.add(db_subscription)
    db.commit()
    db.refresh(db_subscription)
    return db_subscription

@router.get("/subscriptions/user/{user_id}", response_model=List[schemas.VIPSubscriptionOut])
def get_user_vip_subscriptions(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.VIPSubscription).filter(models.VIPSubscription.user_id == user_id).all()

# Concierge Requests
@router.post("/requests", response_model=schemas.ConciergeRequestOut)
def create_concierge_request(request: schemas.ConciergeRequestCreate, db: Session = Depends(get_db)):
    db_request = models.ConciergeRequest(**request.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@router.get("/requests/user/{user_id}", response_model=List[schemas.ConciergeRequestOut])
def get_user_concierge_requests(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.ConciergeRequest).filter(models.ConciergeRequest.user_id == user_id).all()

@router.get("/requests", response_model=List[schemas.ConciergeRequestOut])
def get_concierge_requests(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.ConciergeRequest)
    if status:
        query = query.filter(models.ConciergeRequest.status == status)
    return query.all()

@router.put("/requests/{request_id}", response_model=schemas.ConciergeRequestOut)
def update_concierge_request(request_id: int, update: schemas.ConciergeRequestUpdate, db: Session = Depends(get_db)):
    request = db.query(models.ConciergeRequest).filter(models.ConciergeRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Concierge request not found")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(request, field, value)

    db.commit()
    db.refresh(request)
    return request

# Concierge Messages
@router.post("/messages", response_model=schemas.ConciergeMessageOut)
def create_concierge_message(message: schemas.ConciergeMessageCreate, db: Session = Depends(get_db)):
    db_message = models.ConciergeMessage(**message.dict())
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@router.get("/messages/request/{request_id}", response_model=List[schemas.ConciergeMessageOut])
def get_request_messages(request_id: int, db: Session = Depends(get_db)):
    return db.query(models.ConciergeMessage).filter(models.ConciergeMessage.request_id == request_id).order_by(models.ConciergeMessage.created_at).all()

@router.put("/messages/{message_id}/read")
def mark_message_read(message_id: int, db: Session = Depends(get_db)):
    message = db.query(models.ConciergeMessage).filter(models.ConciergeMessage.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")

    message.is_read = True
    db.commit()
    return {"message": "Message marked as read"}
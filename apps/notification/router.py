from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas
import uuid

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.NotificationOut)
def create_notification(item: schemas.NotificationCreate, db: Session = Depends(get_db)):
    db_item = models.Notification(**item.dict(), id=str(uuid.uuid4()))
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=list[schemas.NotificationOut])
def list_notifications(db: Session = Depends(get_db)):
    return db.query(models.Notification).all()

@router.get("/{item_id}", response_model=schemas.NotificationOut)
def get_notification(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.Notification).filter(models.Notification.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    return item

@router.put("/{item_id}", response_model=schemas.NotificationOut)
def update_notification(item_id: str, updated: schemas.NotificationCreate, db: Session = Depends(get_db)):
    item = db.query(models.Notification).filter(models.Notification.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    for key, value in updated.dict().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_notification(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.Notification).filter(models.Notification.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(item)
    db.commit()
    return {{"success": True}}

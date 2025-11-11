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

@router.post("/", response_model=schemas.MessageOut)
def create_message(item: schemas.MessageCreate, db: Session = Depends(get_db)):
    db_item = models.Message(**item.dict(), id=str(uuid.uuid4()))
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/", response_model=list[schemas.MessageOut])
def list_messages(db: Session = Depends(get_db)):
    return db.query(models.Message).all()

@router.get("/{item_id}", response_model=schemas.MessageOut)
def get_message(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.Message).filter(models.Message.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Message not found")
    return item

@router.put("/{item_id}", response_model=schemas.MessageOut)
def update_message(item_id: str, updated: schemas.MessageCreate, db: Session = Depends(get_db)):
    item = db.query(models.Message).filter(models.Message.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Message not found")
    for key, value in updated.dict().items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}")
def delete_message(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.Message).filter(models.Message.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Message not found")
    db.delete(item)
    db.commit()
    return {{"success": True}}

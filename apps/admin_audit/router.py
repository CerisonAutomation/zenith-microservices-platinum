from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
import models, schemas

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.AuditLogOut)
def create_item(item: schemas.AuditLogCreate, db: Session = Depends(get_db)):
    db_item = models.AuditLog(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/{item_id}", response_model=schemas.AuditLogOut)
def read_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.AuditLog).filter(models.AuditLog.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="AuditLog not found")
    return item

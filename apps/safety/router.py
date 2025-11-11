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

# Safety Reports
@router.post("/reports", response_model=schemas.SafetyReportOut)
def create_report(report: schemas.SafetyReportCreate, db: Session = Depends(get_db)):
    db_report = models.SafetyReport(**report.dict())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.get("/reports", response_model=List[schemas.SafetyReportOut])
def get_reports(status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.SafetyReport)
    if status:
        query = query.filter(models.SafetyReport.status == status)
    return query.all()

@router.get("/reports/{report_id}", response_model=schemas.SafetyReportOut)
def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(models.SafetyReport).filter(models.SafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.put("/reports/{report_id}", response_model=schemas.SafetyReportOut)
def update_report(report_id: int, update: schemas.SafetyReportUpdate, db: Session = Depends(get_db)):
    report = db.query(models.SafetyReport).filter(models.SafetyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(report, field, value)

    db.commit()
    db.refresh(report)
    return report

# Safety Incidents
@router.post("/incidents", response_model=schemas.SafetyIncidentOut)
def create_incident(incident: schemas.SafetyIncidentCreate, db: Session = Depends(get_db)):
    db_incident = models.SafetyIncident(**incident.dict())
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)
    return db_incident

@router.get("/incidents/user/{user_id}", response_model=List[schemas.SafetyIncidentOut])
def get_user_incidents(user_id: str, db: Session = Depends(get_db)):
    return db.query(models.SafetyIncident).filter(models.SafetyIncident.user_id == user_id).all()

# Blocked Users
@router.post("/blocked", response_model=schemas.BlockedUserOut)
def block_user(block: schemas.BlockedUserCreate, db: Session = Depends(get_db)):
    # Check if already blocked
    existing = db.query(models.BlockedUser).filter(
        models.BlockedUser.blocker_id == block.blocker_id,
        models.BlockedUser.blocked_user_id == block.blocked_user_id,
        models.BlockedUser.is_active == True
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already blocked")

    db_block = models.BlockedUser(**block.dict())
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@router.get("/blocked/{blocker_id}", response_model=List[schemas.BlockedUserOut])
def get_blocked_users(blocker_id: str, db: Session = Depends(get_db)):
    return db.query(models.BlockedUser).filter(
        models.BlockedUser.blocker_id == blocker_id,
        models.BlockedUser.is_active == True
    ).all()

@router.delete("/blocked/{block_id}")
def unblock_user(block_id: int, db: Session = Depends(get_db)):
    block = db.query(models.BlockedUser).filter(models.BlockedUser.id == block_id).first()
    if not block:
        raise HTTPException(status_code=404, detail="Block not found")

    block.is_active = False
    db.commit()
    return {"message": "User unblocked"}

# Safety Settings
@router.post("/settings", response_model=schemas.SafetySettingOut)
def create_safety_settings(settings: schemas.SafetySettingCreate, db: Session = Depends(get_db)):
    # Check if settings already exist
    existing = db.query(models.SafetySetting).filter(
        models.SafetySetting.user_id == settings.user_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Safety settings already exist")

    db_settings = models.SafetySetting(**settings.dict())
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings

@router.get("/settings/{user_id}", response_model=schemas.SafetySettingOut)
def get_safety_settings(user_id: str, db: Session = Depends(get_db)):
    settings = db.query(models.SafetySetting).filter(models.SafetySetting.user_id == user_id).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Safety settings not found")
    return settings

@router.put("/settings/{user_id}", response_model=schemas.SafetySettingOut)
def update_safety_settings(user_id: str, update: schemas.SafetySettingUpdate, db: Session = Depends(get_db)):
    settings = db.query(models.SafetySetting).filter(models.SafetySetting.user_id == user_id).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Safety settings not found")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings
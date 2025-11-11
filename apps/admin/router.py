from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
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

# Admin Users
@router.post("/admins", response_model=schemas.AdminUserOut)
def create_admin_user(admin: schemas.AdminUserCreate, db: Session = Depends(get_db)):
    db_admin = models.AdminUser(**admin.dict())
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

@router.get("/admins", response_model=List[schemas.AdminUserOut])
def get_admin_users(db: Session = Depends(get_db)):
    return db.query(models.AdminUser).filter(models.AdminUser.is_active == True).all()

# Admin Actions
@router.post("/actions", response_model=schemas.AdminActionOut)
def log_admin_action(action: schemas.AdminActionCreate, db: Session = Depends(get_db)):
    db_action = models.AdminAction(**action.dict())
    db.add(db_action)
    db.commit()
    db.refresh(db_action)
    return db_action

@router.get("/actions", response_model=List[schemas.AdminActionOut])
def get_admin_actions(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(models.AdminAction).order_by(desc(models.AdminAction.created_at)).limit(limit).all()

# System Metrics
@router.post("/metrics", response_model=schemas.SystemMetricOut)
def record_metric(metric: schemas.SystemMetricCreate, db: Session = Depends(get_db)):
    db_metric = models.SystemMetric(**metric.dict())
    db.add(db_metric)
    db.commit()
    db.refresh(db_metric)
    return db_metric

@router.get("/metrics/{category}", response_model=List[schemas.SystemMetricOut])
def get_metrics(category: str, days: int = 30, db: Session = Depends(get_db)):
    since_date = datetime.utcnow() - timedelta(days=days)
    return db.query(models.SystemMetric).filter(
        models.SystemMetric.category == category,
        models.SystemMetric.timestamp >= since_date
    ).order_by(desc(models.SystemMetric.timestamp)).all()

# Dashboard Widgets
@router.post("/widgets", response_model=schemas.DashboardWidgetOut)
def create_widget(widget: schemas.DashboardWidgetCreate, db: Session = Depends(get_db)):
    db_widget = models.DashboardWidget(**widget.dict())
    db.add(db_widget)
    db.commit()
    db.refresh(db_widget)
    return db_widget

@router.get("/widgets", response_model=List[schemas.DashboardWidgetOut])
def get_widgets(db: Session = Depends(get_db)):
    return db.query(models.DashboardWidget).filter(models.DashboardWidget.is_active == True).all()

# Announcements
@router.post("/announcements", response_model=schemas.AnnouncementOut)
def create_announcement(announcement: schemas.AnnouncementCreate, db: Session = Depends(get_db)):
    db_announcement = models.Announcement(**announcement.dict())
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    return db_announcement

@router.get("/announcements", response_model=List[schemas.AnnouncementOut])
def get_announcements(audience: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Announcement).filter(models.Announcement.is_active == True)
    if audience:
        query = query.filter(
            (models.Announcement.target_audience == audience) |
            (models.Announcement.target_audience == "all")
        )
    return query.order_by(desc(models.Announcement.created_at)).all()

# System Settings
@router.post("/settings", response_model=schemas.SystemSettingOut)
def create_setting(setting: schemas.SystemSettingCreate, db: Session = Depends(get_db)):
    db_setting = models.SystemSetting(**setting.dict())
    db.add(db_setting)
    db.commit()
    db.refresh(db_setting)
    return db_setting

@router.get("/settings", response_model=List[schemas.SystemSettingOut])
def get_settings(public_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(models.SystemSetting)
    if public_only:
        query = query.filter(models.SystemSetting.is_public == True)
    return query.all()

@router.get("/settings/{setting_key}", response_model=schemas.SystemSettingOut)
def get_setting(setting_key: str, db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.setting_key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting

@router.put("/settings/{setting_key}", response_model=schemas.SystemSettingOut)
def update_setting(setting_key: str, update: schemas.SystemSettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.setting_key == setting_key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")

    for field, value in update.dict(exclude_unset=True).items():
        setattr(setting, field, value)

    db.commit()
    db.refresh(setting)
    return setting

# Dashboard Statistics
@router.get("/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    # This would typically aggregate data from multiple services
    # For now, returning placeholder data
    return schemas.DashboardStats(
        total_users=1000,
        active_users=850,
        total_providers=200,
        active_providers=180,
        total_bookings=5000,
        pending_reports=25,
        revenue_today=2500.00,
        revenue_month=75000.00
    )

@router.get("/dashboard/activity", response_model=List[schemas.UserActivityData])
def get_user_activity(days: int = 30, db: Session = Depends(get_db)):
    # This would typically query user activity metrics
    # For now, returning placeholder data
    activity_data = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        activity_data.append(schemas.UserActivityData(
            date=date,
            new_users=10 + i % 5,
            active_users=100 + i % 20,
            bookings=50 + i % 10
        ))
    return activity_data

@router.get("/dashboard/revenue", response_model=List[schemas.RevenueData])
def get_revenue_data(days: int = 30, db: Session = Depends(get_db)):
    # This would typically query revenue metrics
    # For now, returning placeholder data
    revenue_data = []
    for i in range(days):
        date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y-%m-%d")
        revenue_data.append(schemas.RevenueData(
            date=date,
            amount=1000.00 + (i * 50.00),
            currency="USD"
        ))
    return revenue_data
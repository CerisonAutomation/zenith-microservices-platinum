from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract
from database import get_db
from supabase_client import get_current_user
import models, schemas
from typing import List, Optional
import uuid
from datetime import datetime, date, time, timedelta
import calendar

router = APIRouter()

# Availability Management
@router.post("/availability", response_model=schemas.ProviderAvailabilityOut)
async def create_availability(
    availability: schemas.ProviderAvailabilityCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create availability slot for provider."""
    # Verify user is a provider
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    if availability.provider_id != provider_profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this provider's availability")

    # Check for conflicting availability
    conflict = db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.provider_id == availability.provider_id,
        models.ProviderAvailability.date == availability.date,
        or_(
            and_(
                models.ProviderAvailability.start_time <= availability.start_time,
                models.ProviderAvailability.end_time > availability.start_time
            ),
            and_(
                models.ProviderAvailability.start_time < availability.end_time,
                models.ProviderAvailability.end_time >= availability.end_time
            )
        )
    ).first()

    if conflict:
        raise HTTPException(status_code=400, detail="Conflicting availability slot exists")

    db_availability = models.ProviderAvailability(
        id=str(uuid.uuid4()),
        **availability.dict()
    )

    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

@router.get("/availability", response_model=List[schemas.ProviderAvailabilityOut])
async def get_provider_availability(
    start_date: date = Query(..., description="Start date for availability query"),
    end_date: Optional[date] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get provider's availability slots."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    query = db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.provider_id == provider_profile.id,
        models.ProviderAvailability.date >= start_date
    )

    if end_date:
        query = query.filter(models.ProviderAvailability.date <= end_date)

    availability = query.order_by(
        models.ProviderAvailability.date,
        models.ProviderAvailability.start_time
    ).all()

    return availability

@router.put("/availability/{availability_id}", response_model=schemas.ProviderAvailabilityOut)
async def update_availability(
    availability_id: str,
    updates: schemas.ProviderAvailabilityUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update availability slot."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    availability = db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.id == availability_id,
        models.ProviderAvailability.provider_id == provider_profile.id
    ).first()

    if not availability:
        raise HTTPException(status_code=404, detail="Availability slot not found")

    # Update fields
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(availability, field, value)

    db.commit()
    db.refresh(availability)
    return availability

@router.delete("/availability/{availability_id}")
async def delete_availability(
    availability_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete availability slot."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    availability = db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.id == availability_id,
        models.ProviderAvailability.provider_id == provider_profile.id
    ).first()

    if not availability:
        raise HTTPException(status_code=404, detail="Availability slot not found")

    # Check if slot is booked
    if availability.booking_id:
        raise HTTPException(status_code=400, detail="Cannot delete booked availability slot")

    db.delete(availability)
    db.commit()

    return {"message": "Availability slot deleted successfully"}

# Services Management
@router.post("/services", response_model=schemas.ProviderServiceOut)
async def create_service(
    service: schemas.ProviderServiceCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a service offering."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    if service.provider_id != provider_profile.id:
        raise HTTPException(status_code=403, detail="Not authorized to manage this provider's services")

    db_service = models.ProviderService(
        id=str(uuid.uuid4()),
        **service.dict()
    )

    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.get("/services", response_model=List[schemas.ProviderServiceOut])
async def get_provider_services(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get provider's services."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    services = db.query(models.ProviderService).filter(
        models.ProviderService.provider_id == provider_profile.id,
        models.ProviderService.is_active == True
    ).all()

    return services

@router.put("/services/{service_id}", response_model=schemas.ProviderServiceOut)
async def update_service(
    service_id: str,
    updates: schemas.ProviderServiceUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update service offering."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    service = db.query(models.ProviderService).filter(
        models.ProviderService.id == service_id,
        models.ProviderService.provider_id == provider_profile.id
    ).first()

    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    # Update fields
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(service, field, value)

    db.commit()
    db.refresh(service)
    return service

# Earnings and Stats
@router.get("/earnings", response_model=List[schemas.ProviderEarningOut])
async def get_provider_earnings(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get provider's earnings."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    query = db.query(models.ProviderEarning).filter(
        models.ProviderEarning.provider_id == provider_profile.id
    )

    if start_date:
        query = query.filter(models.ProviderEarning.created_at >= start_date)
    if end_date:
        query = query.filter(models.ProviderEarning.created_at <= end_date)
    if status:
        query = query.filter(models.ProviderEarning.payment_status == status)

    earnings = query.order_by(models.ProviderEarning.created_at.desc()).all()
    return earnings

@router.get("/stats", response_model=schemas.ProviderStatsOut)
async def get_provider_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get provider's statistics."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    stats = db.query(models.ProviderStats).filter(
        models.ProviderStats.provider_id == provider_profile.id
    ).first()

    if not stats:
        # Create initial stats
        stats = models.ProviderStats(
            id=str(uuid.uuid4()),
            provider_id=provider_profile.id
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)

    return stats

# Calendar Settings
@router.get("/calendar-settings", response_model=schemas.ProviderCalendarSettingsOut)
async def get_calendar_settings(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get provider's calendar settings."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    settings = db.query(models.ProviderCalendarSettings).filter(
        models.ProviderCalendarSettings.provider_id == provider_profile.id
    ).first()

    if not settings:
        # Create default settings
        settings = models.ProviderCalendarSettings(
            id=str(uuid.uuid4()),
            provider_id=provider_profile.id
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings

@router.put("/calendar-settings", response_model=schemas.ProviderCalendarSettingsOut)
async def update_calendar_settings(
    updates: schemas.ProviderCalendarSettingsUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update provider's calendar settings."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    settings = db.query(models.ProviderCalendarSettings).filter(
        models.ProviderCalendarSettings.provider_id == provider_profile.id
    ).first()

    if not settings:
        settings = models.ProviderCalendarSettings(
            id=str(uuid.uuid4()),
            provider_id=provider_profile.id
        )
        db.add(settings)

    # Update fields
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)
    return settings

# Dashboard Data
@router.get("/dashboard", response_model=schemas.ProviderDashboardData)
async def get_provider_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get provider dashboard data."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Get stats
    stats = db.query(models.ProviderStats).filter(
        models.ProviderStats.provider_id == provider_profile.id
    ).first()

    if not stats:
        stats = models.ProviderStats(
            id=str(uuid.uuid4()),
            provider_id=provider_profile.id
        )
        db.add(stats)
        db.commit()
        db.refresh(stats)

    # Get recent bookings (last 5)
    recent_bookings = db.query(models.Booking).filter(
        models.Booking.provider_id == provider_profile.id
    ).order_by(models.Booking.created_at.desc()).limit(5).all()

    # Get upcoming availability (next 7 days)
    today = date.today()
    next_week = today + timedelta(days=7)

    upcoming_availability = db.query(models.ProviderAvailability).filter(
        models.ProviderAvailability.provider_id == provider_profile.id,
        models.ProviderAvailability.date >= today,
        models.ProviderAvailability.date <= next_week,
        models.ProviderAvailability.availability_type == "available"
    ).order_by(models.ProviderAvailability.date, models.ProviderAvailability.start_time).all()

    # Calculate earnings summary
    current_month = datetime.now().month
    current_year = datetime.now().year

    monthly_earnings = db.query(
        func.sum(models.ProviderEarning.net_amount).label('total')
    ).filter(
        models.ProviderEarning.provider_id == provider_profile.id,
        extract('month', models.ProviderEarning.created_at) == current_month,
        extract('year', models.ProviderEarning.created_at) == current_year
    ).scalar() or 0.0

    pending_payments = db.query(
        func.sum(models.ProviderEarning.net_amount).label('total')
    ).filter(
        models.ProviderEarning.provider_id == provider_profile.id,
        models.ProviderEarning.payment_status == "pending"
    ).scalar() or 0.0

    earnings_summary = {
        "total_earned": stats.total_earnings,
        "pending_payments": pending_payments,
        "paid_this_month": monthly_earnings,
        "paid_last_month": 0.0,  # Would need to calculate
        "currency": "USD"
    }

    # Count pending reviews
    pending_reviews = db.query(models.Review).filter(
        models.Review.provider_id == provider_profile.id,
        models.Review.response.is_(None)
    ).count()

    return schemas.ProviderDashboardData(
        stats=stats,
        recent_bookings=[booking.__dict__ for booking in recent_bookings],
        upcoming_availability=upcoming_availability,
        earnings_summary=earnings_summary,
        pending_reviews=pending_reviews
    )

# Calendar View
@router.get("/calendar/{year}/{month}", response_model=schemas.CalendarView)
async def get_calendar_view(
    year: int,
    month: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get calendar view for a specific month."""
    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == current_user["id"]
    ).first()

    if not provider_profile:
        raise HTTPException(status_code=404, detail="Provider profile not found")

    # Get calendar settings
    settings = db.query(models.ProviderCalendarSettings).filter(
        models.ProviderCalendarSettings.provider_id == provider_profile.id
    ).first()

    if not settings:
        settings = models.ProviderCalendarSettings(
            id=str(uuid.uuid4()),
            provider_id=provider_profile.id
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # Get all days in the month
    cal = calendar.monthcalendar(year, month)
    days = []

    for week in cal:
        for day_num in week:
            if day_num == 0:
                continue  # Skip days from previous/next month

            current_date = date(year, month, day_num)

            # Get availability for this day
            availability_slots = db.query(models.ProviderAvailability).filter(
                models.ProviderAvailability.provider_id == provider_profile.id,
                models.ProviderAvailability.date == current_date
            ).order_by(models.ProviderAvailability.start_time).all()

            # Get bookings for this day
            booked_slots = db.query(models.Booking).filter(
                models.Booking.provider_id == provider_profile.id,
                func.date(models.Booking.start_time) == current_date
            ).all()

            # Check if it's a working day
            day_name = calendar.day_name[current_date.weekday()].lower()
            is_working_day = day_name in settings.working_days

            day_data = schemas.CalendarDay(
                date=current_date,
                availability_slots=availability_slots,
                booked_slots=[booking.__dict__ for booking in booked_slots],
                is_working_day=is_working_day
            )
            days.append(day_data)

    return schemas.CalendarView(
        month=month,
        year=year,
        days=days,
        settings=settings
    )
"""
Newsletter Service - FastAPI microservice for newsletter management
Senior-level implementation with comprehensive newsletter API
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, Form, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_, text, update
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import json
import logging
from contextlib import asynccontextmanager
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import secrets
import hashlib

# Import our models and schemas
from models import (
    Base, NewsletterTemplate, Newsletter, NewsletterSegment, Subscriber,
    NewsletterSend, NewsletterLink, NewsletterClick, SubscriberActivity,
    BounceEvent, NewsletterSegmentAssociation, SubscriberSegmentAssociation
)
from schemas import (
    NewsletterTemplateCreate, NewsletterTemplateUpdate, NewsletterTemplate as NewsletterTemplateSchema,
    NewsletterCreate, NewsletterUpdate, Newsletter as NewsletterSchema, NewsletterWithDetails,
    NewsletterSegmentCreate, NewsletterSegmentUpdate, NewsletterSegment as NewsletterSegmentSchema,
    SubscriberCreate, SubscriberUpdate, Subscriber as SubscriberSchema, SubscriberWithDetails,
    NewsletterSend as NewsletterSendSchema,
    NewsletterLinkCreate, NewsletterLink as NewsletterLinkSchema,
    NewsletterClickCreate, NewsletterClick as NewsletterClickSchema,
    SubscriberActivityCreate, SubscriberActivity as SubscriberActivitySchema,
    BounceEventCreate, BounceEvent as BounceEventSchema,
    NewsletterSearchFilters, SubscriberSearchFilters, SegmentSearchFilters,
    BulkSubscriberUpdate, BulkNewsletterUpdate, BulkDeleteRequest,
    NewsletterStats, SubscriberStats, CampaignPerformance,
    SubscriptionRequest, UnsubscribeRequest, ConfirmSubscriptionRequest,
    PaginationParams, PaginatedResponse,
    APIResponse, ErrorResponse, SuccessResponse,
    NewsletterStatus, SubscriptionStatus, CampaignType, SendStatus, BounceType
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup (placeholder - will be configured with actual database)
DATABASE_URL = "postgresql://user:password@localhost/newsletter_db"

# Email configuration (placeholder)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "your-email@gmail.com"
SMTP_PASSWORD = "your-password"

# Create FastAPI app
app = FastAPI(
    title="Newsletter Service API",
    description="Enterprise newsletter management with campaigns, segmentation, and analytics",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database dependency (placeholder)
def get_db():
    # This will be replaced with actual database session management
    return None

# Authentication dependency (placeholder)
def get_current_user():
    # This will be replaced with actual authentication
    return {"id": 1, "email": "user@example.com"}

# Admin authorization dependency (placeholder)
def require_admin(current_user: dict = Depends(get_current_user)):
    # This will be replaced with actual admin check
    return current_user

# Background task for sending newsletters
async def send_newsletter_batch(newsletter_id: int, subscriber_ids: List[int], db: Session):
    """Send newsletter to a batch of subscribers"""
    try:
        newsletter = db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
        if not newsletter:
            logger.error(f"Newsletter {newsletter_id} not found")
            return

        # Get email template and settings (placeholder)
        # In real implementation, this would integrate with email service provider

        sent_count = 0
        for subscriber_id in subscriber_ids:
            subscriber = db.query(Subscriber).filter(Subscriber.id == subscriber_id).first()
            if not subscriber or subscriber.status != SubscriptionStatus.ACTIVE:
                continue

            send_record = None
            try:
                # Create send record
                send_record = NewsletterSend(
                    newsletter_id=newsletter_id,
                    subscriber_id=subscriber_id,
                    status=SendStatus.SENDING
                )
                db.add(send_record)
                db.flush()

                # Send email (placeholder implementation)
                await send_email_to_subscriber(newsletter, subscriber, send_record.id)

                # Update send record
                send_record.status = SendStatus.SENT
                send_record.sent_at = datetime.utcnow()
                send_record.message_id = f"msg_{send_record.id}_{secrets.token_hex(8)}"
                sent_count += 1

            except Exception as e:
                logger.error(f"Failed to send to subscriber {subscriber_id}: {e}")
                if send_record:
                    send_record.status = SendStatus.FAILED
                    send_record.error_message = str(e)

        # Update newsletter statistics
        newsletter.sent_count += sent_count
        newsletter.update_stats()

        db.commit()
        logger.info(f"Sent newsletter {newsletter_id} to {sent_count} subscribers")

    except Exception as e:
        logger.error(f"Error sending newsletter batch {newsletter_id}: {e}")
        db.rollback()

async def send_email_to_subscriber(newsletter: Newsletter, subscriber: Subscriber, send_id: int):
    """Send email to individual subscriber (placeholder implementation)"""
    # This would integrate with actual email service provider (SendGrid, Mailgun, etc.)
    # For now, just simulate sending
    await asyncio.sleep(0.1)  # Simulate network delay

    # In real implementation:
    # - Use email service provider API
    # - Track opens with pixel
    # - Track clicks with link redirection
    # - Handle bounces and complaints via webhooks

async def update_subscriber_segments(db: Session):
    """Update dynamic subscriber segments"""
    try:
        dynamic_segments = db.query(NewsletterSegment).filter(
            NewsletterSegment.is_dynamic == True,
            NewsletterSegment.is_active == True
        ).all()

        for segment in dynamic_segments:
            # Clear existing associations
            db.query(SubscriberSegmentAssociation).filter(
                SubscriberSegmentAssociation.segment_id == segment.id
            ).delete()

            # Apply segment criteria (example implementation)
            criteria = segment.criteria or {}

            query = db.query(Subscriber).filter(Subscriber.status == SubscriptionStatus.ACTIVE)

            # Apply filters based on criteria
            if criteria.get('subscription_source'):
                query = query.filter(Subscriber.subscription_source == criteria['subscription_source'])

            if criteria.get('subscribed_after'):
                query = query.filter(Subscriber.subscribed_at >= criteria['subscribed_after'])

            if criteria.get('has_opened_recently'):
                recent_date = datetime.utcnow() - timedelta(days=30)
                query = query.filter(Subscriber.last_activity_at >= recent_date)

            # Add subscribers to segment
            subscribers = query.all()
            for subscriber in subscribers:
                association = SubscriberSegmentAssociation(
                    subscriber_id=subscriber.id,
                    segment_id=segment.id
                )
                db.add(association)

            segment.subscriber_count = len(subscribers)
            segment.last_calculated_at = datetime.utcnow()

        db.commit()
        logger.info("Updated dynamic subscriber segments")

    except Exception as e:
        logger.error(f"Error updating subscriber segments: {e}")
        db.rollback()

async def process_bounce_events(db: Session):
    """Process bounce events and update subscriber status"""
    try:
        # Get unprocessed bounce events
        bounce_events = db.query(BounceEvent).filter(
            BounceEvent.processed_at.is_(None)
        ).limit(100).all()

        for bounce in bounce_events:
            subscriber = db.query(Subscriber).filter(Subscriber.id == bounce.subscriber_id).first()
            if not subscriber:
                continue

            if bounce.bounce_type == BounceType.HARD:
                subscriber.status = SubscriptionStatus.BOUNCED
                subscriber.bounce_count += 1
                subscriber.last_bounce_at = bounce.created_at
            elif bounce.bounce_type == BounceType.SOFT:
                subscriber.bounce_count += 1
                subscriber.last_bounce_at = bounce.created_at
            elif bounce.bounce_type == BounceType.COMPLAINT:
                subscriber.status = SubscriptionStatus.COMPLAINT
                subscriber.complaint_count += 1
                subscriber.last_complaint_at = bounce.created_at

            bounce.processed_at = datetime.utcnow()

        db.commit()
        logger.info(f"Processed {len(bounce_events)} bounce events")

    except Exception as e:
        logger.error(f"Error processing bounce events: {e}")
        db.rollback()

# API Routes

# Health check
@app.get("/health", response_model=SuccessResponse)
async def health_check():
    """Health check endpoint"""
    return SuccessResponse(message="Newsletter service is healthy")

# Newsletter Templates API
@app.post("/templates", response_model=NewsletterTemplateSchema)
async def create_template(
    template: NewsletterTemplateCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new newsletter template"""
    try:
        # Check if slug already exists
        existing = db.query(NewsletterTemplate).filter(NewsletterTemplate.slug == template.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Template slug already exists")

        # If setting as default, unset other defaults
        if template.is_default:
            db.query(NewsletterTemplate).filter(NewsletterTemplate.is_default == True).update({"is_default": False})

        db_template = NewsletterTemplate(**template.dict(), created_by=current_user["id"])
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        return db_template
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Template creation failed")

@app.get("/templates", response_model=PaginatedResponse)
async def list_templates(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """List newsletter templates with pagination and filtering"""
    query = db.query(NewsletterTemplate)

    if search:
        query = query.filter(
            or_(
                NewsletterTemplate.name.ilike(f"%{search}%"),
                NewsletterTemplate.description.ilike(f"%{search}%")
            )
        )

    if is_active is not None:
        query = query.filter(NewsletterTemplate.is_active == is_active)

    total = query.count()
    templates = query.order_by(desc(NewsletterTemplate.created_at))\
                    .offset((page - 1) * per_page)\
                    .limit(per_page)\
                    .all()

    return PaginatedResponse(
        items=templates,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/templates/{template_id}", response_model=NewsletterTemplateSchema)
async def get_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific newsletter template"""
    template = db.query(NewsletterTemplate).filter(NewsletterTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

# Newsletters API
@app.post("/newsletters", response_model=NewsletterSchema)
async def create_newsletter(
    newsletter: NewsletterCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new newsletter"""
    try:
        # Check if template exists (if provided)
        if newsletter.template_id:
            template = db.query(NewsletterTemplate).filter(NewsletterTemplate.id == newsletter.template_id).first()
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")

        # Check if slug already exists
        existing = db.query(Newsletter).filter(Newsletter.slug == newsletter.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Newsletter slug already exists")

        db_newsletter = Newsletter(**newsletter.dict(), created_by=current_user["id"])
        db.add(db_newsletter)
        db.commit()
        db.refresh(db_newsletter)
        return db_newsletter
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Newsletter creation failed")

@app.get("/newsletters", response_model=PaginatedResponse)
async def list_newsletters(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    filters: NewsletterSearchFilters = Depends(),
    db: Session = Depends(get_db)
):
    """List newsletters with advanced filtering and pagination"""
    query = db.query(Newsletter)

    # Apply filters
    if filters.query:
        query = query.filter(
            or_(
                Newsletter.title.ilike(f"%{filters.query}%"),
                Newsletter.subject.ilike(f"%{filters.query}%")
            )
        )

    if filters.campaign_type:
        query = query.filter(Newsletter.campaign_type == filters.campaign_type)

    if filters.status:
        query = query.filter(Newsletter.status == filters.status)

    if filters.created_by:
        query = query.filter(Newsletter.created_by == filters.created_by)

    if filters.date_from:
        query = query.filter(Newsletter.created_at >= filters.date_from)

    if filters.date_to:
        query = query.filter(Newsletter.created_at <= filters.date_to)

    # Sorting
    sort_column = getattr(Newsletter, filters.sort_by, Newsletter.created_at)
    if filters.sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    total = query.count()
    newsletters = query.offset((page - 1) * per_page)\
                      .limit(per_page)\
                      .all()

    return PaginatedResponse(
        items=newsletters,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/newsletters/{newsletter_id}", response_model=NewsletterWithDetails)
async def get_newsletter(newsletter_id: int, db: Session = Depends(get_db)):
    """Get a specific newsletter with details"""
    newsletter = db.query(Newsletter)\
                   .options(
                       joinedload(Newsletter.template),
                       joinedload(Newsletter.segments),
                       joinedload(Newsletter.links)
                   )\
                   .filter(Newsletter.id == newsletter_id)\
                   .first()

    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")

    return newsletter

@app.put("/newsletters/{newsletter_id}", response_model=NewsletterSchema)
async def update_newsletter(
    newsletter_id: int,
    newsletter_update: NewsletterUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update a newsletter"""
    newsletter = db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")

    # Check slug uniqueness if being updated
    if newsletter_update.slug and newsletter_update.slug != newsletter.slug:
        existing = db.query(Newsletter).filter(Newsletter.slug == newsletter_update.slug).first()
        if existing:
            raise HTTPException(status_code=400, detail="Newsletter slug already exists")

    # Check template exists if being updated
    if newsletter_update.template_id:
        template = db.query(NewsletterTemplate).filter(NewsletterTemplate.id == newsletter_update.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

    for field, value in newsletter_update.dict(exclude_unset=True).items():
        setattr(newsletter, field, value)

    newsletter.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(newsletter)
    return newsletter

@app.post("/newsletters/{newsletter_id}/send", response_model=SuccessResponse)
async def send_newsletter(
    newsletter_id: int,
    background_tasks: BackgroundTasks,
    segment_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Send newsletter to subscribers"""
    newsletter = db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")

    if newsletter.status == NewsletterStatus.SENT:
        raise HTTPException(status_code=400, detail="Newsletter has already been sent")

    # Get subscribers to send to
    if segment_ids:
        # Send to specific segments
        subscriber_ids = []
        for segment_id in segment_ids:
            segment = db.query(NewsletterSegment).filter(NewsletterSegment.id == segment_id).first()
            if not segment:
                continue

            segment_subscribers = db.query(SubscriberSegmentAssociation.subscriber_id)\
                                   .filter(SubscriberSegmentAssociation.segment_id == segment_id)\
                                   .all()
            subscriber_ids.extend([s[0] for s in segment_subscribers])
    else:
        # Send to all active subscribers
        active_subscribers = db.query(Subscriber.id)\
                              .filter(Subscriber.status == SubscriptionStatus.ACTIVE)\
                              .all()
        subscriber_ids = [s[0] for s in active_subscribers]

    if not subscriber_ids:
        raise HTTPException(status_code=400, detail="No subscribers to send to")

    # Update newsletter status
    newsletter.status = NewsletterStatus.SENT
    newsletter.sent_at = datetime.utcnow()
    newsletter.total_recipients = len(subscriber_ids)

    # Send in batches
    batch_size = 50
    for i in range(0, len(subscriber_ids), batch_size):
        batch = subscriber_ids[i:i + batch_size]
        background_tasks.add_task(send_newsletter_batch, newsletter_id, batch, db)

    db.commit()

    return SuccessResponse(
        message=f"Newsletter scheduled for sending to {len(subscriber_ids)} subscribers"
    )

# Subscriber Management API
@app.post("/subscribers", response_model=SubscriberSchema)
async def create_subscriber(
    subscriber: SubscriberCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Create a new subscriber"""
    try:
        # Check if email already exists
        existing = db.query(Subscriber).filter(Subscriber.email == subscriber.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already subscribed")

        db_subscriber = Subscriber(
            **subscriber.dict(),
            ip_address="127.0.0.1",  # Would get from request in real implementation
            user_agent="API"  # Would get from request in real implementation
        )
        db.add(db_subscriber)
        db.commit()
        db.refresh(db_subscriber)

        # Send confirmation email
        background_tasks.add_task(send_confirmation_email, db_subscriber.id, db)

        return db_subscriber
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Subscriber creation failed")

@app.get("/subscribers", response_model=PaginatedResponse)
async def list_subscribers(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    filters: SubscriberSearchFilters = Depends(),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """List subscribers with filtering and pagination"""
    query = db.query(Subscriber)

    # Apply filters
    if filters.query:
        query = query.filter(
            or_(
                Subscriber.email.ilike(f"%{filters.query}%"),
                Subscriber.first_name.ilike(f"%{filters.query}%"),
                Subscriber.last_name.ilike(f"%{filters.query}%")
            )
        )

    if filters.status:
        query = query.filter(Subscriber.status == filters.status)

    if filters.segment_id:
        query = query.join(SubscriberSegmentAssociation)\
                    .filter(SubscriberSegmentAssociation.segment_id == filters.segment_id)

    if filters.subscription_source:
        query = query.filter(Subscriber.subscription_source == filters.subscription_source)

    if filters.date_from:
        query = query.filter(Subscriber.subscribed_at >= filters.date_from)

    if filters.date_to:
        query = query.filter(Subscriber.subscribed_at <= filters.date_to)

    # Sorting
    sort_column = getattr(Subscriber, filters.sort_by, Subscriber.subscribed_at)
    if filters.sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))

    total = query.count()
    subscribers = query.offset((page - 1) * per_page)\
                      .limit(per_page)\
                      .all()

    return PaginatedResponse(
        items=subscribers,
        total=total,
        page=page,
        per_page=per_page,
        pages=(total + per_page - 1) // per_page
    )

@app.get("/subscribers/{subscriber_id}", response_model=SubscriberWithDetails)
async def get_subscriber(subscriber_id: int, db: Session = Depends(get_db)):
    """Get a specific subscriber with details"""
    subscriber = db.query(Subscriber)\
                   .options(joinedload(Subscriber.segments))\
                   .filter(Subscriber.id == subscriber_id)\
                   .first()

    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    return subscriber

@app.put("/subscribers/{subscriber_id}", response_model=SubscriberSchema)
async def update_subscriber(
    subscriber_id: int,
    subscriber_update: SubscriberUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Update a subscriber"""
    subscriber = db.query(Subscriber).filter(Subscriber.id == subscriber_id).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    for field, value in subscriber_update.dict(exclude_unset=True).items():
        setattr(subscriber, field, value)

    db.commit()
    db.refresh(subscriber)
    return subscriber

@app.delete("/subscribers/{subscriber_id}", response_model=SuccessResponse)
async def delete_subscriber(
    subscriber_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Delete a subscriber"""
    subscriber = db.query(Subscriber).filter(Subscriber.id == subscriber_id).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Subscriber not found")

    db.delete(subscriber)
    db.commit()
    return SuccessResponse(message="Subscriber deleted successfully")

# Public subscription endpoints
@app.post("/subscribe", response_model=SuccessResponse)
async def public_subscribe(
    subscription: SubscriptionRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Public endpoint for subscribing to newsletter"""
    try:
        # Check if email already exists
        existing = db.query(Subscriber).filter(Subscriber.email == subscription.email).first()
        if existing:
            if existing.status == SubscriptionStatus.ACTIVE:
                raise HTTPException(status_code=400, detail="Email already subscribed")
            elif existing.status == SubscriptionStatus.UNSUBSCRIBED:
                # Re-subscribe
                existing.status = SubscriptionStatus.PENDING
                existing.unsubscribed_at = None
                existing.subscribed_at = datetime.utcnow()
                db.commit()
                background_tasks.add_task(send_confirmation_email, existing.id, db)
                return SuccessResponse(message="Subscription confirmation sent")

        # Create new subscriber
        db_subscriber = Subscriber(
            email=subscription.email,
            first_name=subscription.first_name,
            last_name=subscription.last_name,
            subscription_source=subscription.source,
            preferences=subscription.preferences,
            status=SubscriptionStatus.PENDING
        )
        db.add(db_subscriber)
        db.commit()
        db.refresh(db_subscriber)

        # Send confirmation email
        background_tasks.add_task(send_confirmation_email, db_subscriber.id, db)

        return SuccessResponse(message="Subscription confirmation sent to your email")

    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Subscription failed")

@app.post("/unsubscribe", response_model=SuccessResponse)
async def public_unsubscribe(
    unsubscribe: UnsubscribeRequest,
    db: Session = Depends(get_db)
):
    """Public endpoint for unsubscribing from newsletter"""
    subscriber = db.query(Subscriber).filter(Subscriber.email == unsubscribe.email).first()
    if not subscriber:
        # Don't reveal if email exists or not for privacy
        return SuccessResponse(message="Unsubscribe request processed")

    subscriber.status = SubscriptionStatus.UNSUBSCRIBED
    subscriber.unsubscribed_at = datetime.utcnow()

    # Log activity
    activity = SubscriberActivity(
        subscriber_id=subscriber.id,
        activity_type="unsubscribe",
        metadata={"reason": unsubscribe.reason}
    )
    db.add(activity)

    db.commit()
    return SuccessResponse(message="Successfully unsubscribed from newsletter")

@app.post("/confirm", response_model=SuccessResponse)
async def confirm_subscription(
    confirmation: ConfirmSubscriptionRequest,
    db: Session = Depends(get_db)
):
    """Confirm email subscription"""
    # In real implementation, verify token
    # For now, just mark as confirmed
    subscriber = db.query(Subscriber).filter(Subscriber.email == "placeholder").first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="Invalid confirmation token")

    if subscriber.status != SubscriptionStatus.PENDING:
        return SuccessResponse(message="Subscription already confirmed")

    subscriber.status = SubscriptionStatus.ACTIVE
    subscriber.confirmed_at = datetime.utcnow()

    db.commit()
    return SuccessResponse(message="Subscription confirmed successfully")

# Analytics API
@app.get("/analytics/overview", response_model=SubscriberStats)
async def get_subscriber_stats(db: Session = Depends(get_db)):
    """Get overall subscriber statistics"""
    stats = db.query(
        func.count(Subscriber.id).label('total_subscribers'),
        func.count(func.case([(Subscriber.status == SubscriptionStatus.ACTIVE, 1)])).label('active_subscribers'),
        func.count(func.case([(Subscriber.status == SubscriptionStatus.PENDING, 1)])).label('pending_subscribers'),
        func.count(func.case([(Subscriber.status == SubscriptionStatus.UNSUBSCRIBED, 1)])).label('unsubscribed_count'),
        func.count(func.case([(Subscriber.status == SubscriptionStatus.BOUNCED, 1)])).label('bounced_count'),
        func.count(func.case([(Subscriber.status == SubscriptionStatus.COMPLAINT, 1)])).label('complaint_count')
    ).first()

    # Calculate new subscribers
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    new_today = db.query(func.count(Subscriber.id))\
                 .filter(func.date(Subscriber.subscribed_at) == today)\
                 .scalar()

    new_week = db.query(func.count(Subscriber.id))\
                .filter(func.date(Subscriber.subscribed_at) >= week_ago)\
                .scalar()

    new_month = db.query(func.count(Subscriber.id))\
                 .filter(func.date(Subscriber.subscribed_at) >= month_ago)\
                 .scalar()

    return SubscriberStats(
        total_subscribers=stats.total_subscribers,
        active_subscribers=stats.active_subscribers,
        pending_subscribers=stats.pending_subscribers,
        unsubscribed_count=stats.unsubscribed_count,
        bounced_count=stats.bounced_count,
        complaint_count=stats.complaint_count,
        new_subscribers_today=new_today,
        new_subscribers_this_week=new_week,
        new_subscribers_this_month=new_month
    )

@app.get("/analytics/newsletters/{newsletter_id}", response_model=NewsletterStats)
async def get_newsletter_stats(newsletter_id: int, db: Session = Depends(get_db)):
    """Get statistics for a specific newsletter"""
    newsletter = db.query(Newsletter).filter(Newsletter.id == newsletter_id).first()
    if not newsletter:
        raise HTTPException(status_code=404, detail="Newsletter not found")

    return NewsletterStats(
        newsletter_id=newsletter_id,
        total_recipients=newsletter.total_recipients,
        sent_count=newsletter.sent_count,
        delivered_count=newsletter.delivered_count,
        opened_count=newsletter.opened_count,
        clicked_count=newsletter.clicked_count,
        bounced_count=newsletter.bounced_count,
        complained_count=newsletter.complained_count,
        unsubscribed_count=newsletter.unsubscribed_count,
        open_rate=newsletter.open_rate,
        click_rate=newsletter.click_rate,
        bounce_rate=newsletter.bounce_rate,
        unsubscribe_rate=newsletter.unsubscribe_rate
    )

# Webhook endpoints for email service providers
@app.post("/webhooks/bounce")
async def handle_bounce_webhook(webhook_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Handle bounce webhooks from email service provider"""
    # Process bounce events
    for bounce in webhook_data.get('bounces', []):
        bounce_event = BounceEvent(
            subscriber_id=bounce.get('subscriber_id'),
            bounce_type=bounce.get('type', BounceType.SOFT),
            bounce_reason=bounce.get('reason'),
            bounce_code=bounce.get('code'),
            provider_message=bounce.get('message'),
            raw_data=bounce
        )
        db.add(bounce_event)

    db.commit()
    return {"status": "processed"}

@app.post("/webhooks/open")
async def handle_open_webhook(webhook_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Handle open webhooks from email service provider"""
    # Process open events
    for open_event in webhook_data.get('opens', []):
        send_id = open_event.get('send_id')
        send_record = db.query(NewsletterSend).filter(NewsletterSend.id == send_id).first()
        if send_record:
            if not send_record.first_opened_at:
                send_record.first_opened_at = datetime.utcnow()
            send_record.opened_at = datetime.utcnow()

            # Update newsletter stats
            newsletter = send_record.newsletter
            newsletter.opened_count = db.query(func.count(NewsletterSend.id))\
                                      .filter(NewsletterSend.newsletter_id == newsletter.id,
                                             NewsletterSend.opened_at.isnot(None))\
                                      .scalar()
            newsletter.update_stats()

    db.commit()
    return {"status": "processed"}

@app.post("/webhooks/click")
async def handle_click_webhook(webhook_data: Dict[str, Any], db: Session = Depends(get_db)):
    """Handle click webhooks from email service provider"""
    # Process click events
    for click_event in webhook_data.get('clicks', []):
        send_id = click_event.get('send_id')
        link_url = click_event.get('url')

        send_record = db.query(NewsletterSend).filter(NewsletterSend.id == send_id).first()
        if send_record:
            send_record.clicked_at = datetime.utcnow()

            # Find or create link
            link = db.query(NewsletterLink)\
                    .filter(NewsletterLink.newsletter_id == send_record.newsletter_id,
                           NewsletterLink.url == link_url)\
                    .first()

            if link:
                link.click_count += 1

                # Create click record
                click_record = NewsletterClick(
                    send_id=send_id,
                    link_id=link.id,
                    ip_address=click_event.get('ip'),
                    user_agent=click_event.get('user_agent'),
                    referrer=click_event.get('referrer')
                )
                db.add(click_record)

                # Update newsletter stats
                newsletter = send_record.newsletter
                newsletter.clicked_count = db.query(func.count(NewsletterSend.id))\
                                           .filter(NewsletterSend.newsletter_id == newsletter.id,
                                                  NewsletterSend.clicked_at.isnot(None))\
                                           .scalar()
                newsletter.update_stats()

    db.commit()
    return {"status": "processed"}

# Background task functions
async def send_confirmation_email(subscriber_id: int, db: Session):
    """Send confirmation email to subscriber"""
    # Placeholder implementation
    logger.info(f"Sending confirmation email to subscriber {subscriber_id}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
"""
SMS Verification Service - FastAPI microservice for SMS verification and messaging
Senior-level implementation with comprehensive SMS functionality
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc, asc, and_, or_, text, update
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import asyncio
import json
import logging
import secrets
import string
import re
import phonenumbers
from contextlib import asynccontextmanager

# Import our models and schemas
from models import (
    Base, SMSProviderConfig, SMSMessage, SMSVerification, PhoneNumberValidation,
    SMSRateLimit, SMSWebhookLog, SMSAnalytics
)
from schemas import (
    SMSProviderConfigCreate, SMSProviderConfigUpdate, SMSProviderConfig as SMSProviderConfigSchema,
    SMSMessageCreate, SMSMessage as SMSMessageSchema,
    SMSVerificationCreate, SMSVerification as SMSVerificationSchema,
    PhoneNumberValidationCreate, PhoneNumberValidation as PhoneNumberValidationSchema,
    SMSRateLimitCreate, SMSRateLimit as SMSRateLimitSchema,
    SMSWebhookLogCreate, SMSWebhookLog as SMSWebhookLogSchema,
    SMSAnalyticsCreate, SMSAnalytics as SMSAnalyticsSchema,
    SendSMSRequest, SendVerificationRequest, VerifyCodeRequest, ValidatePhoneRequest,
    BulkSMSRequest, SMSStats, VerificationStats,
    PaginationParams, PaginatedResponse,
    APIResponse, ErrorResponse, SuccessResponse,
    VerificationStatus, SMSProvider, MessageType, DeliveryStatus,
    TwilioWebhook, AWSWebhook, GenericSMSWebhook
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup (placeholder - will be configured with actual database)
DATABASE_URL = "postgresql://user:password@localhost/sms_db"

# SMS provider configurations (placeholder)
SMS_CONFIGS = {
    "twilio": {
        "account_sid": "your_account_sid",
        "auth_token": "your_auth_token",
        "phone_number": "+1234567890"
    }
}

# Create FastAPI app
app = FastAPI(
    title="SMS Verification Service API",
    description="Enterprise SMS verification and messaging service with multiple providers",
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

# Utility functions
def generate_verification_code(length: int = 6) -> str:
    """Generate a random verification code"""
    return ''.join(secrets.choice(string.digits) for _ in range(length))

def normalize_phone_number(phone: str) -> str:
    """Normalize phone number to international format"""
    try:
        parsed = phonenumbers.parse(phone, None)
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except:
        pass
    return phone

def validate_phone_number(phone: str) -> bool:
    """Validate phone number format"""
    try:
        parsed = phonenumbers.parse(phone, None)
        return phonenumbers.is_valid_number(parsed)
    except:
        return False

async def check_rate_limit(identifier: str, limit_type: str, db: Session) -> bool:
    """Check if request is within rate limits"""
    now = datetime.utcnow()

    # Define rate limit windows
    windows = {
        "per_minute": timedelta(minutes=1),
        "per_hour": timedelta(hours=1),
        "per_day": timedelta(days=1)
    }

    for window_name, window_delta in windows.items():
        window_start = now.replace(second=0, microsecond=0)
        if window_name == "per_hour":
            window_start = window_start.replace(minute=0)
        elif window_name == "per_day":
            window_start = window_start.replace(hour=0, minute=0)

        window_end = window_start + window_delta

        # Get or create rate limit record
        rate_limit = db.query(SMSRateLimit).filter(
            SMSRateLimit.identifier == identifier,
            SMSRateLimit.limit_type == limit_type,
            SMSRateLimit.window_start == window_start
        ).first()

        if not rate_limit:
            # Create new rate limit record
            limit_value = 10 if window_name == "per_minute" else 100 if window_name == "per_hour" else 1000
            rate_limit = SMSRateLimit(
                identifier=identifier,
                limit_type=limit_type,
                window_start=window_start,
                window_end=window_end,
                limit_value=limit_value
            )
            db.add(rate_limit)
            db.commit()

        # Check if blocked
        if rate_limit.is_blocked and (rate_limit.blocked_until and now < rate_limit.blocked_until):
            return False

        # Check if limit exceeded
        if rate_limit.request_count >= rate_limit.limit_value:
            rate_limit.is_blocked = True
            rate_limit.blocked_until = window_end
            db.commit()
            return False

        # Increment counter
        rate_limit.request_count += 1
        db.commit()

    return True

async def send_sms_via_provider(
    provider_config: SMSProviderConfig,
    to_phone: str,
    message: str,
    message_type: MessageType
) -> Dict[str, Any]:
    """Send SMS via specific provider (placeholder implementation)"""
    try:
        if provider_config.provider == SMSProvider.TWILIO:
            # Twilio implementation
            return await send_via_twilio(provider_config, to_phone, message)

        elif provider_config.provider == SMSProvider.AWS_SNS:
            # AWS SNS implementation
            return await send_via_aws_sns(provider_config, to_phone, message)

        elif provider_config.provider == SMSProvider.NEXMO:
            # Nexmo/Vonage implementation
            return await send_via_nexmo(provider_config, to_phone, message)

        else:
            raise HTTPException(status_code=400, detail=f"Provider {provider_config.provider} not implemented")

    except Exception as e:
        logger.error(f"Error sending SMS via {provider_config.provider}: {e}")
        raise HTTPException(status_code=500, detail="SMS sending failed")

async def send_via_twilio(provider_config: SMSProviderConfig, to_phone: str, message: str) -> Dict[str, Any]:
    """Send SMS via Twilio (placeholder)"""
    # In real implementation, use Twilio SDK
    # from twilio.rest import Client
    # client = Client(provider_config.account_sid, provider_config.api_key)
    # message = client.messages.create(
    #     body=message,
    #     from_=provider_config.phone_number,
    #     to=to_phone
    # )

    # Simulate successful send
    await asyncio.sleep(0.5)
    return {
        "provider_message_id": f"twilio_{secrets.token_hex(16)}",
        "status": "sent",
        "cost": 0.01,
        "segments": 1
    }

async def send_via_aws_sns(provider_config: SMSProviderConfig, to_phone: str, message: str) -> Dict[str, Any]:
    """Send SMS via AWS SNS (placeholder)"""
    # In real implementation, use boto3
    # import boto3
    # sns = boto3.client('sns', region_name=provider_config.region)
    # response = sns.publish(PhoneNumber=to_phone, Message=message)

    # Simulate successful send
    await asyncio.sleep(0.5)
    return {
        "provider_message_id": f"aws_{secrets.token_hex(16)}",
        "status": "sent",
        "cost": 0.006,
        "segments": 1
    }

async def send_via_nexmo(provider_config: SMSProviderConfig, to_phone: str, message: str) -> Dict[str, Any]:
    """Send SMS via Nexmo (placeholder)"""
    # In real implementation, use Nexmo SDK
    # import nexmo
    # client = nexmo.Client(key=provider_config.api_key, secret=provider_config.api_secret)
    # response = client.send_message({
    #     'from': provider_config.phone_number,
    #     'to': to_phone,
    #     'text': message
    # })

    # Simulate successful send
    await asyncio.sleep(0.5)
    return {
        "provider_message_id": f"nexmo_{secrets.token_hex(16)}",
        "status": "sent",
        "cost": 0.005,
        "segments": 1
    }

async def update_analytics(db: Session):
    """Update SMS analytics daily"""
    try:
        today = datetime.utcnow().date()

        # Get today's stats
        today_start = datetime.combine(today, datetime.min.time())
        today_end = datetime.combine(today, datetime.max.time())

        stats = db.query(
            SMSMessage.provider_config_id,
            func.count(SMSMessage.id).label('total_sent'),
            func.sum(func.case([(SMSMessage.delivery_status == DeliveryStatus.DELIVERED, 1)], else_=0)).label('delivered'),
            func.sum(func.case([(SMSMessage.delivery_status == DeliveryStatus.FAILED, 1)], else_=0)).label('failed'),
            func.sum(SMSMessage.cost).label('total_cost')
        ).filter(
            SMSMessage.created_at.between(today_start, today_end)
        ).group_by(SMSMessage.provider_config_id).all()

        for stat in stats:
            provider_config = db.query(SMSProviderConfig).filter(
                SMSProviderConfig.id == stat.provider_config_id
            ).first()

            if provider_config:
                analytics = SMSAnalytics(
                    date=today,
                    provider=provider_config.provider,
                    total_sent=stat.total_sent,
                    total_delivered=stat.delivered,
                    total_failed=stat.failed,
                    total_cost=stat.total_cost or 0.0
                )
                db.add(analytics)

        db.commit()
        logger.info("Updated SMS analytics")

    except Exception as e:
        logger.error(f"Error updating SMS analytics: {e}")
        db.rollback()

# API Routes

# Health check
@app.get("/health", response_model=SuccessResponse)
async def health_check():
    """Health check endpoint"""
    return SuccessResponse(message="SMS service is healthy")

# Provider Management API
@app.post("/providers", response_model=SMSProviderConfigSchema)
async def create_provider_config(
    provider_config: SMSProviderConfigCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Create a new SMS provider configuration"""
    try:
        # Check if provider already exists
        existing = db.query(SMSProviderConfig).filter(
            SMSProviderConfig.provider == provider_config.provider
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Provider configuration already exists")

        db_provider = SMSProviderConfig(**provider_config.dict())
        db.add(db_provider)
        db.commit()
        db.refresh(db_provider)
        return db_provider
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Provider creation failed")

@app.get("/providers", response_model=List[SMSProviderConfigSchema])
async def list_provider_configs(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """List SMS provider configurations"""
    query = db.query(SMSProviderConfig)
    if active_only:
        query = query.filter(SMSProviderConfig.is_active == True)

    return query.order_by(desc(SMSProviderConfig.priority)).all()

@app.get("/providers/{provider_id}", response_model=SMSProviderConfigSchema)
async def get_provider_config(
    provider_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Get a specific provider configuration"""
    provider = db.query(SMSProviderConfig).filter(SMSProviderConfig.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider

# SMS Sending API
@app.post("/send", response_model=SMSMessageSchema)
async def send_sms(
    request: SendSMSRequest,
    background_tasks: BackgroundTasks,
    request_obj: Request,
    db: Session = Depends(get_db)
):
    """Send an SMS message"""
    # Normalize phone number
    to_phone = normalize_phone_number(request.to_phone)
    if not validate_phone_number(to_phone):
        raise HTTPException(status_code=400, detail="Invalid phone number")

    # Check rate limits
    client_ip = request_obj.client.host
    if not await check_rate_limit(to_phone, "phone", db):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for this phone number")

    if not await check_rate_limit(client_ip, "ip", db):
        raise HTTPException(status_code=429, detail="Rate limit exceeded for this IP address")

    # Get active provider (with highest priority)
    provider_config = db.query(SMSProviderConfig).filter(
        SMSProviderConfig.is_active == True
    ).order_by(desc(SMSProviderConfig.priority)).first()

    if not provider_config:
        raise HTTPException(status_code=500, detail="No active SMS provider available")

    try:
        # Create SMS message record
        db_message = SMSMessage(
            provider_config_id=provider_config.id,
            to_phone=to_phone,
            message=request.message,
            message_type=request.message_type,
            from_phone=provider_config.phone_number
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)

        # Send SMS asynchronously
        background_tasks.add_task(send_sms_background, db_message.id, db)

        return db_message
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="SMS creation failed")

async def send_sms_background(message_id: int, db: Session):
    """Send SMS in background"""
    try:
        message = db.query(SMSMessage).options(joinedload(SMSMessage.provider_config)).filter(
            SMSMessage.id == message_id
        ).first()

        if not message:
            logger.error(f"SMS message {message_id} not found")
            return

        # Send via provider
        result = await send_sms_via_provider(
            message.provider_config,
            message.to_phone,
            message.message,
            message.message_type
        )

        # Update message record
        message.delivery_status = DeliveryStatus.SENT if result["status"] == "sent" else DeliveryStatus.FAILED
        message.provider_message_id = result.get("provider_message_id")
        message.cost = result.get("cost")
        message.segments = result.get("segments", 1)
        message.sent_at = datetime.utcnow()
        message.provider_response = result

        if result["status"] != "sent":
            message.error_message = result.get("error", "Unknown error")
            message.failed_at = datetime.utcnow()

        db.commit()
        logger.info(f"SMS {message_id} sent successfully")

    except Exception as e:
        logger.error(f"Error sending SMS {message_id}: {e}")
        # Update message status to failed
        db.query(SMSMessage).filter(SMSMessage.id == message_id).update({
            "delivery_status": DeliveryStatus.FAILED,
            "error_message": str(e),
            "failed_at": datetime.utcnow()
        })
        db.commit()

# Verification API
@app.post("/verify/send", response_model=SMSVerificationSchema)
async def send_verification(
    request: SendVerificationRequest,
    background_tasks: BackgroundTasks,
    request_obj: Request,
    db: Session = Depends(get_db)
):
    """Send SMS verification code"""
    # Normalize phone number
    phone_number = normalize_phone_number(request.phone_number)
    if not validate_phone_number(phone_number):
        raise HTTPException(status_code=400, detail="Invalid phone number")

    # Check rate limits
    client_ip = request_obj.client.host
    if not await check_rate_limit(phone_number, "phone", db):
        raise HTTPException(status_code=429, detail="Too many verification requests for this phone number")

    if not await check_rate_limit(client_ip, "ip", db):
        raise HTTPException(status_code=429, detail="Too many requests from this IP address")

    # Generate verification code
    code = generate_verification_code()

    # Create custom message or use default
    message_text = request.custom_message or f"Your verification code is: {code}"

    # Send SMS
    sms_request = SendSMSRequest(
        to_phone=phone_number,
        message=message_text,
        message_type=MessageType.VERIFICATION
    )

    sms_response = await send_sms(sms_request, background_tasks, request_obj, db)

    # Create verification record
    expires_at = datetime.utcnow() + timedelta(minutes=request.expires_in_minutes)

    try:
        db_verification = SMSVerification(
            message_id=sms_response.id,
            verification_code=code,  # In production, this should be hashed
            user_id=request.user_id,
            purpose=request.purpose,
            expires_at=expires_at,
            ip_address=client_ip,
            user_agent=request_obj.headers.get("user-agent")
        )
        db.add(db_verification)
        db.commit()
        db.refresh(db_verification)
        return db_verification
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Verification creation failed")

@app.post("/verify/check", response_model=SuccessResponse)
async def verify_code(
    request: VerifyCodeRequest,
    request_obj: Request,
    db: Session = Depends(get_db)
):
    """Verify SMS code"""
    verification = db.query(SMSVerification).options(joinedload(SMSVerification.message)).filter(
        SMSVerification.id == request.verification_id
    ).first()

    if not verification:
        raise HTTPException(status_code=404, detail="Verification not found")

    if verification.status != VerificationStatus.SENT:
        raise HTTPException(status_code=400, detail="Verification is not active")

    if verification.is_expired():
        verification.status = VerificationStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired")

    if not verification.can_attempt():
        verification.status = VerificationStatus.FAILED
        db.commit()
        raise HTTPException(status_code=400, detail="Too many failed attempts")

    # Check code (in production, compare hashed versions)
    if verification.verification_code != request.code:
        verification.attempts_used += 1
        if not verification.can_attempt():
            verification.status = VerificationStatus.FAILED
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Mark as verified
    verification.status = VerificationStatus.VERIFIED
    verification.verified_at = datetime.utcnow()
    verification.ip_address = request.ip_address or request_obj.client.host
    verification.user_agent = request.user_agent or request_obj.headers.get("user-agent")

    db.commit()

    return SuccessResponse(message="Code verified successfully")

# Phone Number Validation API
@app.post("/validate-phone", response_model=PhoneNumberValidationSchema)
async def validate_phone(
    request: ValidatePhoneRequest,
    db: Session = Depends(get_db)
):
    """Validate and format phone number"""
    normalized = normalize_phone_number(request.phone_number)
    is_valid = validate_phone_number(normalized)

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid phone number format")

    # Parse phone number for additional info
    try:
        parsed = phonenumbers.parse(normalized, None)
        country_code = str(parsed.country_code)
        national_number = str(parsed.national_number)
        is_mobile = phonenumbers.number_type(parsed) == phonenumbers.PhoneNumberType.MOBILE
    except:
        country_code = None
        national_number = None
        is_mobile = None

    # Check if we already have validation cached
    existing = db.query(PhoneNumberValidation).filter(
        PhoneNumberValidation.phone_number == normalized
    ).first()

    if existing and existing.validated_at:
        # Return cached validation if recent (within 30 days)
        if (datetime.utcnow() - existing.validated_at).days < 30:
            return existing

    # Create or update validation record
    if existing:
        existing.is_valid = is_valid
        existing.country_code = country_code
        existing.national_number = national_number
        existing.is_mobile = is_mobile
        existing.validated_at = datetime.utcnow()
        db.commit()
        return existing
    else:
        validation = PhoneNumberValidation(
            phone_number=normalized,
            country_code=country_code,
            national_number=national_number,
            is_valid=is_valid,
            is_mobile=is_mobile,
            validated_at=datetime.utcnow()
        )
        db.add(validation)
        db.commit()
        db.refresh(validation)
        return validation

# Bulk SMS API
@app.post("/bulk-send", response_model=List[SMSMessageSchema])
async def bulk_send_sms(
    request: BulkSMSRequest,
    background_tasks: BackgroundTasks,
    request_obj: Request,
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    """Send bulk SMS messages"""
    if len(request.messages) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 messages per bulk request")

    results = []
    for sms_request in request.messages:
        try:
            message = await send_sms(sms_request, background_tasks, request_obj, db)
            results.append(message)
        except Exception as e:
            logger.error(f"Failed to send bulk SMS: {e}")
            # Continue with other messages

    return results

# Analytics API
@app.get("/analytics/sms", response_model=SMSStats)
async def get_sms_stats(db: Session = Depends(get_db)):
    """Get SMS statistics"""
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)

    # Today's stats
    today_stats = db.query(
        func.count(SMSMessage.id).label('sent'),
        func.sum(func.case([(SMSMessage.delivery_status == DeliveryStatus.DELIVERED, 1)], else_=0)).label('delivered'),
        func.sum(func.case([(SMSMessage.delivery_status == DeliveryStatus.FAILED, 1)], else_=0)).label('failed'),
        func.sum(SMSMessage.cost).label('cost')
    ).filter(
        func.date(SMSMessage.created_at) == today
    ).first()

    # Weekly stats
    week_stats = db.query(
        func.count(SMSMessage.id).label('sent')
    ).filter(
        func.date(SMSMessage.created_at) >= week_ago
    ).first()

    # Monthly stats
    month_stats = db.query(
        func.count(SMSMessage.id).label('sent')
    ).filter(
        func.date(SMSMessage.created_at) >= month_ago
    ).first()

    # Most used provider
    provider_usage = db.query(
        SMSProviderConfig.provider,
        func.count(SMSMessage.id).label('usage')
    ).join(SMSMessage).filter(
        func.date(SMSMessage.created_at) == today
    ).group_by(SMSProviderConfig.provider)\
     .order_by(desc(func.count(SMSMessage.id)))\
     .first()

    return SMSStats(
        total_sent_today=today_stats.sent or 0,
        total_sent_this_week=week_stats.sent or 0,
        total_sent_this_month=month_stats.sent or 0,
        total_delivered_today=today_stats.delivered or 0,
        total_failed_today=today_stats.failed or 0,
        total_cost_today=today_stats.cost or 0.0,
        average_delivery_rate=(today_stats.delivered / today_stats.sent * 100) if today_stats.sent > 0 else 0.0,
        most_used_provider=provider_usage.provider if provider_usage else None,
        top_failure_reasons=[]  # Would implement failure reason analysis
    )

@app.get("/analytics/verifications", response_model=VerificationStats)
async def get_verification_stats(db: Session = Depends(get_db)):
    """Get verification statistics"""
    today = datetime.utcnow().date()

    # Today's verification stats
    today_stats = db.query(
        func.count(SMSVerification.id).label('total'),
        func.sum(func.case([(SMSVerification.status == VerificationStatus.VERIFIED, 1)], else_=0)).label('verified'),
        func.sum(func.case([(SMSVerification.status == VerificationStatus.FAILED, 1)], else_=0)).label('failed')
    ).filter(
        func.date(SMSVerification.created_at) == today
    ).first()

    # Average verification time
    avg_time = db.query(
        func.avg(
            func.extract('epoch', SMSVerification.verified_at - SMSVerification.created_at)
        )
    ).filter(
        SMSVerification.status == VerificationStatus.VERIFIED,
        func.date(SMSVerification.created_at) == today
    ).scalar()

    # Most common purposes
    purposes = db.query(
        SMSVerification.purpose,
        func.count(SMSVerification.id).label('count')
    ).filter(
        func.date(SMSVerification.created_at) == today
    ).group_by(SMSVerification.purpose)\
     .order_by(desc(func.count(SMSVerification.id)))\
     .limit(5)\
     .all()

    return VerificationStats(
        total_verifications_today=today_stats.total or 0,
        total_verified_today=today_stats.verified or 0,
        total_failed_today=today_stats.failed or 0,
        average_verification_time=avg_time,
        verification_success_rate=(today_stats.verified / today_stats.total * 100) if today_stats.total > 0 else 0.0,
        most_common_purposes=[{"purpose": p.purpose, "count": p.count} for p in purposes]
    )

# Webhook endpoints for SMS providers
@app.post("/webhooks/twilio")
async def twilio_webhook(
    webhook: TwilioWebhook,
    db: Session = Depends(get_db)
):
    """Handle Twilio webhooks"""
    try:
        # Log webhook
        webhook_log = SMSWebhookLog(
            provider=SMSProvider.TWILIO,
            event_type=webhook.MessageStatus,
            provider_message_id=webhook.MessageSid,
            payload=webhook.dict()
        )
        db.add(webhook_log)

        # Update message status
        message = db.query(SMSMessage).filter(
            SMSMessage.provider_message_id == webhook.MessageSid
        ).first()

        if message:
            if webhook.MessageStatus == "delivered":
                message.delivery_status = DeliveryStatus.DELIVERED
                message.delivered_at = datetime.utcnow()
            elif webhook.MessageStatus in ["failed", "undelivered"]:
                message.delivery_status = DeliveryStatus.FAILED
                message.failed_at = datetime.utcnow()
                message.error_message = f"Twilio status: {webhook.MessageStatus}"

        db.commit()
        return {"status": "processed"}

    except Exception as e:
        logger.error(f"Error processing Twilio webhook: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Webhook processing failed")

@app.post("/webhooks/aws")
async def aws_webhook(
    webhook: AWSWebhook,
    db: Session = Depends(get_db)
):
    """Handle AWS SNS webhooks"""
    try:
        # Log webhook
        webhook_log = SMSWebhookLog(
            provider=SMSProvider.AWS_SNS,
            event_type=webhook.notification.get("eventType", "unknown"),
            payload=webhook.dict()
        )
        db.add(webhook_log)

        # Process AWS notification (simplified)
        # In real implementation, parse the notification and update message status

        db.commit()
        return {"status": "processed"}

    except Exception as e:
        logger.error(f"Error processing AWS webhook: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Webhook processing failed")

@app.post("/webhooks/generic")
async def generic_sms_webhook(
    webhook: GenericSMSWebhook,
    db: Session = Depends(get_db)
):
    """Handle generic SMS provider webhooks"""
    try:
        # Log webhook
        webhook_log = SMSWebhookLog(
            provider=webhook.provider,
            event_type=webhook.event_type,
            message_id=webhook.message_id,
            payload=webhook.dict()
        )
        db.add(webhook_log)

        # Update message status based on webhook
        if webhook.message_id:
            message = db.query(SMSMessage).filter(
                SMSMessage.provider_message_id == webhook.message_id
            ).first()

            if message and webhook.status:
                if webhook.status == "delivered":
                    message.delivery_status = DeliveryStatus.DELIVERED
                    message.delivered_at = datetime.utcnow()
                elif webhook.status in ["failed", "undelivered"]:
                    message.delivery_status = DeliveryStatus.FAILED
                    message.failed_at = datetime.utcnow()
                    message.error_message = webhook.error_message or f"Status: {webhook.status}"

        db.commit()
        return {"status": "processed"}

    except Exception as e:
        logger.error(f"Error processing generic webhook: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Webhook processing failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
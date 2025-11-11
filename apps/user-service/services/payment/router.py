"""
Zenith Payment Service Router
FastAPI router for payment processing endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, List, Any
from pydantic import BaseModel
import stripe
import os
from datetime import datetime, timedelta
import logging

from ...core.database import get_db
from . import models, schemas

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

router = APIRouter()

# Request/Response schemas for router endpoints
class PaymentIntentRequest(BaseModel):
    user_id: str
    amount: int
    currency: str = "usd"
    service_type: str
    metadata: Optional[Dict[str, Any]] = None

class SubscriptionRequest(BaseModel):
    user_id: str
    customer_email: str
    price_id: str
    plan_type: str

class WebhookRequest(BaseModel):
    headers: Dict[str, str]
    body: bytes

class CancelSubscriptionRequest(BaseModel):
    user_id: str
    subscription_id: str

# Payment service class
class PaymentService:
    def __init__(self):
        self.stripe = stripe

    async def create_payment_intent(self, amount: int, currency: str = "usd", metadata: Optional[Dict] = None) -> Dict:
        """Create a Stripe payment intent."""
        try:
            intent = self.stripe.PaymentIntent.create(
                amount=amount,
                currency=currency,
                metadata=metadata or {},
                automatic_payment_methods={"enabled": True}
            )
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount": intent.amount,
                "currency": intent.currency
            }
        except Exception as e:
            logger.error(f"Failed to create payment intent: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to create payment intent")

    async def create_subscription(self, customer_id: str, price_id: str, metadata: Optional[Dict] = None) -> Dict:
        """Create a Stripe subscription."""
        try:
            subscription = self.stripe.Subscription.create(
                customer=customer_id,
                items=[{"price": price_id}],
                metadata=metadata or {},
                payment_behavior="default_incomplete",
                expand=["latest_invoice.payment_intent"]
            )
            return {
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret,
                "status": subscription.status
            }
        except Exception as e:
            logger.error(f"Failed to create subscription: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to create subscription")

    async def cancel_subscription(self, subscription_id: str) -> Dict:
        """Cancel a Stripe subscription."""
        try:
            subscription = self.stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=True
            )
            return {"message": "Subscription will be cancelled at period end"}
        except Exception as e:
            logger.error(f"Failed to cancel subscription: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to cancel subscription")

# Initialize payment service
payment_service = PaymentService()

@router.post("/create-intent", response_model=schemas.PaymentIntent)
async def create_payment_intent(
    request: PaymentIntentRequest,
    db: Session = Depends(get_db)
):
    """Create a payment intent for booking or service payment."""
    try:
        result = await payment_service.create_payment_intent(
            amount=request.amount,
            currency=request.currency,
            metadata={"user_id": request.user_id, "service_type": request.service_type}
        )

        # Store payment intent in database
        payment_record = models.Payment(
            user_id=request.user_id,
            amount=request.amount,
            currency=request.currency,
            payment_intent_id=result["payment_intent_id"],
            status="pending",
            service_type=request.service_type,
            metadata=request.metadata
        )
        db.add(payment_record)
        db.commit()
        db.refresh(payment_record)

        return result
    except Exception as e:
        logger.error(f"Payment intent creation failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Payment intent creation failed")

@router.post("/create-subscription", response_model=schemas.SubscriptionResponse)
async def create_subscription(
    request: SubscriptionRequest,
    db: Session = Depends(get_db)
):
    """Create a subscription for premium services."""
    try:
        # Create or get Stripe customer
        customer = stripe.Customer.create(
            email=request.customer_email,
            metadata={"user_id": request.user_id}
        )

        result = await payment_service.create_subscription(
            customer_id=customer.id,
            price_id=request.price_id,
            metadata={"user_id": request.user_id, "plan_type": request.plan_type}
        )

        # Store subscription in database
        subscription_record = models.Subscription(
            user_id=request.user_id,
            stripe_customer_id=customer.id,
            stripe_subscription_id=result["subscription_id"],
            status=result["status"],
            plan_type=request.plan_type,
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        db.add(subscription_record)
        db.commit()
        db.refresh(subscription_record)

        return result
    except Exception as e:
        logger.error(f"Subscription creation failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Subscription creation failed")

@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhooks for payment events."""
    try:
        # Verify webhook signature
        sig_header = request.headers.get("stripe-signature")
        event = stripe.Webhook.construct_event(
            await request.body(),
            sig_header,
            stripe_webhook_secret
        )

        # Handle different event types
        if event.type == "payment_intent.succeeded":
            payment_intent = event.data.object
            # Update payment status
            payment = db.query(models.Payment).filter(
                models.Payment.payment_intent_id == payment_intent.id
            ).first()
            if payment:
                payment.status = "succeeded"
                payment.paid_at = datetime.utcnow()
                db.commit()

        elif event.type == "payment_intent.payment_failed":
            payment_intent = event.data.object
            # Update payment status
            payment = db.query(models.Payment).filter(
                models.Payment.payment_intent_id == payment_intent.id
            ).first()
            if payment:
                payment.status = "failed"
                db.commit()

        elif event.type == "invoice.payment_succeeded":
            invoice = event.data.object
            # Update subscription status
            subscription = db.query(models.Subscription).filter(
                models.Subscription.stripe_customer_id == invoice.customer
            ).first()
            if subscription:
                subscription.status = "active"
                subscription.current_period_end = datetime.fromtimestamp(invoice.period_end)
                db.commit()

        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook processing failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")

@router.post("/cancel-subscription")
async def cancel_subscription(
    request: CancelSubscriptionRequest,
    db: Session = Depends(get_db)
):
    """Cancel a user subscription."""
    try:
        # Get subscription from database
        subscription = db.query(models.Subscription).filter(
            models.Subscription.id == request.subscription_id,
            models.Subscription.user_id == request.user_id
        ).first()

        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")

        # Cancel in Stripe
        await payment_service.cancel_subscription(subscription.stripe_subscription_id)

        # Update in database
        subscription.status = "cancelled"
        subscription.cancelled_at = datetime.utcnow()
        db.commit()

        return {"message": "Subscription cancelled successfully"}
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to cancel subscription")

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "zenith-payment",
        "version": "1.0.0",
        "stripe_connected": bool(stripe.api_key)
    }
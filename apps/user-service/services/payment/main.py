"""
Zenith Payment Service - Stripe Integration for Bookings & Subscriptions
Enterprise-grade payment processing with security and compliance.
"""
import os
import stripe
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Create FastAPI app
app = FastAPI(title="Zenith Payment Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        """Create a subscription for a customer."""
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

    async def create_customer(self, email: str, name: str, metadata: Optional[Dict] = None) -> str:
        """Create a Stripe customer."""
        try:
            customer = self.stripe.Customer.create(
                email=email,
                name=name,
                metadata=metadata or {}
            )
            return customer.id
        except Exception as e:
            logger.error(f"Failed to create customer: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to create customer")

    async def refund_payment(self, payment_intent_id: str, amount: Optional[int] = None) -> Dict:
        """Refund a payment."""
        try:
            refund = self.stripe.Refund.create(
                payment_intent=payment_intent_id,
                amount=amount
            )
            return {
                "refund_id": refund.id,
                "status": refund.status,
                "amount": refund.amount
            }
        except Exception as e:
            logger.error(f"Failed to refund payment: {str(e)}")
            raise HTTPException(status_code=400, detail="Failed to process refund")

payment_service = PaymentService()

# API Routes
@app.post("/create-payment-intent")
async def create_payment_intent(
    payment: schemas.PaymentIntentCreate,
    db: Session = Depends(get_db)
):
    """Create a payment intent for booking payment."""
    # Validate booking exists and belongs to user
    booking = db.query(models.Booking).filter(
        models.Booking.id == payment.booking_id
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Calculate amount (this would include service fees, taxes, etc.)
    amount_cents = int(payment.amount * 100)  # Convert to cents

    metadata = {
        "booking_id": str(payment.booking_id),
        "user_id": payment.user_id,
        "provider_id": booking.provider_id
    }

    result = await payment_service.create_payment_intent(amount_cents, payment.currency, metadata)
    return result

@app.post("/create-subscription")
async def create_subscription(
    subscription: schemas.SubscriptionCreate,
    db: Session = Depends(get_db)
):
    """Create a subscription for premium features."""
    # Get or create Stripe customer
    customer_id = await payment_service.create_customer(
        subscription.email,
        subscription.name,
        {"user_id": subscription.user_id}
    )

    result = await payment_service.create_subscription(
        customer_id,
        subscription.price_id,
        {"user_id": subscription.user_id, "plan_type": subscription.plan_type}
    )

    # Store subscription in database
    db_subscription = models.Subscription(
        user_id=subscription.user_id,
        stripe_subscription_id=result["subscription_id"],
        stripe_customer_id=customer_id,
        status=result["status"],
        plan_type=subscription.plan_type,
        current_period_start=datetime.utcnow(),
        current_period_end=datetime.utcnow() + timedelta(days=30)
    )
    db.add(db_subscription)
    db.commit()

    return result

@app.post("/webhook")
async def stripe_webhook(request: Any):
    """Handle Stripe webhooks."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    if event.type == "payment_intent.succeeded":
        await handle_payment_success(event.data.object)
    elif event.type == "payment_intent.payment_failed":
        await handle_payment_failure(event.data.object)
    elif event.type == "invoice.payment_succeeded":
        await handle_subscription_payment(event.data.object)
    elif event.type == "customer.subscription.deleted":
        await handle_subscription_cancelled(event.data.object)

    return {"status": "success"}

async def handle_payment_success(payment_intent):
    """Handle successful payment."""
    logger.info(f"Payment succeeded: {payment_intent.id}")

    # Update booking status, send notifications, etc.
    # This would integrate with the booking service

async def handle_payment_failure(payment_intent):
    """Handle failed payment."""
    logger.error(f"Payment failed: {payment_intent.id}")

    # Update booking status, notify user, etc.

async def handle_subscription_payment(invoice):
    """Handle subscription payment."""
    logger.info(f"Subscription payment: {invoice.subscription}")

async def handle_subscription_cancelled(subscription):
    """Handle subscription cancellation."""
    logger.info(f"Subscription cancelled: {subscription.id}")

@app.post("/refund")
async def refund_payment(
    refund: schemas.RefundCreate,
    db: Session = Depends(get_db)
):
    """Process a refund."""
    # Validate refund request
    payment = db.query(models.Payment).filter(
        models.Payment.id == refund.payment_id
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.status != "succeeded":
        raise HTTPException(status_code=400, detail="Payment not eligible for refund")

    # Calculate refund amount
    refund_amount = refund.amount if refund.amount else payment.amount

    result = await payment_service.refund_payment(
        payment.stripe_payment_intent_id,
        int(refund_amount * 100) if refund.amount else None
    )

    # Update payment status
    payment.status = "refunded"
    payment.refunded_amount = refund_amount
    payment.refunded_at = datetime.utcnow()
    db.commit()

    return result

@app.get("/payment-methods/{user_id}")
async def get_payment_methods(user_id: str):
    """Get user's saved payment methods."""
    try:
        # Get customer ID from database
        # This would query the user table to get stripe_customer_id

        # For now, return mock data
        return {
            "payment_methods": [
                {
                    "id": "pm_mock",
                    "type": "card",
                    "last4": "4242",
                    "brand": "visa",
                    "exp_month": 12,
                    "exp_year": 2025
                }
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get payment methods: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to retrieve payment methods")

@app.post("/setup-intent")
async def create_setup_intent(user_id: str):
    """Create a setup intent for saving payment methods."""
    try:
        # Get or create customer
        customer_id = f"cus_mock_{user_id}"  # This would be retrieved from database

        setup_intent = stripe.SetupIntent.create(
            customer=customer_id,
            payment_method_types=["card"]
        )

        return {
            "client_secret": setup_intent.client_secret,
            "setup_intent_id": setup_intent.id
        }
    except Exception as e:
        logger.error(f"Failed to create setup intent: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to create setup intent")

@app.get("/subscriptions/{user_id}")
async def get_user_subscriptions(user_id: str, db: Session = Depends(get_db)):
    """Get user's active subscriptions."""
    subscriptions = db.query(models.Subscription).filter(
        models.Subscription.user_id == user_id,
        models.Subscription.status == "active"
    ).all()

    return {"subscriptions": subscriptions}

@app.delete("/subscriptions/{subscription_id}")
async def cancel_subscription(subscription_id: str, db: Session = Depends(get_db)):
    """Cancel a subscription."""
    subscription = db.query(models.Subscription).filter(
        models.Subscription.stripe_subscription_id == subscription_id
    ).first()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    try:
        # Cancel in Stripe
        stripe.Subscription.delete(subscription_id)

        # Update in database
        subscription.status = "cancelled"
        subscription.cancelled_at = datetime.utcnow()
        db.commit()

        return {"message": "Subscription cancelled successfully"}
    except Exception as e:
        logger.error(f"Failed to cancel subscription: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to cancel subscription")

# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "zenith-payment",
        "version": "1.0.0",
        "stripe_connected": bool(stripe.api_key)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
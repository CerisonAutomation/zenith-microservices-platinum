"""
Payment Service Schemas - Pydantic models for Stripe payment processing.
"""
from pydantic import BaseModel, UUID4, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

class PaymentIntentCreate(BaseModel):
    booking_id: UUID4
    user_id: str
    amount: Decimal = Field(..., gt=0, description="Payment amount in dollars")
    currency: str = Field(default="usd", description="Currency code")

class PaymentIntent(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: int
    currency: str

class SubscriptionCreate(BaseModel):
    user_id: str
    email: str
    name: str
    price_id: str
    plan_type: str = Field(..., description="basic, premium, vip")

class SubscriptionResponse(BaseModel):
    subscription_id: str
    client_secret: str
    status: str

class RefundCreate(BaseModel):
    payment_id: UUID4
    amount: Optional[Decimal] = Field(None, description="Amount to refund (full refund if not specified)")
    reason: Optional[str] = Field(None, description="Reason for refund")

class Refund(BaseModel):
    refund_id: str
    status: str
    amount: int

class PaymentMethod(BaseModel):
    id: str
    type: str
    brand: Optional[str] = None
    last4: Optional[str] = None
    exp_month: Optional[int] = None
    exp_year: Optional[int] = None
    is_default: bool = False

class PaymentMethodsResponse(BaseModel):
    payment_methods: List[PaymentMethod]

class SetupIntent(BaseModel):
    client_secret: str
    setup_intent_id: str

class Subscription(BaseModel):
    id: UUID4
    user_id: str
    stripe_subscription_id: str
    plan_type: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    amount: Decimal
    currency: str
    cancel_at_period_end: bool = False
    cancelled_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SubscriptionsResponse(BaseModel):
    subscriptions: List[Subscription]

class Invoice(BaseModel):
    id: UUID4
    user_id: str
    stripe_invoice_id: str
    amount: Decimal
    currency: str
    status: str
    invoice_date: datetime
    due_date: Optional[datetime] = None
    paid_at: Optional[datetime] = None
    invoice_url: Optional[str] = None
    hosted_invoice_url: Optional[str] = None

    class Config:
        from_attributes = True

class Coupon(BaseModel):
    id: UUID4
    code: str
    name: str
    description: Optional[str] = None
    discount_type: str
    discount_value: Decimal
    currency: str
    valid_from: datetime
    valid_until: Optional[datetime] = None
    max_redemptions: Optional[int] = None
    times_redeemed: int
    min_amount: Optional[Decimal] = None

    class Config:
        from_attributes = True

class Transaction(BaseModel):
    id: UUID4
    user_id: str
    type: str
    amount: Decimal
    currency: str
    status: str
    created_at: datetime
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class PaymentStats(BaseModel):
    total_revenue: Decimal
    total_transactions: int
    successful_payments: int
    failed_payments: int
    refund_amount: Decimal
    active_subscriptions: int
    monthly_recurring_revenue: Decimal

class WebhookEvent(BaseModel):
    id: str
    type: str
    data: Dict[str, Any]
    created: int
    livemode: bool

# Webhook response schemas
class WebhookResponse(BaseModel):
    status: str = "success"

# Error response schemas
class PaymentError(BaseModel):
    error: str
    code: Optional[str] = None
    param: Optional[str] = None

# Success response schemas
class PaymentSuccess(BaseModel):
    status: str = "success"
    data: Dict[str, Any]

# Card tokenization schemas
class CardToken(BaseModel):
    number: str = Field(..., min_length=13, max_length=19)
    exp_month: int = Field(..., ge=1, le=12)
    exp_year: int = Field(..., ge=2024, le=2030)
    cvc: str = Field(..., min_length=3, max_length=4)
    name: str

class BankAccountToken(BaseModel):
    account_number: str
    routing_number: str
    account_holder_name: str
    account_holder_type: str = Field(..., pattern="^(individual|company)$")

# Payout schemas for providers
class PayoutCreate(BaseModel):
    provider_id: str
    amount: Decimal = Field(..., gt=0)
    currency: str = "usd"
    description: Optional[str] = None

class Payout(BaseModel):
    id: str
    provider_id: str
    amount: Decimal
    currency: str
    status: str
    created_at: datetime
    arrival_date: Optional[datetime] = None
    description: Optional[str] = None

# Fee calculation schemas
class FeeCalculation(BaseModel):
    amount: Decimal
    currency: str = "usd"
    fee_type: str = Field(..., description="platform, payment_processor, tax")
    region: Optional[str] = None

class FeeBreakdown(BaseModel):
    subtotal: Decimal
    platform_fee: Decimal
    payment_processing_fee: Decimal
    tax_amount: Decimal
    total: Decimal
    currency: str

# Analytics schemas
class RevenueAnalytics(BaseModel):
    period: str  # daily, weekly, monthly
    start_date: datetime
    end_date: datetime
    total_revenue: Decimal
    subscription_revenue: Decimal
    booking_revenue: Decimal
    refunds: Decimal
    net_revenue: Decimal
    growth_rate: Optional[Decimal] = None

class SubscriptionAnalytics(BaseModel):
    total_subscribers: int
    active_subscribers: int
    churned_subscribers: int
    new_subscribers: int
    churn_rate: Decimal
    average_revenue_per_user: Decimal
    lifetime_value: Decimal
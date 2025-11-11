"""
Payment Service Models - SQLAlchemy models for Stripe payments and subscriptions.
"""
import uuid
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey, DECIMAL, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Stripe data
    stripe_payment_intent_id = Column(String, unique=True, index=True)
    stripe_customer_id = Column(String, index=True)
    stripe_charge_id = Column(String, nullable=True)

    # Payment details
    user_id = Column(UUID(as_uuid=True), index=True)
    booking_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    amount = Column(DECIMAL(10, 2))
    currency = Column(String, default="usd")
    status = Column(String, default="pending")  # pending, succeeded, failed, cancelled, refunded
    payment_method = Column(String, nullable=True)  # card, bank_transfer, etc.

    # Refund information
    refunded_amount = Column(DECIMAL(10, 2), default=0)
    refunded_at = Column(DateTime, nullable=True)

    # Metadata
    description = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="payment")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Stripe data
    stripe_subscription_id = Column(String, unique=True, index=True)
    stripe_customer_id = Column(String, index=True)
    stripe_price_id = Column(String)

    # Subscription details
    user_id = Column(UUID(as_uuid=True), index=True)
    plan_type = Column(String)  # basic, premium, vip
    status = Column(String, default="incomplete")  # incomplete, active, past_due, cancelled

    # Billing cycle
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancel_at_period_end = Column(Boolean, default=False)
    cancelled_at = Column(DateTime, nullable=True)

    # Pricing
    amount = Column(DECIMAL(10, 2))
    currency = Column(String, default="usd")

    # Metadata
    metadata = Column(JSON, nullable=True)

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Stripe data
    stripe_invoice_id = Column(String, unique=True, index=True)
    stripe_customer_id = Column(String, index=True)

    # Invoice details
    user_id = Column(UUID(as_uuid=True), index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True)
    amount = Column(DECIMAL(10, 2))
    currency = Column(String, default="usd")
    status = Column(String, default="draft")  # draft, open, paid, void, uncollectible

    # Dates
    invoice_date = Column(DateTime, default=datetime.datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)

    # URLs
    invoice_url = Column(String, nullable=True)
    hosted_invoice_url = Column(String, nullable=True)

    # Relationships
    subscription = relationship("Subscription")

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Stripe data
    stripe_refund_id = Column(String, unique=True, index=True)
    stripe_payment_intent_id = Column(String, index=True)

    # Refund details
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"))
    user_id = Column(UUID(as_uuid=True), index=True)
    amount = Column(DECIMAL(10, 2))
    currency = Column(String, default="usd")
    reason = Column(String, nullable=True)  # duplicate, fraudulent, requested_by_customer
    status = Column(String, default="pending")  # pending, succeeded, failed, cancelled

    # Processing
    processed_at = Column(DateTime, nullable=True)

    # Relationships
    payment = relationship("Payment")

class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Stripe data
    stripe_payment_method_id = Column(String, unique=True, index=True)
    stripe_customer_id = Column(String, index=True)

    # Payment method details
    user_id = Column(UUID(as_uuid=True), index=True)
    type = Column(String)  # card, bank_account
    brand = Column(String, nullable=True)  # visa, mastercard, etc.
    last4 = Column(String, nullable=True)
    exp_month = Column(Integer, nullable=True)
    exp_year = Column(Integer, nullable=True)
    is_default = Column(Boolean, default=False)

    # Bank account fields (if applicable)
    bank_name = Column(String, nullable=True)
    account_holder_name = Column(String, nullable=True)

class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Stripe data
    stripe_coupon_id = Column(String, unique=True, index=True)

    # Coupon details
    code = Column(String, unique=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    discount_type = Column(String)  # percent, amount
    discount_value = Column(DECIMAL(10, 2))
    currency = Column(String, default="usd")

    # Validity
    valid_from = Column(DateTime, default=datetime.datetime.utcnow)
    valid_until = Column(DateTime, nullable=True)
    max_redemptions = Column(Integer, nullable=True)
    times_redeemed = Column(Integer, default=0)

    # Restrictions
    min_amount = Column(DECIMAL(10, 2), nullable=True)
    applicable_plans = Column(JSON, nullable=True)  # List of plan types this applies to

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Transaction details
    user_id = Column(UUID(as_uuid=True), index=True)
    type = Column(String)  # payment, refund, subscription, fee
    amount = Column(DECIMAL(10, 2))
    currency = Column(String, default="usd")
    status = Column(String, default="pending")

    # Related entities
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True)
    refund_id = Column(UUID(as_uuid=True), ForeignKey("refunds.id"), nullable=True)

    # External references
    stripe_event_id = Column(String, nullable=True)
    stripe_event_type = Column(String, nullable=True)

    # Metadata
    description = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)

    # Relationships
    payment = relationship("Payment")
    subscription = relationship("Subscription")
    refund = relationship("Refund")
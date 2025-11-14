"""
Payment Integration Tests
Tests for Stripe payment processing, subscriptions, and refunds
"""

import pytest
from unittest.mock import patch, Mock
from datetime import datetime, timedelta


@pytest.mark.integration
@pytest.mark.payment
@pytest.mark.stripe
class TestPaymentService:
    """Test payment service operations"""

    def test_create_payment_intent_success(
        self,
        client,
        mock_stripe,
        sample_payment_data,
        test_db_session
    ):
        """Test creating a payment intent"""
        from services.payment.models import Booking

        # Create a test booking
        booking = Booking(
            id=sample_payment_data["booking_id"],
            user_id=sample_payment_data["user_id"],
            provider_id="provider_123",
            status="pending"
        )
        test_db_session.add(booking)
        test_db_session.commit()

        response = client.post(
            "/api/v1/payment/create-payment-intent",
            json=sample_payment_data
        )

        assert response.status_code == 200
        data = response.json()
        assert "client_secret" in data
        assert "payment_intent_id" in data
        assert data["amount"] == 10000  # $100.00 in cents
        assert data["currency"] == "usd"

    def test_create_payment_intent_invalid_booking(
        self,
        client,
        mock_stripe,
        sample_payment_data
    ):
        """Test creating payment intent with nonexistent booking"""
        sample_payment_data["booking_id"] = "nonexistent_booking"

        response = client.post(
            "/api/v1/payment/create-payment-intent",
            json=sample_payment_data
        )

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_create_payment_intent_stripe_error(
        self,
        client,
        mock_stripe,
        sample_payment_data,
        test_db_session
    ):
        """Test payment intent creation with Stripe error"""
        from services.payment.models import Booking

        # Create booking
        booking = Booking(
            id=sample_payment_data["booking_id"],
            user_id=sample_payment_data["user_id"],
            provider_id="provider_123",
            status="pending"
        )
        test_db_session.add(booking)
        test_db_session.commit()

        # Mock Stripe error
        mock_stripe["payment_intent"].create.side_effect = Exception("Stripe API error")

        response = client.post(
            "/api/v1/payment/create-payment-intent",
            json=sample_payment_data
        )

        assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.payment
@pytest.mark.stripe
class TestSubscriptionService:
    """Test subscription management"""

    def test_create_subscription_success(
        self,
        client,
        mock_stripe,
        sample_subscription_data
    ):
        """Test creating a subscription"""
        response = client.post(
            "/api/v1/payment/create-subscription",
            json=sample_subscription_data
        )

        assert response.status_code == 200
        data = response.json()
        assert "subscription_id" in data
        assert "client_secret" in data
        assert data["status"] == "active"

    def test_create_subscription_creates_customer(
        self,
        client,
        mock_stripe,
        sample_subscription_data
    ):
        """Test that subscription creation also creates Stripe customer"""
        response = client.post(
            "/api/v1/payment/create-subscription",
            json=sample_subscription_data
        )

        assert response.status_code == 200
        # Verify customer creation was called
        mock_stripe["customer"].create.assert_called_once()

    def test_create_subscription_stores_in_db(
        self,
        client,
        mock_stripe,
        sample_subscription_data,
        test_db_session
    ):
        """Test that subscription is stored in database"""
        from services.payment.models import Subscription

        response = client.post(
            "/api/v1/payment/create-subscription",
            json=sample_subscription_data
        )

        assert response.status_code == 200

        # Check database
        subscription = test_db_session.query(Subscription).filter_by(
            user_id=sample_subscription_data["user_id"]
        ).first()

        assert subscription is not None
        assert subscription.plan_type == "premium"
        assert subscription.status == "active"

    def test_get_user_subscriptions(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test getting user's subscriptions"""
        from services.payment.models import Subscription

        user = create_test_user()

        # Create test subscriptions
        subscription = Subscription(
            id="sub_test_123",
            user_id=user.id,
            stripe_subscription_id="sub_stripe_123",
            stripe_customer_id="cus_stripe_123",
            status="active",
            plan_type="premium",
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        test_db_session.add(subscription)
        test_db_session.commit()

        response = client.get(f"/api/v1/payment/subscriptions/{user.id}")

        assert response.status_code == 200
        data = response.json()
        assert "subscriptions" in data
        assert len(data["subscriptions"]) > 0

    def test_cancel_subscription_success(
        self,
        client,
        mock_stripe,
        test_db_session,
        create_test_user
    ):
        """Test canceling a subscription"""
        from services.payment.models import Subscription

        user = create_test_user()

        # Create subscription
        subscription = Subscription(
            id="sub_to_cancel",
            user_id=user.id,
            stripe_subscription_id="sub_stripe_cancel",
            stripe_customer_id="cus_stripe_123",
            status="active",
            plan_type="premium",
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        test_db_session.add(subscription)
        test_db_session.commit()

        response = client.delete(
            f"/api/v1/payment/subscriptions/sub_stripe_cancel"
        )

        assert response.status_code == 200
        assert "cancelled" in response.json()["message"].lower()

        # Verify status in database
        test_db_session.refresh(subscription)
        assert subscription.status == "cancelled"
        assert subscription.cancelled_at is not None

    def test_cancel_nonexistent_subscription(
        self,
        client,
        mock_stripe
    ):
        """Test canceling a nonexistent subscription"""
        response = client.delete(
            "/api/v1/payment/subscriptions/nonexistent_sub"
        )

        assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.payment
@pytest.mark.stripe
class TestRefundService:
    """Test refund processing"""

    def test_refund_payment_success(
        self,
        client,
        mock_stripe,
        test_db_session,
        create_test_user
    ):
        """Test successful refund"""
        from services.payment.models import Payment

        user = create_test_user()

        # Create payment
        payment = Payment(
            id="payment_to_refund",
            user_id=user.id,
            stripe_payment_intent_id="pi_stripe_123",
            amount=10000,
            currency="usd",
            status="succeeded"
        )
        test_db_session.add(payment)
        test_db_session.commit()

        refund_data = {
            "payment_id": "payment_to_refund"
        }

        response = client.post(
            "/api/v1/payment/refund",
            json=refund_data
        )

        assert response.status_code == 200
        data = response.json()
        assert "refund_id" in data
        assert data["status"] == "succeeded"

        # Verify payment status updated
        test_db_session.refresh(payment)
        assert payment.status == "refunded"
        assert payment.refunded_at is not None

    def test_refund_partial_amount(
        self,
        client,
        mock_stripe,
        test_db_session,
        create_test_user
    ):
        """Test partial refund"""
        from services.payment.models import Payment

        user = create_test_user()

        payment = Payment(
            id="payment_partial_refund",
            user_id=user.id,
            stripe_payment_intent_id="pi_stripe_456",
            amount=10000,
            currency="usd",
            status="succeeded"
        )
        test_db_session.add(payment)
        test_db_session.commit()

        refund_data = {
            "payment_id": "payment_partial_refund",
            "amount": 50.00  # Partial refund
        }

        response = client.post(
            "/api/v1/payment/refund",
            json=refund_data
        )

        assert response.status_code == 200

    def test_refund_invalid_payment(
        self,
        client,
        mock_stripe
    ):
        """Test refunding nonexistent payment"""
        refund_data = {
            "payment_id": "nonexistent_payment"
        }

        response = client.post(
            "/api/v1/payment/refund",
            json=refund_data
        )

        assert response.status_code == 404

    def test_refund_already_refunded(
        self,
        client,
        mock_stripe,
        test_db_session,
        create_test_user
    ):
        """Test refunding an already refunded payment"""
        from services.payment.models import Payment

        user = create_test_user()

        payment = Payment(
            id="payment_already_refunded",
            user_id=user.id,
            stripe_payment_intent_id="pi_stripe_789",
            amount=10000,
            currency="usd",
            status="refunded"  # Already refunded
        )
        test_db_session.add(payment)
        test_db_session.commit()

        refund_data = {
            "payment_id": "payment_already_refunded"
        }

        response = client.post(
            "/api/v1/payment/refund",
            json=refund_data
        )

        assert response.status_code == 400
        assert "not eligible" in response.json()["detail"].lower()


@pytest.mark.integration
@pytest.mark.payment
@pytest.mark.stripe
class TestStripeWebhooks:
    """Test Stripe webhook handling"""

    def test_webhook_payment_succeeded(
        self,
        client,
        mock_stripe
    ):
        """Test handling payment_intent.succeeded webhook"""
        webhook_data = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_webhook_123",
                    "amount": 10000,
                    "currency": "usd"
                }
            }
        }

        response = client.post(
            "/api/v1/payment/webhook",
            json=webhook_data,
            headers={"stripe-signature": "test_signature"}
        )

        assert response.status_code == 200
        assert response.json()["status"] == "success"

    def test_webhook_payment_failed(
        self,
        client,
        mock_stripe
    ):
        """Test handling payment_intent.payment_failed webhook"""
        webhook_data = {
            "type": "payment_intent.payment_failed",
            "data": {
                "object": {
                    "id": "pi_webhook_failed",
                    "amount": 10000,
                    "currency": "usd"
                }
            }
        }

        response = client.post(
            "/api/v1/payment/webhook",
            json=webhook_data,
            headers={"stripe-signature": "test_signature"}
        )

        assert response.status_code == 200

    def test_webhook_subscription_payment(
        self,
        client,
        mock_stripe
    ):
        """Test handling invoice.payment_succeeded webhook"""
        webhook_data = {
            "type": "invoice.payment_succeeded",
            "data": {
                "object": {
                    "subscription": "sub_webhook_123",
                    "amount_paid": 2000
                }
            }
        }

        response = client.post(
            "/api/v1/payment/webhook",
            json=webhook_data,
            headers={"stripe-signature": "test_signature"}
        )

        assert response.status_code == 200

    def test_webhook_subscription_cancelled(
        self,
        client,
        mock_stripe
    ):
        """Test handling customer.subscription.deleted webhook"""
        webhook_data = {
            "type": "customer.subscription.deleted",
            "data": {
                "object": {
                    "id": "sub_cancelled_123"
                }
            }
        }

        response = client.post(
            "/api/v1/payment/webhook",
            json=webhook_data,
            headers={"stripe-signature": "test_signature"}
        )

        assert response.status_code == 200

    def test_webhook_invalid_signature(
        self,
        client,
        mock_stripe
    ):
        """Test webhook with invalid signature"""
        # Mock signature verification failure
        mock_stripe["webhook"].construct_event.side_effect = Exception(
            "Invalid signature"
        )

        webhook_data = {"type": "payment_intent.succeeded"}

        response = client.post(
            "/api/v1/payment/webhook",
            json=webhook_data,
            headers={"stripe-signature": "invalid_signature"}
        )

        assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.payment
class TestPaymentMethods:
    """Test payment method management"""

    def test_get_payment_methods(
        self,
        client,
        mock_stripe
    ):
        """Test getting user's payment methods"""
        response = client.get("/api/v1/payment/payment-methods/user_123")

        assert response.status_code == 200
        data = response.json()
        assert "payment_methods" in data

    def test_create_setup_intent(
        self,
        client,
        mock_stripe
    ):
        """Test creating setup intent for saving payment method"""
        response = client.post(
            "/api/v1/payment/setup-intent",
            params={"user_id": "user_123"}
        )

        assert response.status_code == 200
        data = response.json()
        assert "client_secret" in data
        assert "setup_intent_id" in data


@pytest.mark.integration
@pytest.mark.payment
class TestPaymentHealthCheck:
    """Test payment service health"""

    def test_payment_health_check(self, client, mock_stripe):
        """Test payment service health endpoint"""
        with patch.dict("os.environ", {"STRIPE_SECRET_KEY": "sk_test_key"}):
            response = client.get("/api/v1/payment/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "healthy"
            assert data["service"] == "zenith-payment"
            assert "stripe_connected" in data

"""
Pytest Configuration and Fixtures
Comprehensive test fixtures for Zenith User Service
"""

import os
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from httpx import AsyncClient
import redis
from elasticsearch import Elasticsearch

# Set test environment variables
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_mock_key"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test_mock_secret"
os.environ["TWILIO_ACCOUNT_SID"] = "test_account_sid"
os.environ["TWILIO_AUTH_TOKEN"] = "test_auth_token"
os.environ["TWILIO_PHONE_NUMBER"] = "+1234567890"
os.environ["ELASTICSEARCH_HOSTS"] = "http://localhost:9200"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_KEY"] = "test_key"
os.environ["PASSWORD_SALT"] = "test_salt"
os.environ["FRONTEND_URL"] = "http://localhost:3000"

# Import after environment setup
from core.database import Base, get_db
from main import app


# ============================================================================
# Session Scope Fixtures (Run Once Per Test Session)
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# Database Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def test_db_engine():
    """Create a test database engine with in-memory SQLite"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(scope="function")
def test_db_session(test_db_engine) -> Generator[Session, None, None]:
    """Create a test database session"""
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=test_db_engine
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture(scope="function")
def override_get_db(test_db_session):
    """Override the get_db dependency"""
    def _override_get_db():
        try:
            yield test_db_session
        finally:
            pass
    return _override_get_db


# ============================================================================
# FastAPI Test Client Fixtures
# ============================================================================

@pytest.fixture(scope="function")
def client(override_get_db) -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI app"""
    from core.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
async def async_client(override_get_db) -> AsyncGenerator[AsyncClient, None]:
    """Create an async test client for the FastAPI app"""
    from core.database import get_db

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ============================================================================
# Mock External Services
# ============================================================================

@pytest.fixture(scope="function")
def mock_stripe():
    """Mock Stripe API"""
    with patch("stripe.PaymentIntent") as mock_payment_intent, \
         patch("stripe.Customer") as mock_customer, \
         patch("stripe.Subscription") as mock_subscription, \
         patch("stripe.Refund") as mock_refund, \
         patch("stripe.SetupIntent") as mock_setup_intent, \
         patch("stripe.Webhook") as mock_webhook:

        # Mock PaymentIntent
        mock_payment_intent.create.return_value = Mock(
            id="pi_test_123",
            client_secret="pi_test_123_secret",
            amount=10000,
            currency="usd",
            status="requires_payment_method"
        )

        # Mock Customer
        mock_customer.create.return_value = Mock(
            id="cus_test_123",
            email="test@example.com",
            name="Test User"
        )

        # Mock Subscription
        mock_subscription_obj = Mock(
            id="sub_test_123",
            status="active",
            latest_invoice=Mock(
                payment_intent=Mock(
                    client_secret="pi_test_subscription_secret"
                )
            )
        )
        mock_subscription.create.return_value = mock_subscription_obj
        mock_subscription.delete.return_value = Mock(status="canceled")

        # Mock Refund
        mock_refund.create.return_value = Mock(
            id="re_test_123",
            status="succeeded",
            amount=10000
        )

        # Mock SetupIntent
        mock_setup_intent.create.return_value = Mock(
            id="seti_test_123",
            client_secret="seti_test_123_secret"
        )

        # Mock Webhook
        mock_webhook.construct_event.return_value = Mock(
            type="payment_intent.succeeded",
            data=Mock(object=Mock(id="pi_test_123"))
        )

        yield {
            "payment_intent": mock_payment_intent,
            "customer": mock_customer,
            "subscription": mock_subscription,
            "refund": mock_refund,
            "setup_intent": mock_setup_intent,
            "webhook": mock_webhook
        }


@pytest.fixture(scope="function")
def mock_twilio():
    """Mock Twilio API"""
    with patch("twilio.rest.Client") as mock_client:
        mock_messages = Mock()
        mock_messages.create.return_value = Mock(
            sid="SM_test_123",
            status="sent",
            to="+1234567890",
            body="Test SMS"
        )

        mock_verify = Mock()
        mock_verify.verifications.create.return_value = Mock(
            sid="VE_test_123",
            status="pending"
        )
        mock_verify.verification_checks.create.return_value = Mock(
            sid="VE_test_123",
            status="approved"
        )

        mock_client_instance = Mock()
        mock_client_instance.messages = mock_messages
        mock_client_instance.verify.v2.services.return_value = mock_verify
        mock_client.return_value = mock_client_instance

        yield mock_client


@pytest.fixture(scope="function")
def mock_elasticsearch():
    """Mock Elasticsearch client"""
    with patch("elasticsearch.Elasticsearch") as mock_es:
        mock_es_instance = Mock(spec=Elasticsearch)

        # Mock info method
        mock_es_instance.info.return_value = {
            "version": {"number": "8.10.0"}
        }

        # Mock indices
        mock_es_instance.indices.exists.return_value = False
        mock_es_instance.indices.create.return_value = {"acknowledged": True}

        # Mock index method
        mock_es_instance.index.return_value = {
            "_id": "test_id",
            "_index": "test_index",
            "result": "created"
        }

        # Mock search method
        mock_es_instance.search.return_value = {
            "hits": {
                "total": {"value": 2},
                "hits": [
                    {
                        "_id": "user_1",
                        "_score": 1.5,
                        "_source": {
                            "id": "user_1",
                            "full_name": "John Doe",
                            "age": 30,
                            "gender": "male",
                            "bio": "Test bio",
                            "is_verified": True,
                            "is_online": True
                        }
                    },
                    {
                        "_id": "user_2",
                        "_score": 1.2,
                        "_source": {
                            "id": "user_2",
                            "full_name": "Jane Smith",
                            "age": 28,
                            "gender": "female",
                            "bio": "Test bio 2",
                            "is_verified": True,
                            "is_online": False
                        }
                    }
                ]
            },
            "took": 5,
            "timed_out": False
        }

        # Mock delete method
        mock_es_instance.delete.return_value = {"result": "deleted"}

        # Mock bulk method
        mock_es_instance.bulk.return_value = {
            "took": 10,
            "errors": False
        }

        mock_es.return_value = mock_es_instance
        yield mock_es_instance


@pytest.fixture(scope="function")
def mock_redis():
    """Mock Redis client"""
    with patch("redis.Redis") as mock_redis_client:
        mock_redis_instance = Mock(spec=redis.Redis)

        # Mock common Redis operations
        mock_redis_instance.get.return_value = None
        mock_redis_instance.set.return_value = True
        mock_redis_instance.delete.return_value = 1
        mock_redis_instance.exists.return_value = False
        mock_redis_instance.expire.return_value = True
        mock_redis_instance.ttl.return_value = -1
        mock_redis_instance.incr.return_value = 1
        mock_redis_instance.decr.return_value = 0

        mock_redis_client.return_value = mock_redis_instance
        yield mock_redis_instance


@pytest.fixture(scope="function")
def mock_supabase():
    """Mock Supabase client"""
    with patch("supabase.create_client") as mock_create_client:
        mock_supabase_client = Mock()

        # Mock auth methods
        mock_auth = Mock()

        # Mock sign_up
        mock_auth.sign_up.return_value = Mock(
            user=Mock(
                id="test_user_123",
                email="test@example.com",
                model_dump=lambda: {
                    "id": "test_user_123",
                    "email": "test@example.com"
                }
            ),
            session=Mock(
                access_token="test_access_token",
                refresh_token="test_refresh_token"
            )
        )

        # Mock sign_in_with_password
        mock_auth.sign_in_with_password.return_value = Mock(
            user=Mock(id="test_user_123", email="test@example.com"),
            session=Mock(
                access_token="test_access_token",
                refresh_token="test_refresh_token"
            )
        )

        # Mock get_user
        mock_auth.get_user.return_value = Mock(
            user=Mock(
                id="test_user_123",
                email="test@example.com",
                model_dump=lambda: {
                    "id": "test_user_123",
                    "email": "test@example.com"
                }
            )
        )

        # Mock sign_out
        mock_auth.sign_out.return_value = None

        mock_supabase_client.auth = mock_auth
        mock_create_client.return_value = mock_supabase_client

        yield mock_supabase_client


@pytest.fixture(scope="function")
def mock_email_service():
    """Mock email service"""
    with patch("services.auth.router.send_email") as mock_send:
        mock_send.return_value = True
        yield mock_send


# ============================================================================
# Test Data Fixtures
# ============================================================================

@pytest.fixture
def sample_user_data():
    """Sample user data for tests"""
    return {
        "email": "test@example.com",
        "password": "SecurePassword123!",
        "role": "user"
    }


@pytest.fixture
def sample_user_login():
    """Sample login credentials"""
    return {
        "email": "test@example.com",
        "password": "SecurePassword123!",
        "remember_me": False
    }


@pytest.fixture
def sample_payment_data():
    """Sample payment data"""
    return {
        "booking_id": "booking_123",
        "user_id": "user_123",
        "amount": 100.00,
        "currency": "usd"
    }


@pytest.fixture
def sample_subscription_data():
    """Sample subscription data"""
    return {
        "user_id": "user_123",
        "email": "test@example.com",
        "name": "Test User",
        "price_id": "price_test_123",
        "plan_type": "premium"
    }


@pytest.fixture
def sample_message_data():
    """Sample chat message data"""
    return {
        "sender_id": "user_123",
        "receiver_id": "user_456",
        "content": "Hello, this is a test message!",
        "message_type": "text",
        "conversation_id": "conv_123"
    }


@pytest.fixture
def sample_search_filters():
    """Sample search filters"""
    return {
        "age_min": 25,
        "age_max": 35,
        "gender": ["female"],
        "verified_only": True,
        "online_only": False
    }


@pytest.fixture
def auth_headers():
    """Authentication headers for protected endpoints"""
    return {
        "Authorization": "Bearer test_access_token",
        "X-Session-Token": "test_session_token"
    }


@pytest.fixture
def create_test_user(test_db_session):
    """Helper fixture to create a test user"""
    def _create_user(**kwargs):
        from services.auth.models import User
        from services.auth.router import hash_password

        default_data = {
            "id": "test_user_123",
            "email": "test@example.com",
            "password_hash": hash_password("SecurePassword123!"),
            "role": "user",
            "is_active": True,
            "is_verified": True,
            "two_factor_enabled": False,
            "login_attempts": 0
        }
        default_data.update(kwargs)

        user = User(**default_data)
        test_db_session.add(user)
        test_db_session.commit()
        test_db_session.refresh(user)
        return user

    return _create_user


@pytest.fixture
def create_test_conversation(test_db_session):
    """Helper fixture to create a test conversation"""
    def _create_conversation(**kwargs):
        from services.chat.models import Conversation, ConversationParticipant

        default_data = {
            "id": "conv_123",
            "type": "direct",
            "name": None,
            "is_active": True
        }
        default_data.update(kwargs)

        conversation = Conversation(**default_data)
        test_db_session.add(conversation)
        test_db_session.flush()

        # Add participants if provided
        if "participant_ids" in kwargs:
            for participant_id in kwargs["participant_ids"]:
                participant = ConversationParticipant(
                    conversation_id=conversation.id,
                    user_id=participant_id,
                    is_active=True
                )
                test_db_session.add(participant)

        test_db_session.commit()
        test_db_session.refresh(conversation)
        return conversation

    return _create_conversation


# ============================================================================
# Utility Fixtures
# ============================================================================

@pytest.fixture
def mock_datetime():
    """Mock datetime for consistent testing"""
    with patch("datetime.datetime") as mock_dt:
        mock_dt.utcnow.return_value = datetime(2024, 1, 1, 12, 0, 0)
        mock_dt.now.return_value = datetime(2024, 1, 1, 12, 0, 0)
        yield mock_dt


@pytest.fixture
def mock_uuid():
    """Mock UUID generation for consistent testing"""
    with patch("uuid.uuid4") as mock_uuid4:
        mock_uuid4.return_value = Mock(hex="test-uuid-123")
        yield mock_uuid4


@pytest.fixture
def mock_secrets():
    """Mock secrets generation"""
    with patch("secrets.token_urlsafe") as mock_token:
        mock_token.return_value = "test_secure_token_123"
        yield mock_token


# ============================================================================
# Cleanup Fixtures
# ============================================================================

@pytest.fixture(autouse=True)
def cleanup_after_test():
    """Cleanup after each test"""
    yield
    # Add any cleanup logic here
    pass

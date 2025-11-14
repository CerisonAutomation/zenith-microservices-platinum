"""
Database Tests
Tests for database connections, models, queries, and session management
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from services.auth.models import User, UserSession, GDPRConsent, PasswordHistory
from services.chat.models import (
    Conversation, ConversationParticipant, Message,
    MessageReaction, BlockedConversation, MessageReport
)
from services.payment.models import Subscription, Payment, Booking


@pytest.mark.unit
@pytest.mark.database
class TestDatabaseConnection:
    """Test database connection and configuration"""

    def test_db_engine_creation(self, test_db_engine):
        """Test that database engine is created successfully"""
        assert test_db_engine is not None
        assert test_db_engine.url.database == ":memory:"

    def test_db_session_creation(self, test_db_session):
        """Test that database session is created successfully"""
        assert test_db_session is not None
        assert test_db_session.is_active

    def test_db_connection(self, test_db_session):
        """Test basic database connectivity"""
        result = test_db_session.execute(text("SELECT 1"))
        assert result.scalar() == 1

    def test_db_transaction_rollback(self, test_db_session):
        """Test database transaction rollback"""
        user = User(
            id="test_rollback_user",
            email="rollback@example.com",
            password_hash="test_hash",
            role="user"
        )
        test_db_session.add(user)
        test_db_session.rollback()

        # User should not exist after rollback
        result = test_db_session.query(User).filter_by(
            id="test_rollback_user"
        ).first()
        assert result is None


@pytest.mark.unit
@pytest.mark.database
class TestUserModel:
    """Test User model operations"""

    def test_create_user(self, test_db_session):
        """Test creating a user"""
        user = User(
            id="user_123",
            email="test@example.com",
            password_hash="hashed_password",
            role="user",
            is_active=True,
            is_verified=False
        )

        test_db_session.add(user)
        test_db_session.commit()

        # Retrieve and verify
        saved_user = test_db_session.query(User).filter_by(id="user_123").first()
        assert saved_user is not None
        assert saved_user.email == "test@example.com"
        assert saved_user.role == "user"
        assert saved_user.is_active is True
        assert saved_user.is_verified is False

    def test_user_unique_email_constraint(self, test_db_session):
        """Test that email must be unique"""
        user1 = User(
            id="user_1",
            email="duplicate@example.com",
            password_hash="hash1",
            role="user"
        )
        user2 = User(
            id="user_2",
            email="duplicate@example.com",
            password_hash="hash2",
            role="user"
        )

        test_db_session.add(user1)
        test_db_session.commit()

        test_db_session.add(user2)
        with pytest.raises(IntegrityError):
            test_db_session.commit()
        test_db_session.rollback()

    def test_user_default_values(self, test_db_session):
        """Test user model default values"""
        user = User(
            id="user_defaults",
            email="defaults@example.com",
            password_hash="hash"
        )

        test_db_session.add(user)
        test_db_session.commit()
        test_db_session.refresh(user)

        assert user.role == "user"
        assert user.is_active is True
        assert user.is_verified is False
        assert user.two_factor_enabled is False
        assert user.login_attempts == 0
        assert user.created_at is not None

    def test_user_password_hashing(self):
        """Test password hashing utility"""
        from services.auth.router import hash_password, verify_password

        password = "SecurePassword123!"
        hashed = hash_password(password)

        assert hashed != password
        assert len(hashed) > 0
        assert verify_password(password, hashed) is True
        assert verify_password("WrongPassword", hashed) is False

    def test_user_relationships(self, test_db_session):
        """Test user relationships with sessions and consents"""
        user = User(
            id="user_relationships",
            email="relations@example.com",
            password_hash="hash",
            role="user"
        )
        test_db_session.add(user)
        test_db_session.commit()

        # Add session
        session = UserSession(
            id="session_1",
            user_id=user.id,
            session_token="token_123",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        test_db_session.add(session)

        # Add consent
        consent = GDPRConsent(
            user_id=user.id,
            consent_type="necessary",
            consented=True,
            ip_address="127.0.0.1"
        )
        test_db_session.add(consent)
        test_db_session.commit()

        # Test relationships
        test_db_session.refresh(user)
        assert len(user.sessions) == 1
        assert len(user.consents) == 1
        assert user.sessions[0].session_token == "token_123"
        assert user.consents[0].consent_type == "necessary"


@pytest.mark.unit
@pytest.mark.database
class TestUserSessionModel:
    """Test UserSession model operations"""

    def test_create_session(self, test_db_session, create_test_user):
        """Test creating a user session"""
        user = create_test_user()

        session = UserSession(
            id="session_test",
            user_id=user.id,
            session_token="unique_token_123",
            device_info="Mozilla/5.0",
            ip_address="192.168.1.1",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(days=1)
        )

        test_db_session.add(session)
        test_db_session.commit()

        # Retrieve and verify
        saved_session = test_db_session.query(UserSession).filter_by(
            id="session_test"
        ).first()
        assert saved_session is not None
        assert saved_session.user_id == user.id
        assert saved_session.is_active is True

    def test_session_expiry(self, test_db_session, create_test_user):
        """Test querying expired sessions"""
        user = create_test_user()

        # Active session
        active_session = UserSession(
            id="active_session",
            user_id=user.id,
            session_token="active_token",
            is_active=True,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )

        # Expired session
        expired_session = UserSession(
            id="expired_session",
            user_id=user.id,
            session_token="expired_token",
            is_active=True,
            expires_at=datetime.utcnow() - timedelta(hours=1)
        )

        test_db_session.add(active_session)
        test_db_session.add(expired_session)
        test_db_session.commit()

        # Query active, non-expired sessions
        active_sessions = test_db_session.query(UserSession).filter(
            UserSession.user_id == user.id,
            UserSession.is_active == True,
            UserSession.expires_at > datetime.utcnow()
        ).all()

        assert len(active_sessions) == 1
        assert active_sessions[0].id == "active_session"


@pytest.mark.unit
@pytest.mark.database
class TestGDPRConsentModel:
    """Test GDPR consent model operations"""

    def test_create_consent(self, test_db_session, create_test_user):
        """Test creating GDPR consent record"""
        user = create_test_user()

        consent = GDPRConsent(
            user_id=user.id,
            consent_type="marketing",
            consented=True,
            ip_address="192.168.1.1",
            user_agent="Test Browser"
        )

        test_db_session.add(consent)
        test_db_session.commit()

        # Retrieve and verify
        saved_consent = test_db_session.query(GDPRConsent).filter_by(
            user_id=user.id,
            consent_type="marketing"
        ).first()

        assert saved_consent is not None
        assert saved_consent.consented is True
        assert saved_consent.consent_date is not None

    def test_multiple_consent_types(self, test_db_session, create_test_user):
        """Test storing multiple consent types for a user"""
        user = create_test_user()

        consent_types = ["necessary", "marketing", "analytics"]
        for consent_type in consent_types:
            consent = GDPRConsent(
                user_id=user.id,
                consent_type=consent_type,
                consented=True,
                ip_address="192.168.1.1"
            )
            test_db_session.add(consent)

        test_db_session.commit()

        # Query all consents
        consents = test_db_session.query(GDPRConsent).filter_by(
            user_id=user.id
        ).all()

        assert len(consents) == 3
        consent_type_list = [c.consent_type for c in consents]
        assert set(consent_type_list) == set(consent_types)


@pytest.mark.unit
@pytest.mark.database
class TestPasswordHistoryModel:
    """Test password history model operations"""

    def test_create_password_history(self, test_db_session, create_test_user):
        """Test creating password history record"""
        user = create_test_user()

        history = PasswordHistory(
            user_id=user.id,
            password_hash="old_password_hash"
        )

        test_db_session.add(history)
        test_db_session.commit()

        # Retrieve and verify
        saved_history = test_db_session.query(PasswordHistory).filter_by(
            user_id=user.id
        ).first()

        assert saved_history is not None
        assert saved_history.password_hash == "old_password_hash"
        assert saved_history.created_at is not None

    def test_multiple_password_history(self, test_db_session, create_test_user):
        """Test storing multiple password history records"""
        user = create_test_user()

        # Create multiple history entries
        for i in range(3):
            history = PasswordHistory(
                user_id=user.id,
                password_hash=f"password_hash_{i}"
            )
            test_db_session.add(history)

        test_db_session.commit()

        # Query all history
        history_records = test_db_session.query(PasswordHistory).filter_by(
            user_id=user.id
        ).order_by(PasswordHistory.created_at).all()

        assert len(history_records) == 3


@pytest.mark.unit
@pytest.mark.database
class TestConversationModel:
    """Test conversation model operations"""

    def test_create_conversation(self, test_db_session):
        """Test creating a conversation"""
        conversation = Conversation(
            id="conv_123",
            type="direct",
            name=None,
            is_active=True
        )

        test_db_session.add(conversation)
        test_db_session.commit()

        # Retrieve and verify
        saved_conv = test_db_session.query(Conversation).filter_by(
            id="conv_123"
        ).first()

        assert saved_conv is not None
        assert saved_conv.type == "direct"
        assert saved_conv.is_active is True

    def test_conversation_participants(self, test_db_session, create_test_user):
        """Test conversation with participants"""
        user1 = create_test_user(id="user_1", email="user1@example.com")
        user2 = create_test_user(id="user_2", email="user2@example.com")

        conversation = Conversation(
            id="conv_with_participants",
            type="direct",
            is_active=True
        )
        test_db_session.add(conversation)
        test_db_session.flush()

        # Add participants
        participant1 = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user1.id,
            role="owner",
            is_active=True
        )
        participant2 = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user2.id,
            role="member",
            is_active=True
        )

        test_db_session.add(participant1)
        test_db_session.add(participant2)
        test_db_session.commit()

        # Verify participants
        participants = test_db_session.query(ConversationParticipant).filter_by(
            conversation_id=conversation.id
        ).all()

        assert len(participants) == 2


@pytest.mark.unit
@pytest.mark.database
class TestMessageModel:
    """Test message model operations"""

    def test_create_message(self, test_db_session, create_test_user):
        """Test creating a message"""
        sender = create_test_user(id="sender_1", email="sender@example.com")
        receiver = create_test_user(id="receiver_1", email="receiver@example.com")

        message = Message(
            id="msg_123",
            sender_id=sender.id,
            receiver_id=receiver.id,
            content="Hello, World!",
            message_type="text",
            is_delivered=True,
            is_read=False,
            conversation_id="conv_123"
        )

        test_db_session.add(message)
        test_db_session.commit()

        # Retrieve and verify
        saved_message = test_db_session.query(Message).filter_by(
            id="msg_123"
        ).first()

        assert saved_message is not None
        assert saved_message.content == "Hello, World!"
        assert saved_message.is_delivered is True
        assert saved_message.is_read is False

    def test_message_reactions(self, test_db_session, create_test_user):
        """Test message reactions"""
        sender = create_test_user(id="sender_2", email="sender2@example.com")
        receiver = create_test_user(id="receiver_2", email="receiver2@example.com")

        message = Message(
            id="msg_reactions",
            sender_id=sender.id,
            receiver_id=receiver.id,
            content="Test message",
            message_type="text",
            conversation_id="conv_123"
        )
        test_db_session.add(message)
        test_db_session.flush()

        # Add reaction
        reaction = MessageReaction(
            message_id=message.id,
            user_id=receiver.id,
            reaction="❤️"
        )
        test_db_session.add(reaction)
        test_db_session.commit()

        # Query reactions
        reactions = test_db_session.query(MessageReaction).filter_by(
            message_id=message.id
        ).all()

        assert len(reactions) == 1
        assert reactions[0].reaction == "❤️"


@pytest.mark.unit
@pytest.mark.database
class TestPaymentModels:
    """Test payment-related model operations"""

    def test_create_subscription(self, test_db_session, create_test_user):
        """Test creating a subscription"""
        user = create_test_user()

        subscription = Subscription(
            id="sub_123",
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

        # Retrieve and verify
        saved_sub = test_db_session.query(Subscription).filter_by(
            id="sub_123"
        ).first()

        assert saved_sub is not None
        assert saved_sub.status == "active"
        assert saved_sub.plan_type == "premium"

    def test_create_payment(self, test_db_session, create_test_user):
        """Test creating a payment record"""
        user = create_test_user()

        payment = Payment(
            id="payment_123",
            user_id=user.id,
            stripe_payment_intent_id="pi_stripe_123",
            amount=10000,  # $100.00 in cents
            currency="usd",
            status="succeeded"
        )

        test_db_session.add(payment)
        test_db_session.commit()

        # Retrieve and verify
        saved_payment = test_db_session.query(Payment).filter_by(
            id="payment_123"
        ).first()

        assert saved_payment is not None
        assert saved_payment.amount == 10000
        assert saved_payment.status == "succeeded"


@pytest.mark.unit
@pytest.mark.database
class TestDatabaseQueries:
    """Test complex database queries"""

    def test_query_active_users(self, test_db_session):
        """Test querying active users"""
        # Create test users
        active_user = User(
            id="active_1",
            email="active@example.com",
            password_hash="hash",
            is_active=True
        )
        inactive_user = User(
            id="inactive_1",
            email="inactive@example.com",
            password_hash="hash",
            is_active=False
        )

        test_db_session.add(active_user)
        test_db_session.add(inactive_user)
        test_db_session.commit()

        # Query active users
        active_users = test_db_session.query(User).filter(
            User.is_active == True
        ).all()

        assert len(active_users) >= 1
        assert all(user.is_active for user in active_users)

    def test_query_verified_users(self, test_db_session):
        """Test querying verified users"""
        verified_user = User(
            id="verified_1",
            email="verified@example.com",
            password_hash="hash",
            is_verified=True
        )
        unverified_user = User(
            id="unverified_1",
            email="unverified@example.com",
            password_hash="hash",
            is_verified=False
        )

        test_db_session.add(verified_user)
        test_db_session.add(unverified_user)
        test_db_session.commit()

        # Query verified users
        verified_users = test_db_session.query(User).filter(
            User.is_verified == True
        ).all()

        assert len(verified_users) >= 1
        assert all(user.is_verified for user in verified_users)

    def test_query_users_with_2fa(self, test_db_session):
        """Test querying users with 2FA enabled"""
        user_with_2fa = User(
            id="2fa_user",
            email="2fa@example.com",
            password_hash="hash",
            two_factor_enabled=True
        )
        user_without_2fa = User(
            id="no_2fa_user",
            email="no2fa@example.com",
            password_hash="hash",
            two_factor_enabled=False
        )

        test_db_session.add(user_with_2fa)
        test_db_session.add(user_without_2fa)
        test_db_session.commit()

        # Query users with 2FA
        users_with_2fa = test_db_session.query(User).filter(
            User.two_factor_enabled == True
        ).all()

        assert len(users_with_2fa) >= 1
        assert all(user.two_factor_enabled for user in users_with_2fa)

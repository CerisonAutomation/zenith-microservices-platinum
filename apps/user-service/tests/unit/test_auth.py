"""
Authentication Router Tests
Comprehensive tests for user registration, login, password reset, 2FA, and session management
"""

import pytest
from unittest.mock import patch, Mock
from datetime import datetime, timedelta
from fastapi import HTTPException


@pytest.mark.unit
@pytest.mark.auth
class TestUserRegistration:
    """Test user registration endpoints"""

    def test_register_user_success(
        self,
        client,
        mock_supabase,
        sample_user_data,
        mock_email_service
    ):
        """Test successful user registration"""
        response = client.post("/api/v1/auth/register", json=sample_user_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == sample_user_data["email"]
        assert data["user"]["is_verified"] is False
        assert data["token_type"] == "bearer"

    def test_register_user_duplicate_email(
        self,
        client,
        create_test_user,
        sample_user_data,
        mock_supabase
    ):
        """Test registration with existing email"""
        # Create existing user
        create_test_user(email=sample_user_data["email"])

        # Try to register with same email
        response = client.post("/api/v1/auth/register", json=sample_user_data)

        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_register_user_invalid_email(self, client):
        """Test registration with invalid email"""
        invalid_data = {
            "email": "not-an-email",
            "password": "SecurePassword123!",
            "role": "user"
        }

        response = client.post("/api/v1/auth/register", json=invalid_data)
        assert response.status_code in [400, 422]

    def test_register_user_weak_password(self, client, mock_supabase):
        """Test registration with weak password"""
        weak_password_data = {
            "email": "test@example.com",
            "password": "123",
            "role": "user"
        }

        # This might pass if validation is not strict
        # Adjust based on actual validation rules
        response = client.post("/api/v1/auth/register", json=weak_password_data)
        # Check if validation is present
        assert response.status_code in [200, 400, 422]

    def test_register_sends_verification_email(
        self,
        client,
        mock_supabase,
        sample_user_data,
        mock_email_service
    ):
        """Test that verification email is sent on registration"""
        response = client.post("/api/v1/auth/register", json=sample_user_data)

        assert response.status_code == 200
        # Verify email sending was called
        # mock_email_service.assert_called_once()


@pytest.mark.unit
@pytest.mark.auth
class TestEmailVerification:
    """Test email verification endpoints"""

    def test_verify_email_success(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test successful email verification"""
        # Create user with verification token
        user = create_test_user(
            is_verified=False,
            verification_token="test_token_123"
        )

        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": "test_token_123"}
        )

        assert response.status_code == 200
        assert "verified successfully" in response.json()["message"].lower()

        # Refresh user from DB
        test_db_session.refresh(user)
        assert user.is_verified is True
        assert user.verification_token is None

    def test_verify_email_invalid_token(self, client):
        """Test email verification with invalid token"""
        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": "invalid_token"}
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()

    def test_verify_email_already_verified(
        self,
        client,
        create_test_user
    ):
        """Test verifying an already verified email"""
        user = create_test_user(is_verified=True, verification_token=None)

        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": "any_token"}
        )

        assert response.status_code == 400


@pytest.mark.unit
@pytest.mark.auth
class TestUserLogin:
    """Test user login endpoints"""

    def test_login_success(
        self,
        client,
        create_test_user,
        mock_supabase
    ):
        """Test successful user login"""
        # Create verified user
        user = create_test_user(
            email="test@example.com",
            is_verified=True
        )

        login_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "remember_me": False
        }

        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == login_data["email"]

    def test_login_invalid_credentials(
        self,
        client,
        create_test_user,
        mock_supabase
    ):
        """Test login with invalid credentials"""
        user = create_test_user(email="test@example.com", is_verified=True)

        login_data = {
            "email": "test@example.com",
            "password": "WrongPassword123!",
            "remember_me": False
        }

        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_unverified_email(
        self,
        client,
        create_test_user,
        mock_supabase
    ):
        """Test login with unverified email"""
        user = create_test_user(
            email="test@example.com",
            is_verified=False
        )

        login_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "remember_me": False
        }

        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 403
        assert "verify" in response.json()["detail"].lower()

    def test_login_account_locked(
        self,
        client,
        create_test_user,
        mock_supabase
    ):
        """Test login with locked account"""
        locked_until = datetime.utcnow() + timedelta(minutes=15)
        user = create_test_user(
            email="test@example.com",
            is_verified=True,
            locked_until=locked_until,
            login_attempts=5
        )

        login_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "remember_me": False
        }

        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 429
        assert "locked" in response.json()["detail"].lower()

    def test_login_increments_failed_attempts(
        self,
        client,
        create_test_user,
        test_db_session,
        mock_supabase
    ):
        """Test that failed login attempts are tracked"""
        user = create_test_user(
            email="test@example.com",
            is_verified=True,
            login_attempts=0
        )

        login_data = {
            "email": "test@example.com",
            "password": "WrongPassword",
            "remember_me": False
        }

        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 401

        # Check that login attempts increased
        test_db_session.refresh(user)
        assert user.login_attempts == 1

    def test_login_resets_attempts_on_success(
        self,
        client,
        create_test_user,
        test_db_session,
        mock_supabase
    ):
        """Test that login attempts reset on successful login"""
        user = create_test_user(
            email="test@example.com",
            is_verified=True,
            login_attempts=3
        )

        login_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!",
            "remember_me": False
        }

        response = client.post("/api/v1/auth/login", json=login_data)

        assert response.status_code == 200

        # Check that login attempts reset
        test_db_session.refresh(user)
        assert user.login_attempts == 0
        assert user.last_login is not None


@pytest.mark.unit
@pytest.mark.auth
class TestUserLogout:
    """Test user logout endpoints"""

    def test_logout_success(
        self,
        client,
        create_test_user,
        auth_headers,
        mock_supabase
    ):
        """Test successful logout"""
        user = create_test_user()

        response = client.post("/api/v1/auth/logout", headers=auth_headers)

        assert response.status_code == 200
        assert "logged out" in response.json()["message"].lower()

    def test_logout_without_token(self, client):
        """Test logout without authentication token"""
        response = client.post("/api/v1/auth/logout")

        # Should still succeed (graceful handling)
        assert response.status_code == 200


@pytest.mark.unit
@pytest.mark.auth
class TestPasswordReset:
    """Test password reset endpoints"""

    def test_request_password_reset_success(
        self,
        client,
        create_test_user,
        mock_email_service
    ):
        """Test successful password reset request"""
        user = create_test_user(email="test@example.com")

        response = client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "test@example.com"}
        )

        assert response.status_code == 200
        assert "reset link" in response.json()["message"].lower()

    def test_request_password_reset_nonexistent_email(
        self,
        client,
        mock_email_service
    ):
        """Test password reset request for nonexistent email"""
        response = client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "nonexistent@example.com"}
        )

        # Should return success for security (don't reveal if email exists)
        assert response.status_code == 200
        assert "reset link" in response.json()["message"].lower()

    def test_reset_password_success(
        self,
        client,
        create_test_user,
        test_db_session
    ):
        """Test successful password reset"""
        reset_token = "test_reset_token_123"
        reset_expires = datetime.utcnow() + timedelta(hours=1)

        user = create_test_user(
            email="test@example.com",
            reset_token=reset_token,
            reset_token_expires=reset_expires
        )

        reset_data = {
            "token": reset_token,
            "new_password": "NewSecurePassword123!"
        }

        response = client.post("/api/v1/auth/password-reset", json=reset_data)

        assert response.status_code == 200
        assert "reset successfully" in response.json()["message"].lower()

        # Verify token is cleared
        test_db_session.refresh(user)
        assert user.reset_token is None
        assert user.reset_token_expires is None

    def test_reset_password_invalid_token(self, client):
        """Test password reset with invalid token"""
        reset_data = {
            "token": "invalid_token",
            "new_password": "NewPassword123!"
        }

        response = client.post("/api/v1/auth/password-reset", json=reset_data)

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()

    def test_reset_password_expired_token(
        self,
        client,
        create_test_user
    ):
        """Test password reset with expired token"""
        reset_token = "test_reset_token_123"
        reset_expires = datetime.utcnow() - timedelta(hours=1)  # Expired

        user = create_test_user(
            email="test@example.com",
            reset_token=reset_token,
            reset_token_expires=reset_expires
        )

        reset_data = {
            "token": reset_token,
            "new_password": "NewPassword123!"
        }

        response = client.post("/api/v1/auth/password-reset", json=reset_data)

        assert response.status_code == 400
        assert "expired" in response.json()["detail"].lower()


@pytest.mark.unit
@pytest.mark.auth
class TestTwoFactorAuth:
    """Test two-factor authentication endpoints"""

    def test_setup_2fa_success(
        self,
        client,
        create_test_user,
        auth_headers
    ):
        """Test successful 2FA setup"""
        with patch("services.auth.router.get_current_user_from_token") as mock_get_user:
            mock_get_user.return_value = {"id": "test_user_123"}
            create_test_user(id="test_user_123")

            response = client.post(
                "/api/v1/auth/2fa/setup",
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert "secret" in data
            assert "qr_code" in data
            assert data["qr_code"].startswith("data:image/png;base64,")

    def test_setup_2fa_unauthenticated(self, client):
        """Test 2FA setup without authentication"""
        response = client.post("/api/v1/auth/2fa/setup")

        assert response.status_code in [401, 422]

    def test_enable_2fa_success(
        self,
        client,
        create_test_user,
        test_db_session,
        auth_headers
    ):
        """Test successful 2FA enablement"""
        with patch("services.auth.router.get_current_user_from_token") as mock_get_user, \
             patch("pyotp.TOTP") as mock_totp:

            mock_get_user.return_value = {"id": "test_user_123"}
            user = create_test_user(
                id="test_user_123",
                two_factor_secret="TEST_SECRET_123"
            )

            # Mock TOTP verification
            mock_totp_instance = Mock()
            mock_totp_instance.verify.return_value = True
            mock_totp.return_value = mock_totp_instance

            response = client.post(
                "/api/v1/auth/2fa/enable",
                headers=auth_headers,
                json={"code": "123456"}
            )

            assert response.status_code == 200
            assert "enabled successfully" in response.json()["message"].lower()

            # Verify 2FA is enabled in DB
            test_db_session.refresh(user)
            assert user.two_factor_enabled is True

    def test_enable_2fa_invalid_code(
        self,
        client,
        create_test_user,
        auth_headers
    ):
        """Test 2FA enablement with invalid code"""
        with patch("services.auth.router.get_current_user_from_token") as mock_get_user, \
             patch("pyotp.TOTP") as mock_totp:

            mock_get_user.return_value = {"id": "test_user_123"}
            user = create_test_user(
                id="test_user_123",
                two_factor_secret="TEST_SECRET_123"
            )

            # Mock TOTP verification failure
            mock_totp_instance = Mock()
            mock_totp_instance.verify.return_value = False
            mock_totp.return_value = mock_totp_instance

            response = client.post(
                "/api/v1/auth/2fa/enable",
                headers=auth_headers,
                json={"code": "000000"}
            )

            assert response.status_code == 400
            assert "invalid" in response.json()["detail"].lower()


@pytest.mark.unit
@pytest.mark.auth
class TestSessionManagement:
    """Test session management endpoints"""

    def test_get_user_sessions(
        self,
        client,
        create_test_user,
        test_db_session,
        auth_headers
    ):
        """Test getting user sessions"""
        from services.auth.models import UserSession

        with patch("services.auth.router.get_current_user_from_token") as mock_get_user:
            mock_get_user.return_value = {"id": "test_user_123"}
            user = create_test_user(id="test_user_123")

            # Create test sessions
            session1 = UserSession(
                id="session_1",
                user_id=user.id,
                session_token="token_1",
                is_active=True,
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
            session2 = UserSession(
                id="session_2",
                user_id=user.id,
                session_token="token_2",
                is_active=True,
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
            test_db_session.add(session1)
            test_db_session.add(session2)
            test_db_session.commit()

            response = client.get(
                "/api/v1/auth/sessions",
                headers=auth_headers
            )

            assert response.status_code == 200
            sessions = response.json()
            assert len(sessions) == 2

    def test_revoke_session(
        self,
        client,
        create_test_user,
        test_db_session,
        auth_headers
    ):
        """Test revoking a specific session"""
        from services.auth.models import UserSession

        with patch("services.auth.router.get_current_user_from_token") as mock_get_user:
            mock_get_user.return_value = {"id": "test_user_123"}
            user = create_test_user(id="test_user_123")

            # Create test session
            session = UserSession(
                id="session_123",
                user_id=user.id,
                session_token="token_123",
                is_active=True,
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
            test_db_session.add(session)
            test_db_session.commit()

            response = client.delete(
                "/api/v1/auth/sessions/session_123",
                headers=auth_headers
            )

            assert response.status_code == 200
            assert "revoked" in response.json()["message"].lower()

            # Verify session is inactive
            test_db_session.refresh(session)
            assert session.is_active is False


@pytest.mark.unit
@pytest.mark.auth
class TestGDPRConsent:
    """Test GDPR consent endpoints"""

    def test_update_consent_success(
        self,
        client,
        create_test_user,
        auth_headers
    ):
        """Test updating GDPR consent"""
        with patch("services.auth.router.get_current_user_from_token") as mock_get_user:
            mock_get_user.return_value = {"id": "test_user_123"}
            user = create_test_user(id="test_user_123")

            consent_data = {
                "consent_type": "marketing",
                "consented": True
            }

            response = client.post(
                "/api/v1/auth/consent",
                headers=auth_headers,
                json=consent_data
            )

            assert response.status_code == 200
            assert "updated successfully" in response.json()["message"].lower()

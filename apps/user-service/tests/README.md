# Zenith User Service - Test Suite

Comprehensive test suite for the Zenith User Service with 85%+ code coverage.

## Overview

This test suite provides comprehensive coverage for all major services including:
- Authentication (registration, login, 2FA, password reset)
- Database operations (models, queries, transactions)
- Search service (Elasticsearch integration)
- Payment processing (Stripe integration)
- Chat service (messaging, conversations, moderation)

## Test Structure

```
tests/
├── README.md                    # This file
├── conftest.py                  # Shared fixtures and mocks
├── __init__.py
├── unit/                        # Unit tests (fast, isolated)
│   ├── test_auth.py            # Authentication tests
│   ├── test_database.py        # Database model tests
│   └── __init__.py
├── integration/                 # Integration tests (external dependencies)
│   ├── test_chat.py            # Chat service tests
│   ├── test_payment.py         # Payment integration tests
│   ├── test_search.py          # Search service tests
│   └── __init__.py
└── fixtures/                    # Test data fixtures
    └── __init__.py
```

## Running Tests

### Run All Tests
```bash
pytest
```

### Run with Coverage Report
```bash
pytest --cov=. --cov-report=html --cov-report=term
```

### Run Specific Test Categories
```bash
# Unit tests only (fast)
pytest -m unit

# Integration tests only
pytest -m integration

# Authentication tests
pytest -m auth

# Database tests
pytest -m database

# Payment tests
pytest -m payment

# Search tests
pytest -m search

# Chat tests
pytest -m chat
```

### Run Specific Test Files
```bash
# Authentication tests
pytest tests/unit/test_auth.py

# Database tests
pytest tests/unit/test_database.py

# Payment tests
pytest tests/integration/test_payment.py
```

### Run with Verbose Output
```bash
pytest -v
```

### Run Tests in Parallel
```bash
pytest -n auto
```

### Run Failed Tests Only
```bash
pytest --lf  # Last failed
pytest --ff  # Failed first
```

## Test Configuration

Test configuration is defined in `pytest.ini`:
- Async mode enabled for FastAPI testing
- Coverage threshold set to 85%
- Multiple output formats (terminal, HTML, XML)
- Custom markers for test categorization

## Fixtures and Mocks

### Database Fixtures
- `test_db_engine`: In-memory SQLite database engine
- `test_db_session`: Isolated database session per test
- `override_get_db`: Override FastAPI database dependency

### Client Fixtures
- `client`: Synchronous test client for FastAPI
- `async_client`: Asynchronous test client for FastAPI

### Mock Services
- `mock_stripe`: Mocked Stripe API
- `mock_twilio`: Mocked Twilio SMS API
- `mock_elasticsearch`: Mocked Elasticsearch client
- `mock_redis`: Mocked Redis client
- `mock_supabase`: Mocked Supabase client
- `mock_email_service`: Mocked email service

### Helper Fixtures
- `create_test_user`: Helper to create test users
- `create_test_conversation`: Helper to create test conversations
- `sample_user_data`: Sample user registration data
- `sample_payment_data`: Sample payment data
- `auth_headers`: Authentication headers for protected endpoints

## Test Coverage Goals

| Module | Target Coverage |
|--------|----------------|
| Authentication | 90% |
| Database | 85% |
| Payment | 85% |
| Chat | 85% |
| Search | 80% |
| Overall | 85% |

## Writing New Tests

### Test Naming Convention
- Test files: `test_*.py`
- Test classes: `Test*`
- Test functions: `test_*`

### Test Organization
```python
import pytest

@pytest.mark.unit  # or integration
@pytest.mark.auth  # feature marker
class TestFeature:
    """Test feature description"""

    def test_success_case(self, client):
        """Test successful operation"""
        response = client.post("/endpoint", json={})
        assert response.status_code == 200

    def test_error_case(self, client):
        """Test error handling"""
        response = client.post("/endpoint", json={})
        assert response.status_code == 400
```

### Using Fixtures
```python
def test_with_fixtures(
    client,
    create_test_user,
    mock_stripe,
    test_db_session
):
    """Example test using multiple fixtures"""
    user = create_test_user(email="test@example.com")
    response = client.post("/endpoint", json={"user_id": user.id})
    assert response.status_code == 200
```

## Test Markers

Available pytest markers:
- `unit`: Fast, isolated unit tests
- `integration`: Tests with external dependencies
- `auth`: Authentication-related tests
- `database`: Database-related tests
- `payment`: Payment processing tests
- `search`: Search service tests
- `chat`: Chat service tests
- `slow`: Slow-running tests
- `redis`: Tests requiring Redis
- `elasticsearch`: Tests requiring Elasticsearch
- `stripe`: Tests requiring Stripe mocks

## Continuous Integration

### Pre-commit Tests
```bash
# Run before committing
pytest -m unit --maxfail=1
```

### CI Pipeline Tests
```bash
# Full test suite with coverage
pytest --cov=. --cov-report=xml --cov-fail-under=85
```

## Troubleshooting

### Import Errors
If you encounter import errors, ensure you're running pytest from the user-service directory:
```bash
cd apps/user-service
pytest
```

### Database Errors
Tests use in-memory SQLite databases. If you encounter database errors:
- Ensure SQLAlchemy models are properly imported
- Check that fixtures are properly scoped
- Verify database session cleanup in conftest.py

### Mock Errors
If mocks aren't working:
- Verify patch paths are correct
- Check that mocks are applied before importing modules
- Ensure mock return values match expected types

### Async Test Errors
For async test errors:
- Ensure `pytest-asyncio` is installed
- Use `@pytest.mark.asyncio` decorator
- Verify `asyncio_mode = auto` in pytest.ini

## Code Coverage

### View Coverage Report
After running tests with coverage:
```bash
# Terminal report
pytest --cov=. --cov-report=term-missing

# HTML report (opens in browser)
pytest --cov=. --cov-report=html
open htmlcov/index.html
```

### Coverage Configuration
Coverage settings in `pytest.ini`:
- Source directory: `.` (current directory)
- Omit: tests, cache, virtual environments
- Fail threshold: 85%
- Show missing lines

## Performance

### Test Execution Time
- Unit tests: < 30 seconds
- Integration tests: < 2 minutes
- Full suite: < 3 minutes

### Optimization Tips
1. Use `pytest-xdist` for parallel execution
2. Run unit tests during development
3. Run full suite before committing
4. Use `--maxfail=1` to stop on first failure
5. Use `--lf` to run only failed tests

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Use fixtures for setup/teardown
3. **Mocking**: Mock external services (Stripe, Twilio, etc.)
4. **Assertions**: Use clear, descriptive assertions
5. **Documentation**: Add docstrings to test functions
6. **Coverage**: Aim for 85%+ coverage on critical paths
7. **Speed**: Keep unit tests fast (< 1s each)
8. **Maintainability**: Keep tests simple and readable

## Resources

- [pytest documentation](https://docs.pytest.org/)
- [pytest-asyncio documentation](https://pytest-asyncio.readthedocs.io/)
- [FastAPI testing guide](https://fastapi.tiangolo.com/tutorial/testing/)
- [SQLAlchemy testing guide](https://docs.sqlalchemy.org/en/14/orm/session_transaction.html#joining-a-session-into-an-external-transaction-such-as-for-test-suites)

# Two-Factor Authentication Service

Enterprise-grade two-factor authentication microservice for the Zenith dating platform.

## Features

- **TOTP (Time-based One-Time Password)**: RFC 6238 compliant TOTP implementation
- **SMS Verification**: SMS-based 2FA with multiple provider support
- **Email Verification**: Email-based 2FA for recovery
- **Hardware Keys**: WebAuthn/FIDO2 hardware key support
- **Backup Codes**: One-time use backup codes for account recovery
- **Rate Limiting**: Built-in rate limiting and account lockout protection
- **Analytics**: Comprehensive 2FA usage analytics and reporting
- **Recovery System**: Secure account recovery with multiple verification methods

## API Endpoints

### Configuration Management
- `POST /config` - Create 2FA configuration
- `GET /config/{user_id}` - Get 2FA configuration
- `PUT /config/{user_id}` - Update 2FA configuration

### TOTP Setup
- `POST /totp/setup` - Setup TOTP with QR code generation
- `POST /totp/verify` - Verify TOTP setup and enable 2FA

### Challenge System
- `POST /challenge` - Create 2FA challenge
- `POST /challenge/verify` - Verify 2FA challenge

### Backup Codes
- `POST /backup-codes/generate` - Generate new backup codes
- `GET /backup-codes/{user_id}` - List backup codes

### Enable/Disable
- `POST /enable` - Enable 2FA
- `POST /disable` - Disable 2FA

### Recovery
- `POST /recovery` - Create recovery request
- `POST /recovery/approve` - Approve recovery request

### Analytics
- `GET /analytics/stats` - Get 2FA statistics
- `GET /status/{user_id}` - Get user 2FA status

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export DATABASE_URL="postgresql://user:password@localhost/twofa_db"
export ENCRYPTION_KEY="your-encryption-key-here"
```

3. Run database migrations:
```bash
alembic upgrade head
```

4. Start the service:
```bash
uvicorn main:app --host 0.0.0.0 --port 8004
```

## Docker

Build and run with Docker:
```bash
docker build -t zenith-2fa .
docker run -p 8004:8004 zenith-2fa
```

## Security Features

- **Encryption**: All sensitive data encrypted with Fernet
- **Rate Limiting**: Automatic account lockout after failed attempts
- **Audit Logging**: Complete audit trail of all 2FA operations
- **Token Expiration**: Time-limited challenges and recovery tokens
- **Input Validation**: Comprehensive input validation and sanitization

## Architecture

The service uses:
- **FastAPI**: High-performance async web framework
- **SQLAlchemy**: ORM with PostgreSQL backend
- **Pydantic**: Data validation and serialization
- **Cryptography**: Secure encryption and hashing
- **QR Code**: TOTP setup QR code generation

## Database Schema

- `two_factor_configs`: User 2FA configurations
- `two_factor_challenges`: Active 2FA challenges
- `backup_codes`: Backup recovery codes
- `hardware_keys`: WebAuthn hardware key registrations
- `two_factor_attempts`: Audit log of verification attempts
- `recovery_requests`: Account recovery requests

## Testing

Run tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=. --cov-report=html
```

## Monitoring

The service includes:
- Health check endpoint (`/health`)
- Structured logging with JSON output
- Metrics collection for monitoring
- Error tracking with Sentry integration

## Production Deployment

For production deployment:
1. Use proper secret management (Vault, AWS Secrets Manager)
2. Configure database connection pooling
3. Set up Redis for session management
4. Configure load balancer with SSL termination
5. Set up monitoring and alerting
6. Configure backup and disaster recovery

## API Documentation

Full API documentation available at `/docs` when running the service.

## License

Copyright 2024 Zenith Platform
# Zenith Microservices API Documentation

Comprehensive API documentation for the Zenith microservices platform.

## Overview

This directory contains OpenAPI/Swagger documentation for all Zenith microservices. Each service provides interactive API documentation through Swagger UI, allowing you to explore endpoints, view schemas, and test API calls directly from your browser.

## Quick Start

### View Documentation Portal

Open the documentation portal in your browser:

```bash
open docs/api/index.html
# or
firefox docs/api/index.html
# or
google-chrome docs/api/index.html
```

### Start All Services

```bash
# Start services individually or use Docker Compose
docker-compose up -d
```

## Available Services

### 1. API Gateway (Port 8080)

Unified entry point for all microservices.

- **Swagger UI**: http://localhost:8080/api-docs
- **OpenAPI JSON**: http://localhost:8080/openapi.json
- **Health Check**: http://localhost:8080/health/live

**Features**:
- Service routing and load balancing
- Rate limiting
- Request/response logging
- Prometheus metrics

### 2. Auth Service (Port 3001)

Authentication and authorization service.

- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI JSON**: http://localhost:3001/openapi.json
- **Health Check**: http://localhost:3001/health

**Features**:
- JWT authentication
- OAuth (Google, GitHub)
- Password reset
- User registration/login
- Token refresh

**Example Request**:
```bash
# Register a new user
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 3. Data Service (Port 3003)

User data and relationship management.

- **Swagger UI**: http://localhost:3003/api-docs
- **OpenAPI JSON**: http://localhost:3003/openapi.json
- **Health Check**: http://localhost:3003/health

**Features**:
- User CRUD operations
- Subscription management
- Message handling
- Booking management

### 4. Payment Service (Port 3002)

Payment processing with Stripe integration.

- **Swagger UI**: http://localhost:3002/api-docs
- **OpenAPI JSON**: http://localhost:3002/openapi.json
- **Health Check**: http://localhost:3002/health

**Features**:
- Checkout sessions
- Subscription management
- Payment method management
- Stripe webhooks

**Example Request**:
```bash
# Create checkout session
curl -X POST http://localhost:3002/checkout/create-session \
  -H "Content-Type: application/json" \
  -d '{
    "priceId": "price_xxxxx",
    "userId": "user-uuid",
    "email": "user@example.com"
  }'
```

### 5. i18n Service (Port 3004)

Internationalization and translation service.

- **Swagger UI**: http://localhost:3004/api-docs
- **OpenAPI JSON**: http://localhost:3004/openapi.json
- **Health Check**: http://localhost:3004/health

**Features**:
- Multi-language support
- Translation caching
- Batch translation
- Language detection

### 6. User Service (Port 8000)

Comprehensive user service with multiple sub-services.

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json
- **Health Check**: http://localhost:8000/health

**Features**:
- Authentication & 2FA
- Real-time chat (WebSockets)
- Elasticsearch search
- Payment integration
- SMS notifications
- Blog & Forum
- Photo gallery
- Mini-games
- Newsletter management

## Authentication

Most endpoints require JWT authentication. To authenticate:

1. **Register or Login** to get an access token:
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

2. **Use the token** in subsequent requests:
```bash
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

3. **Refresh tokens** when they expire:
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

## Postman Collections

Pre-configured Postman collections are available for all services:

```bash
# See postman directory
ls docs/api/postman/
```

### Import Collections

1. Open Postman
2. Click "Import"
3. Select the collection file from `docs/api/postman/`
4. Configure environment variables (see `postman/environment.json`)

## OpenAPI Specification

All services follow OpenAPI 3.0 specification. You can:

1. **Download specs** directly from `/openapi.json` endpoint
2. **Import into tools** like Swagger Editor, Postman, Insomnia
3. **Generate client SDKs** using OpenAPI Generator

### Generate Client SDK

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript client
openapi-generator-cli generate \
  -i http://localhost:3001/openapi.json \
  -g typescript-axios \
  -o ./generated-clients/auth-client

# Generate Python client
openapi-generator-cli generate \
  -i http://localhost:8000/api/openapi.json \
  -g python \
  -o ./generated-clients/user-client
```

## Rate Limiting

All services implement rate limiting:

- **Authenticated users**: 100 requests/minute
- **Unauthenticated**: 20 requests/minute
- **Auth endpoints**: Additional strict limits

Rate limit info is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635789600
```

## Error Handling

All services use consistent error response format:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Monitoring

### Health Checks

All services expose health check endpoints:

```bash
# Check service health
curl http://localhost:3001/health
```

### Metrics

Prometheus metrics are available at `/metrics`:

```bash
# View metrics
curl http://localhost:3001/metrics
```

## Development

### Running Services Locally

```bash
# Auth Service
cd apps/auth_service
npm install
npm run dev

# Data Service
cd apps/data_service
npm install
npm run dev

# Payment Service
cd apps/payment_service
npm install
npm run dev

# i18n Service
cd apps/i18n_service
npm install
npm run dev

# User Service (FastAPI)
cd apps/user-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# API Gateway
cd apps/api_gateway
npm install
npm run dev
```

### Environment Variables

Each service requires environment variables. See `.env.example` in each service directory.

### Testing API Endpoints

#### Using cURL

```bash
# GET request
curl -X GET http://localhost:3001/health

# POST with JSON
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# With authentication
curl -X GET http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Using HTTPie

```bash
# Install HTTPie
pip install httpie

# GET request
http GET localhost:3001/health

# POST with JSON
http POST localhost:3001/auth/login email=user@example.com password=password123

# With authentication
http GET localhost:3001/auth/me Authorization:"Bearer YOUR_TOKEN"
```

## API Versioning

All APIs are versioned:

- API Gateway: Routes include service prefixes
- TypeScript services: Version in response headers
- User Service: `/api/v1/` prefix

## CORS Configuration

CORS is enabled for development. Production configuration restricts origins to:
- https://zenith.com
- https://app.zenith.com

## Security

### Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (httpOnly cookies or secure storage)
3. **Rotate tokens** regularly
4. **Never commit** API keys or secrets
5. **Validate input** on client and server
6. **Use rate limiting** to prevent abuse

### Security Headers

All services include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- Content Security Policy (CSP)

## Support

For API support and questions:

- **Email**: api@zenith.com
- **Documentation**: https://docs.zenith.com
- **Issues**: GitHub Issues

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines on contributing to the API.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

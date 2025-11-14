# Zenith Data Service

Production-ready unified data access microservice for the Zenith platform. This service provides a centralized API for managing users, subscriptions, messages, and bookings with comprehensive type safety, validation, and audit logging.

## Features

- **Type-Safe API**: Full TypeScript implementation with Zod validation
- **Database Abstraction**: Prisma ORM with PostgreSQL
- **Security**: Helmet, CORS, rate limiting, input validation
- **Observability**: Health checks, metrics (JSON + Prometheus), audit logging
- **Testing**: Comprehensive Jest test suite with >80% coverage
- **Production-Ready**: Multi-stage Docker build, non-root user, health checks
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Pagination**: Built-in pagination support for list endpoints

## Architecture

```
data_service/
├── src/
│   ├── controllers/     # Request handlers for each resource
│   ├── routes/          # Express route definitions
│   ├── middleware/      # Custom middleware (validation, error handling, etc.)
│   ├── services/        # Business logic and external services
│   ├── validators/      # Zod schemas for request validation
│   ├── db/              # Database connection and utilities
│   ├── utils/           # Utility functions
│   ├── __tests__/       # Jest test files
│   ├── config.ts        # Configuration management
│   └── index.ts         # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── Dockerfile           # Multi-stage production build
├── docker-compose.yml   # Local development setup
└── package.json         # Dependencies and scripts
```

## API Documentation

### Base URL
```
http://localhost:3002
```

### Authentication
All endpoints (except health checks) require Bearer token authentication:
```
Authorization: Bearer <token>
```

---

## Users API

### Create User
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "avatarUrl": "https://example.com/avatar.jpg",
  "dateOfBirth": "1990-01-01T00:00:00Z",
  "gender": "male",
  "bio": "Software engineer",
  "location": "San Francisco, CA",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

### Get User by ID
```http
GET /users/:id
```

### Get User by Email
```http
GET /users/email/:email
```

### List Users (with pagination)
```http
GET /users?page=1&limit=20&search=john&verified=true&active=true
```

Query Parameters:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search by email, username, first name, or last name
- `verified` (optional): Filter by verification status
- `active` (optional): Filter by active status

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Update User
```http
PUT /users/:id
Content-Type: application/json

{
  "firstName": "Jane",
  "bio": "Updated bio",
  "verified": true
}
```

### Delete User
```http
DELETE /users/:id
```

---

## Subscriptions API

### Create Subscription
```http
POST /subscriptions
Content-Type: application/json

{
  "userId": "uuid",
  "plan": "premium",
  "price": 9.99,
  "currency": "USD",
  "billingCycle": "monthly",
  "autoRenew": true,
  "paymentMethod": "stripe",
  "metadata": {
    "promoCode": "SUMMER2024"
  }
}
```

Plans: `free`, `premium`, `premium_plus`
Billing Cycles: `monthly`, `yearly`

### Get Subscription by ID
```http
GET /subscriptions/:id
```

### Get Subscriptions by User ID
```http
GET /subscriptions/user/:userId?status=active&plan=premium
```

Query Parameters:
- `status` (optional): Filter by status
- `plan` (optional): Filter by plan

### Update Subscription
```http
PUT /subscriptions/:id
Content-Type: application/json

{
  "plan": "premium_plus",
  "autoRenew": false
}
```

### Cancel Subscription
```http
POST /subscriptions/:id/cancel
Content-Type: application/json

{
  "cancellationReason": "Too expensive"
}
```

---

## Messages API

### Create Message
```http
POST /messages
Content-Type: application/json

{
  "senderId": "uuid",
  "receiverId": "uuid",
  "content": "Hello, world!",
  "type": "text",
  "metadata": {
    "priority": "high"
  }
}
```

Message Types: `text`, `image`, `video`, `file`

### Get Messages by Participant
```http
GET /messages/participant/:userId?page=1&limit=20&read=false&type=text
```

Query Parameters:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `read` (optional): Filter by read status
- `type` (optional): Filter by message type

### Mark Message as Read
```http
POST /messages/:messageId/read
Content-Type: application/json

{
  "userId": "uuid"
}
```

### Delete Message
```http
DELETE /messages/:id
```

---

## Bookings API

### Create Booking
```http
POST /bookings
Content-Type: application/json

{
  "userId": "uuid",
  "providerId": "uuid",
  "serviceType": "date",
  "title": "Dinner Date",
  "description": "Romantic dinner at Italian restaurant",
  "startTime": "2024-12-25T19:00:00Z",
  "endTime": "2024-12-25T22:00:00Z",
  "location": "Restaurant Name, City",
  "price": 150.00,
  "currency": "USD",
  "notes": "Vegetarian options needed",
  "metadata": {
    "restaurantId": "123"
  }
}
```

Service Types: `date`, `event`, `consultation`

### Get Booking by ID
```http
GET /bookings/:id
```

### Get Bookings by User ID
```http
GET /bookings/user/:userId?page=1&limit=20&status=confirmed&serviceType=date
```

Query Parameters:
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `serviceType` (optional): Filter by service type
- `startDate` (optional): Filter by start date
- `endDate` (optional): Filter by end date

### Update Booking
```http
PUT /bookings/:id
Content-Type: application/json

{
  "status": "confirmed",
  "notes": "Updated notes"
}
```

Status: `pending`, `confirmed`, `cancelled`, `completed`

### Cancel Booking
```http
POST /bookings/:id/cancel
Content-Type: application/json

{
  "cancellationReason": "Schedule conflict"
}
```

---

## Health & Monitoring

### Liveness Probe
```http
GET /health/live
```

Returns: `200 OK` if service is running

### Readiness Probe
```http
GET /health/ready
```

Returns: `200 OK` if service is ready to accept traffic (database connected)

### Full Health Check
```http
GET /health
```

Returns comprehensive health information:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "ok",
      "latency": "5ms"
    }
  },
  "stats": {
    "users": 1000,
    "subscriptions": 500,
    "messages": 10000,
    "bookings": 250
  },
  "memory": {
    "used": "128MB",
    "total": "256MB"
  }
}
```

### Metrics (JSON)
```http
GET /metrics
```

### Metrics (Prometheus)
```http
GET /metrics/prometheus
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Local Development

1. **Clone the repository**
```bash
cd apps/data_service
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

Environment Variables:
```env
PORT=3002
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@localhost:5432/data_db
ALLOWED_ORIGINS=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DEFAULT_PAGE_SIZE=20
MAX_PAGE_SIZE=100
AUTH_SERVICE_URL=http://localhost:3001
ENABLE_AUDIT_LOGGING=true
```

4. **Set up database**
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# (Optional) Seed database
npm run prisma:seed
```

5. **Run development server**
```bash
npm run dev
```

Server will start at `http://localhost:3002`

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

### Building for Production

```bash
# Build TypeScript
npm run build

# Run production server
npm start
```

### Docker Deployment

```bash
# Build image
docker build -t zenith-data-service:latest .

# Run container
docker run -d \
  -p 3002:3002 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/data_db \
  --name data-service \
  zenith-data-service:latest
```

### Docker Compose

```bash
docker-compose up -d
```

---

## Database Schema

The service uses PostgreSQL with Prisma ORM. Key models:

### User
- Profile information
- Authentication data
- Preferences
- Relations: subscriptions, messages, bookings

### Subscription
- Plan and billing information
- Status tracking
- Auto-renewal settings
- Cancellation history

### Message
- Sender/receiver relationships
- Content and metadata
- Read status tracking
- Soft deletion support

### Booking
- User and provider relationships
- Service details and scheduling
- Status tracking
- Payment information

### AuditLog
- Comprehensive audit trail
- User actions tracking
- Change history

---

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `204 No Content`: Successful deletion
- `400 Bad Request`: Invalid input/validation error
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Duplicate resource
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service temporarily unavailable

Error Response Format:
```json
{
  "error": "Error message",
  "details": [
    {
      "path": "field.name",
      "message": "Validation error message"
    }
  ]
}
```

---

## Security Features

- **Helmet**: Security headers
- **CORS**: Configurable origin policies
- **Rate Limiting**: Prevents abuse
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma parameterized queries
- **Non-root Docker User**: Enhanced container security
- **Audit Logging**: Complete action tracking

---

## Performance

- **Database Connection Pooling**: Prisma manages connections efficiently
- **Pagination**: All list endpoints support pagination
- **Indexes**: Strategic database indexes for common queries
- **Caching**: Ready for Redis integration
- **Health Checks**: Kubernetes-compatible liveness/readiness probes

---

## Monitoring & Observability

### Logs
Structured JSON logging for all requests:
```json
{
  "method": "GET",
  "path": "/users/123",
  "statusCode": 200,
  "duration": "45ms",
  "ip": "192.168.1.1",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Metrics
- Request counts by endpoint
- Error rates
- Response times
- Database performance
- Memory usage

### Audit Trail
All create, update, and delete operations are logged with:
- User ID
- Action type
- Resource modified
- Changes made
- IP address and user agent
- Timestamp

---

## Development

### Code Structure
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and external integrations
- **Validators**: Zod schemas for type-safe validation
- **Middleware**: Reusable request processing
- **Routes**: API endpoint definitions

### Testing Strategy
- Unit tests for controllers and services
- Integration tests for API endpoints
- Database tests with test containers
- Coverage threshold: 80%

### Linting
```bash
npm run lint
```

---

## Troubleshooting

### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Client Issues
```bash
# Regenerate Prisma client
npm run prisma:generate
```

### Port Already in Use
```bash
# Change port in .env file
PORT=3003
```

---

## Contributing

1. Follow TypeScript best practices
2. Add tests for new features
3. Update API documentation
4. Run linter before committing
5. Keep dependencies up to date

---

## License

Proprietary - Zenith Platform

---

## Support

For issues and questions:
- GitHub Issues: [Repository Issues](https://github.com/zenith/microservices/issues)
- Documentation: [Full Docs](https://docs.zenith.com)
- Email: support@zenith.com

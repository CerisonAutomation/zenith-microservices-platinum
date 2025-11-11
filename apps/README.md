# Zenith Extracted Microservices

**Generated:** $(date)
**Extraction Source:** Hikari + i18n-starter boilerplates

## Architecture Overview

This directory contains fully extracted and isolated microservices from the Zenith boilerplate audit.

```
┌──────────────────┐
│   API Gateway    │  Port 3000
│  (Orchestration) │
└────────┬─────────┘
         │
    ┌────┴────┬────────┬──────────┬──────────┐
    │         │        │          │          │
┌───▼───┐ ┌──▼───┐ ┌──▼───┐  ┌───▼───┐  ┌──▼───┐
│ Auth  │ │Payment│ │ i18n │  │ Data  │  │ More │
│ :3001 │ │ :3002 │ │ :3003│  │ :3004 │  │      │
└───────┘ └───────┘ └──────┘  └───────┘  └──────┘
```

## Available Services

### 1. Auth Service (Port 3001)
- User authentication
- JWT token management
- OAuth (Google, GitHub)
- Password reset
- Session management

### 2. Payment Service (Port 3002)
- Stripe integration
- Subscription management
- Webhook handling
- Customer management
- Pricing plans

### 3. i18n Service (Port 3003)
- Multi-language support
- Translation management
- Locale handling
- Dictionary management

### 4. Data Service (Port 3004)
- Unified database access
- User CRUD
- Subscription CRUD
- Message CRUD
- Booking CRUD

### 5. API Gateway (Port 3000)
- Route orchestration
- Rate limiting
- CORS handling
- Request forwarding

## Quick Start

### Start All Services with Docker

```bash
cd extracted_services
docker-compose up -d
```

### Start Individual Service

```bash
cd extracted_services/auth_service
npm install
npm run dev
```

## Service URLs

- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Payment Service: http://localhost:3002
- i18n Service: http://localhost:3003
- Data Service: http://localhost:3004

## API Documentation

Each service has its own API documentation in `docs/API.md`

## Integration Guide

See `INTEGRATION.md` for how to integrate these services into your application.

## Environment Setup

1. Copy `.env.example` to `.env` in each service
2. Update environment variables
3. Run `npm install` in each service
4. Start services with `npm run dev`

## Testing

```bash
# Test all services
./test-all-services.sh

# Test individual service
cd auth_service && npm test
```

## Deployment

Each service is Docker-ready. Deploy to:
- Kubernetes
- Docker Swarm
- AWS ECS
- Google Cloud Run
- Heroku


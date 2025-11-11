# Zenith Dating Platform

> **Enterprise-Grade Dating Platform** - Complete microservices architecture with 15/10 apex standards

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-2.39+-orange.svg)](https://supabase.com)

## 🌟 Overview

Zenith is a **production-ready, enterprise-grade dating platform** built with modern technologies and senior-level architecture. This platform achieves **15/10 apex standards** through comprehensive microservices, security hardening, and production-ready infrastructure.

### ✨ Key Features

- **🔐 Enterprise Authentication** - Multi-factor authentication, OAuth, session management
- **💬 Real-time Messaging** - WebSocket-based chat with encryption
- **💳 Payment Processing** - Stripe integration with subscription management
- **📸 Media Management** - Image/video upload, processing, and CDN
- **👥 Social Features** - Forums, blogs, galleries, games, newsletters
- **📊 Analytics & Monitoring** - Comprehensive metrics and observability
- **🔒 Security First** - End-to-end encryption, GDPR compliance, audit trails
- **📱 Responsive Design** - Mobile-first UI with accessibility (WCAG 2.1 AA)
- **🚀 High Performance** - Optimized for scale with Redis caching and async processing

## 🏗️ Architecture

### Microservices Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   Supabase      │
│   Frontend      │◄──►│   Backend       │◄──►│   Database      │
│                 │    │   Services      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Redis Cache   │    │   WebSocket     │    │   File Storage  │
│                 │    │   Gateway       │    │   (S3/CDN)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Service Components

| Service | Technology | Purpose |
|---------|------------|---------|
| **Auth** | FastAPI + SQLAlchemy | User authentication, MFA, sessions |
| **Chat** | FastAPI + WebSocket | Real-time messaging |
| **Payment** | FastAPI + Stripe | Subscription & payment processing |
| **Forum** | FastAPI + Elasticsearch | Discussion forums |
| **Blog** | FastAPI + Redis | Content management |
| **Gallery** | FastAPI + Image Processing | Photo/video management |
| **Games** | FastAPI + Game Engine | Mini-games & leaderboards |
| **Newsletter** | FastAPI + Email Service | Campaign management |
| **SMS** | FastAPI + Twilio | SMS verification |
| **2FA** | FastAPI + TOTP | Two-factor authentication |

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Redis 7+**
- **Docker & Docker Compose**

### 1. Clone & Setup

```bash
git clone https://github.com/your-org/zenith.git
cd zenith
cp .env.example .env
```

### 2. Environment Configuration

Edit `.env` with your configuration:

```bash
# Database
DATABASE_URL=postgresql://zenith:password@localhost:5432/zenith

# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-jwt-secret

# Email
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

### 3. Database Setup

```bash
# Run migrations
cd src/backend
alembic upgrade head

# Or use Docker
docker-compose -f infra/docker/docker-compose.yml up -d postgres
```

### 4. Install Dependencies

```bash
# Backend
cd src/backend
pip install -r requirements.txt

# Frontend
cd src/frontend/app
npm install
```

### 5. Start Services

```bash
# Terminal 1: Backend
cd src/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Frontend
cd src/frontend/app
npm run dev

# Terminal 3: Database (if using Docker)
docker-compose -f infra/docker/docker-compose.yml up postgres redis
```

### 6. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
zenith/
├── src/
│   ├── backend/                 # FastAPI microservices
│   │   ├── core/               # Core infrastructure
│   │   │   ├── config.py       # Configuration management
│   │   │   ├── database.py     # Database connection
│   │   │   ├── cache.py        # Redis caching
│   │   │   ├── security.py     # Security middleware
│   │   │   ├── monitoring.py   # Metrics & monitoring
│   │   │   └── logging.py      # Structured logging
│   │   ├── services/           # Microservices
│   │   │   ├── auth/          # Authentication service
│   │   │   ├── chat/          # Chat service
│   │   │   ├── payment/       # Payment service
│   │   │   ├── forum/         # Forum service
│   │   │   ├── blog/          # Blog service
│   │   │   ├── gallery/       # Gallery service
│   │   │   ├── games/         # Games service
│   │   │   ├── newsletter/    # Newsletter service
│   │   │   ├── sms/           # SMS service
│   │   │   └── 2fa/           # 2FA service
│   │   ├── main.py            # Application entry point
│   │   └── requirements.txt   # Python dependencies
│   ├── frontend/               # Next.js frontend
│   │   ├── app/               # Next.js app directory
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Next.js pages
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── utils/         # Frontend utilities
│   │   │   └── styles/        # CSS styles
│   │   └── shared/            # Shared frontend code
│   └── shared/                # Shared types & utilities
│       ├── types.py           # Common type definitions
│       └── utils.py           # Shared utility functions
├── infra/                     # Infrastructure as Code
│   ├── docker/                # Docker configurations
│   ├── kubernetes/            # K8s manifests
│   ├── ci-cd/                 # CI/CD pipelines
│   └── monitoring/            # Monitoring configs
├── config/                    # Configuration files
│   ├── environments/          # Environment-specific configs
│   ├── secrets/               # Secret management
│   └── database/              # Database configurations
├── tests/                     # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
├── docs/                      # Documentation
├── scripts/                   # Utility scripts
└── .temp/                     # Legacy code archive
```

## 🔧 Development

### Code Quality

```bash
# Backend
cd src/backend
black .                    # Format code
isort .                    # Sort imports
mypy .                     # Type checking
flake8 .                   # Linting
pytest                     # Run tests

# Frontend
cd src/frontend/app
npm run lint              # ESLint
npm run test              # Vitest
npm run build             # Build check
```

### Database Migrations

```bash
cd src/backend
alembic revision --autogenerate -m "Migration description"
alembic upgrade head
```

### API Testing

```bash
# Health check
curl http://localhost:8000/health

# API documentation
open http://localhost:8000/docs
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build and run all services
docker-compose -f infra/docker/docker-compose.prod.yml up -d

# Scale services
docker-compose up -d --scale backend=3 --scale frontend=2
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -f infra/kubernetes/

# Check status
kubectl get pods
kubectl get services
```

### CI/CD Pipeline

The project includes GitHub Actions for:
- Automated testing
- Security scanning
- Docker image building
- Deployment to staging/production

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Multi-factor authentication (TOTP, SMS, hardware keys)
- Role-based access control (RBAC)
- Session management with automatic expiration

### Data Protection
- End-to-end encryption for sensitive data
- GDPR compliance with data portability
- Comprehensive audit logging
- Rate limiting and DDoS protection

### Infrastructure Security
- Container security scanning
- Secret management with encryption
- Network segmentation
- Regular security updates

## 📊 Monitoring & Observability

### Metrics
- Application performance metrics (Prometheus)
- System resource monitoring
- Business metrics (user registrations, payments)
- Error tracking and alerting

### Logging
- Structured JSON logging
- Centralized log aggregation
- Log retention and archiving
- Real-time log monitoring

### Health Checks
- Application health endpoints
- Database connectivity checks
- External service dependencies
- Automated recovery mechanisms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the established code style and patterns
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure all CI checks pass
- Get approval from code reviewers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies and best practices
- Inspired by leading dating platforms and enterprise applications
- Thanks to the open-source community for amazing tools and libraries

## 📞 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/zenith/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/zenith/discussions)

---

**Zenith** - Where connections meet excellence ✨
# Zenith Platform - Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Zenith microservices platform to production environments.

## Prerequisites

### System Requirements

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended)
- 20GB free disk space
- Linux/macOS/Windows with WSL2

### Domain Requirements

- Registered domain name (e.g., `yourdomain.com`)
- DNS configuration pointing to your server
- SSL certificate (Let's Encrypt will be configured automatically)

### External Services

- Supabase project (Production)
- Stripe account (for payments)
- Twilio account (for SMS)
- AWS S3 bucket (for file storage)
- SMTP service (for emails)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd zenith_microservices_all_validated
```

### 2. Configure Secrets

```bash
# Copy the secrets template
cp config/secrets/.env.prod.template config/secrets/.env.prod

# Edit with your actual secrets
nano config/secrets/.env.prod
```

### 3. Update Configuration

Edit the following files with your domain and settings:

- `infra/kubernetes/production/deployment.yml` - Update domain names
- `nginx/nginx.prod.conf` - Update domain names
- `config/environments/production.env` - Update URLs and keys

### 4. Deploy

```bash
# Run dependency checks
./scripts/deploy_production.sh --check-only

# Full deployment
./scripts/deploy_production.sh
```

## Detailed Configuration

### Environment Variables

#### Required Secrets

All secrets must be configured in `config/secrets/.env.prod`:

```bash
# Database
DB_PASSWORD=your-strong-db-password
REDIS_PASSWORD=your-strong-redis-password

# Security
JWT_SECRET_KEY=64-character-random-key
SECRET_KEY=64-character-random-key
NEXTAUTH_SECRET=32-character-random-key

# External Services
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
STRIPE_SECRET_KEY=sk_live_your-key
# ... (see template for all required variables)
```

#### Domain Configuration

Update these files with your actual domain:

- `infra/kubernetes/production/deployment.yml`
- `nginx/nginx.prod.conf`

Replace `yourdomain.com` with your actual domain.

### SSL Certificates

#### Using Let's Encrypt (Recommended)

The Kubernetes ingress is configured to automatically obtain SSL certificates from Let's Encrypt.

#### Using Custom Certificates

Place your certificates in `nginx/ssl/`:

- `tls.crt` - SSL certificate
- `tls.key` - Private key

### Database Setup

#### PostgreSQL

The production setup includes:

- Persistent volume for data
- Automated backups (configure in deployment script)
- Health checks and monitoring

#### Redis

- Persistent storage for sessions
- Password authentication
- Connection pooling configured

## Deployment Options

### Docker Compose (Recommended for Small Deployments)

```bash
# Production deployment
./scripts/deploy_production.sh

# Staging deployment
ENVIRONMENT=staging ./scripts/deploy_production.sh
```

### Kubernetes (Recommended for Large Deployments)

```bash
# Apply Kubernetes manifests
kubectl apply -f infra/kubernetes/production/

# Check deployment status
kubectl get pods -n zenith-prod
kubectl get services -n zenith-prod
```

### Manual Docker Deployment

```bash
# Build images
docker build -f src/backend/Dockerfile.prod -t zenith/backend:latest src/backend
docker build -f src/frontend/Dockerfile.prod -t zenith/frontend:latest src/frontend

# Deploy
docker-compose -f infra/docker/docker-compose.prod.yml up -d
```

## Monitoring and Observability

### Accessing Monitoring Tools

- **Grafana**: `http://your-server:3001` (admin/admin123)
- **Prometheus**: `http://your-server:9090`
- **Kibana**: `http://your-server:5601` (if using ELK stack)

### Health Checks

The deployment includes health checks for all services:

- Backend: `GET /health`
- Frontend: `GET /api/health`
- Database: PostgreSQL connection check
- Cache: Redis ping check

### Logging

- Application logs: Available in Docker logs
- Nginx access logs: `/var/log/nginx/`
- System logs: Journald/systemd

## Backup and Recovery

### Automated Backups

Configure automated backups in your deployment script:

```bash
# Database backup
docker exec zenith-postgres pg_dump -U zenith_prod_user zenith_prod > backup.sql

# Volume backup
docker run --rm -v zenith_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
```

### Recovery

```bash
# Stop services
docker-compose -f infra/docker/docker-compose.prod.yml down

# Restore database
docker exec -i zenith-postgres psql -U zenith_prod_user zenith_prod < backup.sql

# Start services
docker-compose -f infra/docker/docker-compose.prod.yml up -d
```

## Scaling

### Horizontal Scaling

```bash
# Scale backend services
docker-compose -f infra/docker/docker-compose.prod.yml up -d --scale backend=3

# Kubernetes scaling
kubectl scale deployment zenith-backend --replicas=5 -n zenith-prod
```

### Vertical Scaling

Update resource limits in:

- `infra/docker/docker-compose.prod.yml`
- `infra/kubernetes/production/deployment.yml`

## Security Considerations

### Network Security

- All services run in isolated networks
- Nginx acts as reverse proxy with rate limiting
- SSL/TLS encryption enabled

### Access Control

- Database passwords required
- Redis authentication enabled
- API rate limiting configured

### Secrets Management

- Never commit secrets to version control
- Use environment variables for secrets
- Rotate secrets regularly

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose -f infra/docker/docker-compose.prod.yml logs

# Check service health
docker-compose -f infra/docker/docker-compose.prod.yml ps
```

#### Database Connection Issues

```bash
# Check database connectivity
docker exec zenith-postgres pg_isready -U zenith_prod_user -d zenith_prod

# Check environment variables
docker exec zenith-backend env | grep DATABASE
```

#### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/tls.crt -text -noout

# Renew Let's Encrypt certificates
certbot renew
```

### Logs and Debugging

```bash
# View all logs
docker-compose -f infra/docker/docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f infra/docker/docker-compose.prod.yml logs backend

# Debug mode (temporary)
docker-compose -f infra/docker/docker-compose.prod.yml exec backend bash
```

## Performance Optimization

### Database Tuning

- Connection pooling configured
- Indexes optimized
- Query monitoring enabled

### Caching Strategy

- Redis for session storage
- Application-level caching
- CDN for static assets

### Resource Limits

- CPU and memory limits set
- Horizontal Pod Autoscaling (Kubernetes)
- Load balancing configured

## Maintenance

### Updates

```bash
# Pull latest images
docker-compose -f infra/docker/docker-compose.prod.yml pull

# Update services
docker-compose -f infra/docker/docker-compose.prod.yml up -d

# Clean up old images
docker image prune -f
```

### Monitoring Alerts

Configure alerts for:

- High CPU/memory usage
- Database connection issues
- SSL certificate expiration
- Failed health checks

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review application logs
3. Check monitoring dashboards
4. Contact the development team

## Checklist

- [ ] Domain configured and DNS updated
- [ ] SSL certificates obtained
- [ ] Secrets configured in `.env.prod`
- [ ] External services (Supabase, Stripe, etc.) configured
- [ ] Database backups configured
- [ ] Monitoring and alerting set up
- [ ] Health checks passing
- [ ] Performance tested
- [ ] Security audit completed

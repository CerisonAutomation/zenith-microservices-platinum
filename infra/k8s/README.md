# Kubernetes Infrastructure for Zenith Microservices Platform

This directory contains all Kubernetes manifests for deploying the Zenith microservices platform.

## Directory Structure

```
infra/k8s/
├── namespace.yaml                    # Namespaces for production and staging
├── configmap.yaml                    # Application configuration
├── secrets.yaml                      # Secrets template (DO NOT commit actual secrets)
├── ingress.yaml                      # Ingress configuration for routing
├── network-policy.yaml               # Network policies for security
├── resource-quota.yaml               # Resource limits and quotas
├── hpa.yaml                          # Horizontal Pod Autoscalers
├── postgres-statefulset.yaml        # PostgreSQL database
├── redis-deployment.yaml             # Redis cache
├── elasticsearch-statefulset.yaml   # Elasticsearch for search
├── frontend-deployment.yaml          # Frontend Next.js application
├── auth-service-deployment.yaml      # Authentication service
├── api-gateway-deployment.yaml       # API Gateway
├── data-service-deployment.yaml      # Data service
├── i18n-service-deployment.yaml      # Internationalization service
├── payment-service-deployment.yaml   # Payment service
└── user-service-deployment.yaml      # User service (Python)
```

## Prerequisites

1. Kubernetes cluster (v1.24+)
2. kubectl CLI installed and configured
3. Nginx Ingress Controller installed
4. cert-manager installed (for TLS certificates)
5. Container registry access (GitHub Container Registry)

## Quick Start

### 1. Create Namespaces

```bash
kubectl apply -f namespace.yaml
```

### 2. Configure Secrets

**IMPORTANT**: Do not use the default secrets in production!

```bash
# Copy the secrets template
cp secrets.yaml secrets-production.yaml

# Edit with your actual secrets
vim secrets-production.yaml

# Apply secrets
kubectl apply -f secrets-production.yaml -n zenith-production
kubectl apply -f secrets-production.yaml -n zenith-staging
```

### 3. Apply ConfigMaps

```bash
kubectl apply -f configmap.yaml -n zenith-production
kubectl apply -f configmap.yaml -n zenith-staging
```

### 4. Deploy Infrastructure Components

```bash
# Deploy PostgreSQL
kubectl apply -f postgres-statefulset.yaml -n zenith-production

# Deploy Redis
kubectl apply -f redis-deployment.yaml -n zenith-production

# Deploy Elasticsearch
kubectl apply -f elasticsearch-statefulset.yaml -n zenith-production
```

### 5. Deploy Microservices

```bash
# Deploy all services
kubectl apply -f frontend-deployment.yaml -n zenith-production
kubectl apply -f auth-service-deployment.yaml -n zenith-production
kubectl apply -f api-gateway-deployment.yaml -n zenith-production
kubectl apply -f data-service-deployment.yaml -n zenith-production
kubectl apply -f i18n-service-deployment.yaml -n zenith-production
kubectl apply -f payment-service-deployment.yaml -n zenith-production
kubectl apply -f user-service-deployment.yaml -n zenith-production
```

### 6. Apply Network Policies and Resource Limits

```bash
kubectl apply -f network-policy.yaml -n zenith-production
kubectl apply -f resource-quota.yaml
kubectl apply -f hpa.yaml -n zenith-production
```

### 7. Configure Ingress

```bash
kubectl apply -f ingress.yaml
```

## Deployment with CI/CD

The GitHub Actions workflows in `.github/workflows/` automate the deployment process:

- **ci.yml**: Runs on every PR and push to main/develop
  - Runs tests for all services
  - Performs linting and type checking
  - Builds Docker images
  - Runs security scans with Trivy
  - Reports test coverage

- **deploy-staging.yml**: Deploys to staging on push to main
  - Builds and pushes Docker images
  - Deploys to staging Kubernetes cluster
  - Runs smoke tests
  - Sends notifications

- **deploy-production.yml**: Deploys to production on release tags
  - Requires manual approval
  - Builds production Docker images
  - Deploys to production with rolling updates
  - Runs comprehensive smoke tests
  - Automatic rollback on failure
  - Creates GitHub release

## Monitoring and Observability

### View Pod Status

```bash
kubectl get pods -n zenith-production
kubectl get pods -n zenith-staging
```

### View Logs

```bash
# View logs for a specific service
kubectl logs -f deployment/frontend -n zenith-production
kubectl logs -f deployment/auth-service -n zenith-production

# View logs for all pods with a label
kubectl logs -l app=api-gateway -n zenith-production --tail=100
```

### Check Service Health

```bash
# Check service endpoints
kubectl get svc -n zenith-production
kubectl get endpoints -n zenith-production

# Port forward to test locally
kubectl port-forward svc/frontend 3000:3000 -n zenith-production
kubectl port-forward svc/api-gateway 8080:8080 -n zenith-production
```

### Scaling Services

```bash
# Manual scaling
kubectl scale deployment frontend --replicas=5 -n zenith-production

# Check HPA status
kubectl get hpa -n zenith-production
kubectl describe hpa frontend-hpa -n zenith-production
```

## Troubleshooting

### Pod Not Starting

```bash
kubectl describe pod <pod-name> -n zenith-production
kubectl logs <pod-name> -n zenith-production
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
kubectl get pods -l app=postgres -n zenith-production

# Test database connection
kubectl exec -it postgres-0 -n zenith-production -- psql -U zenith -d zenith -c "SELECT 1;"
```

### Ingress Issues

```bash
# Check ingress status
kubectl get ingress -n zenith-production
kubectl describe ingress zenith-ingress -n zenith-production

# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/name=ingress-nginx
```

### Resource Issues

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n zenith-production

# Check resource quotas
kubectl describe resourcequota -n zenith-production
```

## Backup and Restore

### PostgreSQL Backup

```bash
# Create backup
kubectl exec -it postgres-0 -n zenith-production -- \
  pg_dump -U zenith -d zenith > backup-$(date +%Y%m%d).sql

# Restore from backup
kubectl exec -i postgres-0 -n zenith-production -- \
  psql -U zenith -d zenith < backup-20250114.sql
```

### Redis Backup

```bash
# Create Redis snapshot
kubectl exec -it redis-<pod-id> -n zenith-production -- redis-cli BGSAVE

# Copy RDB file
kubectl cp zenith-production/redis-<pod-id>:/data/dump.rdb ./redis-backup.rdb
```

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to version control
   - Use Sealed Secrets or External Secrets Operator in production
   - Rotate secrets regularly

2. **Network Policies**
   - All network policies are enforced
   - Services can only communicate as defined
   - Deny all by default approach

3. **Resource Limits**
   - All pods have resource requests and limits
   - Resource quotas prevent resource exhaustion
   - HPAs ensure automatic scaling

4. **Image Security**
   - All images scanned with Trivy
   - Only approved images deployed
   - Regular security updates

## Maintenance

### Update Deployments

```bash
# Update image for a service
kubectl set image deployment/frontend \
  frontend=ghcr.io/org/zenith-microservices-platinum/frontend:v2.0.0 \
  -n zenith-production

# Rollback a deployment
kubectl rollout undo deployment/frontend -n zenith-production

# Check rollout status
kubectl rollout status deployment/frontend -n zenith-production
```

### Database Migrations

```bash
# Run migrations for auth service
kubectl exec -it deployment/auth-service -n zenith-production -- \
  npm run migrate

# Run migrations for Python services
kubectl exec -it deployment/user-service -n zenith-production -- \
  flask db upgrade
```

## Cost Optimization

- Use HPAs to scale down during low traffic
- Configure resource limits appropriately
- Use node selectors for workload placement
- Monitor and optimize resource usage regularly

## Support

For issues and questions:
- Check the main README.md in the repository root
- Review GitHub Actions workflow runs for deployment issues
- Contact the DevOps team

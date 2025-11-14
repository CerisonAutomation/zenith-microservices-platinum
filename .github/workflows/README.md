# CI/CD Pipelines for Zenith Microservices Platform

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. CI Pipeline (`ci.yml`)

**Trigger**: Pull requests and pushes to main/develop branches

**Purpose**: Validate code quality, run tests, and perform security scans

**Jobs**:

#### Service Testing Jobs (Parallel Execution)
- **frontend**: Next.js application
  - Install dependencies (npm ci)
  - Run ESLint
  - TypeScript type checking
  - Run tests with Vitest
  - Upload coverage to Codecov
  - Build production bundle

- **auth-service**: Authentication microservice (Node.js)
  - Install dependencies
  - Run ESLint
  - TypeScript type checking
  - Run Jest tests with coverage
  - Build TypeScript

- **api-gateway**: API Gateway (Node.js)
  - Install dependencies
  - Run ESLint
  - TypeScript type checking
  - Run Jest tests with coverage
  - Build TypeScript

- **data-service**: Data management service (Node.js)
  - Install dependencies
  - Run ESLint
  - TypeScript type checking
  - Run Jest tests with coverage
  - Build TypeScript

- **i18n-service**: Internationalization service (Node.js)
  - Install dependencies
  - Run ESLint
  - TypeScript type checking
  - Run Jest tests with coverage
  - Build TypeScript

- **payment-service**: Payment processing service (Node.js)
  - Install dependencies
  - Run ESLint
  - TypeScript type checking
  - Run Jest tests with coverage
  - Build TypeScript

- **user-service**: User management service (Python)
  - Install dependencies
  - Run Black formatter check
  - Run Flake8 linter
  - Run mypy type checker
  - Run pytest with coverage
  - Upload coverage to Codecov

#### Security Scanning Jobs
- **docker-security-scan**: Build Docker images and scan with Trivy
  - Matrix strategy for all 7 services
  - Build Docker images
  - Scan for vulnerabilities (CRITICAL, HIGH)
  - Upload results to GitHub Security tab

- **dependency-check**: Check for vulnerable dependencies
  - npm audit for Node.js services
  - pip-audit for Python services

#### Quality Gate
- **quality-gate**: Final check ensuring all jobs passed
  - Fails if any service test fails
  - Blocks PR merge if quality standards not met

**Environment Variables**:
- `NODE_VERSION`: 20.x
- `PYTHON_VERSION`: 3.11

**Features**:
- Dependency caching (npm, pip)
- Parallel job execution
- Code coverage reporting
- Security vulnerability scanning
- Quality gate enforcement

---

### 2. Staging Deployment (`deploy-staging.yml`)

**Trigger**: Pushes to main branch or manual workflow dispatch

**Purpose**: Automatically deploy to staging environment

**Jobs**:

#### 1. Build and Push (Matrix for all services)
- Set up Docker Buildx
- Login to GitHub Container Registry
- Build Docker images with multi-platform support
- Tag images:
  - `staging-{sha}`
  - `staging-latest`
  - Branch name
- Push to registry with layer caching
- Run Trivy security scan
- Upload security results

#### 2. Deploy to Staging
- Configure kubectl with staging cluster
- Update image tags in K8s manifests
- Apply Kubernetes configurations:
  - Namespace
  - ConfigMap
  - Secrets
  - All service deployments
- Wait for rollout completion (10 min timeout)
- Verify deployment status

#### 3. Smoke Tests
- Health check all services:
  - Frontend: https://staging.zenith-platform.com/health
  - API Gateway: https://staging-api.zenith-platform.com/health
  - Auth Service: /auth/health
  - Data Service: /data/health
  - i18n Service: /i18n/health
  - Payment Service: /payments/health
  - User Service: /users/health

#### 4. Notifications
- Send Slack notification with deployment status
- Include commit SHA, author, and environment URL

**Environment**:
- Name: staging
- URL: https://staging.zenith-platform.com
- Namespace: zenith-staging

**Required Secrets**:
- `KUBE_CONFIG_STAGING`: Base64-encoded kubeconfig
- `SLACK_WEBHOOK_URL`: Slack webhook for notifications
- `GITHUB_TOKEN`: Automatic (for registry access)

---

### 3. Production Deployment (`deploy-production.yml`)

**Trigger**:
- Push tags matching `v*.*.*` (e.g., v1.0.0)
- Manual workflow dispatch with version input

**Purpose**: Deploy to production with approval and rollback support

**Jobs**:

#### 1. Build and Push (Matrix for all services)
- Extract version from tag or manual input
- Build production Docker images
- Tag images:
  - Semantic version (e.g., `1.0.0`)
  - Major.minor version (e.g., `1.0`)
  - Major version (e.g., `1`)
  - `production-latest`
- Add build arguments:
  - VERSION
  - BUILD_DATE
  - VCS_REF
- Push to registry with caching
- Run Trivy scan (fails on CRITICAL/HIGH)
- Upload security results

#### 2. Manual Approval
- **Environment**: production-approval
- Requires manual approval from authorized users
- Deployment pauses until approved

#### 3. Blue-Green Deployment
- Backup current deployment configuration
- Update image tags to new version
- Apply Kubernetes manifests
- Rolling update strategy:
  - maxSurge: 1
  - maxUnavailable: 0
  - Zero downtime deployment
- Wait for all deployments (10 min timeout)
- Verify deployment status

#### 4. Production Smoke Tests
- Comprehensive health checks with retries
- Test all service endpoints
- Run integration tests
- Verify service functionality

#### 5. Rollback on Failure
- **Trigger**: If smoke tests fail
- Automatic rollback using `kubectl rollout undo`
- Rollback all services to previous version
- Wait for rollback completion

#### 6. Create GitHub Release
- **Trigger**: After successful deployment
- Generate changelog from commits
- Create GitHub release with:
  - Version number
  - Changelog
  - Deployed services list
  - Deployment timestamp

#### 7. Notifications
- Send Slack notification
- Send email notification
- Include:
  - Deployment status
  - Version number
  - Commit SHA
  - Author
  - Production URL

**Environment**:
- Name: production
- URL: https://zenith-platform.com
- Namespace: zenith-production
- Requires approval: Yes

**Required Secrets**:
- `KUBE_CONFIG_PRODUCTION`: Base64-encoded kubeconfig for production
- `SLACK_WEBHOOK_URL`: Slack webhook URL
- `EMAIL_USERNAME`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `NOTIFICATION_EMAIL`: Email address for notifications
- `GITHUB_TOKEN`: Automatic (for releases and registry)

---

## Setup Instructions

### 1. Configure GitHub Secrets

Navigate to your repository → Settings → Secrets and variables → Actions

#### Required Secrets

**For Staging**:
```bash
# Generate base64-encoded kubeconfig
cat ~/.kube/config-staging | base64 | pbcopy

# Add as KUBE_CONFIG_STAGING in GitHub secrets
```

**For Production**:
```bash
# Generate base64-encoded kubeconfig
cat ~/.kube/config-production | base64 | pbcopy

# Add as KUBE_CONFIG_PRODUCTION in GitHub secrets
```

**For Notifications**:
- `SLACK_WEBHOOK_URL`: Create webhook in Slack
- `EMAIL_USERNAME`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `NOTIFICATION_EMAIL`: Recipient email

### 2. Configure Environments

Create protected environments in GitHub:

1. **staging**:
   - No required reviewers
   - Deployment branch rule: main

2. **production-approval**:
   - Required reviewers: Add team members
   - Wait timer: Optional
   - Deployment branch rule: Tags matching v*

3. **production**:
   - Required reviewers: Add team members
   - Deployment branch rule: Tags matching v*

### 3. Enable GitHub Container Registry

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# The workflows will automatically push to:
# ghcr.io/YOUR_ORG/zenith-microservices-platinum/SERVICE_NAME:TAG
```

### 4. Install Required Tools in Cluster

#### Nginx Ingress Controller
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml
```

#### cert-manager (for TLS)
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

---

## Usage

### Running CI on Pull Requests

CI runs automatically on all PRs. To run locally:

```bash
# Run tests for all services
npm test --workspaces

# Run linting
npm run lint --workspaces

# Run type checking
npm run type-check --workspaces
```

### Deploying to Staging

**Automatic**: Push to main branch

**Manual**:
```bash
# Trigger workflow manually
gh workflow run deploy-staging.yml
```

### Deploying to Production

**Create a release tag**:
```bash
# Create and push a version tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

**Manual deployment**:
```bash
# Trigger workflow with specific version
gh workflow run deploy-production.yml -f version=v1.0.0
```

**Approve deployment**:
1. Go to Actions tab
2. Click on the running workflow
3. Click "Review deployments"
4. Select "production-approval"
5. Click "Approve and deploy"

### Monitoring Deployments

```bash
# View workflow runs
gh run list --workflow=deploy-production.yml

# View specific run
gh run view <run-id>

# Watch logs
gh run watch <run-id>
```

---

## Troubleshooting

### Build Failures

**Problem**: Docker build fails
- Check Dockerfile syntax
- Verify all dependencies are available
- Check build logs in Actions tab

**Problem**: Tests fail
- Run tests locally first
- Check for missing environment variables
- Review test logs

### Deployment Failures

**Problem**: Image pull errors
- Verify registry authentication
- Check image tags are correct
- Ensure GITHUB_TOKEN has package:write permission

**Problem**: Deployment timeout
- Check pod status: `kubectl get pods -n zenith-production`
- Review pod logs: `kubectl logs -f deployment/SERVICE_NAME`
- Check resource constraints

**Problem**: Health checks fail
- Verify service is running: `kubectl get svc`
- Check ingress configuration
- Test health endpoints directly

### Rollback

**Automatic**: Production deployments rollback automatically on failure

**Manual rollback**:
```bash
# Rollback specific service
kubectl rollout undo deployment/frontend -n zenith-production

# Rollback to specific revision
kubectl rollout undo deployment/frontend -n zenith-production --to-revision=2

# Check rollout history
kubectl rollout history deployment/frontend -n zenith-production
```

---

## Best Practices

1. **Always run CI locally before pushing**
   ```bash
   npm test && npm run lint && npm run type-check
   ```

2. **Use semantic versioning for releases**
   - Major: Breaking changes (v2.0.0)
   - Minor: New features (v1.1.0)
   - Patch: Bug fixes (v1.0.1)

3. **Test in staging before production**
   - Always deploy to staging first
   - Run manual QA tests
   - Verify all functionality

4. **Monitor deployments**
   - Watch deployment progress
   - Check application logs
   - Verify metrics and alerts

5. **Write meaningful commit messages**
   - CI uses commits for changelog
   - Be descriptive and clear

6. **Keep secrets secure**
   - Never commit secrets
   - Rotate regularly
   - Use strong passwords

---

## Performance Optimization

- **Dependency Caching**: npm and pip dependencies cached
- **Docker Layer Caching**: Registry caching for faster builds
- **Parallel Execution**: All service tests run in parallel
- **Incremental Builds**: Only affected services rebuilt

---

## Security

- **Trivy Scanning**: All images scanned for vulnerabilities
- **Dependency Auditing**: npm audit and pip-audit
- **SARIF Upload**: Results uploaded to GitHub Security tab
- **Secret Management**: Kubernetes secrets for sensitive data
- **Network Policies**: Restrict inter-service communication
- **Resource Limits**: Prevent resource exhaustion

---

## Metrics and Monitoring

- **Test Coverage**: Reported to Codecov
- **Build Times**: Tracked in Actions
- **Deployment Success Rate**: View in Actions tab
- **Application Metrics**: Use Prometheus/Grafana

---

## Support

For issues:
1. Check this README
2. Review workflow logs in Actions tab
3. Check Kubernetes cluster status
4. Contact DevOps team

---

## Future Enhancements

- [ ] Add canary deployments
- [ ] Implement A/B testing
- [ ] Add performance testing
- [ ] Integrate with monitoring tools
- [ ] Add automated database migrations
- [ ] Implement feature flags
- [ ] Add chaos engineering tests

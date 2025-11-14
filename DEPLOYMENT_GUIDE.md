# 🚀 Zenith Dating Platform - Production Deployment Guide

## Quick Deployment Steps

### Option 1: Vercel (Recommended)

#### 1. Deploy via Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy to production
cd /home/user/zenith-microservices-platinum
vercel --prod
```

#### 2. Deploy via Vercel Dashboard
1. Visit https://vercel.com/new
2. Import your GitHub repository
3. Configure the following:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/frontend`
   - **Build Command:** `cd ../.. && npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `pnpm install`

#### 3. Environment Variables (Critical!)
Add these in Vercel Dashboard → Settings → Environment Variables:

**Supabase (Required):**
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Application:**
```bash
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NODE_ENV=production
JWT_SECRET=your_32_char_secret
```

**Stripe (If using payments):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Daily.co (If using video calls):**
```bash
NEXT_PUBLIC_DAILY_API_KEY=your_daily_api_key
```

**Optional Services:**
```bash
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_key
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**CORS:**
```bash
CORS_ALLOWED_ORIGINS=https://your-domain.vercel.app,https://www.your-domain.com
```

---

## Option 2: Docker Deployment

### 1. Build Docker Images

**Frontend:**
```bash
cd apps/frontend
docker build -t zenith-frontend:latest .
docker tag zenith-frontend:latest your-registry/zenith-frontend:latest
docker push your-registry/zenith-frontend:latest
```

**Backend (if applicable):**
```bash
cd apps/backend
docker build -t zenith-backend:latest .
docker tag zenith-backend:latest your-registry/zenith-backend:latest
docker push your-registry/zenith-backend:latest
```

### 2. Deploy with Docker Compose

**Basic deployment:**
```bash
docker-compose up -d
```

**Full microservices:**
```bash
docker-compose -f docker-compose.platinum.yml up -d
```

**With all services:**
```bash
docker-compose -f docker-compose.full.yml up -d
```

---

## Option 3: Kubernetes Deployment

### 1. Using Helm Chart

```bash
# Navigate to infrastructure directory
cd infrastructure/helm

# Install/Upgrade the Helm chart
helm upgrade --install zenith ./zenith \
  --namespace zenith-production \
  --create-namespace \
  --set frontend.replicaCount=5 \
  --set backend.replicaCount=5 \
  --set frontend.image.tag=latest \
  --set backend.image.tag=latest \
  --values values-production.yaml
```

### 2. Using kubectl directly

```bash
# Apply Kubernetes manifests
kubectl apply -f infrastructure/kubernetes/namespace.yaml
kubectl apply -f infrastructure/kubernetes/configmap.yaml
kubectl apply -f infrastructure/kubernetes/frontend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/backend-deployment.yaml
kubectl apply -f infrastructure/kubernetes/redis-deployment.yaml
kubectl apply -f infrastructure/kubernetes/ingress.yaml
kubectl apply -f infrastructure/kubernetes/monitoring.yaml
```

### 3. Using Skaffold (Development to Production)

```bash
# Development
skaffold dev

# Production deployment
skaffold run --profile production
```

### 4. Using ArgoCD (GitOps)

```bash
# Apply ArgoCD application
kubectl apply -f infrastructure/argocd/application.yaml

# Sync manually (or wait for auto-sync)
argocd app sync zenith-production

# Check status
argocd app get zenith-production
```

---

## Pre-Deployment Checklist

### 1. Environment Variables ✅
```bash
# Verify all required environment variables are set
cat .env.example | grep "REQUIRED"
```

**Critical Variables to Set:**
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `JWT_SECRET` (min 32 characters)
- ✅ `NEXT_PUBLIC_APP_URL`
- ✅ `CORS_ALLOWED_ORIGINS`

### 2. Database Setup ✅

**Run Supabase Migrations:**
```bash
# If using Supabase CLI
supabase db push

# Or run migrations directly
psql $DATABASE_URL < supabase/migrations/20250114000000_add_missing_features.sql
psql $DATABASE_URL < supabase/migrations/20250114100000_native_solutions_and_security.sql
psql $DATABASE_URL < supabase/migrations/20250114200000_critical_fixes.sql
psql $DATABASE_URL < supabase/migrations/20250114210000_realtime_features.sql
psql $DATABASE_URL < supabase/migrations/20250114220000_optimize_nearby_users.sql
```

### 3. Build Verification ✅

```bash
# Test production build locally
cd apps/frontend
npm run build

# Expected output: ✓ Compiled successfully
# Build time: < 3 minutes
# No errors or warnings
```

### 4. Security Verification ✅

**Check for secrets in code:**
```bash
# Use trufflehog or similar
trufflehog filesystem . --only-verified

# Or manual grep
grep -r "api_key\|password\|secret" apps/frontend/src --exclude-dir=node_modules
```

**Verify security headers:**
```bash
# After deployment, test headers
curl -I https://your-domain.vercel.app | grep -i "x-frame-options\|strict-transport\|content-security"
```

### 5. Test Deployment Locally ✅

```bash
# Build and start production server
cd apps/frontend
npm run build
npm run start

# Server should start on http://localhost:3000
# Test critical paths:
# - Homepage loads
# - Authentication works
# - Profile viewing works
# - Booking flow works
```

---

## Post-Deployment Steps

### 1. Verify Deployment ✅

**Check application status:**
```bash
# Vercel
vercel ls

# Kubernetes
kubectl get pods -n zenith-production
kubectl get svc -n zenith-production
kubectl get ingress -n zenith-production

# Docker
docker ps
```

**Test critical endpoints:**
```bash
# Homepage
curl https://your-domain.vercel.app

# Health check (if implemented)
curl https://your-domain.vercel.app/api/health

# API test
curl https://your-domain.vercel.app/api/auth/callback
```

### 2. Run Lighthouse Audit ✅

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.vercel.app \
  --output html \
  --output-path ./lighthouse-report.html \
  --chrome-flags="--headless"

# Expected scores:
# Performance: 90+
# Accessibility: 95+
# Best Practices: 95+
# SEO: 90+
```

### 3. Monitor Initial Traffic ✅

**Vercel Analytics:**
- Visit: https://vercel.com/[your-team]/[your-project]/analytics
- Monitor: Core Web Vitals, Real User Monitoring

**Error Tracking:**
```bash
# If using Sentry, verify events are being captured
# Check Sentry dashboard for any errors
```

**Application Logs:**
```bash
# Vercel
vercel logs [deployment-url]

# Kubernetes
kubectl logs -f deployment/frontend -n zenith-production

# Docker
docker logs -f zenith-frontend
```

### 4. Performance Monitoring ✅

**Core Web Vitals to Monitor:**
- **LCP (Largest Contentful Paint):** < 2.5s ✅
- **FID (First Input Delay):** < 100ms ✅
- **CLS (Cumulative Layout Shift):** < 0.1 ✅
- **FCP (First Contentful Paint):** < 1.5s ✅
- **TTI (Time to Interactive):** < 3.5s ✅

**Monitoring Tools:**
- Vercel Analytics (built-in)
- Google Analytics 4
- Sentry Performance Monitoring
- Prometheus + Grafana (if using K8s)

### 5. Security Monitoring ✅

**Enable:**
- ✅ Vercel Firewall (WAF)
- ✅ Bot protection
- ✅ DDoS protection
- ✅ Rate limiting alerts
- ✅ Failed authentication alerts

**Regular Security Checks:**
```bash
# Run npm audit
npm audit

# Check for outdated packages
npm outdated

# Scan with Snyk or similar
snyk test
```

---

## Scaling Configuration

### Vercel Auto-Scaling
Vercel automatically scales based on traffic. No configuration needed! ✅

### Kubernetes Auto-Scaling

**Horizontal Pod Autoscaler (HPA):**
```yaml
# Already configured in deployment.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**Verify HPA:**
```bash
kubectl get hpa -n zenith-production
```

### Database Scaling

**Supabase:**
- Upgrade to Pro plan for connection pooling
- Enable read replicas for read-heavy workloads
- Configure pgBouncer for connection management

---

## Rollback Procedures

### Vercel Rollback

**Via Dashboard:**
1. Go to Deployments tab
2. Find previous stable deployment
3. Click "..." → "Promote to Production"

**Via CLI:**
```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]
```

### Kubernetes Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/frontend -n zenith-production

# Rollback to specific revision
kubectl rollout undo deployment/frontend --to-revision=2 -n zenith-production

# Check rollout status
kubectl rollout status deployment/frontend -n zenith-production
```

### Docker Rollback

```bash
# Pull previous version
docker pull your-registry/zenith-frontend:previous-tag

# Stop current container
docker stop zenith-frontend

# Start previous version
docker run -d --name zenith-frontend your-registry/zenith-frontend:previous-tag
```

---

## Monitoring & Alerts

### Recommended Alerts

**Performance Alerts:**
- Page load time > 3s
- API response time > 1s
- Error rate > 1%

**Security Alerts:**
- Failed authentication > 5 attempts/min
- Rate limit exceeded
- Unusual traffic patterns

**Infrastructure Alerts:**
- CPU usage > 80%
- Memory usage > 85%
- Disk usage > 90%
- Pod restarts

### Alert Channels
- Email notifications
- Slack integration
- PagerDuty for critical issues

---

## Backup & Disaster Recovery

### Database Backups

**Supabase:**
- Automatic daily backups (Pro plan)
- Point-in-time recovery available
- Download manual backup:
  ```bash
  pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
  ```

### Application Backups

**Git Repository:**
- All code versioned in Git ✅
- Can redeploy any previous commit

**Environment Variables:**
- Export from Vercel dashboard
- Store securely in password manager

### Disaster Recovery Plan

1. **Data Loss:** Restore from latest Supabase backup
2. **Deployment Failure:** Rollback to previous deployment
3. **Security Breach:**
   - Rotate all secrets immediately
   - Force logout all users
   - Review audit logs
   - Deploy security patches

---

## Performance Optimization Tips

### CDN Configuration
- ✅ Already configured with Vercel Edge Network
- Assets automatically cached globally

### Image Optimization
- ✅ Using Next.js Image component
- ✅ WebP/AVIF conversion enabled
- ✅ Responsive images configured

### Caching Strategy
```javascript
// Already configured in next.config.js
{
  source: '/api/:path*',
  headers: [
    { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=600' }
  ]
}
```

### Database Optimization
- ✅ Indexes on frequently queried fields
- ✅ Connection pooling via Supabase
- ✅ PostGIS for efficient geospatial queries

---

## Troubleshooting Common Issues

### Build Failures

**Error: "Module not found"**
```bash
# Solution: Clear cache and rebuild
rm -rf node_modules .next
npm install
npm run build
```

**Error: "Type error in production build"**
```bash
# Solution: Run type check
npm run type-check
# Fix reported errors
```

### Deployment Failures

**Error: "Environment variables not set"**
- Verify all required env vars in deployment platform
- Check for typos in variable names

**Error: "Database connection failed"**
- Verify DATABASE_URL is correct
- Check database is accessible from deployment environment
- Verify IP whitelist includes deployment platform

### Runtime Errors

**Error: "CORS policy blocked"**
- Add deployment domain to CORS_ALLOWED_ORIGINS
- Update CORS configuration in middleware

**Error: "Rate limit exceeded"**
- Check rate limit configuration
- Consider increasing limits for production
- Implement Redis-based distributed rate limiting

---

## Support & Resources

### Documentation
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

### Monitoring
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://app.supabase.com

### Community
- Next.js Discord: https://nextjs.org/discord
- Supabase Discord: https://discord.supabase.com

---

## Final Checklist Before Going Live

- [ ] All environment variables set in production
- [ ] Database migrations applied
- [ ] SSL/TLS certificate configured (automatic with Vercel)
- [ ] Domain name configured and DNS updated
- [ ] Security headers verified
- [ ] Performance tested (Lighthouse score 90+)
- [ ] Error tracking configured (Sentry recommended)
- [ ] Monitoring and alerts set up
- [ ] Backup strategy verified
- [ ] Team has access to all platforms
- [ ] Rollback procedure tested
- [ ] Documentation updated with production URLs
- [ ] Load testing completed (optional but recommended)
- [ ] Legal pages updated (Privacy Policy, Terms of Service)
- [ ] GDPR compliance verified (if serving EU users)
- [ ] Payment processor configured (if using payments)

---

## 🎉 Congratulations!

Your Zenith Dating Platform is now live and ready to serve users worldwide!

**Key Metrics to Track:**
- Daily Active Users (DAU)
- User engagement (messages, bookings)
- Conversion rate (sign-ups to paid)
- Core Web Vitals
- Error rate
- API response times

**Best of luck with your launch! 🚀**

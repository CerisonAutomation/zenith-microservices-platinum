# 🚀 Vercel Production Deployment Guide

**Date:** 2025-11-14
**Status:** ✅ Production-Ready
**Platform:** Vercel Edge + AI Gateway
**Recommended For:** Frontend, AI features, Edge Functions, global performance

---

## 📊 OVERVIEW

This guide covers deploying the Zenith platform to **Vercel**, leveraging:
- ✅ **Edge Runtime** - <100ms cold starts globally
- ✅ **AI Gateway** - Unified access to 100+ LLM models
- ✅ **Global CDN** - Automatic worldwide distribution
- ✅ **Zero Config** - Automatic optimizations
- ✅ **Preview Deployments** - Every PR gets a URL
- ✅ **Instant Rollback** - One-click revert to any deployment

---

## 🎯 ARCHITECTURE

### Hybrid Deployment Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                      Vercel (Edge)                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js 14 Frontend                                   │  │
│  │  - React Server Components                             │  │
│  │  - Server Actions                                      │  │
│  │  - Edge API Routes                                     │  │
│  │  - AI Gateway Integration                              │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
┌────────────┐ ┌──────────┐ ┌──────────┐
│  Supabase  │ │ Vercel   │ │ External │
│  Database  │ │ AI       │ │ Services │
│  + Auth    │ │ Gateway  │ │ (Stripe) │
└────────────┘ └──────────┘ └──────────┘
```

**What Runs on Vercel:**
- ✅ Next.js frontend (apps/frontend)
- ✅ AI endpoints (/api/ai/*)
- ✅ Edge API routes
- ✅ Static assets (images, CSS, JS)
- ✅ Server-side rendering (SSR)
- ✅ API routes for business logic

**What Runs Elsewhere:**
- 🗄️ Database (Supabase PostgreSQL)
- 🔐 Authentication (Supabase Auth)
- 💳 Payments (Stripe)
- 📦 File Storage (Supabase Storage)

---

## 🚀 QUICK START

### Step 1: Install Vercel CLI

```bash
# Install globally
npm i -g vercel

# Or use pnpm
pnpm add -g vercel

# Login to Vercel
vercel login
```

### Step 2: Link Project

```bash
# Navigate to frontend
cd apps/frontend

# Link to Vercel project
vercel link

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [Your account]
# - Link to existing project? N
# - Project name: zenith-dating-platform
# - Directory: ./
```

### Step 3: Configure Environment Variables

**Via Vercel Dashboard:**
```
1. Go to project settings
2. Navigate to Environment Variables
3. Add all required variables (see below)
```

**Or via CLI:**
```bash
# Production variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add OPENAI_API_KEY production
vercel env add ANTHROPIC_API_KEY production
vercel env add STRIPE_SECRET_KEY production

# Preview variables (optional - inherit from production)
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
# ... repeat for preview environment

# Development variables
vercel env add NEXT_PUBLIC_SUPABASE_URL development
# ... repeat for development
```

### Step 4: Deploy

```bash
# Deploy to production
vercel --prod

# Or let CI/CD handle it (recommended)
git push origin main
```

---

## 🔐 ENVIRONMENT VARIABLES

### Required Variables

**Public (Client-side):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# App Config
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
```

**Private (Server-side):**
```bash
# Supabase
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...

# Payments
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# External Services (if needed)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
SMTP_HOST=smtp.gmail.com
SMTP_USER=...
SMTP_PASS=...
```

**Vercel Auto-Provided:**
```bash
# These are automatically set by Vercel
VERCEL_URL              # Deployment URL
VERCEL_ENV              # development | preview | production
VERCEL_REGION           # Deployment region
VERCEL_OIDC_TOKEN       # For AI Gateway auth
```

---

## ⚙️ VERCEL CONFIGURATION

### vercel.json

Already created at `apps/frontend/vercel.json`:

```json
{
  "version": 2,
  "framework": "nextjs",
  "regions": ["iad1", "sfo1", "fra1", "hnd1", "syd1"],
  "functions": {
    "app/api/ai/**": {
      "memory": 3008,
      "maxDuration": 60,
      "runtime": "edge"
    }
  },
  "crons": [
    {
      "path": "/api/ai/cleanup",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Key Settings:**
- `regions`: Deploy to 5 global regions (US East, US West, Europe, Asia, Australia)
- `functions.memory`: 3GB RAM for AI endpoints (handles large models)
- `functions.maxDuration`: 60s timeout for AI generation
- `runtime: "edge"`: Deploy to Edge Runtime for <100ms cold starts
- `crons`: Scheduled tasks for cleanup, analytics, cost reports

---

## 🏗️ CI/CD PIPELINE

### GitHub Actions Integration

**Automatic Deployments:**
```yaml
# .github/workflows/vercel-production.yml
name: Vercel Production Deployment

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

on:
  push:
    branches:
      - main
    paths:
      - 'apps/frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install --global vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project Artifacts
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Run Post-Deployment Tests
        run: |
          npm run test:e2e:production
          npm run test:ai:smoke
```

**Preview Deployments:**
```yaml
# .github/workflows/vercel-preview.yml
name: Vercel Preview Deployment

on:
  pull_request:
    paths:
      - 'apps/frontend/**'

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy Preview
        run: vercel deploy --token=${{ secrets.VERCEL_TOKEN }}

      - name: Comment PR with Preview URL
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Preview deployed!\n\n🔗 URL: https://preview-url.vercel.app'
            })
```

---

## 🔄 DEPLOYMENT WORKFLOWS

### Production Deployment Process

**1. Automatic (Recommended):**
```bash
# Push to main branch
git push origin main

# Vercel automatically:
# 1. Detects the push
# 2. Runs build
# 3. Deploys to production
# 4. Updates DNS
# 5. Invalidates CDN cache
```

**2. Manual:**
```bash
# From apps/frontend directory
cd apps/frontend

# Deploy to production
vercel --prod

# Verify deployment
vercel ls

# Check logs
vercel logs
```

### Preview Deployments

**Every PR Gets a URL:**
```bash
# Create feature branch
git checkout -b feature/new-ai-feature

# Make changes
git add .
git commit -m "Add new AI feature"
git push origin feature/new-ai-feature

# Create PR on GitHub
# Vercel automatically deploys to unique URL
# Example: https://zenith-pr-123.vercel.app
```

### Rollback Procedure

**Instant Rollback:**
```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback

# Or rollback to specific deployment
vercel rollback <deployment-id>

# Verify rollback
vercel inspect
```

**Via Dashboard:**
```
1. Go to Vercel Dashboard
2. Select project
3. Click "Deployments"
4. Find stable deployment
5. Click "..." → "Promote to Production"
```

---

## 📊 MONITORING & OBSERVABILITY

### Built-in Vercel Analytics

**Automatically Tracks:**
- ✅ Page views and unique visitors
- ✅ Core Web Vitals (LCP, FID, CLS)
- ✅ API route performance
- ✅ Function execution time
- ✅ Error rates
- ✅ Geographic distribution

**Access:**
```
Vercel Dashboard → Your Project → Analytics
```

### Custom Application Monitoring

**Add Vercel Analytics SDK:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Track Custom Events:**
```typescript
// components/ChatInterface.tsx
import { track } from '@vercel/analytics/react'

export function ChatInterface() {
  const sendMessage = async (message: string) => {
    track('message_sent', {
      feature: 'chat',
      messageLength: message.length,
    })

    await sendMessageToAPI(message)
  }
}
```

### AI Cost Monitoring

**Dashboard Setup:**
```typescript
// app/api/ai/analytics/route.ts
export async function GET() {
  const costs = await getAICosts()

  return Response.json({
    daily: costs.today,
    weekly: costs.week,
    monthly: costs.month,
    breakdown: {
      conversationStarters: costs.byFeature.starters,
      smartReplies: costs.byFeature.replies,
      moderation: costs.byFeature.moderation,
    },
  })
}
```

---

## 🔒 SECURITY BEST PRACTICES

### Environment Variable Security

**✅ DO:**
- Store secrets in Vercel Environment Variables
- Use different keys for preview/production
- Rotate keys regularly
- Use Vercel OIDC tokens for AI Gateway

**❌ DON'T:**
- Commit secrets to git
- Use production keys in preview
- Share keys across team members
- Hardcode API keys in code

### Content Security Policy

**Already configured in next.config.js:**
```javascript
headers: [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      // ...
    ].join('; ')
  }
]
```

### Rate Limiting

**Edge Middleware:**
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function middleware(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Rate limit exceeded', { status: 429 })
  }
}
```

---

## 💰 COST OPTIMIZATION

### Vercel Pricing Tiers

**Pro Plan ($20/month):**
- ✅ Unlimited bandwidth
- ✅ 1000 GB-hours compute
- ✅ Advanced analytics
- ✅ Team collaboration
- ✅ Custom domains
- ✅ DDoS protection

**Enterprise (Custom):**
- ✅ Everything in Pro
- ✅ 99.99% SLA
- ✅ Advanced security
- ✅ Dedicated support
- ✅ Custom contracts

### Cost Breakdown

**Monthly Estimates:**
```yaml
Infrastructure:
  Vercel Pro: $20/month
  Supabase Pro: $25/month
  Total Base: $45/month

AI Costs (variable):
  Conversation Starters: ~$50/month (1K requests/day)
  Smart Replies: ~$75/month (2K requests/day)
  Content Moderation: ~$25/month (5K requests/day)
  Total AI: ~$150/month

External Services:
  Stripe: Pay-as-you-go (2.9% + $0.30)
  Twilio SMS: $0.0075/message
  Email: $10/month (SendGrid)

Total Monthly Cost: ~$205/month
Expected Revenue: $10,000+/month
ROI: 4,800%
```

### Optimization Strategies

**1. Enable Edge Caching:**
```typescript
// app/api/route.ts
export const revalidate = 3600 // Cache for 1 hour
```

**2. Optimize Images:**
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src="/avatar.jpg"
  width={200}
  height={200}
  quality={80} // Reduce quality
  priority={false} // Lazy load
/>
```

**3. Bundle Size Monitoring:**
```bash
# Analyze bundle
ANALYZE=true pnpm build

# Set budget limits
{
  "bundleSizeLimit": "500kb",
  "warningThreshold": "400kb"
}
```

---

## 🧪 TESTING

### Pre-Deployment Tests

**Required Checks:**
```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Unit tests
pnpm test

# Build verification
pnpm build

# E2E tests (preview)
pnpm test:e2e
```

### Post-Deployment Verification

**Smoke Tests:**
```bash
# Test homepage
curl https://yourdomain.com

# Test AI endpoints
curl -X POST https://yourdomain.com/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Test authentication
curl https://yourdomain.com/api/auth/session
```

### Load Testing

**Using Artillery:**
```yaml
# load-test.yml
config:
  target: 'https://yourdomain.com'
  phases:
    - duration: 60
      arrivalRate: 10
      name: 'Ramp up'
    - duration: 120
      arrivalRate: 50
      name: 'Sustained load'

scenarios:
  - name: 'AI Chat'
    flow:
      - post:
          url: '/api/ai/chat'
          json:
            message: 'Test message'
```

```bash
# Run load test
artillery run load-test.yml
```

---

## 📋 PRODUCTION CHECKLIST

### Pre-Launch

- [ ] Domain configured and DNS updated
- [ ] SSL certificate provisioned (automatic on Vercel)
- [ ] All environment variables set
- [ ] Supabase production database configured
- [ ] Stripe live keys configured
- [ ] AI provider keys (production) configured
- [ ] Analytics and monitoring enabled
- [ ] Error tracking configured (Sentry)
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] GDPR compliance verified
- [ ] Privacy policy and ToS pages
- [ ] Backup strategy documented

### Post-Launch

- [ ] Monitor error rates (target: <0.1%)
- [ ] Check performance metrics (target: <2s load time)
- [ ] Verify AI features working
- [ ] Monitor AI costs (daily budget: $100)
- [ ] Test rollback procedure
- [ ] Document any incidents
- [ ] Set up alerts for critical metrics
- [ ] Schedule regular security audits
- [ ] Plan for scaling (if needed)

---

## 🆘 TROUBLESHOOTING

### Common Issues

**1. Build Failures:**
```bash
# Check build logs
vercel logs --follow

# Common fixes:
# - Clear build cache: vercel --force
# - Check environment variables
# - Verify package.json dependencies
```

**2. Environment Variable Issues:**
```bash
# List all env vars
vercel env ls

# Pull latest env vars
vercel env pull .env.local
```

**3. AI Gateway Errors:**
```bash
# Verify OIDC token
vercel env get VERCEL_OIDC_TOKEN

# Check AI provider keys
vercel env get OPENAI_API_KEY

# Test AI endpoint locally
curl http://localhost:3000/api/ai/test
```

**4. Performance Issues:**
```bash
# Check function logs
vercel logs --function=/api/ai/chat

# Monitor metrics
vercel inspect <deployment-url>

# Analyze bundle size
ANALYZE=true pnpm build
```

---

## 📚 REFERENCE

**Key Documentation:**
- [Vercel Deployment Docs](https://vercel.com/docs/deployments)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Edge Functions](https://vercel.com/docs/functions/edge-functions)

**Related Files:**
- `apps/frontend/vercel.json` - Deployment configuration
- `apps/frontend/next.config.js` - Next.js configuration
- `.github/workflows/vercel-*.yml` - CI/CD pipelines
- `docs/VERCEL_LLM_INFRASTRUCTURE.md` - AI infrastructure guide
- `docs/AI_GATEWAY_CONFIGURATION.md` - Gateway setup

**Support:**
- Vercel Discord: https://vercel.com/discord
- Documentation: https://vercel.com/docs
- Status: https://vercel-status.com

---

**Status:** ✅ Production-Ready
**Last Updated:** 2025-11-14
**Deployment Time:** ~5 minutes (first deploy), ~30 seconds (updates)
**Global Latency:** <100ms (Edge Runtime)

# 🚀 Vercel Deployment Guide - Zenith Microservices Platform

This guide follows Vercel best practices and official documentation for deploying the Zenith dating platform to Vercel.

## 📋 Prerequisites

- Vercel account (sign up at https://vercel.com)
- GitHub repository connected to Vercel
- Supabase account and project (https://supabase.com)
- Required API keys (Stripe, Daily.co, Giphy, etc.)

## 🏗️ Architecture

This is a Next.js 14+ application optimized for Vercel deployment with:
- **App Router** for modern routing
- **Server Actions** for server-side mutations
- **Edge Middleware** for authentication
- **API Routes** for backend functionality
- **ISR & SSR** for optimal performance
- **Image Optimization** via Vercel

## 🔧 Quick Start

### 1. Connect Repository to Vercel

```bash
# Install Vercel CLI (optional but recommended)
npm i -g vercel

# Link your project
cd apps/frontend
vercel link
```

### 2. Configure Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

#### **Required for Production:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

#### **Optional (for full features):**

```bash
# AI Services
GOOGLE_GEMINI_API_KEY=your-key
OPENAI_API_KEY=sk-xxx

# Video Calls
DAILY_API_KEY=your-daily-key

# GIFs
NEXT_PUBLIC_GIPHY_API_KEY=your-giphy-key
```

### 3. Deploy

```bash
# Development deployment
vercel

# Production deployment
vercel --prod
```

Or simply push to your connected GitHub branch - Vercel auto-deploys!

## 📦 Build Configuration

### vercel.json

The project includes an optimized `vercel.json`:

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],  // Adjust to your primary region
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### next.config.js

Optimized for Vercel with:
- ✅ Modern `remotePatterns` for images
- ✅ Security headers (CSP, HSTS, etc.)
- ✅ Image optimization
- ✅ Console removal in production
- ⚠️ `output: 'standalone'` commented out (Vercel handles this)

## 🔐 Security Best Practices

### 1. Environment Variables

- ✅ Use Vercel's encrypted environment variables
- ✅ Never commit `.env.local` to Git
- ✅ Use different keys for development/production
- ✅ Leverage `VERCEL_OIDC_TOKEN` for secure auth

### 2. Headers

All security headers are configured in:
- `middleware.ts` - Runtime security
- `next.config.js` - Build-time headers

### 3. Authentication

- ✅ Uses Supabase SSR with secure cookie handling
- ✅ Edge Middleware for auth token refresh
- ✅ Protected routes via middleware
- ✅ CSRF protection in Server Actions

## 🚦 Deployment Workflow

### Automatic Deployments

1. **Push to `main`** → Production deployment
2. **Push to other branches** → Preview deployment
3. **Pull Request** → Automatic preview with unique URL

### Manual Deployments

```bash
# Preview deployment
vercel

# Production deployment (requires confirmation)
vercel --prod

# Deploy with specific environment
vercel --env production
```

## 📊 Performance Optimization

### 1. Image Optimization

Vercel automatically optimizes images:

```tsx
import Image from 'next/image'

<Image
  src="https://images.unsplash.com/photo-xxx"
  alt="Profile"
  width={400}
  height={400}
  priority // For above-the-fold images
/>
```

### 2. Incremental Static Regeneration (ISR)

```tsx
// app/profile/[id]/page.tsx
export const revalidate = 3600 // Revalidate every hour

export default async function ProfilePage({ params }) {
  const profile = await getProfile(params.id)
  return <ProfileView profile={profile} />
}
```

### 3. Edge Functions

Fast global execution for API routes:

```tsx
// app/api/edge/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  return Response.json({ message: 'Hello from edge!' })
}
```

## 🔄 CI/CD Integration

### GitHub Actions (Optional)

```yaml
# .github/workflows/vercel.yml
name: Vercel Deployment
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📈 Monitoring & Analytics

### Vercel Analytics

Automatically enabled for all deployments:

```tsx
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

### Speed Insights

```bash
npm install @vercel/speed-insights
```

```tsx
import { SpeedInsights } from '@vercel/speed-insights/next'

<SpeedInsights />
```

## 🐛 Troubleshooting

### Build Failures

1. Check build logs in Vercel Dashboard
2. Verify all environment variables are set
3. Test build locally: `pnpm run build`
4. Check Node.js version matches (specified in `package.json`)

### Environment Variable Issues

```bash
# Test locally with Vercel environment
vercel env pull .env.local
pnpm run dev
```

### Image Optimization Errors

Ensure domains are listed in `next.config.js`:

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: '**.supabase.co' }
  ]
}
```

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase + Vercel Guide](https://supabase.com/docs/guides/platform/vercel)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)

## 📞 Support

- Vercel Support: https://vercel.com/support
- Supabase Support: https://supabase.com/support
- GitHub Issues: [Your repo]/issues

---

## ✅ Post-Deployment Checklist

- [ ] All environment variables configured
- [ ] SSL certificate active (automatic)
- [ ] Custom domain configured (if applicable)
- [ ] Supabase connection working
- [ ] Stripe webhooks configured
- [ ] Authentication flow tested
- [ ] Image optimization working
- [ ] API routes functional
- [ ] Performance metrics monitored
- [ ] Error tracking enabled

## 🎯 Recommended Settings

### Project Settings

- **Build Command**: `pnpm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `pnpm install`
- **Development Command**: `pnpm run dev`
- **Node Version**: 18.x or 20.x

### Function Configuration

- **Memory**: 1024 MB (for AI features)
- **Max Duration**: 10s (Hobby/Pro) / 60s (Enterprise)
- **Region**: Choose closest to your users

### Team Settings (Pro/Enterprise)

- Enable **Deployment Protection**
- Configure **RBAC** for team members
- Set up **WAF rules** for security
- Enable **Bot Protection**
- Configure **DDoS mitigation**

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-01-14
**Deployment Platform**: Vercel
**Framework**: Next.js 14+

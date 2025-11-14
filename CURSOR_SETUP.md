# 🎯 ZENITH DATING PLATFORM - ONE-COMMAND SETUP FOR CURSOR IDE

**Complete dating platform setup in a single command - ready in 5 minutes!**

---

## 🚀 ONE-COMMAND SETUP

```bash
bash setup-cursor.sh
```

That's it! The script will:
- ✅ Check all prerequisites (Node.js, pnpm, Python, Docker)
- ✅ Create Turborepo monorepo structure
- ✅ Set up Next.js apps (web + admin)
- ✅ Create FastAPI backend
- ✅ Initialize Supabase
- ✅ Install all dependencies
- ✅ Configure Cursor IDE
- ✅ Create environment files
- ✅ Set up Docker (optional)

---

## 📋 PREREQUISITES

Before running the setup script, ensure you have:

### Required
- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm 9+** - Install: `npm install -g pnpm`

### Optional (but recommended)
- **Python 3.11+** - For FastAPI backend
- **Docker** - For local Redis/PostgreSQL
- **Git** - For version control

### API Keys (can add later)
- Supabase Project (free tier: [supabase.com](https://supabase.com))
- OpenAI API Key ([platform.openai.com](https://platform.openai.com))
- Anthropic API Key ([console.anthropic.com](https://console.anthropic.com))
- Stripe Keys ([dashboard.stripe.com](https://dashboard.stripe.com))

---

## 📦 WHAT GETS CREATED

### Directory Structure
```
zenith-dating-platform/
├── apps/
│   ├── web/                    # Main Next.js app (port 3000)
│   │   ├── app/
│   │   │   ├── (auth)/        # Auth routes
│   │   │   ├── (dashboard)/   # Dashboard with parallel routes
│   │   │   │   ├── @sidebar/
│   │   │   │   ├── @main/
│   │   │   │   └── @modal/
│   │   │   ├── api/           # API routes
│   │   │   │   ├── ai/        # AI endpoints
│   │   │   │   ├── booking/   # Booking endpoints
│   │   │   │   └── webhooks/  # Stripe webhooks
│   │   │   ├── profiles/      # Profile pages
│   │   │   ├── (.)profiles/   # Intercepting routes (modals)
│   │   │   └── chat/          # Real-time chat
│   │   ├── components/
│   │   └── lib/
│   │
│   ├── admin/                  # Admin dashboard (port 3001)
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   ├── reports/
│   │   │   └── analytics/
│   │   └── components/
│   │
│   └── api/                    # FastAPI backend (port 8000)
│       ├── app/
│       │   ├── routes/
│       │   │   ├── ai.py      # AI chat endpoints
│       │   │   ├── booking.py # Booking logic
│       │   │   └── matching.py # Matching algorithm
│       │   ├── services/
│       │   │   ├── booking_service.py
│       │   │   ├── ai_service.py
│       │   │   └── matching_service.py
│       │   └── models/
│       └── main.py
│
├── packages/
│   ├── ui/                     # Shared shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── index.tsx
│   │
│   ├── database/               # Supabase client
│   │   ├── client.ts
│   │   └── types.ts
│   │
│   ├── auth/                   # Auth utilities
│   │   ├── index.ts
│   │   └── middleware.ts
│   │
│   └── types/                  # Shared TypeScript types
│       └── index.ts
│
├── supabase/
│   ├── migrations/
│   │   └── YYYYMMDDHHMMSS_initial_schema.sql
│   └── config.toml
│
├── .vscode/                    # Cursor IDE configuration
│   ├── settings.json
│   ├── tasks.json
│   └── launch.json
│
├── .env.local                  # Environment variables
├── .env.example
├── docker-compose.yml
├── turbo.json
├── package.json
└── README.md
```

### Configuration Files Created

1. **package.json** (root + all apps/packages)
2. **turbo.json** - Turborepo configuration
3. **.env.local** - Environment variables
4. **docker-compose.yml** - Redis + PostgreSQL
5. **.vscode/*** - Cursor IDE settings
6. **supabase/config.toml** - Supabase configuration

---

## 🎮 CURSOR IDE COMMANDS

After setup, you can use these Cursor commands:

### Built-in Tasks (Cmd/Ctrl + Shift + P)

1. **Tasks: Run Task** → "Start Development"
   - Starts all apps in parallel (web, admin, api)
   - Port 3000: Main app
   - Port 3001: Admin dashboard
   - Port 8000: FastAPI docs

2. **Tasks: Run Task** → "Start Database"
   - Starts Supabase locally
   - Runs all migrations

3. **Tasks: Run Task** → "Build All"
   - Builds all apps for production

4. **Tasks: Run Task** → "Run Tests"
   - Runs all test suites

### Terminal Commands

```bash
# Development
pnpm dev                # Start all apps
pnpm dev --filter=@zenith/web    # Start only web app
pnpm dev --filter=@zenith/admin  # Start only admin app

# Database
pnpm db:start          # Start Supabase
pnpm db:stop           # Stop Supabase
pnpm db:reset          # Reset database
pnpm db:migrate        # Run migrations

# Build
pnpm build             # Build all apps
pnpm build --filter=@zenith/web  # Build only web app

# Testing
pnpm test              # Run all tests
pnpm test:watch        # Run tests in watch mode

# Linting & Formatting
pnpm lint              # Lint all apps
pnpm format            # Format with Prettier

# Clean
pnpm clean             # Remove all node_modules and build artifacts
```

### Cursor Agent Commands

You can use Cursor's AI agent with these natural language commands:

```
"Start the development server"
"Run database migrations"
"Build the project"
"Run tests"
"Fix linting errors"
"Format all code"
"Show me the database schema"
"Explain this component"
"Refactor this function"
"Add a new API route"
```

---

## ⚙️ ENVIRONMENT CONFIGURATION

### Step 1: Update .env.local

After running the setup script, open `.env.local` and add your API keys:

```bash
# Supabase (Get from: https://app.supabase.com/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (Get from: https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-...

# Anthropic (Get from: https://console.anthropic.com/settings/keys)
ANTHROPIC_API_KEY=sk-ant-api03-...

# ElevenLabs (Get from: https://elevenlabs.io/app/settings)
ELEVENLABS_API_KEY=...

# Stripe (Get from: https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (Get from: https://resend.com/api-keys)
RESEND_API_KEY=re_...

# Upstash Redis (Get from: https://console.upstash.com)
UPSTASH_REDIS_URL=https://...upstash.io
UPSTASH_REDIS_TOKEN=...

# Sentry (Get from: https://sentry.io/settings/projects/)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 2: Get Free API Keys

#### Supabase (Required)
1. Go to [supabase.com](https://supabase.com)
2. Create new project (free tier)
3. Go to Settings → API
4. Copy URL, anon key, and service role key

#### OpenAI (Required for AI chat)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add credits ($5 minimum)

#### Stripe (Required for payments)
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Get test API keys (no credit card needed)
3. For webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

#### Optional Services
- **Anthropic** - For Claude AI (alternative to OpenAI)
- **ElevenLabs** - For AI voice features
- **Resend** - For email notifications (100 emails/day free)
- **Upstash** - For Redis caching (10k requests/day free)
- **Sentry** - For error monitoring (5k errors/month free)

---

## 🗄️ DATABASE SETUP

### Option 1: Local Supabase (Recommended for Development)

```bash
# Start local Supabase (requires Docker)
pnpm db:start

# Run migrations (includes all ZENITH_EXPERT_CRITIQUE improvements)
pnpm db:migrate

# Access Studio: http://localhost:54323
```

**Includes:**
- ✅ PostgreSQL 15 with PostGIS, pgvector, pg_trgm
- ✅ 30+ performance indexes
- ✅ Complete booking system tables
- ✅ AI conversation storage
- ✅ Real-time subscriptions
- ✅ Row Level Security (RLS)
- ✅ GDPR compliance functions
- ✅ Audit logging
- ✅ Rate limiting tables

### Option 2: Hosted Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Copy SQL from `ZENITH_EXPERT_CRITIQUE/DATABASE_IMPROVEMENTS.sql`
3. Paste into SQL Editor
4. Execute
5. Update `.env.local` with project URL and keys

---

## 🚀 FIRST RUN

### Quick Start (5 minutes)

```bash
# 1. Run setup script
bash setup-cursor.sh

# 2. Update environment variables
nano .env.local

# 3. Start Supabase
pnpm db:start

# 4. Run migrations
pnpm db:migrate

# 5. Start all apps
pnpm dev
```

### What to Expect

**Terminal output:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│   Zenith Dating Platform - Turborepo           │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   @zenith/web      ready on http://localhost:3000
│   @zenith/admin    ready on http://localhost:3001
│                                                 │
└─────────────────────────────────────────────────┘
```

**Open in browser:**
- **Main App:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3001
- **API Docs:** http://localhost:8000/docs (if FastAPI is running)
- **Supabase Studio:** http://localhost:54323

---

## 🧪 TESTING THE SETUP

### 1. Test Authentication

```bash
# Go to: http://localhost:3000/auth/signup
# Create a test account
# Verify email verification works
```

### 2. Test Database

```bash
# Open Supabase Studio: http://localhost:54323
# Check tables exist:
# - profiles, matches, messages, bookings, ai_conversations
```

### 3. Test API Routes

```bash
# Test health check
curl http://localhost:3000/api/health

# Test AI chat (requires OpenAI key)
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, AI!"}'
```

### 4. Test FastAPI (if installed)

```bash
# Open API docs: http://localhost:8000/docs
# Try the /health endpoint
# Test AI endpoints
```

---

## 🐛 TROUBLESHOOTING

### Issue: "pnpm not found"

**Solution:**
```bash
npm install -g pnpm
```

### Issue: "Supabase CLI not found"

**Solution:**
```bash
pnpm install -g supabase
# Or: brew install supabase/tap/supabase (Mac)
```

### Issue: "Docker not running"

**Solution:**
```bash
# Mac: Open Docker Desktop
# Linux: sudo systemctl start docker
# Windows: Start Docker Desktop
```

### Issue: "Port 3000 already in use"

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in package.json
"dev": "next dev -p 3001"
```

### Issue: "Database migrations failed"

**Solution:**
```bash
# Reset database
pnpm db:reset

# Run migrations again
pnpm db:migrate

# If still fails, check:
# - Docker is running
# - Supabase is started (pnpm db:start)
```

### Issue: "Module not found" errors

**Solution:**
```bash
# Clean install
pnpm clean
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: "Python/FastAPI errors"

**Solution:**
```bash
cd apps/api
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## 📚 NEXT STEPS

### 1. Review Documentation

- **Setup Critique:** `ZENITH_EXPERT_CRITIQUE/SETUP_CRITIQUE_EXPERT_ANALYSIS.md`
- **Security Guide:** `ZENITH_EXPERT_CRITIQUE/SECURITY_HARDENING.md`
- **Database Schema:** `ZENITH_EXPERT_CRITIQUE/DATABASE_IMPROVEMENTS.sql`
- **Production Checklist:** `ZENITH_EXPERT_CRITIQUE/PRODUCTION_LAUNCH_CHECKLIST.md`
- **Implementation Guide:** `ZENITH_EXPERT_CRITIQUE/IMPLEMENTATION_GUIDE.md`

### 2. Implement Core Features

Follow the day-by-day implementation guide:

**Week 1: Database & Security**
- ✅ Database already set up
- [ ] Implement rate limiting
- [ ] Add content moderation
- [ ] Set up GDPR endpoints

**Week 2: Features**
- [ ] Build profile pages
- [ ] Implement matching algorithm
- [ ] Create booking system UI
- [ ] Add real-time chat

**Week 3: Polish**
- [ ] Set up monitoring (Sentry)
- [ ] Add analytics (PostHog)
- [ ] Implement caching (Redis)
- [ ] Mobile PWA configuration

### 3. Deploy to Production

```bash
# Deploy frontend to Vercel
vercel --prod

# Deploy API to Railway
railway up

# Database is already hosted on Supabase!
```

---

## 🎯 CURSOR AI AGENT TIPS

### Best Practices for Using Cursor Agent

1. **Be Specific**
   ```
   ❌ "Add a button"
   ✅ "Add a primary button to the booking form that submits the reservation"
   ```

2. **Reference Files**
   ```
   ✅ "Update the BookingCalendar component in components/booking/booking-calendar.tsx to use the new date format"
   ```

3. **Request Explanations**
   ```
   ✅ "Explain how the matching algorithm works in packages/database/matching.ts"
   ```

4. **Multi-step Tasks**
   ```
   ✅ "Create a new API route for user reviews:
   1. Add POST /api/reviews endpoint
   2. Create review schema validation
   3. Store review in database
   4. Send notification to reviewed user"
   ```

### Common Cursor Commands

```
"Show me all API routes"
"Find all components using the Button from @zenith/ui"
"Refactor this component to use Server Components"
"Add error handling to this API route"
"Create a new page for user settings"
"Fix all TypeScript errors in this file"
"Add tests for the BookingService"
"Optimize this database query"
"Add loading states to this component"
"Implement pagination for the profiles list"
```

---

## 🔄 DEVELOPMENT WORKFLOW

### Daily Workflow

```bash
# 1. Start your day
pnpm db:start              # Start Supabase
pnpm dev                   # Start all apps

# 2. Make changes
# Use Cursor AI to help implement features

# 3. Test changes
pnpm lint                  # Check for errors
pnpm test                  # Run tests

# 4. Commit
git add .
git commit -m "feat: add booking calendar"
git push
```

### Creating New Features

```bash
# 1. Create a branch
git checkout -b feature/new-feature

# 2. Use Cursor AI
"Create a new booking confirmation page with:
- Booking details summary
- Payment status
- Calendar add button
- Email confirmation option"

# 3. Test locally
pnpm dev

# 4. Push and create PR
git push -u origin feature/new-feature
```

---

## 📞 SUPPORT

### Documentation
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Vercel Docs:** https://vercel.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Turborepo Docs:** https://turbo.build/repo/docs

### Community
- **Supabase Discord:** https://discord.supabase.com
- **Next.js Discord:** https://nextjs.org/discord

### Project Documentation
- See `ZENITH_EXPERT_CRITIQUE/` folder for comprehensive guides
- Check `README.md` for quick reference

---

## ✅ CHECKLIST

Track your setup progress:

- [ ] Prerequisites installed (Node.js, pnpm, Python, Docker)
- [ ] Ran `bash setup-cursor.sh`
- [ ] Updated `.env.local` with API keys
- [ ] Started Supabase (`pnpm db:start`)
- [ ] Ran migrations (`pnpm db:migrate`)
- [ ] Started development servers (`pnpm dev`)
- [ ] Tested main app (http://localhost:3000)
- [ ] Tested admin dashboard (http://localhost:3001)
- [ ] Verified database in Supabase Studio
- [ ] Created test account
- [ ] Tested API endpoints
- [ ] Reviewed documentation in `ZENITH_EXPERT_CRITIQUE/`
- [ ] Ready to build features! 🚀

---

## 🎉 YOU'RE READY!

Your complete dating platform is now set up and ready for development!

**What you have:**
- ✅ Monorepo with Turborepo
- ✅ Next.js apps (web + admin)
- ✅ FastAPI backend
- ✅ Production-ready database
- ✅ Enterprise security
- ✅ Complete booking system
- ✅ AI chat infrastructure
- ✅ Cursor IDE configured
- ✅ All dependencies installed

**Next:** Start building features with Cursor AI! 🚀

```bash
pnpm dev
# Open http://localhost:3000
# Use Cursor AI to help implement features
```

Happy coding! 💜

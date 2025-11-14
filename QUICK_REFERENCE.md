# ⚡ ZENITH PLATFORM - QUICK REFERENCE CARD

**One-page cheat sheet for daily development**

---

## 🚀 ONE-COMMAND SETUP

```bash
bash setup-cursor.sh && pnpm db:start && pnpm dev
```

---

## 📦 ESSENTIAL COMMANDS

### Development
```bash
pnpm dev                # Start all apps (ports 3000, 3001, 8000)
pnpm dev --filter=@zenith/web    # Web app only
pnpm dev --filter=@zenith/admin  # Admin only
pnpm build              # Build for production
```

### Database
```bash
pnpm db:start          # Start Supabase (http://localhost:54323)
pnpm db:stop           # Stop Supabase
pnpm db:reset          # Reset & re-migrate
pnpm db:migrate        # Run new migrations
```

### Testing & Quality
```bash
pnpm test              # Run all tests
pnpm lint              # Lint all code
pnpm format            # Format with Prettier
pnpm clean             # Clean all builds
```

---

## 🌐 LOCAL URLS

| Service | URL | Purpose |
|---------|-----|---------|
| **Main App** | http://localhost:3000 | User-facing app |
| **Admin** | http://localhost:3001 | Admin dashboard |
| **API Docs** | http://localhost:8000/docs | FastAPI docs |
| **Supabase** | http://localhost:54323 | Database Studio |

---

## 📁 KEY DIRECTORIES

```
apps/web/
  ├── app/              # Routes & pages
  │   ├── (auth)/      # Login, signup
  │   ├── (dashboard)/ # Main dashboard
  │   │   ├── @sidebar/    # Parallel route
  │   │   ├── @main/       # Parallel route
  │   │   └── @modal/      # Parallel route
  │   ├── api/         # API routes
  │   ├── profiles/    # Profile pages
  │   └── (.)profiles/ # Profile modals (intercepting)
  ├── components/      # React components
  └── lib/            # Utilities

packages/
  ├── ui/             # Shared UI components
  ├── database/       # Supabase client
  └── auth/           # Auth utilities
```

---

## 🔧 ENVIRONMENT VARIABLES

**Required for AI features:**
```bash
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Required for payments:**
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Required for database:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 🎯 CURSOR AI COMMANDS

```
"Start development server"
"Run database migrations"
"Create a new API route for [feature]"
"Add a new component for [feature]"
"Fix all TypeScript errors"
"Explain this function"
"Refactor to use Server Components"
"Add error handling"
"Write tests for this component"
"Optimize this database query"
```

---

## 🗄️ DATABASE TABLES

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles & settings |
| `matches` | Swipe matches |
| `messages` | Real-time chat |
| `bookings` | Date reservations |
| `booking_packages` | Provider pricing |
| `availability_schedules` | Provider availability |
| `ai_conversations` | AI chat history |
| `ai_personalities` | AI companion types |
| `notifications` | User notifications |
| `user_reports` | Content moderation |
| `blocked_users` | Blocked/muted users |

---

## 🔐 API ROUTES

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/user
```

### AI Features
```
POST   /api/ai/chat           # Chat with AI
POST   /api/ai/voice          # Text-to-speech
POST   /api/ai/memory         # Store/retrieve memories
```

### Bookings
```
GET    /api/bookings          # List bookings
POST   /api/bookings          # Create booking
PATCH  /api/bookings/[id]     # Update status
DELETE /api/bookings/[id]     # Cancel booking
GET    /api/availability/[id] # Get provider availability
```

### Matching
```
GET    /api/matches           # Get matches
POST   /api/matches/swipe     # Swipe left/right
GET    /api/matches/suggestions # Get recommendations
```

### Payments
```
POST   /api/payments/intent   # Create payment intent
POST   /api/webhooks/stripe   # Stripe webhooks
```

---

## 🧪 TESTING CHECKLIST

```bash
✓ Run setup script
✓ Start Supabase
✓ Run migrations
✓ Start dev servers
✓ Create test account
✓ Test login/logout
✓ Test profile creation
✓ Test matching (swipe)
✓ Test chat messaging
✓ Test booking creation
✓ Test AI chat
✓ Test payments (Stripe test mode)
```

---

## 🐛 COMMON ISSUES

| Issue | Solution |
|-------|----------|
| Port in use | `lsof -ti:3000 \| xargs kill -9` |
| Module not found | `pnpm clean && pnpm install` |
| Database error | `pnpm db:reset` |
| Supabase not starting | Check Docker is running |
| Type errors | `pnpm build` to see all errors |

---

## 📚 DOCUMENTATION

| Document | Location |
|----------|----------|
| Setup Guide | `CURSOR_SETUP.md` |
| Expert Analysis | `ZENITH_EXPERT_CRITIQUE/SETUP_CRITIQUE_EXPERT_ANALYSIS.md` |
| Database Schema | `ZENITH_EXPERT_CRITIQUE/DATABASE_IMPROVEMENTS.sql` |
| Security Guide | `ZENITH_EXPERT_CRITIQUE/SECURITY_HARDENING.md` |
| Production Checklist | `ZENITH_EXPERT_CRITIQUE/PRODUCTION_LAUNCH_CHECKLIST.md` |
| Implementation Guide | `ZENITH_EXPERT_CRITIQUE/IMPLEMENTATION_GUIDE.md` |

---

## 🚀 DEPLOYMENT

```bash
# Deploy to Vercel
vercel --prod

# Deploy API to Railway
railway up

# Push database changes
supabase db push
```

---

## 💡 QUICK TIPS

1. **Use Turborepo filtering** to work on single apps:
   ```bash
   pnpm dev --filter=@zenith/web
   ```

2. **Use Supabase Studio** for database management:
   ```
   http://localhost:54323
   ```

3. **Use FastAPI docs** for API testing:
   ```
   http://localhost:8000/docs
   ```

4. **Use Cursor AI** for code generation:
   ```
   Select code → Ask Cursor to refactor/explain/optimize
   ```

5. **Check logs** for debugging:
   ```bash
   # Terminal shows all app logs in parallel
   # Filter by app name in output
   ```

---

## 🎯 DAILY WORKFLOW

```bash
# Morning
pnpm db:start
pnpm dev

# Development
# Use Cursor AI to implement features
# Test in browser
# Check database in Supabase Studio

# Before commit
pnpm lint
pnpm test

# End of day
git add .
git commit -m "feat: description"
git push
```

---

## 🔗 USEFUL LINKS

- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui:** https://ui.shadcn.com
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Turborepo Docs:** https://turbo.build/repo/docs
- **Stripe Testing:** https://stripe.com/docs/testing

---

**Keep this page handy while developing! 📌**

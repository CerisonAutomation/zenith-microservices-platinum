# 🗄️ DATABASE SETUP GUIDE - Port 5432

**PostgreSQL Configuration for Booking a Boyfriend Platform**

---

## 📊 DATABASE OPTIONS

### Option 1: Supabase Cloud (RECOMMENDED) ⭐

**Best for:** Production and rapid development

**Benefits:**
- ✅ FREE tier: 500 MB database, 50K MAU
- ✅ Automatic backups
- ✅ Built-in Auth, Storage, Real-time
- ✅ No local setup required
- ✅ Global CDN
- ✅ Row Level Security (RLS)

**Setup:**
1. Go to https://supabase.com
2. Create new project
3. Get credentials from Settings → API
4. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

---

### Option 2: Local PostgreSQL (Port 5432)

**Best for:** Development without internet, testing

**Requirements:**
- PostgreSQL 15+ installed locally
- Port 5432 available

#### A. Install PostgreSQL

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql-15 postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

#### B. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE booking_a_boyfriend;
CREATE USER zenith_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE booking_a_boyfriend TO zenith_user;

# Exit
\q
```

#### C. Configure Environment

Add to `apps/frontend/.env.local`:
```bash
# Local PostgreSQL
DATABASE_URL=postgresql://zenith_user:your_secure_password@localhost:5432/booking_a_boyfriend
DIRECT_URL=postgresql://zenith_user:your_secure_password@localhost:5432/booking_a_boyfriend

# For Supabase local development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
```

#### D. Run Migrations

```bash
# If using Supabase CLI
supabase db push

# Or if using raw SQL
psql -U zenith_user -d booking_a_boyfriend -f supabase/migrations/*.sql
```

---

### Option 3: Docker PostgreSQL

**Best for:** Isolated development environment

#### docker-compose.yml

Create in project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: booking_boyfriend_db
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: zenith_user
      POSTGRES_PASSWORD: zenith_password_123
      POSTGRES_DB: booking_a_boyfriend
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zenith_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Optional: pgAdmin for database management
  pgadmin:
    image: dpage/pgadmin4
    container_name: booking_boyfriend_pgadmin
    restart: always
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@bookingaboyfriend.local
      PGADMIN_DEFAULT_PASSWORD: admin
    depends_on:
      - postgres

volumes:
  postgres_data:
```

#### Start Database

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Stop
docker-compose down

# Stop and remove data
docker-compose down -v
```

#### Connect

```bash
# Connection string
DATABASE_URL=postgresql://zenith_user:zenith_password_123@localhost:5432/booking_a_boyfriend

# Test connection
docker exec -it booking_boyfriend_db psql -U zenith_user -d booking_a_boyfriend
```

---

### Option 4: Supabase Local (Full Stack)

**Best for:** Full Supabase experience locally

#### Prerequisites

```bash
# Install Docker
# Install Supabase CLI
npm install -g supabase

# Or with Homebrew
brew install supabase/tap/supabase
```

#### Initialize

```bash
# In project root
supabase init

# Start Supabase locally
supabase start

# This will start:
# - PostgreSQL (port 54322)
# - Studio (port 54323)
# - API (port 54321)
# - Auth (port 9999)
```

#### Environment Configuration

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Access Services

- **Supabase Studio**: http://localhost:54323
- **API**: http://localhost:54321
- **Database**: localhost:54322

---

## 🔍 PORT 5432 TROUBLESHOOTING

### Check if Port is Available

```bash
# Linux/macOS
lsof -i :5432
netstat -an | grep 5432

# Find process using port
sudo lsof -i :5432

# Kill process if needed
kill -9 <PID>
```

### Common Port Conflicts

**If port 5432 is already in use:**

1. **Different PostgreSQL instance running**
   ```bash
   # Stop existing PostgreSQL
   sudo systemctl stop postgresql

   # Or on macOS
   brew services stop postgresql
   ```

2. **Docker container using port**
   ```bash
   docker ps | grep 5432
   docker stop <container_id>
   ```

3. **Use different port**
   ```yaml
   # In docker-compose.yml
   ports:
     - "5433:5432"  # Map to 5433 instead

   # Update connection string
   DATABASE_URL=postgresql://user:pass@localhost:5433/db
   ```

---

## 🗂️ DATABASE SCHEMA

Your database schema is already defined in:
```
supabase/migrations/
└── 20250114000000_add_missing_features.sql
```

**Tables included:**
- `profiles` - User profiles
- `matches` - User matches
- `messages` - Chat messages
- `conversations` - Chat conversations
- `message_reactions` - Emoji reactions
- `voice_messages` - Voice recordings
- `calls` - Video/audio call logs
- `stories` - 24-hour stories
- `story_views` - Story view tracking
- `gif_messages` - GIF attachments
- `bookings` - Boyfriend booking system
- `booking_packages` - Booking packages
- `notifications` - User notifications

---

## 🚀 RECOMMENDED SETUP

### For Development:
1. **Supabase Cloud** (easiest, free tier sufficient)
2. Run migrations with `supabase db push`
3. Use Supabase Studio for database management

### For Local Testing:
1. **Docker Compose** (isolated, reproducible)
2. Includes pgAdmin for visual management
3. Easy to reset and rebuild

### For CI/CD:
1. **Supabase Cloud** with staging/production projects
2. GitHub Actions for automated migrations
3. Preview environments for each PR

---

## 📋 QUICK VERIFICATION

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# List all tables
psql $DATABASE_URL -c "\dt"

# Check if migrations ran
psql $DATABASE_URL -c "SELECT * FROM profiles LIMIT 1;"

# Count records
psql $DATABASE_URL -c "SELECT
  (SELECT COUNT(*) FROM profiles) as profiles,
  (SELECT COUNT(*) FROM messages) as messages,
  (SELECT COUNT(*) FROM bookings) as bookings;"
```

---

## 🔐 SECURITY NOTES

**PostgreSQL Port 5432:**
- ⚠️ DO NOT expose to internet (use firewall)
- ✅ Use strong passwords
- ✅ Enable SSL for production
- ✅ Use connection pooling (PgBouncer)
- ✅ Regular backups

**Production Checklist:**
- [ ] Change default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable connection pooling
- [ ] Monitor connection limits
- [ ] Use read replicas for scaling

---

## 📞 SUPPORT

**PostgreSQL Issues:**
- Docs: https://www.postgresql.org/docs/
- Community: https://www.postgresql.org/community/

**Supabase Issues:**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

**Docker Issues:**
- Docs: https://docs.docker.com/
- Docker Hub: https://hub.docker.com/_/postgres

---

## ✅ CURRENT STATUS

Your project is configured for **Supabase** with:
- ✅ Migration files ready
- ✅ Environment variables configured
- ✅ Supabase clients implemented
- ✅ RLS policies defined

**To use local PostgreSQL on port 5432:**
1. Follow "Option 2" or "Option 3" above
2. Update `.env.local` with local connection string
3. Run migrations
4. Restart dev server

---

**Need help?** Let me know which option you'd like to use and I'll provide detailed setup instructions!

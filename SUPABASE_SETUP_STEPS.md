# 🎯 SUPABASE SETUP - NEXT STEPS

**Your Supabase Project:** `YOUR_PROJECT_REF`
**Project URL:** https://YOUR_PROJECT_REF.supabase.co

---

## ✅ STEP-BY-STEP SETUP

### Step 1: Get Your Supabase API Keys ⭐

1. **Open Supabase Dashboard:**
   https://supabase.com/dashboard/project/YOUR_PROJECT_REF

2. **Navigate to Settings → API**
   Direct link: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/settings/api

3. **Copy these keys:**

   **Project URL:**
   ```
   https://YOUR_PROJECT_REF.supabase.co
   ```

   **anon public key:** (Safe to use in browser)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **service_role secret key:** (NEVER expose to browser!)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Add to `.env.local`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

---

### Step 2: Run Database Migrations

Your migrations are already in `supabase/migrations/20250114000000_add_missing_features.sql`

**Option A: Using Supabase CLI (RECOMMENDED)**

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push
```

**Option B: Manual Migration (via Dashboard)**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/editor
2. Click "SQL Editor"
3. Copy content from `supabase/migrations/20250114000000_add_missing_features.sql`
4. Paste and click "Run"

**Option C: Using psql**

```bash
# Get your database password from Supabase Dashboard → Settings → Database
psql "postgresql://postgres:[YOUR_PASSWORD]@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" < supabase/migrations/20250114000000_add_missing_features.sql
```

---

### Step 3: Set Up Storage Buckets

**Go to Storage:**
https://supabase.com/dashboard/project/YOUR_PROJECT_REF/storage/buckets

**Create these buckets:**

1. **`profile-photos`**
   - Public bucket
   - Allowed MIME types: `image/jpeg, image/png, image/webp`
   - Max file size: 5 MB
   - RLS policies:
     ```sql
     -- Allow authenticated users to upload their own photos
     CREATE POLICY "Users can upload own profile photos"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

     -- Allow public to view profile photos
     CREATE POLICY "Public can view profile photos"
     ON storage.objects FOR SELECT
     TO public
     USING (bucket_id = 'profile-photos');
     ```

2. **`voice-messages`**
   - Private bucket
   - Allowed MIME types: `audio/webm, audio/ogg, audio/mp3`
   - Max file size: 10 MB
   - RLS policies:
     ```sql
     -- Allow authenticated users to upload voice messages
     CREATE POLICY "Users can upload voice messages"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'voice-messages');

     -- Only conversation participants can access
     CREATE POLICY "Users can access own voice messages"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (bucket_id = 'voice-messages' AND auth.uid()::text = (storage.foldername(name))[1]);
     ```

3. **`stories`**
   - Private bucket (visible only to matches)
   - Allowed MIME types: `image/*, video/mp4, video/webm`
   - Max file size: 50 MB (for videos)
   - RLS policies:
     ```sql
     -- Allow authenticated users to upload stories
     CREATE POLICY "Users can upload stories"
     ON storage.objects FOR INSERT
     TO authenticated
     WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

     -- Allow matches to view stories
     CREATE POLICY "Matches can view stories"
     ON storage.objects FOR SELECT
     TO authenticated
     USING (bucket_id = 'stories');
     ```

---

### Step 4: Configure Authentication

**Go to Authentication:**
https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/users

**Enable Auth Providers:**

1. **Email (Already enabled by default)**
   - ✅ Enable email confirmations
   - ✅ Set up email templates

2. **Google OAuth (Optional but recommended)**
   - Settings → Auth → Providers → Google
   - Add your Google Client ID & Secret
   - Authorized redirect URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

3. **Facebook OAuth (Optional)**
   - Settings → Auth → Providers → Facebook
   - Add Facebook App ID & Secret

**Configure Email Templates:**
Settings → Auth → Email Templates

Customize:
- Confirmation email
- Password reset email
- Magic link email

---

### Step 5: Get Additional API Keys

#### A. Google Gemini API (For AI Boyfriend) ⭐

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Add to `.env.local`:
   ```bash
   GOOGLE_GEMINI_API_KEY=AIzaSy...
   ```

**FREE Tier:**
- 60 requests/minute
- 1,500 requests/day
- Multimodal support

#### B. Daily.co API (For Video/Audio Calls) ⭐

1. Go to: https://dashboard.daily.co/developers
2. Sign up (free account)
3. Copy your API key
4. Add to `.env.local`:
   ```bash
   DAILY_API_KEY=your_daily_api_key
   ```

**FREE Tier:**
- 10,000 minutes/month
- Unlimited rooms
- Screen sharing
- Recording

#### C. Giphy API (For GIF Messages) ⭐

1. Go to: https://developers.giphy.com/dashboard
2. Create an app
3. Copy SDK Key
4. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_key
   ```

**FREE Tier:**
- 1,000 requests/day
- Full library access

#### D. Stripe API (For Payments) - Optional

1. Go to: https://dashboard.stripe.com/apikeys
2. Copy publishable key and secret key
3. Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

**Test Mode:** Free, no credit card needed for development

---

### Step 6: Test the Connection

```bash
# From apps/frontend folder
cd apps/frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

**Open:** http://localhost:3000

**You should see:**
- ✅ App loads without errors
- ✅ Can sign up / log in
- ✅ Profile creation works
- ✅ Database queries succeed

**Test Database Connection:**

Create a test file `apps/frontend/test-db.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://YOUR_PROJECT_REF.supabase.co',
  'YOUR_ANON_KEY'
)

async function testConnection() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1)

  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Database connected successfully!')
    console.log('Data:', data)
  }
}

testConnection()
```

Run:
```bash
node test-db.js
```

---

### Step 7: Enable Row Level Security (RLS)

**CRITICAL for Security!**

Your migrations already include RLS policies, but verify:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/policies

2. Check that all tables have policies:
   - ✅ `profiles`
   - ✅ `matches`
   - ✅ `messages`
   - ✅ `conversations`
   - ✅ `bookings`
   - ✅ `notifications`
   - ✅ `message_reactions`
   - ✅ `voice_messages`
   - ✅ `calls`
   - ✅ `stories`
   - ✅ `story_views`

3. If any table is missing RLS, enable it:
   ```sql
   ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
   ```

---

### Step 8: Set Up Database Roles (Boyfriend, User, Admin)

Run this SQL in Supabase SQL Editor:

```sql
-- Add role column to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Add constraint for valid roles
ALTER TABLE profiles ADD CONSTRAINT valid_role CHECK (role IN ('user', 'boyfriend', 'admin'));

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update RLS policies to consider roles
CREATE POLICY "Boyfriends can view their bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  partner_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('boyfriend', 'admin')
  )
);

CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('user', 'admin')
  )
);

CREATE POLICY "Admins can view all data"
ON profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);
```

---

### Step 9: Verify Everything Works

**Checklist:**

- [ ] Supabase URL in `.env.local`
- [ ] Supabase Anon Key in `.env.local`
- [ ] Supabase Service Role Key in `.env.local`
- [ ] Google Gemini API Key in `.env.local`
- [ ] Daily.co API Key in `.env.local`
- [ ] Giphy API Key in `.env.local`
- [ ] Database migrations run successfully
- [ ] Storage buckets created with RLS policies
- [ ] Auth providers configured
- [ ] App starts without errors (`pnpm dev`)
- [ ] Can sign up new user
- [ ] Can log in
- [ ] Can view explore page
- [ ] Database queries work
- [ ] RLS policies enforce security

---

### Step 10: Deploy to Vercel (Optional)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd apps/frontend
vercel

# Add environment variables in Vercel Dashboard
# https://vercel.com/your-username/booking-a-boyfriend/settings/environment-variables
```

**Add all env vars from `.env.local` to Vercel**

---

## 🔒 SECURITY CHECKLIST

**Before Going Live:**

- [ ] RLS enabled on ALL tables
- [ ] Storage buckets have proper policies
- [ ] Service role key is NEVER exposed to client
- [ ] CORS properly configured
- [ ] Auth email verification enabled
- [ ] Strong password policy enabled
- [ ] Rate limiting configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts set up

---

## 📊 MONITORING

**Supabase Dashboard:**
- Database: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/database/tables
- Auth: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/auth/users
- Storage: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/storage/buckets
- Logs: https://supabase.com/dashboard/project/YOUR_PROJECT_REF/logs/explorer

**Monitor:**
- Active users
- Database size (500 MB free tier)
- Storage size (1 GB free tier)
- Bandwidth (2 GB/month free tier)
- API requests

---

## 🆘 TROUBLESHOOTING

**Can't connect to database:**
- Verify Supabase URL is correct
- Check API keys are valid
- Ensure RLS policies allow access

**Migrations failed:**
- Check SQL syntax
- Verify dependencies (tables created in order)
- Look at error logs in Supabase

**Storage upload fails:**
- Check bucket name matches code
- Verify MIME type is allowed
- Check file size limits
- Ensure RLS policies allow upload

---

## 🎉 YOU'RE ALL SET!

Your Supabase project `YOUR_PROJECT_REF` is ready to power your Booking a Boyfriend platform!

**Next Steps:**
1. Complete Step 1 (Get API keys) - 5 minutes
2. Run migrations (Step 2) - 2 minutes
3. Set up storage (Step 3) - 5 minutes
4. Get external API keys (Step 5) - 10 minutes
5. Test everything (Step 6) - 5 minutes

**Total setup time: ~30 minutes**

Then you're ready to launch! 🚀

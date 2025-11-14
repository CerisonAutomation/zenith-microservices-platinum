# 🔧 ENVIRONMENT VARIABLES - NEW FEATURES

**Updated: 2025-01-14**
**For: Emoji reactions, Video/Voice calls, Voice messages, GIF support**

---

## 📋 NEW VARIABLES TO ADD

### 1. Daily.co (Video/Voice Calling)

```bash
# Daily.co API Key (get from https://dashboard.daily.co)
DAILY_API_KEY=your_daily_api_key_here

# Daily.co Domain (optional, for custom branding)
DAILY_DOMAIN=your-domain.daily.co
```

**How to get:**
1. Sign up at https://www.daily.co
2. Go to https://dashboard.daily.co/developers
3. Copy your API Key
4. Add to `.env.local`

**Pricing:**
- Free: 10,000 minutes/month
- Pro: $0.0015/minute after free tier

---

### 2. Giphy API (GIF Support)

```bash
# Giphy API Key (get from https://developers.giphy.com)
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_api_key_here
```

**How to get:**
1. Sign up at https://developers.giphy.com/
2. Create a new app
3. Copy your API Key
4. Add to `.env.local`

**Pricing:** Free with rate limits
- 42 requests per hour (with SDK key)
- 1000 requests per day

---

### 3. OpenAI Whisper (Voice Message Transcription - Optional)

```bash
# OpenAI API Key for voice transcription
OPENAI_API_KEY=sk-proj-your_key_here
```

**Already configured if you have OpenAI for AI features.**

**Usage:** Automatically transcribe voice messages for accessibility

**Pricing:** $0.006 per minute

---

## 📄 COMPLETE .env.local EXAMPLE

```bash
# ==================================
# SUPABASE
# ==================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==================================
# STRIPE PAYMENTS
# ==================================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ==================================
# AI FEATURES (OpenAI/Anthropic/Gemini)
# ==================================
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GEMINI_API_KEY=...

# ==================================
# VIDEO/VOICE CALLING (Daily.co)
# ==================================
DAILY_API_KEY=your_daily_api_key_here
DAILY_DOMAIN=your-domain.daily.co

# ==================================
# GIF SUPPORT (Giphy)
# ==================================
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_api_key_here

# ==================================
# ANALYTICS (Optional)
# ==================================
NEXT_PUBLIC_GA_TRACKING_ID=G-...
NEXT_PUBLIC_POSTHOG_KEY=phc_...

# ==================================
# STORAGE (Supabase handles this)
# ==================================
# Voice messages stored in: voice-messages bucket
# Stories stored in: stories bucket

# ==================================
# WEBHOOKS
# ==================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBHOOK_SECRET=your_webhook_secret_here
```

---

## 🔐 SECURITY NOTES

1. **NEVER commit `.env.local` to Git**
   ```bash
   # Already in .gitignore
   .env.local
   .env*.local
   ```

2. **Use different keys for development and production**
   - Dev: Use test/sandbox keys
   - Production: Use production keys

3. **Rotate keys regularly**
   - Every 90 days recommended
   - Immediately if compromised

4. **Store production keys securely**
   - Vercel: Use Environment Variables in dashboard
   - Railway: Use project variables
   - Never in code or Git

---

## 📦 REQUIRED STORAGE BUCKETS

Run this to create new storage buckets in Supabase:

```sql
-- Already included in migration file, but if needed manually:

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('voice-messages', 'voice-messages', true),
  ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;
```

**Or via Supabase Dashboard:**
1. Go to Storage
2. Create bucket: `voice-messages` (public)
3. Create bucket: `stories` (public)

---

## 🚀 SETUP CHECKLIST

- [ ] Add `DAILY_API_KEY` to `.env.local`
- [ ] Add `NEXT_PUBLIC_GIPHY_API_KEY` to `.env.local`
- [ ] Create `voice-messages` storage bucket
- [ ] Create `stories` storage bucket
- [ ] Run database migration: `pnpm db:migrate`
- [ ] Install new packages: `pnpm install`
- [ ] Test video call: Create a test call room
- [ ] Test voice recording: Record and send a voice message
- [ ] Test emoji reactions: React to a test message
- [ ] Test GIF sending: Send a test GIF

---

## 🧪 TESTING VALUES

For development/testing:

```bash
# Daily.co - Use your actual dev key (free tier)
DAILY_API_KEY=your_daily_dev_key

# Giphy - Use your actual dev key (free tier)
NEXT_PUBLIC_GIPHY_API_KEY=your_giphy_dev_key
```

Both services have generous free tiers for development.

---

## 📊 COST ESTIMATES

| Service | Free Tier | Paid Tier | Monthly Cost (1000 users) |
|---------|-----------|-----------|---------------------------|
| **Daily.co** | 10,000 min/month | $0.0015/min | ~$150 (100k minutes) |
| **Giphy** | Free | Free | $0 |
| **Supabase Storage** | 1GB | $0.021/GB | ~$5 (50GB) |
| **OpenAI Whisper** | N/A | $0.006/min | ~$30 (5000 min) |

**Total new costs:** ~$185/month for 1000 active users

---

## 🔗 USEFUL LINKS

- **Daily.co Dashboard:** https://dashboard.daily.co
- **Daily.co Docs:** https://docs.daily.co
- **Giphy Developers:** https://developers.giphy.com
- **Giphy React SDK:** https://github.com/Giphy/giphy-js
- **Supabase Storage:** https://supabase.com/docs/guides/storage
- **OpenAI Whisper:** https://platform.openai.com/docs/guides/speech-to-text

---

## 💡 PRO TIPS

1. **Daily.co Custom Domain** (optional):
   - Makes calls look more professional
   - Example: `call.yourapp.com` instead of `yourapp.daily.co`
   - $99/month for white label

2. **Giphy Content Filtering**:
   - Use `rating: 'g'` for family-friendly content
   - Use `rating: 'pg-13'` for dating apps (recommended)
   - Filter in your API requests

3. **Voice Message Compression**:
   - Use `audio/webm;codecs=opus` for best compression
   - ~1MB per minute vs ~10MB for uncompressed
   - Saves storage costs by 90%

4. **Storage Cost Optimization**:
   - Auto-delete voice messages after 30 days
   - Stories auto-delete after 24 hours (already implemented)
   - Compress media before upload

---

## 🆘 TROUBLESHOOTING

### Daily.co API Error

```bash
Error: Invalid API key
```

**Solution:** Check your API key in `.env.local` matches dashboard

---

### Giphy API Error

```bash
Error: 429 Too Many Requests
```

**Solution:** You've hit rate limit. Implement caching or upgrade plan.

---

### Voice Recording Not Working

```bash
Error: NotAllowedError: Permission denied
```

**Solution:** Browser needs microphone permission. Check HTTPS is enabled (required for getUserMedia).

---

### Storage Upload Error

```bash
Error: Bucket not found
```

**Solution:** Create the storage bucket in Supabase dashboard or run migration.

---

**Last updated:** 2025-01-14
**Next review:** When adding new features

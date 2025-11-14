# Zenith API Routes Documentation

Production-ready API routes following Vercel LLM best practices.

## Overview

All API routes are built with:
- ✅ **Edge Runtime** for optimal performance (where applicable)
- ✅ **Vercel AI SDK** for streaming responses
- ✅ **Rate Limiting** to prevent abuse and control costs
- ✅ **Structured Logging** compatible with Vercel's infrastructure
- ✅ **Type Safety** with Zod validation
- ✅ **Authentication** via Supabase
- ✅ **Error Handling** with sanitized messages

## Available Endpoints

### 1. Chat API (`POST /api/chat`)

**Purpose:** Streaming AI chat endpoint
**Runtime:** Edge (60s max duration)
**Rate Limit:** 20 requests/minute
**Authentication:** Required

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "conversationId": "uuid-optional",
  "matchId": "uuid-optional"
}
```

**Response:** Streaming text response using AI SDK

**Features:**
- Real-time token streaming
- Automatic message persistence
- Context-aware conversations
- GPT-4 Turbo powered

---

### 2. Conversation Starters (`POST /api/conversation-starters`)

**Purpose:** Generate AI-powered conversation starters based on user profiles
**Runtime:** Edge
**Rate Limit:** 5 requests/minute
**Authentication:** Required

**Request:**
```json
{
  "matchId": "uuid-of-match"
}
```

**Response:**
```json
{
  "starters": [
    "I noticed you love hiking - what's your favorite trail?",
    "Your bio mentions photography, what do you like to shoot?",
    "Coffee enthusiast here too! What's your go-to order?"
  ]
}
```

**Features:**
- Personalized based on profiles
- Uses interests, bio, and occupation
- JSON structured output
- Fast edge execution

---

### 3. Content Moderation (`POST /api/moderate-content`)

**Purpose:** AI-powered content moderation for safety
**Runtime:** Edge
**Rate Limit:** 5 requests/minute
**Authentication:** Required

**Request:**
```json
{
  "content": "Text to moderate",
  "contentType": "message",
  "contentId": "optional-uuid"
}
```

**Response:**
```json
{
  "flagged": false,
  "categories": [],
  "severity": "low",
  "action": "allow",
  "confidence": 0.95,
  "reason": null
}
```

**Features:**
- Multi-category detection
- Severity levels (low/medium/high)
- Action recommendations (allow/warn/block/review)
- Automatic logging to database

**Content Types:**
- `message` - Chat messages
- `bio` - User bios
- `photo` - Image descriptions
- `profile` - Full profile content

---

### 4. Create Checkout Session (`POST /api/create-checkout-session`)

**Purpose:** Create Stripe checkout session for subscriptions
**Runtime:** Node.js (Stripe SDK requirement)
**Rate Limit:** 10 requests/hour
**Authentication:** Required

**Request:**
```json
{
  "planId": "premium"
}
```

**Response:**
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Features:**
- Customer ID management
- Subscription tracking
- Automatic metadata
- Success/cancel URLs
- Fraud prevention via rate limiting

**Plans:**
- `premium` - $9.99/month
- `elite` - $19.99/month

---

## Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat | 20 req | 1 minute |
| AI Features | 5 req | 1 minute |
| Payments | 10 req | 1 hour |

**Headers Returned:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining
- `X-RateLimit-Reset` - Unix timestamp when limit resets
- `Retry-After` - Seconds to wait (on 429)

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message",
  "details": {} // Only in development
}
```

### HTTP Status Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error (unexpected error)

---

## Environment Variables Required

### Client-side (NEXT_PUBLIC_*)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_...
```

### Server-side
```bash
# AI Features
OPENAI_API_KEY=sk-...

# Database
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Payments
STRIPE_SECRET_KEY=sk_...
STRIPE_PREMIUM_PRICE_ID=price_...
STRIPE_ELITE_PRICE_ID=price_...

# Security
JWT_SECRET=your-secure-secret-key
ALLOWED_ORIGINS=https://yourdomain.com
```

---

## Development

### Running Locally
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
```

### Testing Endpoints
```bash
# Chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"messages":[{"role":"user","content":"Hello!"}]}'

# Conversation starters
curl -X POST http://localhost:3000/api/conversation-starters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"matchId":"uuid-here"}'
```

---

## Logging & Monitoring

All API routes use structured logging that integrates with Vercel's infrastructure:

```typescript
// Logs appear in Vercel dashboard
logger.info('Request processed', { userId, duration });
logger.error('Error occurred', error, { context });
```

**Log Levels:**
- `info` - Normal operations
- `warn` - Potential issues
- `error` - Errors and exceptions
- `debug` - Development only

---

## Best Practices

1. **Always use rate limiting** on AI endpoints to control costs
2. **Validate inputs** with Zod schemas before processing
3. **Use Edge runtime** for AI features when possible
4. **Log errors** with full context for debugging
5. **Sanitize error messages** in production
6. **Authenticate all requests** via Supabase
7. **Monitor usage** through Vercel dashboard

---

## Deployment Checklist

Before deploying to production:

- [ ] Set all required environment variables in Vercel
- [ ] Test all endpoints with production API keys
- [ ] Verify rate limits are appropriate
- [ ] Check CORS configuration
- [ ] Enable Vercel Analytics
- [ ] Set up error alerting
- [ ] Review logs for any issues
- [ ] Test authentication flows
- [ ] Verify Stripe webhooks (if applicable)
- [ ] Monitor initial traffic

---

## Support

For issues or questions:
- Check Vercel logs in dashboard
- Review error messages in structured logs
- Verify environment variables are set
- Check rate limit headers if getting 429s

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Client (Next.js Frontend)        │
└────────────────┬────────────────────────┘
                 │
                 ├─────────────────┐
                 │                 │
        ┌────────▼─────────┐  ┌───▼──────────┐
        │   Edge Runtime   │  │  Node Runtime │
        │  (AI Endpoints)  │  │   (Stripe)    │
        └────────┬─────────┘  └───┬──────────┘
                 │                 │
         ┌───────▼─────────────────▼────────┐
         │      Vercel Infrastructure        │
         │  • Rate Limiting                  │
         │  • Logging & Monitoring           │
         │  • Global CDN                     │
         └───────┬──────────────┬────────────┘
                 │              │
          ┌──────▼───────┐ ┌───▼──────┐
          │   OpenAI     │ │  Stripe   │
          │   GPT-4      │ │  Payments │
          └──────────────┘ └───────────┘
                 │
          ┌──────▼───────┐
          │   Supabase   │
          │  (Database)  │
          └──────────────┘
```

---

Built with ❤️ following Vercel's LLM best practices

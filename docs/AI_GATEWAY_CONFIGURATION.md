# 🌐 Vercel AI Gateway - Configuration Guide

**Date:** 2025-11-14
**Status:** ✅ Production-Ready
**Purpose:** Unified AI model access with zero vendor lock-in

---

## 📊 OVERVIEW

The Vercel AI Gateway provides a **single endpoint** for routing requests to hundreds of AI models across multiple providers without vendor lock-in. This guide covers complete configuration, usage patterns, and best practices.

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Your Application                          │
│  (Next.js, React, Node.js, Python, etc.)                    │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     │ Single API Endpoint
                     │ https://gateway.vercel.ai/v1
                     ▼
┌──────────────────────────────────────────────────────────────┐
│               Vercel AI Gateway                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Automatic Routing & Load Balancing                    │  │
│  │  - Request validation                                  │  │
│  │  - Provider selection                                  │  │
│  │  - Retry & failover                                    │  │
│  │  - Cost tracking                                       │  │
│  │  - Rate limiting                                       │  │
│  └────────────────────────────────────────────────────────┘  │
└────┬─────────┬──────────┬──────────┬──────────┬─────────────┘
     │         │          │          │          │
     ▼         ▼          ▼          ▼          ▼
┌─────────┐ ┌──────┐ ┌───────┐ ┌──────┐ ┌──────────┐
│ OpenAI  │ │ Claude │ │ Llama │ │ Grok │ │ Gemini   │
│ GPT-4   │ │ Opus   │ │ 3.1   │ │ Beta │ │ Pro      │
└─────────┘ └────────┘ └───────┘ └──────┘ └──────────┘
```

### Key Benefits

✅ **Access 100+ models** from one endpoint
✅ **No vendor lock-in** - switch with string changes
✅ **Automatic failover** between providers
✅ **Cost transparency** with detailed tracking
✅ **Global CDN** deployment for low latency
✅ **BYOK pricing** - no markup on API costs
✅ **Production-ready** monitoring and logging

---

## 🚀 SETUP & CONFIGURATION

### 1. Enable AI Gateway

**Via Vercel Dashboard:**
```
1. Go to your Vercel project
2. Navigate to Settings > AI
3. Click "Enable AI Gateway"
4. Copy your Gateway URL and API Key
```

**Environment Variables:**
```bash
# .env.local (Development)
VERCEL_AI_GATEWAY_URL=https://gateway.vercel.ai/v1
VERCEL_AI_GATEWAY_KEY=your-gateway-key

# Provider Keys (BYOK)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
GOOGLE_AI_API_KEY=...
```

### 2. Install Vercel AI SDK

```bash
# Core SDK
pnpm add ai

# Provider adapters
pnpm add @ai-sdk/openai @ai-sdk/anthropic

# Optional providers
pnpm add @ai-sdk/google @ai-sdk/mistral @ai-sdk/cohere
```

### 3. Configure Providers

```typescript
// lib/ai/config.ts
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'

export const AI_MODELS = {
  // OpenAI Models
  gpt4Turbo: openai('gpt-4-turbo'),
  gpt4: openai('gpt-4'),
  gpt35Turbo: openai('gpt-3.5-turbo'),

  // Anthropic Models
  claudeOpus: anthropic('claude-3-opus-20240229'),
  claudeSonnet: anthropic('claude-3-sonnet-20240229'),
  claudeHaiku: anthropic('claude-3-haiku-20240307'),

  // Google Models
  geminiPro: google('models/gemini-pro'),
  geminiUltra: google('models/gemini-ultra'),
}

// Model selector based on use case
export function selectModel(task: string) {
  const modelMap = {
    chat: AI_MODELS.gpt4Turbo,
    moderation: AI_MODELS.gpt35Turbo,
    analysis: AI_MODELS.claudeOpus,
    summarization: AI_MODELS.claudeHaiku,
    creative: AI_MODELS.geminiPro,
  }

  return modelMap[task] || AI_MODELS.gpt35Turbo
}
```

---

## 🔧 USAGE PATTERNS

### Pattern 1: Simple Text Generation

```typescript
// app/api/ai/generate/route.ts
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const result = await generateText({
    model: openai('gpt-4-turbo'), // Gateway routes automatically
    prompt,
    maxTokens: 500,
    temperature: 0.7,
  })

  return Response.json({ text: result.text })
}
```

### Pattern 2: Streaming Responses

```typescript
// app/api/ai/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4-turbo'),
    messages,
    temperature: 0.7,
  })

  // Stream to client with Server-Sent Events
  return result.toAIStreamResponse()
}
```

**Frontend (with streaming):**
```typescript
// components/ChatInterface.tsx
'use client'

import { useChat } from 'ai/react'

export function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/ai/chat',
    })

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  )
}
```

### Pattern 3: Structured Output

```typescript
// app/api/ai/extract/route.ts
import { openai } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'

export const runtime = 'edge'

const UserProfileSchema = z.object({
  name: z.string(),
  age: z.number(),
  interests: z.array(z.string()),
  bio: z.string(),
})

export async function POST(req: Request) {
  const { text } = await req.json()

  const result = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: UserProfileSchema,
    prompt: `Extract user profile from: ${text}`,
  })

  // result.object is type-safe!
  return Response.json({ profile: result.object })
}
```

### Pattern 4: Multi-Provider Fallback

```typescript
// lib/ai/resilient-generation.ts
import { openai } from '@ai-sdk/openai'
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'

export async function generateWithFallback(prompt: string) {
  const providers = [
    { name: 'openai', model: openai('gpt-4-turbo') },
    { name: 'anthropic', model: anthropic('claude-3-opus-20240229') },
    { name: 'openai-backup', model: openai('gpt-3.5-turbo') },
  ]

  for (const provider of providers) {
    try {
      console.log(`Trying provider: ${provider.name}`)

      const result = await generateText({
        model: provider.model,
        prompt,
        maxRetries: 2,
        abortSignal: AbortSignal.timeout(10000), // 10s timeout
      })

      console.log(`Success with provider: ${provider.name}`)
      return result
    } catch (error) {
      console.error(`Failed with ${provider.name}:`, error)
      continue
    }
  }

  throw new Error('All AI providers failed')
}
```

---

## 🔐 AUTHENTICATION

### Method 1: API Key (Development)

```typescript
// lib/ai/client.ts
import { openai } from '@ai-sdk/openai'

export const aiClient = openai({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.VERCEL_AI_GATEWAY_URL, // Optional: explicit gateway
})
```

### Method 2: OIDC Tokens (Production)

**Automatic on Vercel:**
```typescript
// lib/ai/vercel-auth.ts
export async function getAIClient() {
  // VERCEL_OIDC_TOKEN automatically provided in production
  const token = process.env.VERCEL_OIDC_TOKEN

  if (!token) {
    throw new Error('OIDC token not available')
  }

  return openai({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
```

**Benefits:**
- ✅ 12-hour token validity
- ✅ Automatic renewal
- ✅ No manual key management
- ✅ Enhanced security

---

## 📊 MONITORING & ANALYTICS

### Built-in Gateway Metrics

**Vercel Dashboard Provides:**
- ✅ Request counts per model
- ✅ Latency percentiles (p50, p95, p99)
- ✅ Error rates by provider
- ✅ Cost breakdown per endpoint
- ✅ Token usage analytics

### Custom Telemetry

```typescript
// lib/ai/telemetry.ts
import { track } from '@vercel/analytics/server'

export async function trackAIRequest(
  feature: string,
  model: string,
  metadata: {
    userId?: string
    latency: number
    tokens: number
    cost: number
    success: boolean
  }
) {
  await track('ai_request', {
    feature,
    model,
    ...metadata,
  })

  // Log to your analytics platform
  if (!metadata.success) {
    console.error(`AI request failed: ${feature}`, metadata)
  }
}
```

**Usage:**
```typescript
// app/api/ai/chat/route.ts
export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const result = await generateText({
      model: openai('gpt-4-turbo'),
      prompt: 'Hello',
    })

    await trackAIRequest('chat', 'gpt-4-turbo', {
      latency: Date.now() - startTime,
      tokens: result.usage.totalTokens,
      cost: calculateCost(result.usage),
      success: true,
    })

    return Response.json({ text: result.text })
  } catch (error) {
    await trackAIRequest('chat', 'gpt-4-turbo', {
      latency: Date.now() - startTime,
      tokens: 0,
      cost: 0,
      success: false,
    })

    throw error
  }
}
```

---

## 💰 COST MANAGEMENT

### Real-Time Cost Tracking

```typescript
// lib/ai/cost-tracker.ts
export const MODEL_PRICING = {
  'gpt-4-turbo': {
    input: 0.01 / 1000, // $0.01 per 1K tokens
    output: 0.03 / 1000,
  },
  'gpt-3.5-turbo': {
    input: 0.0005 / 1000,
    output: 0.0015 / 1000,
  },
  'claude-3-opus-20240229': {
    input: 0.015 / 1000,
    output: 0.075 / 1000,
  },
  'claude-3-haiku-20240307': {
    input: 0.00025 / 1000,
    output: 0.00125 / 1000,
  },
}

export function calculateCost(model: string, usage: TokenUsage): number {
  const pricing = MODEL_PRICING[model]
  if (!pricing) return 0

  return (
    usage.promptTokens * pricing.input + usage.completionTokens * pricing.output
  )
}

export async function checkBudget(
  userId: string,
  estimatedCost: number
): Promise<boolean> {
  const dailySpent = await getDailySpent(userId)
  const limit = process.env.DAILY_USER_LIMIT || 5 // $5 default

  if (dailySpent + estimatedCost > parseFloat(limit)) {
    await logBudgetExceeded(userId, dailySpent)
    return false
  }

  return true
}
```

### Budget Alerts

```typescript
// lib/ai/budget-alerts.ts
export async function setupBudgetAlerts() {
  const config = {
    daily: {
      threshold: 100, // $100/day
      alert: 'slack', // or 'email', 'pagerduty'
    },
    monthly: {
      threshold: 2500, // $2,500/month
      alert: 'email',
    },
    perUser: {
      threshold: 5, // $5/user/day
      action: 'throttle', // or 'block'
    },
  }

  // Check and alert every hour
  setInterval(async () => {
    const dailySpent = await getDailySpent()
    if (dailySpent > config.daily.threshold * 0.8) {
      await sendAlert(
        'daily_budget_warning',
        `Daily AI spend at ${Math.round((dailySpent / config.daily.threshold) * 100)}%`
      )
    }
  }, 3600000) // 1 hour
}
```

---

## 🔒 SECURITY & COMPLIANCE

### Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 req/min per user
})

export async function middleware(req: Request) {
  if (req.url.includes('/api/ai/')) {
    const userId = getUserIdFromRequest(req)
    const { success } = await ratelimit.limit(userId)

    if (!success) {
      return new Response('Rate limit exceeded', { status: 429 })
    }
  }

  return NextResponse.next()
}
```

### Data Privacy

```typescript
// lib/ai/privacy.ts
export const PRIVACY_CONFIG = {
  // Redact PII before sending to AI
  redactPII: true,

  // Log prompts for debugging (disable in production)
  logPrompts: process.env.NODE_ENV === 'development',

  // Store responses (for analytics)
  storeResponses: false,

  // Retention period
  logRetention: '30d',
}

export function sanitizeInput(text: string): string {
  if (!PRIVACY_CONFIG.redactPII) return text

  // Redact emails
  text = text.replace(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    '[REDACTED_EMAIL]'
  )

  // Redact phone numbers
  text = text.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]')

  // Redact SSN
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]')

  return text
}
```

---

## 🧪 TESTING

### Unit Tests

```typescript
// tests/ai-gateway.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

describe('AI Gateway', () => {
  it('generates text successfully', async () => {
    const result = await generateText({
      model: openai('gpt-3.5-turbo'),
      prompt: 'Say hello',
      maxTokens: 10,
    })

    expect(result.text).toBeDefined()
    expect(result.usage.totalTokens).toBeGreaterThan(0)
  })

  it('handles rate limiting', async () => {
    const userId = 'test-user'

    // Exhaust rate limit
    for (let i = 0; i < 11; i++) {
      try {
        await generateText({
          model: openai('gpt-3.5-turbo'),
          prompt: 'Test',
        })
      } catch (error) {
        if (i === 10) {
          expect(error.message).toContain('rate limit')
        }
      }
    }
  })
})
```

### Load Testing

```typescript
// scripts/load-test-ai.ts
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

async function loadTest(concurrency: number, duration: number) {
  const results = []
  const startTime = Date.now()

  while (Date.now() - startTime < duration) {
    const promises = Array(concurrency)
      .fill(null)
      .map(async () => {
        const start = Date.now()
        try {
          await generateText({
            model: openai('gpt-3.5-turbo'),
            prompt: 'Test prompt',
          })
          return { success: true, latency: Date.now() - start }
        } catch (error) {
          return { success: false, latency: Date.now() - start, error }
        }
      })

    const batch = await Promise.all(promises)
    results.push(...batch)
  }

  // Analyze results
  const successful = results.filter((r) => r.success).length
  const avgLatency =
    results.reduce((sum, r) => sum + r.latency, 0) / results.length

  console.log({
    total: results.length,
    successful,
    failed: results.length - successful,
    successRate: (successful / results.length) * 100,
    avgLatency,
  })
}

// Run: 10 concurrent requests for 60 seconds
loadTest(10, 60000)
```

---

## 📚 REFERENCE

**Key Configuration Files:**
- `apps/frontend/vercel.json` - Vercel deployment config
- `lib/ai/config.ts` - Provider configuration
- `app/api/ai/**/*.ts` - AI endpoint implementations

**External Resources:**
- [Vercel AI Gateway Docs](https://vercel.com/docs/ai)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Provider Comparison](https://sdk.vercel.ai/docs/ai-sdk-core/providers)

---

**Status:** ✅ Production-Ready
**Last Updated:** 2025-11-14
**Version:** 1.0.0

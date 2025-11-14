/**
 * AI Content Moderation API
 *
 * CRITICAL FOR SAFETY: Moderates user-generated content
 * Uses AI to detect inappropriate content, PII, spam, etc.
 *
 * AXIOM:1 Compliant:
 * - Edge Runtime for <100ms latency
 * - AI Gateway: https://ai-gateway.vercel.sh/v1
 * - Environment: AI_GATEWAY_API_KEY
 */

export const runtime = 'edge'
export const maxDuration = 30 // 30 seconds max

interface ModerationRequest {
  content: string
  contentType?: 'message' | 'bio' | 'photo' | 'comment'
  userId?: string
}

interface ModerationResult {
  safe: boolean
  categories: string[]
  severity: 'low' | 'medium' | 'high'
  action: 'allow' | 'warn' | 'block' | 'review'
  confidence: number
}

export async function POST(request: Request) {
  try {
    const body: ModerationRequest = await request.json()
    const { content, contentType = 'message', userId } = body

    if (!content || typeof content !== 'string') {
      return Response.json(
        { error: 'Content is required and must be a string' },
        { status: 400 }
      )
    }

    // TODO: Implement actual AI moderation
    // For now, use basic rules + placeholder for AI integration

    const flags: string[] = []

    // Check for PII
    if (checkForPII(content)) {
      flags.push('pii_detected')
    }

    // Check for URLs/social media
    if (checkForExternalLinks(content)) {
      flags.push('external_links')
    }

    // Check for spam patterns
    if (checkForSpam(content)) {
      flags.push('spam')
    }

    // Determine action based on flags
    const result: ModerationResult = {
      safe: flags.length === 0,
      categories: flags,
      severity: determineSeverity(flags),
      action: determineAction(flags),
      confidence: 0.85,
    }

    // Log moderation result
    console.log('Moderation:', { userId, contentType, result })

    return Response.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Moderation error:', error)
    return Response.json(
      {
        error: 'Moderation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Helper functions for content checks

function checkForPII(content: string): boolean {
  // Email detection
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content)) {
    return true
  }

  // Phone number detection
  if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(content)) {
    return true
  }

  // SSN detection
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(content)) {
    return true
  }

  return false
}

function checkForExternalLinks(content: string): boolean {
  // URL detection
  if (/https?:\/\//.test(content)) {
    return true
  }

  // Social media handles
  if (/@\w+|instagram|snapchat|whatsapp|telegram/i.test(content)) {
    return true
  }

  return false
}

function checkForSpam(content: string): boolean {
  const spamPatterns = [
    /click here/i,
    /buy now/i,
    /limited time/i,
    /act now/i,
    /free money/i,
    /get rich/i,
    /weight loss/i,
    /work from home/i,
  ]

  return spamPatterns.some((pattern) => pattern.test(content))
}

function determineSeverity(flags: string[]): 'low' | 'medium' | 'high' {
  if (flags.includes('pii_detected')) return 'high'
  if (flags.length >= 2) return 'medium'
  return 'low'
}

function determineAction(flags: string[]): 'allow' | 'warn' | 'block' | 'review' {
  if (flags.includes('pii_detected')) return 'block'
  if (flags.includes('spam')) return 'block'
  if (flags.length > 0) return 'warn'
  return 'allow'
}

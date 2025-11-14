/**
 * AI Smart Replies API
 *
 * Generates quick reply suggestions based on conversation context
 *
 * AXIOM:1 Compliant:
 * - Edge Runtime for low latency
 * - Streaming responses (can be enabled)
 */

export const runtime = 'edge'
export const maxDuration = 30

interface SmartRepliesRequest {
  conversationId: string
  lastMessage: string
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  userId?: string
}

interface SmartRepliesResponse {
  replies: string[]
  cached: boolean
  confidence: number
}

export async function POST(request: Request) {
  try {
    const body: SmartRepliesRequest = await request.json()
    const { conversationId, lastMessage, conversationHistory, userId } = body

    if (!lastMessage) {
      return Response.json(
        { error: 'lastMessage is required' },
        { status: 400 }
      )
    }

    // TODO: Implement actual AI generation
    // For now, return context-aware fallback replies

    const fallbackReplies = generateFallbackReplies(lastMessage)

    console.log('Smart replies requested:', { conversationId, userId })

    const response: SmartRepliesResponse = {
      replies: fallbackReplies,
      cached: false,
      confidence: 0.7,
    }

    return Response.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    })
  } catch (error) {
    console.error('Smart replies error:', error)
    return Response.json(
      {
        error: 'Failed to generate replies',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function generateFallbackReplies(lastMessage: string): string[] {
  // Simple context-aware replies based on message content
  const message = lastMessage.toLowerCase()

  if (message.includes('?')) {
    return [
      "That's a great question! Let me think about that...",
      "Interesting question! I'd say...",
      "Good point! Here's my take:",
    ]
  }

  if (message.includes('thanks') || message.includes('thank you')) {
    return [
      "You're welcome! Happy to help!",
      "No problem at all! 😊",
      "Anytime! Glad I could help!",
    ]
  }

  if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
    return [
      "Hey! How's it going?",
      "Hi there! Great to hear from you!",
      "Hello! What's up?",
    ]
  }

  // Default replies
  return [
    "That sounds interesting! Tell me more.",
    "I'd love to hear more about that!",
    "That's cool! What else?",
  ]
}

/**
 * AI Chat API (General Purpose)
 *
 * General-purpose chat endpoint for AI interactions
 * Can be used for various AI features
 *
 * AXIOM:1 Compliant:
 * - Edge Runtime
 * - Streaming support (commented out for now)
 * - AI Gateway integration ready
 */

export const runtime = 'edge'
export const maxDuration = 60

interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  model?: string
  temperature?: number
  maxTokens?: number
  userId?: string
}

interface ChatResponse {
  message: string
  model: string
  tokensUsed?: number
  cached: boolean
}

export async function POST(request: Request) {
  try {
    const body: ChatRequest = await request.json()
    const { messages, model = 'gpt-3.5-turbo', temperature = 0.7, maxTokens = 500, userId } = body

    if (!messages || messages.length === 0) {
      return Response.json(
        { error: 'messages array is required' },
        { status: 400 }
      )
    }

    // Validate message format
    if (!messages.every((m) => m.role && m.content)) {
      return Response.json(
        { error: 'Each message must have role and content' },
        { status: 400 }
      )
    }

    // TODO: Implement actual AI chat
    // For now, return echo response

    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()
    const fallbackResponse = `I received your message: "${lastUserMessage?.content}". AI integration is pending.`

    console.log('Chat requested:', { model, userId, messageCount: messages.length })

    const response: ChatResponse = {
      message: fallbackResponse,
      model: 'fallback',
      tokensUsed: 0,
      cached: false,
    }

    return Response.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return Response.json(
      {
        error: 'Chat failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// OPTIONS for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * AI Conversation Starters API
 *
 * Generates personalized conversation starters based on user profiles
 *
 * AXIOM:1 Compliant:
 * - Edge Runtime
 * - AI Gateway: https://ai-gateway.vercel.sh/v1
 * - Model format: 'provider/model'
 */

export const runtime = 'edge'
export const maxDuration = 60

interface StartersRequest {
  matchId: string
  userId?: string
}

interface StartersResponse {
  starters: string[]
  cached: boolean
  model?: string
}

export async function POST(request: Request) {
  try {
    const body: StartersRequest = await request.json()
    const { matchId, userId } = body

    if (!matchId) {
      return Response.json(
        { error: 'matchId is required' },
        { status: 400 }
      )
    }

    // TODO: Implement actual AI generation
    // For now, return fallback starters

    const fallbackStarters = [
      "I noticed we both love hiking! What's your favorite trail?",
      "Your profile mentions you're into photography - what do you like to shoot?",
      "Hey! I saw we have some shared interests. What brings you to the platform?",
    ]

    // Log request
    console.log('Conversation starters requested:', { matchId, userId })

    const response: StartersResponse = {
      starters: fallbackStarters,
      cached: false,
      model: 'fallback', // Will be 'openai/gpt-4-turbo' when implemented
    }

    return Response.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Conversation starters error:', error)
    return Response.json(
      {
        error: 'Failed to generate starters',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint for quick access
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get('matchId')

  if (!matchId) {
    return Response.json(
      { error: 'matchId query parameter is required' },
      { status: 400 }
    )
  }

  return POST(
    new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ matchId }),
    })
  )
}

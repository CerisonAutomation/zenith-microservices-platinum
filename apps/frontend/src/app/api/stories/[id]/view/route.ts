import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Record story view
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const storyId = params.id

    // Check if story exists and is not expired
    const { data: story, error: fetchError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', storyId)
      .single()

    if (fetchError || !story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      )
    }

    if (new Date(story.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Story has expired' },
        { status: 410 }
      )
    }

    // Don't record view if user is viewing their own story
    if (story.user_id === user.id) {
      return NextResponse.json({ message: 'Own story view not recorded' })
    }

    // Record view (will fail silently if already viewed due to UNIQUE constraint)
    const { error: viewError } = await supabase
      .from('story_views')
      .insert({
        story_id: storyId,
        viewer_id: user.id,
      })

    // Ignore unique constraint violations (user already viewed)
    if (viewError && !viewError.message.includes('unique')) {
      console.error('Database error:', viewError)
      return NextResponse.json(
        { error: 'Failed to record view' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'View recorded' })

  } catch (error) {
    console.error('Error recording story view:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

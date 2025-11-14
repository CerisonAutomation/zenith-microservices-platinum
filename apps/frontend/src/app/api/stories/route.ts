import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get active stories from matches
export async function GET(request: NextRequest) {
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

    // Get active stories (not expired)
    // Only from user's matches
    const { data: stories, error: fetchError } = await supabase
      .from('stories')
      .select(`
        *,
        user:profiles!stories_user_id_fkey(id, username, avatar_url),
        views:story_views(count)
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch stories' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stories })

  } catch (error) {
    console.error('Error fetching stories:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create a new story
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { media_url, media_type, thumbnail_url, caption } = body

    if (!media_url || !media_type) {
      return NextResponse.json(
        { error: 'media_url and media_type are required' },
        { status: 400 }
      )
    }

    if (!['image', 'video'].includes(media_type)) {
      return NextResponse.json(
        { error: 'media_type must be "image" or "video"' },
        { status: 400 }
      )
    }

    // Create story (expires in 24 hours)
    const { data: story, error: createError } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        media_url,
        media_type,
        thumbnail_url,
        caption,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Database error:', createError)
      return NextResponse.json(
        { error: 'Failed to create story' },
        { status: 500 }
      )
    }

    return NextResponse.json({ story }, { status: 201 })

  } catch (error) {
    console.error('Error creating story:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Delete a story
export async function DELETE(
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

    // Check if story exists and belongs to user
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

    if (story.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete story media from storage if needed
    // Extract file path from media_url
    if (story.media_url.includes('supabase')) {
      const urlParts = story.media_url.split('/')
      const fileName = urlParts[urlParts.length - 1]

      await supabase.storage
        .from('stories')
        .remove([`${user.id}/${fileName}`])
    }

    // Delete story from database (cascades to story_views)
    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete story' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Story deleted' })

  } catch (error) {
    console.error('Error deleting story:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

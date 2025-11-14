import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Get call details
export async function GET(
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

    const callId = params.id

    // Get call details
    const { data: call, error: fetchError } = await supabase
      .from('calls')
      .select(`
        *,
        caller:profiles!calls_caller_id_fkey(id, username, avatar_url),
        receiver:profiles!calls_receiver_id_fkey(id, username, avatar_url)
      `)
      .eq('id', callId)
      .single()

    if (fetchError || !call) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    // Verify user is part of the call
    if (call.caller_id !== user.id && call.receiver_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    return NextResponse.json({ call })

  } catch (error) {
    console.error('Error fetching call:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

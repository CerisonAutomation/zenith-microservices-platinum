import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Update call status (ongoing, ended, missed, declined)
export async function PATCH(
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

    const body = await request.json()
    const { status, duration_seconds } = body
    const callId = params.id

    if (!status) {
      return NextResponse.json(
        { error: 'status is required' },
        { status: 400 }
      )
    }

    // Verify user is part of the call
    const { data: existingCall, error: fetchError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', callId)
      .single()

    if (fetchError || !existingCall) {
      return NextResponse.json(
        { error: 'Call not found' },
        { status: 404 }
      )
    }

    if (existingCall.caller_id !== user.id && existingCall.receiver_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = { status }

    if (status === 'ongoing' && !existingCall.started_at) {
      updateData.started_at = new Date().toISOString()
    }

    if (status === 'ended') {
      updateData.ended_at = new Date().toISOString()

      if (duration_seconds) {
        updateData.duration_seconds = duration_seconds
      } else if (existingCall.started_at) {
        // Calculate duration
        const startTime = new Date(existingCall.started_at).getTime()
        const endTime = new Date().getTime()
        updateData.duration_seconds = Math.floor((endTime - startTime) / 1000)
      }
    }

    // Update call
    const { data: updatedCall, error: updateError } = await supabase
      .from('calls')
      .update(updateData)
      .eq('id', callId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update call' },
        { status: 500 }
      )
    }

    return NextResponse.json({ call: updatedCall })

  } catch (error) {
    console.error('Error updating call status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

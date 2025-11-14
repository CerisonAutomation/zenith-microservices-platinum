import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Create a new video/audio call room using Daily.co
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
    const { receiver_id, conversation_id, type = 'video' } = body

    if (!receiver_id) {
      return NextResponse.json(
        { error: 'receiver_id is required' },
        { status: 400 }
      )
    }

    // Create Daily.co room
    const roomName = `zenith-call-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_screenshare: type === 'video',
          enable_chat: false,
          enable_knocking: true,
          enable_prejoin_ui: true,
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiry
        },
      }),
    })

    if (!dailyResponse.ok) {
      throw new Error('Failed to create Daily.co room')
    }

    const dailyRoom = await dailyResponse.json()

    // Store call in database
    const { data: call, error: dbError } = await supabase
      .from('calls')
      .insert({
        caller_id: user.id,
        receiver_id,
        conversation_id,
        room_url: dailyRoom.url,
        room_name: dailyRoom.name,
        type,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create call record' },
        { status: 500 }
      )
    }

    // TODO: Send real-time notification to receiver via Supabase real-time

    return NextResponse.json({
      call,
      room_url: dailyRoom.url,
    })

  } catch (error) {
    console.error('Error creating call:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

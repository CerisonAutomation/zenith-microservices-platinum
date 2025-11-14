// Supabase Edge Function - Create Video/Audio Call
// Replaces /api/calls/create with native Supabase solution

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Get allowed origins from environment variable
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000').split(',')

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { receiver_id, conversation_id, type } = await req.json()

    if (!receiver_id || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: receiver_id, type' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create Daily.co room
    const dailyApiKey = Deno.env.get('DAILY_API_KEY')
    if (!dailyApiKey) {
      return new Response(JSON.stringify({ error: 'Daily.co API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const roomName = `zenith-call-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`

    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          max_participants: 2,
          enable_screenshare: true,
          enable_chat: false,
          enable_knocking: true,
          enable_prejoin_ui: true,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
      }),
    })

    if (!dailyResponse.ok) {
      throw new Error('Failed to create Daily.co room')
    }

    const dailyRoom = await dailyResponse.json()

    // Store call in database using RPC for better security
    const { data: call, error: callError } = await supabaseClient.rpc('create_call', {
      p_caller_id: user.id,
      p_receiver_id: receiver_id,
      p_conversation_id: conversation_id,
      p_room_url: dailyRoom.url,
      p_call_type: type,
    })

    if (callError) {
      console.error('Database error:', callError)
      return new Response(JSON.stringify({ error: 'Failed to create call record' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Send real-time notification via Supabase Realtime
    await supabaseClient
      .channel(`user:${receiver_id}`)
      .send({
        type: 'broadcast',
        event: 'incoming_call',
        payload: {
          call_id: call.id,
          caller_id: user.id,
          caller_name: user.user_metadata?.full_name || 'Someone',
          type: type,
          room_url: dailyRoom.url,
        },
      })

    return new Response(
      JSON.stringify({
        success: true,
        call: call,
        room_url: dailyRoom.url,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in create-call function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

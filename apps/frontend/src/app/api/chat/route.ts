import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { rateLimit, RateLimitConfig, createRateLimitResponse } from '@/utils/rate-limit';

// Edge runtime for optimal performance
export const runtime = 'edge';

// Maximum duration for streaming response (60 seconds for Edge)
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting for chat endpoints
    const { success, headers: rateLimitHeaders, result } = await rateLimit(req, RateLimitConfig.chat);

    if (!success) {
      return createRateLimitResponse(result);
    }

    // Verify OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user with Supabase
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { messages, conversationId, matchId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stream the AI response using Vercel AI SDK
    const result = await streamText({
      model: openai('gpt-4-turbo'),
      messages: convertToCoreMessages(messages),
      temperature: 0.7,
      maxTokens: 500,
      async onFinish({ text, finishReason, usage }) {
        // Store the message in database after streaming completes
        if (conversationId && text) {
          try {
            await supabase.from('messages').insert({
              conversation_id: conversationId,
              sender_id: 'ai-assistant',
              receiver_id: user.id,
              content: text,
              type: 'text',
              metadata: {
                finishReason,
                usage,
                model: 'gpt-4-turbo'
              }
            });
          } catch (dbError) {
            console.error('Failed to store AI message:', dbError);
          }
        }
      }
    });

    // Return streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

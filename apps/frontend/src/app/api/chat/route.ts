import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { rateLimit, RateLimitConfig, createRateLimitResponse } from '@/utils/rate-limit';
import { APILogger } from '@/utils/api-logger';
import { apiError, requireEnv } from '@/utils/api-helpers';

// Edge runtime for optimal performance
export const runtime = 'edge';

// Maximum duration for streaming response (60 seconds for Edge)
export const maxDuration = 60;

const logger = APILogger.scope('chat');

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting for chat endpoints
    const { success, headers: rateLimitHeaders, result } = await rateLimit(req, RateLimitConfig.chat);

    if (!success) {
      logger.warn('Rate limit exceeded');
      return createRateLimitResponse(result);
    }

    // Verify OpenAI API key is configured
    try {
      requireEnv('OPENAI_API_KEY', 'Chat API');
    } catch (error) {
      logger.error('OpenAI API key not configured', error);
      return apiError('Service configuration error', 500);
    }

    // Authenticate user with Supabase
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access attempt');
      return apiError('Unauthorized', 401);
    }

    // Parse request body
    const { messages, conversationId, matchId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      logger.warn('Invalid request: missing messages array');
      return apiError('Messages array is required', 400);
    }

    logger.info('Chat request received', {
      userId: user.id,
      messageCount: messages.length,
      hasConversationId: Boolean(conversationId)
    });

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
            logger.error('Failed to store AI message in database', dbError, {
              conversationId,
              userId: user.id
            });
          }
        }
      }
    });

    // Return streaming response
    logger.info('Chat streaming response initiated');
    return result.toDataStreamResponse();
  } catch (error) {
    logger.error('Chat API error', error);
    return apiError(
      error instanceof Error ? error.message : 'Internal server error',
      500
    );
  }
}

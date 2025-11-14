import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { rateLimit, RateLimitConfig, createRateLimitResponse } from '@/utils/rate-limit';

import { APILogger } from '@/utils/api-logger';
import { apiError, requireEnv } from '@/utils/api-helpers';
// Edge runtime for optimal performance
export const runtime = 'edge';

const requestSchema = z.object({
  content: z.string().min(1).max(5000),
  contentType: z.enum(['message', 'bio', 'photo', 'profile']),
  contentId: z.string().optional()
});

const moderationResultSchema = z.object({
  flagged: z.boolean(),
  categories: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high']),
  action: z.enum(['allow', 'warn', 'block', 'review']),
  confidence: z.number().min(0).max(1),
  reason: z.string().optional()
});

export async function POST(req: NextRequest) {
const logger = APILogger.scope('moderate-content');
  try {
    // Apply rate limiting for AI endpoints
    const { success, headers: rateLimitHeaders, result } = await rateLimit(req, RateLimitConfig.ai);

    if (!success) {
      return createRateLimitResponse(result);
    }

    // Validate environment
    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Authenticate user
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: validation.error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { content, contentType, contentId } = validation.data;

    // Use AI SDK structured output for moderation
    const { object: result } = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: moderationResultSchema,
      prompt: `Analyze this ${contentType} content for a dating app and provide moderation recommendations:

Content: "${content}"

Check for:
1. Explicit content, sexual content, or harassment
2. Personal information (phone numbers, emails, social media handles)
3. Hate speech, discrimination, or offensive language
4. Scams, spam, or phishing attempts
5. References to minors or inappropriate age-related content
6. Violence or threatening behavior
7. Drug references or illegal activities

Provide a structured moderation result with:
- flagged: true if any violations found
- categories: array of violation types
- severity: low/medium/high
- action: allow/warn/block/review
- confidence: 0-1 score
- reason: brief explanation if flagged`
    });

    // Log moderation result to database
    try {
      await supabase.from('ai_moderation_log').insert({
        content_type: contentType,
        content_id: contentId,
        user_id: user.id,
        flagged: result.flagged,
        categories: result.categories,
        severity: result.severity,
        action: result.action,
        confidence: result.confidence,
        reason: result.reason
      });
    } catch (dbError) {
      logger.error('Failed to log moderation result:', dbError);
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Content moderation API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

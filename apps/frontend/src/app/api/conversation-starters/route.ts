import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { rateLimit, RateLimitConfig, createRateLimitResponse } from '@/utils/rate-limit';

// Edge runtime for optimal performance
export const runtime = 'edge';

const requestSchema = z.object({
  matchId: z.string().uuid()
});

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  occupation?: string;
}

export async function POST(req: NextRequest) {
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

    const { matchId } = validation.data;

    // Fetch match data with profiles
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        user_id,
        matched_user_id,
        user:user_id(id, name, age, bio, interests, occupation),
        matched_user:matched_user_id(id, name, age, bio, interests, occupation)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return new Response(
        JSON.stringify({ error: 'Match not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const user1 = match.user as unknown as Profile;
    const user2 = match.matched_user as unknown as Profile;

    // Generate conversation starters using AI SDK
    const { text } = await generateText({
      model: openai('gpt-4-turbo'),
      temperature: 0.8,
      maxTokens: 300,
      prompt: `Generate 3 creative, engaging conversation starters for two people who just matched on a dating app.

Person 1: ${user1.name}, ${user1.age} years old, ${user1.occupation || 'unknown occupation'}
Bio: ${user1.bio}
Interests: ${user1.interests.join(', ')}

Person 2: ${user2.name}, ${user2.age} years old, ${user2.occupation || 'unknown occupation'}
Bio: ${user2.bio}
Interests: ${user2.interests.join(', ')}

Create personalized conversation starters that:
1. Reference common interests or complementary traits
2. Are fun, lighthearted, and engaging
3. Encourage a genuine response

Format: Return ONLY a JSON array of 3 strings, no additional text.
Example: ["Question 1", "Question 2", "Question 3"]`
    });

    // Parse AI response
    const starters = JSON.parse(text);

    return new Response(
      JSON.stringify({ starters }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Conversation starters API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

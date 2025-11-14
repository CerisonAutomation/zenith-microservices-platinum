import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SECURITY FIX #3: Import secure CORS configuration
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
// SECURITY FIX #8: Import rate limiting
import { applyRateLimit, rateLimits } from '../_shared/rate-limit.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

interface Profile {
  id: string;
  name: string;
  age: number;
  bio: string;
  interests: string[];
  occupation?: string;
}

interface ConversationStarter {
  message: string;
  category: 'interests' | 'bio' | 'occupation' | 'fun';
  confidence: number;
}

serve(async (req) => {
  // SECURITY FIX #3: Handle CORS with origin validation
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  try {
    // Verify request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY FIX #7: Verify user authentication before processing
    const authClient = createClient(
      SUPABASE_URL ?? '',
      SUPABASE_ANON_KEY ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SECURITY FIX #8: Apply rate limiting for AI operations (expensive)
    const rateLimitResponse = await applyRateLimit(
      req,
      rateLimits.ai.maxRequests,
      rateLimits.ai.windowMs,
      user.id
    );
    if (rateLimitResponse) return rateLimitResponse;

    // SECURITY FIX #10: Input validation with proper error handling
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { matchId } = body;

    // SECURITY FIX #10: Validate matchId format (UUID)
    if (!matchId || typeof matchId !== 'string') {
      return new Response(JSON.stringify({ error: 'matchId is required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Validate UUID format to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(matchId)) {
      return new Response(JSON.stringify({ error: 'Invalid matchId format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY FIX #7: Verify user owns this match before proceeding
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);

    // First, verify the user is part of this match
    const { data: matchOwnership, error: ownershipError } = await supabase
      .from('matches')
      .select('user_id, matched_user_id')
      .eq('id', matchId)
      .single();

    if (ownershipError || !matchOwnership) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Ensure the authenticated user is part of this match
    if (matchOwnership.user_id !== user.id && matchOwnership.matched_user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized access to this match' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch match data with both user profiles
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
      return new Response(JSON.stringify({ error: 'Match data not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const user1 = match.user as unknown as Profile;
    const user2 = match.matched_user as unknown as Profile;

    // SECURITY FIX #10: Validate profile data before processing
    if (!user1 || !user2 || !user1.name || !user2.name) {
      return new Response(JSON.stringify({ error: 'Invalid profile data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate conversation starters using OpenAI
    const starters = await generateConversationStarters(user1, user2);

    return new Response(JSON.stringify({ starters }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // SECURITY FIX #12: Don't expose stack traces in production
    console.error('Error in ai-conversation-starters:', error);

    // Log full error for debugging but only return safe message
    const safeErrorMessage = Deno.env.get('DENO_ENV') === 'production'
      ? 'An error occurred while generating conversation starters'
      : (error?.message || 'Internal server error');

    return new Response(
      JSON.stringify({ error: safeErrorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateConversationStarters(
  user1: Profile,
  user2: Profile
): Promise<ConversationStarter[]> {
  if (!OPENAI_API_KEY) {
    // Fallback to template-based starters if no API key
    return generateFallbackStarters(user1, user2);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a dating app assistant that creates natural, engaging conversation starters.
Generate 3 unique opening messages that would help two people connect based on their profiles.
Make them fun, respectful, personalized, and 1-2 sentences max.
Consider shared interests, complementary traits, and engaging topics.
Return as JSON with this structure:
{
  "starters": [
    { "message": "...", "category": "interests|bio|occupation|fun", "confidence": 0.0-1.0 }
  ]
}`
          },
          {
            role: 'user',
            content: `Create conversation starters for these two people:

Person 1: ${user1.name}, ${user1.age}
Bio: ${user1.bio}
Interests: ${user1.interests.join(', ')}
${user1.occupation ? `Occupation: ${user1.occupation}` : ''}

Person 2: ${user2.name}, ${user2.age}
Bio: ${user2.bio}
Interests: ${user2.interests.join(', ')}
${user2.occupation ? `Occupation: ${user2.occupation}` : ''}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return generateFallbackStarters(user1, user2);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return result.starters || [];
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return generateFallbackStarters(user1, user2);
  }
}

function generateFallbackStarters(user1: Profile, user2: Profile): ConversationStarter[] {
  const starters: ConversationStarter[] = [];

  // Find shared interests
  const sharedInterests = user1.interests.filter((interest) =>
    user2.interests.some((i) => i.toLowerCase() === interest.toLowerCase())
  );

  if (sharedInterests.length > 0) {
    const interest = sharedInterests[0];
    starters.push({
      message: `I noticed we both love ${interest}! What got you into it?`,
      category: 'interests',
      confidence: 0.9
    });
  }

  // Bio-based starter
  if (user2.bio && user2.bio.length > 20) {
    const bioSnippet = user2.bio.split('.')[0];
    starters.push({
      message: `Your bio caught my attention, especially "${bioSnippet}". Tell me more!`,
      category: 'bio',
      confidence: 0.7
    });
  }

  // Fun/casual starter
  starters.push({
    message: `Hey ${user2.name}! I'm ${user1.name}. If you could travel anywhere right now, where would you go?`,
    category: 'fun',
    confidence: 0.8
  });

  // Occupation-based starter if available
  if (user2.occupation && user1.occupation) {
    starters.push({
      message: `Fellow ${user1.occupation} here! How did you end up in ${user2.occupation}?`,
      category: 'occupation',
      confidence: 0.75
    });
  }

  return starters.slice(0, 3);
}

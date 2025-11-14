import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// SECURITY FIX #3: Import secure CORS configuration
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';
// SECURITY FIX #8: Import rate limiting
import { applyRateLimit, rateLimits } from '../_shared/rate-limit.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

type ContentType = 'message' | 'bio' | 'photo' | 'profile';
type ActionType = 'allow' | 'warn' | 'block' | 'review';
type SeverityLevel = 'low' | 'medium' | 'high';

interface ModerationResult {
  flagged: boolean;
  categories: string[];
  severity: SeverityLevel;
  action: ActionType;
  confidence: number;
  reason?: string;
}

serve(async (req) => {
  // SECURITY FIX #3: Handle CORS with origin validation
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    const { content, contentType, userId, contentId } = body;

    // SECURITY FIX #8: Apply rate limiting for AI moderation (expensive operation)
    if (userId) {
      const rateLimitResponse = await applyRateLimit(
        req,
        rateLimits.ai.maxRequests,
        rateLimits.ai.windowMs,
        userId
      );
      if (rateLimitResponse) return rateLimitResponse;
    }

    // SECURITY FIX #10: Validate required fields and types
    if (!content || !contentType) {
      return new Response(
        JSON.stringify({ error: 'content and contentType are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (typeof content !== 'string' || content.length > 10000) {
      return new Response(
        JSON.stringify({ error: 'content must be a string with max 10000 characters' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const validContentTypes = ['message', 'bio', 'photo', 'profile'];
    if (!validContentTypes.includes(contentType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid contentType. Must be one of: message, bio, photo, profile' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Perform moderation
    const result = await moderateContent(content, contentType);

    // Log moderation result
    if (userId) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
      await supabase.from('ai_moderation_log').insert({
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        flagged: result.flagged,
        categories: result.categories,
        severity: result.severity,
        action: result.action,
        confidence: result.confidence
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // SECURITY FIX #12: Don't expose stack traces in production
    console.error('Error in ai-moderate-content:', error);

    const safeErrorMessage = Deno.env.get('DENO_ENV') === 'production'
      ? 'An error occurred during content moderation'
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

async function moderateContent(
  content: string,
  contentType: ContentType
): Promise<ModerationResult> {
  // Check custom rules first (these are fast and don't require API calls)
  const customFlags = checkCustomRules(content, contentType);

  // If custom rules flag severe violations, block immediately
  if (customFlags.severity === 'high') {
    return {
      flagged: true,
      categories: customFlags.categories,
      severity: 'high',
      action: 'block',
      confidence: customFlags.confidence,
      reason: customFlags.reason
    };
  }

  // Use OpenAI Moderation API if available
  if (OPENAI_API_KEY) {
    try {
      const openaiResult = await moderateWithOpenAI(content);

      // Combine OpenAI results with custom rules
      const allCategories = [...new Set([...openaiResult.categories, ...customFlags.categories])];
      const maxSeverity = getMaxSeverity(openaiResult.severity, customFlags.severity);
      const combinedConfidence = Math.max(openaiResult.confidence, customFlags.confidence);

      return {
        flagged: openaiResult.flagged || customFlags.categories.length > 0,
        categories: allCategories,
        severity: maxSeverity,
        action: determineAction(allCategories, maxSeverity),
        confidence: combinedConfidence,
        reason: openaiResult.reason || customFlags.reason
      };
    } catch (error) {
      console.error('OpenAI moderation failed, using custom rules only:', error);
    }
  }

  // Fallback to custom rules only
  return {
    flagged: customFlags.categories.length > 0,
    categories: customFlags.categories,
    severity: customFlags.severity,
    action: customFlags.categories.length > 0 ? 'warn' : 'allow',
    confidence: customFlags.confidence,
    reason: customFlags.reason
  };
}

async function moderateWithOpenAI(content: string): Promise<ModerationResult> {
  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: content })
  });

  if (!response.ok) {
    throw new Error('OpenAI moderation API error');
  }

  const data = await response.json();
  const result = data.results[0];

  const categories: string[] = Object.entries(result.categories)
    .filter(([_, flagged]) => flagged)
    .map(([category]) => category);

  const severity = calculateSeverity(result.category_scores);
  const maxScore = Math.max(...Object.values(result.category_scores));

  return {
    flagged: result.flagged,
    categories,
    severity,
    action: 'allow', // Will be determined by combineResults
    confidence: maxScore,
    reason: categories.length > 0 ? `Flagged for: ${categories.join(', ')}` : undefined
  };
}

interface CustomRulesResult {
  categories: string[];
  severity: SeverityLevel;
  confidence: number;
  reason?: string;
}

function checkCustomRules(content: string, contentType: ContentType): CustomRulesResult {
  const flags: string[] = [];
  let severity: SeverityLevel = 'low';
  let confidence = 0;
  let reason: string | undefined;

  const lowerContent = content.toLowerCase();

  // Phone number detection
  if (/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(content)) {
    flags.push('phone_number');
    severity = 'medium';
    confidence = Math.max(confidence, 0.95);
    reason = 'Contains phone number';
  }

  // Email detection
  if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(content)) {
    flags.push('email');
    severity = 'medium';
    confidence = Math.max(confidence, 0.95);
    reason = 'Contains email address';
  }

  // Social media handles
  const socialMediaPatterns = [
    /@\w+/,
    /instagram\.com|insta\s+me|ig\s*:/i,
    /snapchat|snap\s+me|sc\s*:/i,
    /whatsapp|whats\s+app|wa\s*:/i,
    /telegram|tele\s+me/i,
    /discord|disc\s*:/i
  ];

  if (socialMediaPatterns.some((pattern) => pattern.test(lowerContent))) {
    flags.push('social_media');
    severity = 'medium';
    confidence = Math.max(confidence, 0.85);
    reason = 'Contains social media reference';
  }

  // Payment solicitation
  const paymentPatterns = [
    /venmo|paypal|cashapp|zelle|send\s+money/i,
    /\$\d+|money|cash|payment|pay\s+me/i,
    /crypto|bitcoin|eth|wallet/i
  ];

  if (paymentPatterns.some((pattern) => pattern.test(lowerContent))) {
    flags.push('payment_solicitation');
    severity = 'high';
    confidence = Math.max(confidence, 0.9);
    reason = 'Payment solicitation detected';
  }

  // Explicit content (basic detection)
  const explicitPatterns = [
    /\b(sex|fuck|shit|ass|dick|cock|pussy|bitch)\b/i
  ];

  if (explicitPatterns.some((pattern) => pattern.test(lowerContent))) {
    flags.push('explicit_language');
    severity = severity === 'high' ? 'high' : 'medium';
    confidence = Math.max(confidence, 0.7);
  }

  // Scam/spam indicators
  const scamPatterns = [
    /click\s+here|visit\s+my\s+site|check\s+out\s+my/i,
    /100%\s+free|limited\s+time|act\s+now/i,
    /make\s+money|work\s+from\s+home|get\s+rich/i
  ];

  if (scamPatterns.some((pattern) => pattern.test(lowerContent))) {
    flags.push('spam');
    severity = 'high';
    confidence = Math.max(confidence, 0.85);
    reason = 'Possible spam or scam content';
  }

  // Age/minor references (critical)
  const minorPatterns = [
    /\b(underage|minor|teen|child|kid)\b/i,
    /\b(1[0-7]|[0-9])\s*(year|yr)s?\s*old\b/i
  ];

  if (contentType === 'bio' || contentType === 'message') {
    if (minorPatterns.some((pattern) => pattern.test(lowerContent))) {
      flags.push('minor_reference');
      severity = 'high';
      confidence = Math.max(confidence, 0.95);
      reason = 'Reference to minors detected';
    }
  }

  // URL detection (suspicious in first message)
  if (contentType === 'message' && /https?:\/\/\S+/.test(content)) {
    flags.push('url');
    severity = severity === 'high' ? 'high' : 'medium';
    confidence = Math.max(confidence, 0.8);
    reason = 'Contains URL';
  }

  // Excessive capitalization (spam indicator)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) {
    flags.push('excessive_caps');
    confidence = Math.max(confidence, 0.6);
  }

  // Repetitive characters (spam)
  if (/(.)\1{4,}/.test(content)) {
    flags.push('repetitive_text');
    confidence = Math.max(confidence, 0.65);
  }

  return {
    categories: flags,
    severity,
    confidence,
    reason
  };
}

function calculateSeverity(scores: Record<string, number>): SeverityLevel {
  const maxScore = Math.max(...Object.values(scores));

  if (maxScore > 0.8) return 'high';
  if (maxScore > 0.5) return 'medium';
  return 'low';
}

function getMaxSeverity(s1: SeverityLevel, s2: SeverityLevel): SeverityLevel {
  const severityOrder: Record<SeverityLevel, number> = {
    low: 1,
    medium: 2,
    high: 3
  };

  return severityOrder[s1] >= severityOrder[s2] ? s1 : s2;
}

function determineAction(categories: string[], severity: SeverityLevel): ActionType {
  // Critical violations - block immediately
  const criticalCategories = [
    'sexual/minors',
    'violence',
    'minor_reference',
    'payment_solicitation'
  ];

  if (categories.some((cat) => criticalCategories.includes(cat))) {
    return 'block';
  }

  // High severity with multiple flags - require review
  if (severity === 'high' || categories.length >= 3) {
    return 'review';
  }

  // Medium severity - warn user
  if (severity === 'medium' || categories.length > 0) {
    return 'warn';
  }

  return 'allow';
}

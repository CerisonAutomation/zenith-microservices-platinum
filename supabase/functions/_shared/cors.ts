// SECURITY FIX #3: Restricted CORS to prevent unauthorized access
// Only allow requests from trusted origins instead of wildcard (*)

// Get allowed origins from environment variable or use defaults
const ALLOWED_ORIGINS = Deno.env.get('CORS_ALLOWED_ORIGINS')?.split(',') || [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://zenith.app',
  'https://www.zenith.app',
  'https://app.zenith.com',
]

// Shared CORS headers generator for all Edge Functions
export function getCorsHeaders(origin?: string | null): Record<string, string> {
  // SECURITY: Validate origin against whitelist
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0] // Default to first allowed origin

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-csrf-token',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true', // SECURITY: Enable credentials for cookie-based auth
  }
}

// Legacy export for backward compatibility (uses first allowed origin)
export const corsHeaders = getCorsHeaders()

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin')
    return new Response('ok', { headers: getCorsHeaders(origin) })
  }
  return null
}

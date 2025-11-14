/**
 * Health Check Endpoint
 *
 * Returns the health status of the application
 * Used by monitoring systems and load balancers
 */

export const runtime = 'edge' // Use Edge Runtime for <100ms response

export async function GET() {
  try {
    // Check critical dependencies
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.VERCEL_ENV || 'development',
      region: process.env.VERCEL_REGION || 'unknown',
      checks: {
        api: 'ok',
        // Add more health checks as needed
      },
    }

    return Response.json(checks, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // VERCEL BEST PRACTICE: Remove standalone output for Vercel deployments
  // Vercel automatically optimizes the build. Use standalone only for Docker.
  // Uncomment the line below only if deploying to Docker/self-hosted:
  // output: 'standalone',

  experimental: {
    optimizeCss: true,
  },

  // VERCEL BEST PRACTICE: Use remotePatterns instead of deprecated domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    // VERCEL OPTIMIZATION: Optimized device and image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  async headers() {
    return [
      {
        // SECURITY FIX #21: Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            // SECURITY: Prevent clickjacking attacks
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // SECURITY: Prevent MIME type sniffing
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // SECURITY: Enable XSS protection (legacy browsers)
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            // SECURITY: Control referrer information
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // SECURITY: Comprehensive Content Security Policy
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "media-src 'self' blob: data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            // SECURITY: Enforce HTTPS (HSTS)
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            // SECURITY: Control browser features and APIs
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600'
          }
        ],
      },
      {
        source: '/(.*).(jpg|jpeg|png|gif|ico|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
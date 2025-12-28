import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default

  reactStrictMode: true,

  // Include SQL migration files in the serverless bundle
  outputFileTracingIncludes: {
    '/api/setup/migrate': ['./lib/migrations/**/*'],
  },

  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_APP_NAME: 'SmartZap',
  },

  // React Compiler for automatic memoization (moved from experimental in Next.js 16)
  reactCompiler: true,

  // Turbopack is enabled by default in Next.js 16
  // No additional config needed

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },

  // Headers for security and CORS
  async headers() {
    const allowedOrigin = process.env.FRONTEND_URL || 'https://smartzap.vercel.app'
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-API-Key' },
        ],
      },
    ]
  },
}

export default nextConfig

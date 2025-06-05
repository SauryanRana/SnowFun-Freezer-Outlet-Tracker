/**
 * Next.js configuration for Snowfun Nepal Freezer & Outlet Tracker
 * 
 * This configuration file sets up:
 * - Environment variables
 * - Image optimization
 * - API routes
 * - Security headers
 * - Performance optimizations
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configure image domains for external image sources
  images: {
    domains: [
      'firebasestorage.googleapis.com', // For Firebase Storage images
      'storage.googleapis.com',
      'localhost', // For local development
      'snowfun-nepal-storage.s3.amazonaws.com', // If using AWS S3
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Configure environment variables that should be exposed to the browser
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },
  
  // Configure redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  
  // Configure webpack if needed
  webpack(config) {
    // SVG support
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    return config;
  },
  
  // Internationalization settings (if needed for Nepali language support)
  i18n: {
    locales: ['en', 'ne'],
    defaultLocale: 'en',
  },
  
  // Output settings
  output: 'standalone',
  
  // Disable ESLint during build in production (assuming it's run separately)
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  
  // Transpile specific modules if needed
  transpilePackages: ['@snowfun/ui', '@snowfun/config'],
};

export default nextConfig;

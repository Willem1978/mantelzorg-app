import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors during build (not recommended for production)
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Disable static page generation for API routes
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip build-time data fetching for dynamic routes
  outputFileTracing: true,
};

export default nextConfig;

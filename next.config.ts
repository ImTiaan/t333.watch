import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript type checking during production builds
    ignoreBuildErrors: true,
  },
  // Set to 'export' for static site generation
  // This is compatible with Vercel deployments
  output: 'export',
  // Disable image optimization since we're using export
  images: {
    unoptimized: true
  },
  // Disable trailing slash
  trailingSlash: false
};

export default nextConfig;

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
  images: {
    domains: [
      'static-cdn.jtvnw.net',  // Twitch profile images
      'cdn.discordapp.com',    // Discord profile images (if needed)
    ],
  }
};

export default nextConfig;

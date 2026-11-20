import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  experimental: {
    // Portfolio covers go through a server action: 2 MB image plus form overhead (PRD F-PRF-04).
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;

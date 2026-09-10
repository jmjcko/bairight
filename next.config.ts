import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // In Next.js 14.2+, allowedDevOrigins is top-level
  // @ts-ignore
  allowedDevOrigins: ['*.lhr.life', '*.localhost.run', 'localhost:3000'],
};

export default nextConfig;

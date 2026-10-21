import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    viewTransition: true,
  },
  serverExternalPackages: ['isomorphic-dompurify', 'jsdom', 'linkedom', '@mozilla/readability'],
};

export default nextConfig;

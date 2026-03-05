import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['date-fns'],
  images: {
    domains: ['localhost', 'flagcdn.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'backend',
        port: '5000',
        pathname: '/uploads/**',
      },
    ],
  },
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default nextConfig;

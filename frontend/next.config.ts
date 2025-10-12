import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default nextConfig;

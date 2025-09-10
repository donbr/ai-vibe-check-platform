import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // In production on Vercel, we don't need rewrites as the API is handled by Vercel
    if (process.env.NODE_ENV === 'production') {
      return [];
    }
    
    // In development, proxy to local API server
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;

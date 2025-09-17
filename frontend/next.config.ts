import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for better MCP performance
  serverExternalPackages: ['@modelcontextprotocol/sdk'],
  
  // Optimize for Vercel deployment
  env: {
    NEXT_PUBLIC_MCP_ENABLED: process.env.NODE_ENV === 'production' ? 'true' : 'true',
  },

  // Headers for MCP API routes
  async headers() {
    return [
      {
        source: '/api/mcp/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },

  // Rewrite rules for API compatibility
  async rewrites() {
    return [
      {
        source: '/api/chat',
        destination: '/api/legacy-chat'
      },
      // Proxy PDF RAG endpoints to FastAPI backend
      {
        source: '/api/upload-pdf',
        destination: 'http://localhost:8000/api/upload-pdf'
      },
      {
        source: '/api/pdf-status',
        destination: 'http://localhost:8000/api/pdf-status'
      },
      {
        source: '/api/clear-pdf',
        destination: 'http://localhost:8000/api/clear-pdf'
      }
    ];
  },
};

export default nextConfig;

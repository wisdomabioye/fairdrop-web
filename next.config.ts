import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},

  // Required headers for SharedArrayBuffer (needed by Linera WASM client)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // Exclude @linera/client from server-side bundling
  serverExternalPackages: ['@linera/client'],
};

export default nextConfig;

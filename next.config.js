/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pin the bundler root to this project. Without it Next walks up the tree,
  // finds the stray lockfile in the parent `LnkZoo/` folder, and treats it as a
  // monorepo root — which desyncs module IDs ("[project]/_dev/...") from the
  // React Client Manifest and 500s every route.
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  serverExternalPackages: ['@neondatabase/serverless'],
  allowedDevOrigins: ['192.168.1.5'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Content-Security-Policy, written to match how the app actually loads
 * resources:
 *   - Google Fonts stylesheet (app/layout.tsx) -> fonts.googleapis.com styles,
 *     fonts.gstatic.com fonts.
 *   - Inline scripts stay allowed for now: the theme bootstrap in layout and
 *     Next's hydration payload are both inline. Pinning external origins still
 *     removes most payload shapes; going further means nonce-per-request via
 *     middleware.
 *   - Images are user content from arbitrary hosts (Cloudinary previews, OG
 *     images), so img-src stays https: + data:. connect-src stays same-origin:
 *     nothing in the browser talks to third-party APIs directly.
 *   - Dev needs 'unsafe-eval' (React refresh) and ws: (HMR); prod does not.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  // HSTS is ignored by browsers on plain http and localhost, so dev is unaffected.
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Everything under Permissions-Policy is a capability the app never uses;
  // deny them so an embedded third party cannot ask for them either.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // X-XSS-Protection is deliberately absent: it is deprecated, ignored by every
  // current browser, and its old auditor could introduce bugs of its own.
];

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
        headers: securityHeaders,
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

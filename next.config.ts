import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // gate item 23: baseline security headers (CSP is set per-app where inline scripts allow)
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy-Report-Only', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
    ] }]
  },
  // Don't bundle native modules — require at runtime so paths resolve correctly
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "sharp"],
  // Force-include native binaries and bundled fonts in serverless bundles.
  // Vercel's file tracer only follows JS imports, so these non-JS assets
  // must be listed explicitly to be deployed alongside the functions.
  outputFileTracingIncludes: {
    "**": [
      "./node_modules/@ffmpeg-installer/**",
      "./node_modules/sharp/**",
      "./fonts/**",
      "./node_modules/dejavu-fonts-ttf/ttf/**",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default nextConfig;

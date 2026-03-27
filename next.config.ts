import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't bundle these — require them at runtime so __dirname resolves correctly
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg"],
  // Force-include native binaries and bundled fonts in serverless bundles.
  // Vercel's file tracer only follows JS imports, so these non-JS assets
  // must be listed explicitly to be deployed alongside the functions.
  outputFileTracingIncludes: {
    "**": [
      "./node_modules/@ffmpeg-installer/**",
      "./fonts/**",
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

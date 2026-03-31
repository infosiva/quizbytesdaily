import type { MetadataRoute } from "next";
import { channelConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const base = channelConfig.websiteUrl;
  return {
    rules: [
      {
        // Allow all crawlers — including AI bots (GPTBot, ClaudeBot, PerplexityBot, Googlebot, etc.)
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/admin/", "/api/cron/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}

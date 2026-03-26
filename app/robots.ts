import type { MetadataRoute } from "next";
import { channelConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all crawlers including AI bots (GPTBot, ClaudeBot, PerplexityBot, etc.)
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${channelConfig.websiteUrl}/sitemap.xml`,
  };
}

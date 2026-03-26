import type { MetadataRoute } from "next";
import { channelConfig } from "@/lib/config";
import { ALL_SERIES } from "@/lib/slides";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = channelConfig.websiteUrl;
  const now  = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,          lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/slides`, lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
  ];

  // One sitemap entry per slide series
  const seriesPages: MetadataRoute.Sitemap = ALL_SERIES.map((s) => ({
    url:             `${base}/slides#${s.id}`,
    lastModified:    now,
    changeFrequency: "weekly" as const,
    priority:        0.6,
  }));

  return [...staticPages, ...seriesPages];
}

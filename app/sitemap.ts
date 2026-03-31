import type { MetadataRoute } from "next";
import { channelConfig } from "@/lib/config";
import { listSeries } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // rebuild sitemap at most once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = channelConfig.websiteUrl;
  const now  = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = [
    { url: base,          lastModified: now, changeFrequency: "daily",  priority: 1.0 },
    { url: `${base}/play`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  // One entry per published series
  let seriesPages: MetadataRoute.Sitemap = [];
  try {
    const series = await listSeries();
    const published = series.filter((s) => s.youtube_url);
    seriesPages = published.map((s) => ({
      url:             `${base}/?q=${encodeURIComponent(s.slug)}`,
      lastModified:    new Date(s.updated_at ?? s.created_at).toISOString(),
      changeFrequency: "monthly" as const,
      priority:        0.7,
    }));
  } catch { /* DB unavailable at build time — skip dynamic entries */ }

  return [...staticPages, ...seriesPages];
}

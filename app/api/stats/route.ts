import { NextResponse } from "next/server";
import { listSeries, getPageViewStats } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [series, views] = await Promise.all([listSeries(), getPageViewStats()]);
    const withSlides = series.filter((s) => (s.slide_count ?? 0) > 0);
    const catMap: Record<string, number> = {};
    for (const s of withSlides) catMap[s.category] = (catMap[s.category] ?? 0) + 1;
    return NextResponse.json({
      total:      withSlides.length,
      published:  withSlides.filter((s) => s.youtube_url != null).length,
      categories: Object.entries(catMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      pageViews: views,
    });
  } catch {
    return NextResponse.json({ total: 0, published: 0, categories: [], pageViews: { today: 0, week: 0, total: 0, daily: [] } });
  }
}

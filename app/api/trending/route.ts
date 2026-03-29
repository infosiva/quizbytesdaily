// GET /api/trending
// Returns live trending AI/tech topics from HN, GitHub Trending, and ArXiv.
// Results are cached for 1 hour via Next.js fetch cache.

import { NextResponse } from "next/server";
import { fetchLiveTrending } from "@/lib/trending-fetcher";

export const runtime = "nodejs";

export async function GET() {
  try {
    const topics = await fetchLiveTrending();
    return NextResponse.json({ topics, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch trending topics" },
      { status: 500 }
    );
  }
}

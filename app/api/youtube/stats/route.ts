/**
 * GET /api/youtube/stats
 * Fetches view/like/comment counts for all published series from YouTube Data API v3.
 * Sorted by view count descending.
 * Server-cached for 10 minutes to preserve API quota.
 */

import { NextResponse } from "next/server";
import { listSeries } from "@/lib/db";

export const runtime = "nodejs";

// ── 10-minute in-process cache ─────────────────────────────────────────────────
let _cache: { data: unknown; at: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const d = await res.json();
  if (!d.access_token) throw new Error(d.error_description ?? "Token refresh failed");
  return d.access_token as string;
}

export interface VideoStat {
  id:          number;
  slug:        string;
  title:       string;
  category:    string;
  difficulty:  string;
  youtube_id:  string;
  youtube_url: string | null;
  views:       number;
  likes:       number;
  comments:    number;
}

export async function GET() {
  try {
    // Return cache if fresh
    if (_cache && Date.now() - _cache.at < CACHE_TTL) {
      return NextResponse.json(_cache.data);
    }

    const allSeries  = await listSeries();
    const published  = allSeries.filter((s) => s.youtube_id);

    if (published.length === 0) {
      const empty = { stats: [], totalViews: 0, totalLikes: 0 };
      _cache = { data: empty, at: Date.now() };
      return NextResponse.json(empty);
    }

    const token  = await getAccessToken();
    const ids    = published.map((s) => s.youtube_id).join(",");
    const ytRes  = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&maxResults=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const ytData = await ytRes.json() as {
      items?: Array<{ id: string; statistics: { viewCount?: string; likeCount?: string; commentCount?: string } }>;
    };

    const statsMap = new Map<string, { views: number; likes: number; comments: number }>();
    for (const item of ytData.items ?? []) {
      statsMap.set(item.id, {
        views:    Number(item.statistics.viewCount    ?? 0),
        likes:    Number(item.statistics.likeCount    ?? 0),
        comments: Number(item.statistics.commentCount ?? 0),
      });
    }

    const stats: VideoStat[] = published
      .map((s) => {
        const st = statsMap.get(s.youtube_id!) ?? { views: 0, likes: 0, comments: 0 };
        return {
          id:          s.id,
          slug:        s.slug,
          title:       s.title,
          category:    s.category,
          difficulty:  s.difficulty,
          youtube_id:  s.youtube_id!,
          youtube_url: s.youtube_url,
          ...st,
        };
      })
      .sort((a, b) => b.views - a.views);

    const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
    const totalLikes = stats.reduce((sum, s) => sum + s.likes, 0);

    const payload = { stats, totalViews, totalLikes };
    _cache = { data: payload, at: Date.now() };
    return NextResponse.json(payload);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

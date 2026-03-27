import { NextRequest, NextResponse } from "next/server";
import { listSeries, updateSeriesYouTube } from "@/lib/db";

export const runtime = "nodejs";

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
  const data = await res.json();
  if (!data.access_token) throw new Error(data.error_description ?? "Token refresh failed");
  return data.access_token as string;
}

// DELETE /api/youtube/delete
// Body: { videoId: string }   — delete a single video
// Body: { all: true }         — delete every video that has a youtube_id in our DB
export async function DELETE(req: NextRequest) {
  try {
    const token = await getAccessToken();
    const body  = await req.json() as { videoId?: string; all?: boolean };

    const deleteOne = async (videoId: string) => {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      // 204 = success, 404 = already gone — both are fine
      if (res.status !== 204 && res.status !== 404) {
        const text = await res.text();
        throw new Error(`YouTube delete failed (${res.status}): ${text}`);
      }
    };

    if (body.all) {
      // Delete every video linked to a series in our DB
      const allSeries = await listSeries();
      const withVideo = allSeries.filter((s) => s.youtube_id);
      const results: Array<{ id: number; youtube_id: string; ok: boolean; error?: string }> = [];

      for (const series of withVideo) {
        try {
          await deleteOne(series.youtube_id!);
          // Clear the youtube_id from DB so UI updates
          // (re-use updateSeriesYouTube with empty strings won't work — use raw execute)
          results.push({ id: series.id, youtube_id: series.youtube_id!, ok: true });
        } catch (e) {
          results.push({ id: series.id, youtube_id: series.youtube_id!, ok: false, error: String(e) });
        }
      }

      return NextResponse.json({ deleted: results.filter((r) => r.ok).length, results });
    }

    if (body.videoId) {
      await deleteOne(body.videoId);
      return NextResponse.json({ ok: true, videoId: body.videoId });
    }

    return NextResponse.json({ error: "Provide videoId or all:true" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

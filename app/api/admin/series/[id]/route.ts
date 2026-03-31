import { NextRequest, NextResponse } from "next/server";
import { getSeriesById, getSlides, deleteSeries, updateSeriesYouTube } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const series = await getSeriesById(Number(id));
    if (!series) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const slides = await getSlides(series.id);
    const parsedSlides = slides.map((s) => ({
      ...s,
      data: JSON.parse(s.data),
    }));
    return NextResponse.json({ series, slides: parsedSlides });
  } catch (err) {
    console.error("[series get]", err);
    return NextResponse.json({ error: "Failed to get series" }, { status: 500 });
  }
}

// PATCH /api/admin/series/[id] — link a YouTube video to this series
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json() as { youtubeUrl?: string };
    const rawUrl = (body.youtubeUrl ?? "").trim();
    if (!rawUrl) {
      return NextResponse.json({ error: "youtubeUrl is required" }, { status: 400 });
    }
    // Accept full URL or bare video ID
    const ytIdMatch = rawUrl.match(/(?:shorts\/|watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})|^([A-Za-z0-9_-]{11})$/);
    const youtubeId  = ytIdMatch?.[1] ?? ytIdMatch?.[2];
    if (!youtubeId) {
      return NextResponse.json({ error: "Could not extract YouTube video ID from URL" }, { status: 400 });
    }
    const youtubeUrl = `https://www.youtube.com/shorts/${youtubeId}`;
    await updateSeriesYouTube(Number(id), youtubeId, youtubeUrl);
    return NextResponse.json({ ok: true, youtubeId, youtubeUrl });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const series = await getSeriesById(Number(id));
    if (!series) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await deleteSeries(Number(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[series delete]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

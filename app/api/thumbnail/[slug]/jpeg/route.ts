import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug } from "@/lib/db";
import { buildThumbnailJpeg } from "@/lib/thumbnail-svg";

export const runtime    = "nodejs";
export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const series   = await getSeriesBySlug(slug);
  if (!series) return new NextResponse("Not found", { status: 404 });

  const jpeg = await buildThumbnailJpeg(series.title, series.category, series.difficulty);

  return new NextResponse(new Uint8Array(jpeg), {
    headers: {
      "Content-Type":  "image/jpeg",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=600",
    },
  });
}

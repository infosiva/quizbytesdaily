import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { renderSeries } from "@/lib/video-renderer";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const seriesId = Number(body?.seriesId);
    if (!seriesId || isNaN(seriesId)) {
      return NextResponse.json({ error: "seriesId required" }, { status: 400 });
    }

    const logs: string[] = [];
    const outFile = await renderSeries(seriesId, (msg) => logs.push(msg));
    const filename = path.basename(outFile);

    return NextResponse.json({ success: true, filename, logs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[render]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

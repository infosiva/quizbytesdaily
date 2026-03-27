import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { renderSeries } from "@/lib/video-renderer";

export const runtime = "nodejs";
export const maxDuration = 300; // max on Vercel Pro; 60 on Hobby

export async function POST(request: NextRequest) {
  let outFile: string | null = null;
  try {
    const body = await request.json();
    const seriesId = Number(body?.seriesId);
    if (!seriesId || isNaN(seriesId)) {
      return NextResponse.json({ error: "seriesId required" }, { status: 400 });
    }

    const logs: string[] = [];
    outFile = await renderSeries(seriesId, (msg) => logs.push(msg));
    const filename = path.basename(outFile);

    // Return the video bytes directly — avoids a second round-trip and works
    // on Vercel where /tmp files don't persist across function invocations.
    const buffer = fs.readFileSync(outFile);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "X-Filename": filename,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[render]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    // Clean up temp file
    if (outFile) {
      try { fs.unlinkSync(outFile); } catch { /* ignore */ }
    }
  }
}

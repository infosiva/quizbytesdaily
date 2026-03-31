import { NextResponse } from "next/server";
import { listSeries } from "@/lib/db";

export async function GET() {
  try {
    const rows = await listSeries();
    // Show series that have slides generated; youtube_url drives the Watch link
    return NextResponse.json(rows.filter((s) => (s.slide_count ?? 0) > 0));
  } catch {
    return NextResponse.json([]);
  }
}

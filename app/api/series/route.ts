import { NextResponse } from "next/server";
import { listSeries } from "@/lib/db";

export async function GET() {
  try {
    const rows = await listSeries();
    // Only show published (has YouTube) + queued (coming soon) — hide drafts
    const visible = rows.filter((s) =>
      (s.slide_count ?? 0) > 0 &&
      (s.status === 'published' || s.status === 'queued')
    );
    return NextResponse.json(visible);
  } catch {
    return NextResponse.json([]);
  }
}

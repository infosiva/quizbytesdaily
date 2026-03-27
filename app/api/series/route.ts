import { NextResponse } from "next/server";
import { listSeries } from "@/lib/db";

export async function GET() {
  try {
    const rows = await listSeries();
    // Only show series that have slides (skip empty/broken generations)
    return NextResponse.json(rows.filter((s) => (s.slide_count ?? 0) > 0));
  } catch {
    return NextResponse.json([]);
  }
}

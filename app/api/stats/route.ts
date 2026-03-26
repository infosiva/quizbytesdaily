import { NextResponse } from "next/server";
import { listSeries } from "@/lib/db";

export async function GET() {
  try {
    const series = listSeries();
    return NextResponse.json({
      total: series.length,
      published: series.filter((s) => s.status === "published").length,
    });
  } catch {
    return NextResponse.json({ total: 0, published: 0 });
  }
}

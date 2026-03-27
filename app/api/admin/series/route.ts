import { NextResponse } from "next/server";
import { listSeries } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const series = await listSeries();
    return NextResponse.json({ series });
  } catch (err) {
    console.error("[series list]", err);
    return NextResponse.json({ error: "Failed to list series" }, { status: 500 });
  }
}

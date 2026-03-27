import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getAnalytics());
  } catch (err) {
    console.error("[analytics]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

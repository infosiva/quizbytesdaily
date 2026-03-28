import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json(
      { gridColumns: 3, defaultView: "grid", pageSize: 12, heroEnabled: true, showDashboard: true },
    );
  }
}

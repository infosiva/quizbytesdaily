import { NextResponse } from "next/server";
import { trackPageView } from "@/lib/db";

export const runtime = "nodejs";

// POST /api/track — anonymous page-view counter (no PII stored)
export async function POST() {
  try {
    await trackPageView();
    return NextResponse.json({ ok: true });
  } catch {
    // Silently fail — never break the public page
    return NextResponse.json({ ok: false });
  }
}

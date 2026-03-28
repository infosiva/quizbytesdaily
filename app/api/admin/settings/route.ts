import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings, updateSiteSettings, type SiteSettings } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await getSiteSettings());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as Partial<SiteSettings>;
    await updateSiteSettings(body);
    return NextResponse.json(await getSiteSettings());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

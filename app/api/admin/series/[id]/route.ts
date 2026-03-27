import { NextRequest, NextResponse } from "next/server";
import { getSeriesById, getSlides, deleteSeries } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const series = await getSeriesById(Number(id));
    if (!series) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const slides = await getSlides(series.id);
    const parsedSlides = slides.map((s) => ({
      ...s,
      data: JSON.parse(s.data),
    }));
    return NextResponse.json({ series, slides: parsedSlides });
  } catch (err) {
    console.error("[series get]", err);
    return NextResponse.json({ error: "Failed to get series" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const series = await getSeriesById(Number(id));
    if (!series) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await deleteSeries(Number(id));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[series delete]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

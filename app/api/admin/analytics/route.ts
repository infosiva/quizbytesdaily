import { NextResponse } from "next/server";
import { getAnalytics, getQuizStatsSummary } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [analytics, quizStats] = await Promise.all([
      getAnalytics(),
      getQuizStatsSummary().catch(() => null),
    ]);
    return NextResponse.json({ ...analytics, quizStats });
  } catch (err) {
    console.error("[analytics]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}

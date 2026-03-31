import { NextResponse } from "next/server";
import { saveQuizStat } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      question_id?: string;
      correct?:     boolean;
      cat?:         string;
      diff?:        string;
    };
    const { question_id = "", correct = false, cat = "", diff = "" } = body;
    await saveQuizStat({ question_id, correct, cat, diff });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/quiz/stats]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

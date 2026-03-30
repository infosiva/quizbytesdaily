import { NextResponse } from "next/server";
import { sendMessage } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST() {
  try {
    await sendMessage(
      `✅ <b>QuizBytesDaily Bot is working!</b>\n\n` +
      `🤖 Daily automation is connected.\n` +
      `Every day at 8 PM UTC you'll receive a quiz approval message here.\n\n` +
      `Tap ✅ Approve to schedule the upload, or ❌ Decline to pick a new topic.`
    );
    return NextResponse.json({ ok: true, message: "Test message sent to Telegram!" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

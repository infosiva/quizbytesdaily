import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN is not set in environment variables" }, { status: 500 });
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://quizbytes.dev"}/api/telegram/webhook`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message", "callback_query"] }),
    });
    const data = await res.json() as { ok: boolean; description?: string };
    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description ?? "setWebhook failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: `Webhook registered → ${webhookUrl}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

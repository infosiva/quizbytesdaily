// POST /api/telegram/webhook
// Receives Telegram bot updates (callback_query or message).
// Handles: approve_all, skip_all, /approve, /status commands.

import { NextRequest, NextResponse } from "next/server";
import { approveSeriesForUpload, getSeriesById } from "@/lib/db";
import { answerCallback, editMessage, sendMessage, type TelegramUpdate } from "@/lib/telegram";

export const runtime = "nodejs";

// Only accept updates from the configured chat
function isAllowed(chatId: number): boolean {
  const allowed = process.env.TELEGRAM_CHAT_ID;
  return !allowed || String(chatId) === String(allowed);
}

export async function POST(req: NextRequest) {
  try {
    const update = (await req.json()) as TelegramUpdate;

    // ── Handle inline button presses ────────────────────────────────────────
    if (update.callback_query) {
      const cq      = update.callback_query;
      const chatId  = cq.message.chat.id;
      const msgId   = cq.message.message_id;
      const data    = cq.data ?? "";

      if (!isAllowed(chatId)) {
        await answerCallback(cq.id, "Not authorized.");
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("approve_all:")) {
        const ids = data.slice("approve_all:".length)
          .split(",")
          .map(Number)
          .filter((n) => n > 0);

        await approveSeriesForUpload(ids);
        await answerCallback(cq.id, `✅ ${ids.length} quizzes approved!`);
        await editMessage(
          msgId,
          `✅ <b>${ids.length} quizzes approved!</b>\n\nUploads will start at scheduled times. You'll get a notification for each one.\n\nIDs approved: ${ids.join(", ")}`
        );
      } else if (data.startsWith("skip_all:")) {
        await answerCallback(cq.id, "Skipped. No uploads scheduled.");
        await editMessage(msgId, `❌ <b>Skipped today's batch.</b>\n\nNo quizzes will be uploaded. They stay as drafts in your admin panel.`);
      } else {
        await answerCallback(cq.id, "Unknown action.");
      }

      return NextResponse.json({ ok: true });
    }

    // ── Handle text commands ─────────────────────────────────────────────────
    if (update.message?.text) {
      const msg  = update.message;
      const text = (msg.text ?? "").trim();
      const chatId = msg.chat.id;

      if (!isAllowed(chatId)) {
        return NextResponse.json({ ok: true });
      }

      // /approve 123,456,789 or /approve all
      if (text.startsWith("/approve")) {
        const arg = text.slice("/approve".length).trim();
        if (!arg || arg === "all") {
          await sendMessage("Use the Approve All button in the daily notification, or provide specific IDs: /approve 123,456");
        } else {
          const ids = arg.split(/[\s,]+/).map(Number).filter((n) => n > 0);
          if (ids.length === 0) {
            await sendMessage("No valid IDs found. Usage: /approve 123,456,789");
          } else {
            await approveSeriesForUpload(ids);
            await sendMessage(`✅ Approved ${ids.length} series for upload: ${ids.join(", ")}`);
          }
        }
      }

      // /status 123 — check a series
      else if (text.startsWith("/status")) {
        const idStr = text.slice("/status".length).trim();
        const id = Number(idStr);
        if (!id) {
          await sendMessage("Usage: /status 123");
        } else {
          const series = await getSeriesById(id);
          if (!series) {
            await sendMessage(`Series #${id} not found.`);
          } else {
            await sendMessage(
              `📊 <b>Series #${id}</b>\n` +
              `Title: ${series.title}\n` +
              `Category: ${series.category}\n` +
              `Status: <b>${series.status}</b>\n` +
              `Scheduled: ${series.scheduled_at ?? "not set"}\n` +
              `YouTube: ${series.youtube_url ?? "not uploaded"}`
            );
          }
        }
      }

      // /help
      else if (text.startsWith("/help") || text === "/start") {
        await sendMessage(
          `🤖 <b>QuizBytesDaily Bot</b>\n\n` +
          `Commands:\n` +
          `/approve 123,456 — approve specific series IDs\n` +
          `/status 123 — check series upload status\n` +
          `/help — show this message\n\n` +
          `Daily quizzes are auto-generated at 8 PM UTC and sent here for approval.`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram/webhook]", err);
    return NextResponse.json({ ok: true }); // always return 200 to Telegram
  }
}

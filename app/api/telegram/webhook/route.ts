// POST /api/telegram/webhook
// Receives Telegram bot updates (callback_query or plain text message).
//
// Flow:
//  1. Daily cron sends approval message with ✅ Approve / ❌ Decline buttons
//  2a. Approve  → marks series as 'queued' → upload cron picks it up at 10 AM UTC
//  2b. Decline  → bot shows 8 hot topic suggestion buttons + "type a custom topic" prompt
//  3a. Tap suggestion button (sug:N)  → generates new series → sends new approval message
//  3b. User types custom topic text   → generates new series → sends new approval message
//  4.  New approval message has same ✅/❌ buttons — loop continues until approved

import { NextRequest, NextResponse } from "next/server";
import {
  approveSeriesForUpload,
  createSeries,
  getSeriesById,
  getSeriesBySlug,
  insertSlides,
  scheduleSeriesForDate,
  getBotState,
  setBotState,
  resetStuckPublishing,
  getQueuedForUpload,
  setSeriesStatus,
} from "@/lib/db";
import { generateQuizSeries, type LayoutId } from "@/lib/quiz-generator";
import {
  answerCallback,
  editMessageWithKeyboard,
  sendMessage,
  type TelegramUpdate,
} from "@/lib/telegram";
import { getScheduledAt, HOT_SUGGESTIONS, LAYOUT_LABELS } from "@/lib/daily-topics";

export const runtime    = "nodejs";
export const maxDuration = 60;

// ── Auth ───────────────────────────────────────────────────────────────────────
function isAllowed(chatId: number): boolean {
  const allowed = process.env.TELEGRAM_CHAT_ID;
  return !allowed || String(chatId) === String(allowed);
}

// ── Generate a series and return the Telegram approval text + buttons ──────────
async function generateAndGetApproval(
  topic: string,
  category: string,
  layout: LayoutId,
  difficulty: string,
  icon: string
): Promise<{ text: string; keyboard: { text: string; callback_data: string }[][] }> {
  const now = new Date();
  const scheduledAt = getScheduledAt(now, 10); // next-day 10 AM UTC

  const generated = await generateQuizSeries(topic, category, difficulty, layout);

  let slug = generated.slug;
  if (await getSeriesBySlug(slug)) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const series = await createSeries({
    slug,
    title:      generated.title,
    topic:      generated.topic,
    category:   generated.category,
    difficulty: generated.difficulty,
  });

  await insertSlides(
    series.id,
    generated.slides.map((s) => {
      const { template, ...rest } = s as unknown as Record<string, unknown>;
      return { template: String(template ?? "unknown"), data: rest };
    })
  );

  await scheduleSeriesForDate(series.id, scheduledAt);

  const typeLabel  = LAYOUT_LABELS[layout] ?? layout;
  const slideCount = generated.slides.length;
  const uploadTime = scheduledAt.slice(11, 16); // HH:MM

  const text = [
    `✨ <b>New Quiz Generated — Approve for Upload?</b>`,
    ``,
    `${icon} <b>${generated.title}</b>`,
    ``,
    `📂 <b>Category:</b> ${category}`,
    `🎯 <b>Difficulty:</b> ${difficulty}`,
    `📐 <b>Format:</b> ${typeLabel} · ${slideCount} slides`,
    `📅 <b>Upload:</b> Tomorrow ${uploadTime} UTC`,
    ``,
    `✅ Approve to schedule · ❌ Decline to try another`,
  ].join("\n");

  return {
    text,
    keyboard: [
      [
        { text: "✅ Approve — Schedule Upload", callback_data: `approve:${series.id}` },
        { text: "❌ Decline",                   callback_data: `decline:${series.id}` },
      ],
    ],
  };
}

// ── Build the "hot suggestions" message shown after decline ────────────────────
function buildSuggestionsMessage(): { text: string; keyboard: { text: string; callback_data: string }[][] } {
  const text = [
    `❌ <b>Declined. Here are today's hot topics — tap one to generate:</b>`,
    ``,
    `🔥 <b>Trending Now in Tech &amp; AI</b>`,
    ``,
    ...HOT_SUGGESTIONS.map(
      (s) => `${s.icon} <b>${s.topic}</b> · ${s.typeLabel}`
    ),
    ``,
    `<i>Or just type any topic you want and I'll generate slides for it.</i>`,
    `<i>Add a hint for format: <b>quiz</b>, <b>code</b>, <b>explainer</b>, <b>tips</b></i>`,
    `<i>Example: "Python decorators code" or "RAG quiz"</i>`,
  ].join("\n");

  // 2 buttons per row
  const keyboard: { text: string; callback_data: string }[][] = [];
  for (let i = 0; i < HOT_SUGGESTIONS.length; i += 2) {
    const row = HOT_SUGGESTIONS.slice(i, i + 2).map((s) => ({
      text:          `${s.icon} ${s.topic.slice(0, 28)}`,
      callback_data: `sug:${s.idx}`,
    }));
    keyboard.push(row);
  }

  return { text, keyboard };
}

// ── Parse a custom topic text message for format hint ─────────────────────────
function parseCustomTopic(text: string): { topic: string; layout: LayoutId; category: string; difficulty: string; icon: string } {
  const lower = text.toLowerCase();

  // Detect requested format from trailing keyword
  let layout: LayoutId = "quiz-reveal";
  if (lower.includes("code") || lower.includes("example"))   layout = "code-example";
  else if (lower.includes("explainer") || lower.includes("explain")) layout = "explainer";
  else if (lower.includes("tips") || lower.includes("tip"))  layout = "quick-tips";
  else if (lower.includes("quiz"))                           layout = "quiz-reveal";

  // Strip format hints from topic text
  const topic = text
    .replace(/\b(quiz|code|explainer?|tips?|example)\b/gi, "")
    .trim()
    .replace(/\s{2,}/g, " ");

  // Guess category from keywords
  let category = "AI/ML";
  let icon = "🤖";
  if (/python|pip|async|pydantic|fastapi|django|flask|pandas|numpy|pytorch/i.test(topic)) {
    category = "Python"; icon = "🐍";
  } else if (/javascript|typescript|react|node|vue|angular|next|bun|deno/i.test(topic)) {
    category = "JavaScript"; icon = "⚡";
  } else if (/docker|kubernetes|k8s|devops|ci\/cd|terraform|aws|gcp|azure/i.test(topic)) {
    category = "DevOps"; icon = "🚀";
  } else if (/algorithm|leetcode|bfs|dfs|dp|tree|graph|sort|search/i.test(topic)) {
    category = "Algorithms"; icon = "🧮";
  } else if (/system design|database|cache|cdn|api|microservice|queue|sharding/i.test(topic)) {
    category = "System Design"; icon = "🏗";
  }

  // Guess difficulty
  const difficulty = /advanced|deep dive|internals|architecture|distributed/i.test(topic)
    ? "Advanced"
    : /intermediate|pattern|optimization/i.test(topic)
    ? "Intermediate"
    : "Beginner";

  return { topic, layout, category, difficulty, icon };
}

// ── Main webhook handler ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const update = (await req.json()) as TelegramUpdate;

    // ── Inline button callbacks ──────────────────────────────────────────────
    if (update.callback_query) {
      const cq     = update.callback_query;
      const chatId = cq.message.chat.id;
      const msgId  = cq.message.message_id;
      const data   = cq.data ?? "";

      if (!isAllowed(chatId)) {
        await answerCallback(cq.id, "Not authorized.");
        return NextResponse.json({ ok: true });
      }

      // ── ✅ Approve ────────────────────────────────────────────────────────
      if (data.startsWith("approve:")) {
        const id = Number(data.slice("approve:".length));
        await approveSeriesForUpload([id]);
        await setBotState("");
        await answerCallback(cq.id, "✅ Approved and scheduled!");
        await editMessageWithKeyboard(
          msgId,
          `✅ <b>Approved!</b> Series #${id} is queued for upload.\n\nThe upload cron will render + upload it tomorrow at 10 AM UTC. You'll get a Telegram notification when it goes live.`
        );
      }

      // ── ❌ Decline ────────────────────────────────────────────────────────
      else if (data.startsWith("decline:")) {
        await answerCallback(cq.id, "Showing topic suggestions…");
        await setBotState("awaiting_topic");
        // Update the original message to show it was declined
        await editMessageWithKeyboard(
          msgId,
          `❌ <b>Declined.</b> Pick a new topic below or type your own.`
        );
        // Send a new message with suggestions
        const { text, keyboard } = buildSuggestionsMessage();
        await sendMessage(text, keyboard);
      }

      // ── 🔥 Tap suggestion button (sug:N) ──────────────────────────────────
      else if (data.startsWith("sug:")) {
        const idx = Number(data.slice("sug:".length));
        const sug = HOT_SUGGESTIONS.find((s) => s.idx === idx);
        if (!sug) {
          await answerCallback(cq.id, "Unknown suggestion.");
          return NextResponse.json({ ok: true });
        }

        await answerCallback(cq.id, `⏳ Generating "${sug.topic}"…`);
        // Send "generating" placeholder, then edit it with the approval message
        const genMsgId = await sendMessage(
          `⏳ <b>Generating slides…</b>\n\n${sug.icon} ${sug.topic}\n${sug.typeLabel} · ${sug.difficulty}\n\n<i>Usually takes 15–25 seconds.</i>`
        );

        try {
          const { text, keyboard } = await generateAndGetApproval(
            sug.topic, sug.category, sug.layout, sug.difficulty, sug.icon
          );
          await setBotState("");
          await editMessageWithKeyboard(genMsgId, text, keyboard);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          await editMessageWithKeyboard(
            genMsgId,
            `❌ <b>Generation failed</b>\n\n${msg.slice(0, 200)}\n\n<i>Try another topic or check the admin panel.</i>`
          );
        }
      }

      // ── Unknown callback ──────────────────────────────────────────────────
      else if (data.startsWith("approve_all:")) {
        // Legacy support for old "Approve All" button
        const ids = data.slice("approve_all:".length).split(",").map(Number).filter((n) => n > 0);
        await approveSeriesForUpload(ids);
        await answerCallback(cq.id, `✅ ${ids.length} quizzes approved!`);
        await editMessageWithKeyboard(msgId, `✅ <b>${ids.length} quizzes approved!</b>\n\nUploads will run at scheduled times.`);
      } else if (data.startsWith("skip_all:")) {
        await answerCallback(cq.id, "Skipped.");
        await editMessageWithKeyboard(msgId, `❌ <b>Skipped.</b> Series stay as drafts in the admin panel.`);
      } else {
        await answerCallback(cq.id, "Unknown action.");
      }

      return NextResponse.json({ ok: true });
    }

    // ── Plain text message ───────────────────────────────────────────────────
    if (update.message?.text) {
      const msg    = update.message;
      const text   = (msg.text ?? "").trim();
      const chatId = msg.chat.id;

      if (!isAllowed(chatId)) return NextResponse.json({ ok: true });

      // ── /approve ID ───────────────────────────────────────────────────────
      if (text.startsWith("/approve")) {
        const arg = text.slice("/approve".length).trim();
        const ids = arg.split(/[\s,]+/).map(Number).filter((n) => n > 0);
        if (ids.length === 0) {
          await sendMessage("Usage: /approve 123\n\nOr use the ✅ button in the daily notification.");
        } else {
          await approveSeriesForUpload(ids);
          await sendMessage(`✅ Approved ${ids.length} series for upload: ${ids.join(", ")}`);
        }
        return NextResponse.json({ ok: true });
      }

      // ── /status ID ────────────────────────────────────────────────────────
      if (text.startsWith("/status")) {
        const id = Number(text.slice("/status".length).trim());
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
              `Category: ${series.category} · ${series.difficulty}\n` +
              `Status: <b>${series.status}</b>\n` +
              `Scheduled: ${series.scheduled_at ?? "not set"}\n` +
              `YouTube: ${series.youtube_url ?? "not uploaded"}`
            );
          }
        }
        return NextResponse.json({ ok: true });
      }

      // ── /topics — show today's hot topics list ────────────────────────────
      if (text.startsWith("/topics") || text.startsWith("/suggest")) {
        const { text: sugText, keyboard } = buildSuggestionsMessage();
        await sendMessage(sugText, keyboard);
        return NextResponse.json({ ok: true });
      }

      // ── /queue — show all queued + stuck series ───────────────────────────
      if (text.startsWith("/queue")) {
        const queued = await getQueuedForUpload();
        if (queued.length === 0) {
          await sendMessage("📭 <b>No series queued for upload.</b>\n\nApprove a quiz first or check if any are stuck with /fixstuck");
        } else {
          const lines = queued.map(
            (s, i) => `${i + 1}. #${s.id} <b>${s.title}</b>\n   ${s.category} · ${s.difficulty} · ${s.scheduled_at ?? "no time set"}`
          );
          await sendMessage(`📋 <b>${queued.length} series queued for upload:</b>\n\n${lines.join("\n\n")}`);
        }
        return NextResponse.json({ ok: true });
      }

      // ── /fixstuck — reset series stuck in 'publishing' ────────────────────
      if (text.startsWith("/fixstuck")) {
        const count = await resetStuckPublishing(0); // reset ALL stuck, regardless of age
        if (count === 0) {
          await sendMessage("✅ <b>No stuck series found.</b> Nothing to fix.");
        } else {
          await sendMessage(
            `♻️ <b>Fixed ${count} stuck series</b> — reset from 'publishing' → 'queued'.\n\n` +
            `They'll be uploaded at the next cron run (10 AM UTC), or you can trigger upload now from the admin panel.`
          );
        }
        return NextResponse.json({ ok: true });
      }

      // ── /requeue ID — force a series back to 'queued' ─────────────────────
      if (text.startsWith("/requeue")) {
        const id = Number(text.slice("/requeue".length).trim());
        if (!id) {
          await sendMessage("Usage: /requeue 123\n\nForces a series back to 'queued' status so it will be picked up by the upload cron.");
        } else {
          await setSeriesStatus(id, "queued");
          await sendMessage(`♻️ Series #${id} reset to 'queued'. It will upload at the next cron run (10 AM UTC).`);
        }
        return NextResponse.json({ ok: true });
      }

      // ── /help or /start ───────────────────────────────────────────────────
      if (text.startsWith("/help") || text === "/start") {
        await sendMessage(
          `🤖 <b>QuizBytesDaily Bot</b>\n\n` +
          `<b>How the daily flow works:</b>\n` +
          `1. Every day at 8 PM UTC I auto-generate a quiz\n` +
          `2. You get a message here — tap ✅ to approve or ❌ to decline\n` +
          `3. On decline: choose from hot suggestions or type your own topic\n` +
          `4. Approved quizzes upload to YouTube at 10 AM UTC next day\n\n` +
          `<b>Commands:</b>\n` +
          `/approve 123 — approve a specific series by ID\n` +
          `/status 123 — check upload status of a series\n` +
          `/queue — list all series waiting to upload\n` +
          `/fixstuck — reset any series stuck in 'publishing'\n` +
          `/requeue 123 — force a specific series back to 'queued'\n` +
          `/topics — show hot topic suggestions\n` +
          `/help — show this message\n\n` +
          `<b>Custom topic:</b> Just type any topic text to generate it.\n` +
          `Add a format hint: <i>"RAG quiz"</i>, <i>"Python decorators code"</i>, <i>"Docker explainer"</i>`
        );
        return NextResponse.json({ ok: true });
      }

      // ── Custom topic text input ────────────────────────────────────────────
      // Triggered either: (a) by bot state "awaiting_topic" after decline,
      // or (b) by any non-command message (direct generation mode)
      if (!text.startsWith("/")) {
        const botState = await getBotState();
        const isAwaitingTopic = botState === "awaiting_topic" || text.length > 3;

        if (isAwaitingTopic) {
          const { topic, layout, category, difficulty, icon } = parseCustomTopic(text);

          if (topic.length < 3) {
            await sendMessage("Please enter a topic with at least 3 characters.");
            return NextResponse.json({ ok: true });
          }

          const genMsgId = await sendMessage(
            `⏳ <b>Generating slides for your topic…</b>\n\n` +
            `${icon} <b>${topic}</b>\n` +
            `${LAYOUT_LABELS[layout]} · ${category} · ${difficulty}\n\n` +
            `<i>Usually takes 15–25 seconds.</i>`
          );

          try {
            const { text: approvalText, keyboard } = await generateAndGetApproval(
              topic, category, layout, difficulty, icon
            );
            await setBotState("");
            await editMessageWithKeyboard(genMsgId, approvalText, keyboard);
          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            await editMessageWithKeyboard(
              genMsgId,
              `❌ <b>Generation failed</b>\n\n${errMsg.slice(0, 200)}\n\n<i>Try another topic or check the admin panel.</i>`
            );
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram/webhook]", err);
    return NextResponse.json({ ok: true }); // always return 200 to Telegram
  }
}

// POST /api/cron/daily-generate
// Vercel cron: runs at 8 PM UTC every day.
// 1. Picks ONE topic for today using daily rotation (AI/tech, weighted toward AI/ML)
// 2. Generates a quiz series via LLM
// 3. Saves to DB with scheduled_at for next-day 10 AM UTC upload
// 4. Sends a Telegram message with ✅ Approve / ❌ Decline buttons

import { NextRequest, NextResponse } from "next/server";
import { generateQuizSeries, type LayoutId } from "@/lib/quiz-generator";
import { createSeries, insertSlides, getSeriesBySlug, scheduleSeriesForDate } from "@/lib/db";
import { getOneDailyTopic, getScheduledAt, LAYOUT_LABELS } from "@/lib/daily-topics";
import { fetchOneLiveTopic } from "@/lib/trending-fetcher";
import { sendMessage } from "@/lib/telegram";

export const runtime    = "nodejs";
export const maxDuration = 300; // Vercel Pro; set to 60 on Hobby

// ── Auth ───────────────────────────────────────────────────────────────────────
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // if not set, allow (dev mode)
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  // Schedule for next-day 10 AM UTC
  const scheduledAt = getScheduledAt(now, 10);

  // Try live trending first; fall back to static rotation if fetch fails
  let t: { topic: string; category: string; layout: LayoutId; difficulty: string; icon: string };
  try {
    t = await fetchOneLiveTopic();
    console.log(`[daily-generate] Live trending: "${t.topic}" from ${(t as { source?: string }).source ?? "live"}`);
  } catch {
    t = getOneDailyTopic(now);
    console.log(`[daily-generate] Static fallback topic: "${t.topic}"`);
  }

  try {
    console.log(`[daily-generate] Generating: ${t.category} — ${t.topic} (${t.layout})`);

    // Always generate quiz-reveal to keep channel focused on quiz format
    const generated = await generateQuizSeries(t.topic, t.category, t.difficulty, "quiz-reveal");

    // Ensure unique slug
    let slug = generated.slug;
    if (await getSeriesBySlug(slug)) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    // Save series + slides to DB
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

    console.log(`[daily-generate] ✓ "${series.title}" (id=${series.id})`);

    // ── Send Telegram approval message ─────────────────────────────────────
    const typeLabel  = LAYOUT_LABELS["quiz-reveal"];
    const slideCount = generated.slides.length;
    const uploadTime = scheduledAt.slice(11, 16); // HH:MM

    const msg = [
      `🎯 <b>Daily Quiz Ready — Your Approval Needed</b>`,
      ``,
      `${t.icon} <b>${generated.title}</b>`,
      ``,
      `📂 <b>Category:</b> ${t.category}`,
      `🎯 <b>Difficulty:</b> ${t.difficulty}`,
      `📐 <b>Format:</b> ${typeLabel} · ${slideCount} slides`,
      `📅 <b>Upload:</b> Tomorrow ${uploadTime} UTC`,
      ``,
      `<i>Auto-picked from trending tech topics.</i>`,
      `<i>✅ Approve to schedule · ❌ Decline to pick a different topic</i>`,
    ].join("\n");

    await sendMessage(msg, [
      [
        { text: "✅ Approve — Schedule Upload", callback_data: `approve:${series.id}` },
        { text: "❌ Decline",                   callback_data: `decline:${series.id}` },
      ],
    ]);

    return NextResponse.json({
      success:     true,
      seriesId:    series.id,
      title:       series.title,
      category:    t.category,
      layout:      "quiz-reveal",
      slideCount,
      scheduledAt,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[daily-generate] Failed:", msg);

    await sendMessage(
      `⚠️ <b>Daily quiz generation failed</b>\n\nError: ${msg.slice(0, 300)}\n\nYou can manually generate a quiz from the admin panel.`
    ).catch(() => {});

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

// Allow both GET (Vercel cron) and POST (manual trigger from admin)
export const POST = GET;

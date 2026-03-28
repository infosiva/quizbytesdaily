// POST /api/cron/daily-generate
// Vercel cron: runs at 8 PM UTC every day.
// 1. Picks today's topics (rotated from curated list)
// 2. Generates a quiz series per category via LLM
// 3. Saves to DB with scheduled_at for next-day uploads
// 4. Sends a Telegram message with an "Approve All" button

import { NextRequest, NextResponse } from "next/server";
import { generateQuizSeries } from "@/lib/quiz-generator";
import { createSeries, insertSlides, getSeriesBySlug, scheduleSeriesForDate } from "@/lib/db";
import { getDailyTopics, getScheduledAt } from "@/lib/daily-topics";
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
  const topics = getDailyTopics(now);

  const results: {
    category: string;
    topic: string;
    seriesId: number;
    title: string;
    scheduledAt: string;
    error?: string;
  }[] = [];

  for (const t of topics) {
    const scheduledAt = getScheduledAt(now, t.uploadHourUtc);
    try {
      console.log(`[daily-generate] Generating: ${t.category} — ${t.topic}`);
      const generated = await generateQuizSeries(t.topic, t.category, t.difficulty, t.layout);

      // Ensure unique slug
      let slug = generated.slug;
      if (await getSeriesBySlug(slug)) {
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      // Save series to DB
      const series = await createSeries({
        slug,
        title: generated.title,
        topic: generated.topic,
        category: generated.category,
        difficulty: generated.difficulty,
      });

      // Save slides
      await insertSlides(
        series.id,
        generated.slides.map((s) => {
          const { template, ...rest } = s as unknown as Record<string, unknown>;
          return { template: String(template ?? "unknown"), data: rest };
        })
      );

      // Set the scheduled upload time
      await scheduleSeriesForDate(series.id, scheduledAt);

      results.push({
        category: t.category,
        topic: t.topic,
        seriesId: series.id,
        title: series.title,
        scheduledAt,
      });

      console.log(`[daily-generate] ✓ ${t.category}: "${series.title}" (id=${series.id})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[daily-generate] ✗ ${t.category}: ${msg}`);
      results.push({ category: t.category, topic: t.topic, seriesId: 0, title: "", scheduledAt, error: msg });
    }
  }

  const success = results.filter((r) => !r.error);
  const failed  = results.filter((r) => r.error);

  // ── Send Telegram notification ────────────────────────────────────────────
  try {
    const lines: string[] = [
      `🎯 <b>Tomorrow's Quiz Schedule</b>`,
      `Generated ${success.length} quizzes — tap Approve All to schedule uploads.\n`,
    ];

    const topicsData = getDailyTopics(now);

    success.forEach((r, i) => {
      const t = topicsData.find((tp) => tp.category === r.category);
      const icon = t?.icon ?? "📌";
      const layout = t?.layout ?? "quiz-reveal";
      const layoutLabel: Record<string, string> = {
        "quiz-reveal": "quiz", "explainer": "explainer",
        "code-example": "code", "quick-tips": "tips",
      };
      lines.push(
        `${i + 1}. ${icon} <b>${r.category}</b> — ${r.title}`,
        `   📐 ${layoutLabel[layout]} · ${r.scheduledAt.slice(11, 16)} UTC`
      );
    });

    if (failed.length > 0) {
      lines.push(`\n⚠️ ${failed.length} failed: ${failed.map((f) => f.category).join(", ")}`);
    }

    if (success.length > 0) {
      lines.push(`\nTap below to approve and schedule all uploads:`);
      const ids = success.map((r) => r.seriesId).join(",");
      await sendMessage(lines.join("\n"), [
        [
          { text: "✅ Approve All", callback_data: `approve_all:${ids}` },
          { text: "❌ Skip Today",  callback_data: `skip_all:${ids}` },
        ],
      ]);
    } else {
      await sendMessage(lines.join("\n"));
    }
  } catch (tgErr) {
    console.error("[daily-generate] Telegram notification failed:", tgErr);
  }

  return NextResponse.json({
    success: success.length,
    failed: failed.length,
    results,
  });
}

// Allow both GET (Vercel cron) and POST (manual trigger)
export const POST = GET;

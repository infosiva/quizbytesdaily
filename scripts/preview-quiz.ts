#!/usr/bin/env npx tsx
/**
 * preview-quiz.ts
 * Generate + render a quiz series WITHOUT uploading to YouTube.
 * Shows slide content + saves thumbnail for human review.
 *
 * Usage:
 *   TOPIC="Claude Mythos" CATEGORY="AI/ML" DIFFICULTY="Intermediate" npx tsx scripts/preview-quiz.ts
 *
 * After approval:
 *   SERIES_ID=<id> npx tsx scripts/fire-code-quiz.ts
 */

import * as path from "path";
import * as fs   from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { generateQuizSeries }                        from "../lib/quiz-generator";
import { createSeries, insertSlides, getSeriesBySlug } from "../lib/db";
import { renderSeries }                              from "../lib/video-renderer";
import { buildThumbnailJpeg }                        from "../lib/thumbnail-svg";

function log(msg: string) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${msg}`);
}

async function main() {
  const existingId = process.env.SERIES_ID ? Number(process.env.SERIES_ID) : null;

  let series: { id: number; slug: string; title: string; category: string; difficulty: string };
  let slidesForPreview: Array<{ template: string; data: Record<string, unknown> }> = [];

  if (existingId) {
    log(`♻️  Re-using existing series id=${existingId}`);
    const { getSeriesById, getSlides } = await import("../lib/db");
    const s = await getSeriesById(existingId);
    if (!s) throw new Error(`Series id=${existingId} not found`);
    series = s;
    const dbSlides = await getSlides(existingId);
    slidesForPreview = dbSlides.map((sl: { template: string; data: unknown }) => ({
      template: sl.template,
      data: typeof sl.data === "string" ? JSON.parse(sl.data) as Record<string, unknown> : sl.data as Record<string, unknown>,
    }));
    log(`   "${series.title}" (${series.category} · ${series.difficulty})`);
  } else {
    const topic      = process.env.TOPIC      ?? "Claude Mythos — Anthropic's Most Powerful AI";
    const category   = process.env.CATEGORY   ?? "AI/ML";
    const difficulty = process.env.DIFFICULTY ?? "Intermediate";

    log(`📚 Topic:      ${topic}`);
    log(`📂 Category:   ${category}`);
    log(`🎯 Difficulty: ${difficulty}`);

    // 1. Generate quiz series via LLM
    log("⚙️  Generating quiz series…");
    const generated = await generateQuizSeries(topic, category, difficulty, "quiz-reveal");
    log(`✓  Generated "${generated.title}" — ${generated.slides.length} slides`);

    // 2. Save to DB
    log("💾 Saving to database…");
    let slug = generated.slug;
    if (await getSeriesBySlug(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    series = await createSeries({
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
    log(`✓  Saved series id=${series.id}, slug=${series.slug}`);
    // Slides from LLM have flat structure: { template, ...rest } — extract data same way as insertSlides
    slidesForPreview = generated.slides.map((s) => {
      const { template, ...rest } = s as unknown as Record<string, unknown>;
      return { template: String(template ?? "unknown"), data: rest as Record<string, unknown> };
    });
  }

  // 3. Preview: print all slides
  console.log("\n" + "─".repeat(60));
  console.log(`📋 SLIDE PREVIEW — "${series.title}"`);
  console.log("─".repeat(60));
  slidesForPreview.forEach((slide, i) => {
    const d = slide.data as Record<string, unknown>;
    console.log(`\n[${i + 1}] template: ${slide.template}`);
    // Print all string fields dynamically — handles any template
    for (const [k, v] of Object.entries(d)) {
      if (v === null || v === undefined) continue;
      if (typeof v === "string") {
        console.log(`    ${k.padEnd(12)}: ${v.slice(0, 120)}${v.length > 120 ? "…" : ""}`);
      } else if (Array.isArray(v)) {
        console.log(`    ${k.padEnd(12)}:`);
        (v as unknown[]).forEach((item, j) => {
          const isCorrect = k === "options" && j === (d.answer as number);
          const prefix = isCorrect ? "  ✓" : "   ";
          console.log(`    ${prefix} ${["A","B","C","D"][j] ?? j}. ${String(item).slice(0, 100)}`);
        });
      }
    }
  });
  console.log("\n" + "─".repeat(60));

  // 4. Render MP4 (needed to check video quality)
  log("🎬 Rendering MP4…");
  const outFile = await renderSeries(series.id, (msg) => log(`   [ffmpeg] ${msg}`));
  const sizeMB = (fs.statSync(outFile).size / 1024 / 1024).toFixed(1);
  log(`✓  Rendered: ${outFile} (${sizeMB} MB)`);

  // 5. Generate + save thumbnail
  log("🖼  Building thumbnail…");
  const thumbBuffer = await buildThumbnailJpeg(series.title, series.category, series.difficulty);
  const thumbPath   = `/tmp/preview-thumb-${series.id}.jpg`;
  fs.writeFileSync(thumbPath, thumbBuffer);
  log(`✓  Thumbnail saved: ${thumbPath}`);

  // 6. Copy video to /tmp for easy access
  const previewVideoPath = `/tmp/preview-video-${series.id}.mp4`;
  fs.copyFileSync(outFile, previewVideoPath);
  fs.unlinkSync(outFile); // clean up original render dir
  log(`✓  Video saved:     ${previewVideoPath}`);

  // 7. Summary
  console.log("\n" + "═".repeat(60));
  console.log("✅  PREVIEW READY — review before uploading:");
  console.log(`    Title:     ${series.title}`);
  console.log(`    Category:  ${series.category}  |  ${series.difficulty}`);
  console.log(`    Series ID: ${series.id}`);
  console.log(`    Thumbnail: ${thumbPath}`);
  console.log(`    Video:     ${previewVideoPath}`);
  console.log("");
  console.log("  To upload to YouTube after approval:");
  console.log(`    SERIES_ID=${series.id} npx tsx scripts/fire-code-quiz.ts`);
  console.log("═".repeat(60) + "\n");
}

main().catch(err => {
  console.error("Fatal:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

#!/usr/bin/env npx tsx
/**
 * fire-code-quiz.ts
 * One-shot script: generate a code-quiz Short, render to MP4, and upload to YouTube.
 *
 * Usage:
 *   npx tsx scripts/fire-code-quiz.ts
 *
 * Optional topic override:
 *   TOPIC="Python list comprehensions" npx tsx scripts/fire-code-quiz.ts
 */

import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import * as os from "os";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { generateQuizSeries }              from "../lib/quiz-generator";
import { createSeries, insertSlides, getSeriesBySlug } from "../lib/db";
import { renderSeries }                    from "../lib/video-renderer";
import { buildThumbnailJpeg }              from "../lib/thumbnail-svg";

function extractFirstQuestion(slides: Array<unknown>): string | undefined {
  for (const raw of slides) {
    const slide = raw as Record<string, unknown>;
    const d = (slide.data ?? slide) as Record<string, unknown>;
    const tpl = String(slide.template ?? "");
    if (tpl === "code-quiz" && typeof d.question === "string" && d.question.trim()) return d.question.trim();
    if (tpl === "definition-steps" && typeof d.title === "string" && d.title.trim().endsWith("?")) return d.title.trim();
    if (typeof d.q === "string" && d.q.trim()) return d.q.trim();
  }
  return undefined;
}

// ── Topic config ──────────────────────────────────────────────────────────────

const CODE_TOPICS = [
  { topic: "Python list comprehension vs map()",          category: "Python",     difficulty: "Intermediate" },
  { topic: "JavaScript closures and variable scope",      category: "JavaScript", difficulty: "Intermediate" },
  { topic: "Python generators vs list comprehension",     category: "Python",     difficulty: "Intermediate" },
  { topic: "What does this async/await code output?",     category: "JavaScript", difficulty: "Advanced"     },
  { topic: "Python dictionary comprehension tricks",      category: "Python",     difficulty: "Beginner"     },
  { topic: "JavaScript array methods: map vs forEach",    category: "JavaScript", difficulty: "Beginner"     },
  { topic: "Time complexity of Python sorting",           category: "Algorithms", difficulty: "Intermediate" },
  { topic: "Python f-strings vs .format() performance",  category: "Python",     difficulty: "Beginner"     },
];

function pickTopic() {
  if (process.env.TOPIC) {
    return {
      topic:      process.env.TOPIC,
      category:   process.env.CATEGORY ?? "Python",
      difficulty: process.env.DIFFICULTY ?? "Intermediate",
    };
  }
  const day = Math.floor(Date.now() / 86_400_000);
  return CODE_TOPICS[day % CODE_TOPICS.length];
}

// ── YouTube upload ────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(`Token refresh failed: ${data.error_description ?? data.error ?? "unknown"}`);
  }
  return data.access_token;
}

async function uploadToYouTube(
  videoPath: string,
  title: string,
  description: string,
  tags: string[],
): Promise<string> {
  const token = await getAccessToken();
  const videoBuffer = fs.readFileSync(videoPath);

  // 1. Initiate resumable upload
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization:             `Bearer ${token}`,
        "Content-Type":            "application/json",
        "X-Upload-Content-Type":   "video/mp4",
        "X-Upload-Content-Length": String(videoBuffer.byteLength),
      },
      body: JSON.stringify({
        snippet: { title, description, tags, categoryId: "28" },
        status:  { privacyStatus: "public", madeForKids: false, selfDeclaredMadeForKids: false },
      }),
    }
  );

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) {
    const err = await initRes.text();
    throw new Error(`Init upload failed (${initRes.status}): ${err}`);
  }

  // 2. Upload bytes
  const uploadRes = await fetch(uploadUrl, {
    method:  "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(videoBuffer.byteLength) },
    body:    new Uint8Array(videoBuffer),
  });
  if (!uploadRes.ok) {
    const errText = await uploadRes.text().catch(() => "");
    throw new Error(`Upload PUT failed (${uploadRes.status}): ${errText.slice(0, 400)}`);
  }
  const vid = await uploadRes.json() as { id?: string; error?: { message?: string } };
  if (!vid.id) throw new Error(vid.error?.message ?? "Video upload failed (no id in response)");

  return vid.id;
}

async function setThumbnail(videoId: string, thumbBuffer: Buffer): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`,
    {
      method:  "POST",
      headers: {
        Authorization:    `Bearer ${token}`,
        "Content-Type":   "image/jpeg",
        "Content-Length": String(thumbBuffer.byteLength),
      },
      body: new Uint8Array(thumbBuffer),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    console.warn(`[thumb] Could not set thumbnail: ${err.error?.message ?? res.statusText}`);
  }
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${msg}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("🚀 fire-code-quiz starting");

  // SERIES_ID env var lets us re-upload an already-generated series
  const existingId = process.env.SERIES_ID ? Number(process.env.SERIES_ID) : null;

  let series: { id: number; slug: string; title: string; category: string; difficulty: string };

  let firstQuestion: string | undefined;

  if (existingId) {
    log(`♻️  Re-using existing series id=${existingId}`);
    const { getSeriesById, getSlides } = await import("../lib/db");
    const s = await getSeriesById(existingId);
    if (!s) throw new Error(`Series id=${existingId} not found`);
    series = s;
    log(`   "${series.title}" (${series.category} · ${series.difficulty})`);
    try {
      const dbSlides = await getSlides(existingId);
      firstQuestion = extractFirstQuestion(dbSlides as unknown[]);
    } catch { /* non-fatal */ }
  } else {
    const { topic, category, difficulty } = pickTopic();
    log(`📚 Topic:      ${topic}`);
    log(`📂 Category:   ${category}`);
    log(`🎯 Difficulty: ${difficulty}`);

    // 1. Generate quiz slides via LLM (quiz-reveal forces code-quiz slides for coding topics)
    log("⚙️  Generating quiz series with LLM…");
    const generated = await generateQuizSeries(topic, category, difficulty, "quiz-reveal");
    log(`✓  Generated "${generated.title}" — ${generated.slides.length} slides`);
    firstQuestion = extractFirstQuestion(generated.slides as unknown as Array<Record<string, unknown>>);

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

    // Log slide types so we can confirm a code-quiz slide was included
    const templates = (generated.slides as Array<{ template: string }>).map(s => s.template);
    log(`   Slide templates: ${templates.join(", ")}`);
  }

  if (firstQuestion) log(`🎯 Question for thumbnail: ${firstQuestion.slice(0, 80)}`);

  // 3. Render MP4
  log("🎬 Rendering MP4…");
  const outFile = await renderSeries(series.id, (msg) => log(`   [ffmpeg] ${msg}`));
  log(`✓  Rendered: ${outFile} (${(fs.statSync(outFile).size / 1024 / 1024).toFixed(1)} MB)`);

  // 4. Build thumbnail — now includes the actual quiz question for context-aware design
  log("🖼  Building thumbnail…");
  const thumbBuffer = await buildThumbnailJpeg(series.title, series.category, series.difficulty, firstQuestion);

  // 5. Upload to YouTube
  log("📤 Uploading to YouTube…");
  const cat  = series.category;
  const diff = series.difficulty;

  const ytTitle = `${series.title} #Shorts #CodingQuiz`;
  const ytDesc  = [
    `Can you answer this ${cat} coding quiz? 🤔`,
    ``,
    `Difficulty: ${diff}`,
    ``,
    `📚 Interactive quiz: https://quizbytes.dev`,
    `🔔 Subscribe for daily tech quizzes!`,
    ``,
    `#${cat.replace(/[/ ]/g, "")} #CodingQuiz #Programming #LearnToCode #TechQuiz #Shorts`,
  ].join("\n");

  const ytTags = [
    cat, "coding quiz", "programming", "code", "tech quiz",
    "learn to code", "developer", "shorts", diff.toLowerCase(),
    ...cat.toLowerCase().split("/"),
  ];

  log(`   Title: ${ytTitle}`);
  const videoId = await uploadToYouTube(outFile, ytTitle, ytDesc, ytTags);
  log(`✓  Uploaded! Video ID: ${videoId}`);
  log(`   URL: https://www.youtube.com/shorts/${videoId}`);

  // 6. Set custom thumbnail
  await setThumbnail(videoId, thumbBuffer);
  log("✓  Thumbnail set");

  // 7. Cleanup
  try { fs.unlinkSync(outFile); } catch { /* ignore */ }

  log(`\n🎉 Done! https://www.youtube.com/shorts/${videoId}`);
}

main().catch(err => {
  console.error("Fatal:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

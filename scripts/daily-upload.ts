#!/usr/bin/env npx tsx
/**
 * daily-upload.ts
 * Generates and uploads 2 YouTube Shorts every day:
 *   Video 1 — Trending topic explainer (what it is, why it matters)
 *   Video 2 — Technical coding Q&A (code snippet + quiz)
 *
 * Usage:
 *   npx tsx scripts/daily-upload.ts
 *
 * Override topics:
 *   TOPIC1="Claude Mythos" TOPIC2="Python async/await" npx tsx scripts/daily-upload.ts
 *
 * Skip generation (re-upload existing):
 *   SERIES_ID1=82 SERIES_ID2=83 npx tsx scripts/daily-upload.ts
 */

import * as path   from "path";
import * as fs     from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { generateQuizSeries }                         from "../lib/quiz-generator";
import { createSeries, insertSlides, getSeriesBySlug, getSeriesById, getSlides } from "../lib/db";
import { renderSeries }                               from "../lib/video-renderer";
import { buildThumbnailJpeg }                         from "../lib/thumbnail-svg";

/** Pull the first quiz question out of generated or DB slides. */
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

// ── Daily topic pools ─────────────────────────────────────────────────────────

// Video 1: Trending explainer topics — rotated by day
const EXPLAINER_TOPICS = [
  { topic: "Claude Mythos — Anthropic's Most Powerful AI Model",        category: "AI/ML",           difficulty: "Beginner"     },
  { topic: "Project Glasswing — AI Fixing Critical Software Bugs",      category: "AI/ML",           difficulty: "Intermediate" },
  { topic: "MCP Servers — How Claude Connects to Any Tool",             category: "AI/ML",           difficulty: "Intermediate" },
  { topic: "RAG vs Fine-Tuning — Which Should You Use in 2026?",        category: "AI/ML",           difficulty: "Intermediate" },
  { topic: "Vector Databases Explained — Pinecone vs Weaviate vs pgvector", category: "AI/ML",       difficulty: "Intermediate" },
  { topic: "AI Agents — How They Plan, Use Tools and Self-Correct",     category: "AI/ML",           difficulty: "Intermediate" },
  { topic: "Prompt Caching — Save 90% on API Costs with Anthropic",     category: "AI/ML",           difficulty: "Beginner"     },
  { topic: "LLM Context Windows — What 200k Tokens Actually Means",     category: "AI/ML",           difficulty: "Beginner"     },
  { topic: "Mixture of Experts — How Frontier Models Scale Efficiently",category: "AI/ML",           difficulty: "Advanced"     },
  { topic: "Multi-Agent Workflows — Orchestrating AI Teams",            category: "AI/ML",           difficulty: "Advanced"     },
  { topic: "Kubernetes Explained in 60 Seconds",                        category: "DevOps",          difficulty: "Beginner"     },
  { topic: "Distributed System Design — CAP Theorem Demystified",       category: "System Design",   difficulty: "Advanced"     },
  { topic: "React Server Components vs Client Components",              category: "JavaScript",      difficulty: "Intermediate" },
  { topic: "Python Async/Await — The Complete Mental Model",            category: "Python",          difficulty: "Intermediate" },
  { topic: "PostgreSQL vs MongoDB — When to Use Each",                  category: "Database",        difficulty: "Intermediate" },
];

// Video 2: Technical coding Q&A topics — rotated by day (offset by 7)
const CODING_TOPICS = [
  { topic: "Python list comprehension vs map() vs for-loop: what's fastest?", category: "Python",     difficulty: "Intermediate" },
  { topic: "JavaScript closures — what does this code output?",         category: "JavaScript",      difficulty: "Intermediate" },
  { topic: "Python generators vs list comprehensions — memory deep dive",category: "Python",          difficulty: "Intermediate" },
  { topic: "What does this async/await code output?",                   category: "JavaScript",      difficulty: "Advanced"     },
  { topic: "Python dictionary tricks — defaultdict, Counter, ChainMap", category: "Python",          difficulty: "Intermediate" },
  { topic: "Time complexity quiz — O(n²) or O(n log n)?",               category: "Algorithms",      difficulty: "Intermediate" },
  { topic: "Python decorators — what does this @decorator do?",         category: "Python",          difficulty: "Advanced"     },
  { topic: "SQL JOIN quiz — INNER vs LEFT vs CROSS",                    category: "Database",        difficulty: "Intermediate" },
  { topic: "Big-O quiz — which algorithm wins?",                        category: "Algorithms",      difficulty: "Beginner"     },
  { topic: "React useEffect — spot the bug",                            category: "JavaScript",      difficulty: "Intermediate" },
  { topic: "Python context managers — what does __enter__ return?",     category: "Python",          difficulty: "Advanced"     },
  { topic: "TypeScript generics quiz — what's the inferred type?",      category: "TypeScript",      difficulty: "Advanced"     },
  { topic: "Binary search tree — what's the output of this traversal?", category: "Algorithms",      difficulty: "Intermediate" },
  { topic: "Python f-strings vs .format() vs % — which is fastest?",   category: "Python",          difficulty: "Beginner"     },
  { topic: "Docker networking quiz — bridge vs host vs none",           category: "DevOps",          difficulty: "Intermediate" },
];

function pickByDay<T>(pool: T[], offset = 0): T {
  const day = Math.floor(Date.now() / 86_400_000) + offset;
  return pool[day % pool.length];
}

// ── YouTube helpers ────────────────────────────────────────────────────────────

async function sendTelegramAlert(msg: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "Markdown" }),
    });
  } catch { /* best-effort — never crash because of alert */ }
}

async function getAccessToken(attempt = 1): Promise<string> {
  const MAX = 3;
  try {
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
    const data = await res.json() as { access_token?: string; error_description?: string; error?: string };
    if (!data.access_token) throw new Error(`Token refresh failed: ${data.error_description ?? data.error ?? "unknown"}`);
    return data.access_token;
  } catch (err) {
    if (attempt < MAX) {
      const delay = attempt * 2000;
      console.warn(`[auth] Token attempt ${attempt}/${MAX} failed — retrying in ${delay / 1000}s…`);
      await new Promise(r => setTimeout(r, delay));
      return getAccessToken(attempt + 1);
    }
    // All retries exhausted — fire Telegram alert with re-auth link
    const errMsg = err instanceof Error ? err.message : String(err);
    const reauthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(process.env.YOUTUBE_CLIENT_ID ?? "")}` +
      `&redirect_uri=urn:ietf:wg:oauth:2.0:oob` +
      `&scope=https://www.googleapis.com/auth/youtube.upload` +
      `&response_type=code&access_type=offline&prompt=consent`;
    await sendTelegramAlert(
      `🚨 *QuizBytes Daily — YouTube token expired*\n\n` +
      `All ${MAX} token refresh attempts failed.\n` +
      `Error: \`${errMsg}\`\n\n` +
      `[Re-authorize here](${reauthUrl})\n\n` +
      `After re-auth, update \`YOUTUBE_REFRESH_TOKEN\` in \`.env.local\` and re-run.`
    );
    throw err;
  }
}

async function uploadToYouTube(videoPath: string, title: string, description: string, tags: string[]): Promise<string> {
  const token = await getAccessToken();
  const videoBuffer = fs.readFileSync(videoPath);
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": "video/mp4",
        "X-Upload-Content-Length": String(videoBuffer.byteLength),
      },
      body: JSON.stringify({
        snippet: { title, description, tags, categoryId: "28" },
        status:  { privacyStatus: "public", madeForKids: false, selfDeclaredMadeForKids: false },
      }),
    }
  );
  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error(`Init upload failed (${initRes.status}): ${await initRes.text()}`);
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(videoBuffer.byteLength) },
    body: new Uint8Array(videoBuffer),
  });
  if (!uploadRes.ok) throw new Error(`Upload PUT failed (${uploadRes.status}): ${(await uploadRes.text()).slice(0, 400)}`);
  const vid = await uploadRes.json() as { id?: string; error?: { message?: string } };
  if (!vid.id) throw new Error(vid.error?.message ?? "No video ID in response");
  return vid.id;
}

async function setThumbnail(videoId: string, thumbBuffer: Buffer): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "image/jpeg", "Content-Length": String(thumbBuffer.byteLength) },
      body: new Uint8Array(thumbBuffer),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    console.warn(`[thumb] Could not set thumbnail: ${err.error?.message ?? res.statusText}`);
  }
}

// ── Core: generate + upload one series ────────────────────────────────────────

function log(prefix: string, msg: string) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${prefix} ${msg}`);
}

async function generateAndUpload(
  topicCfg: { topic: string; category: string; difficulty: string },
  layout: "quiz-reveal" | "explainer",
  existingSeriesId: number | null,
  prefix: string,
): Promise<string> {
  let series: { id: number; slug: string; title: string; category: string; difficulty: string };

  let firstQuestion: string | undefined;

  if (existingSeriesId) {
    log(prefix, `♻️  Re-using series id=${existingSeriesId}`);
    const s = await getSeriesById(existingSeriesId);
    if (!s) throw new Error(`Series id=${existingSeriesId} not found`);
    series = s;
    // Fetch slides to extract question for thumbnail
    try {
      const dbSlides = await getSlides(existingSeriesId);
      firstQuestion = extractFirstQuestion(dbSlides as unknown[]);
    } catch { /* non-fatal */ }
  } else {
    const { topic, category, difficulty } = topicCfg;
    log(prefix, `📚 Topic: ${topic}`);
    log(prefix, `⚙️  Generating (layout: ${layout})…`);
    const generated = await generateQuizSeries(topic, category, difficulty, layout);
    log(prefix, `✓  Generated "${generated.title}" — ${generated.slides.length} slides`);
    firstQuestion = extractFirstQuestion(generated.slides as unknown as Array<Record<string, unknown>>);

    log(prefix, "💾 Saving to DB…");
    let slug = generated.slug;
    if (await getSeriesBySlug(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    series = await createSeries({ slug, title: generated.title, topic: generated.topic, category: generated.category, difficulty: generated.difficulty });
    await insertSlides(series.id, generated.slides.map((s) => {
      const { template, ...rest } = s as unknown as Record<string, unknown>;
      return { template: String(template ?? "unknown"), data: rest };
    }));
    log(prefix, `✓  Saved series id=${series.id}`);
  }

  if (firstQuestion) log(prefix, `🎯 Question: ${firstQuestion.slice(0, 80)}…`);

  log(prefix, "🎬 Rendering MP4…");
  const outFile = await renderSeries(series.id, (m) => log(prefix, `   [ffmpeg] ${m}`));
  log(prefix, `✓  Rendered (${(fs.statSync(outFile).size / 1024 / 1024).toFixed(1)} MB)`);

  log(prefix, "🖼  Building thumbnail…");
  const thumbBuffer = await buildThumbnailJpeg(series.title, series.category, series.difficulty, firstQuestion);

  const cat  = series.category;
  const diff = series.difficulty;
  const ytTitle = `${series.title} #Shorts #TechQuiz`;
  const ytDesc  = [
    `Can you answer this ${cat} quiz? 🤔`,
    ``,
    `Difficulty: ${diff}`,
    ``,
    `📚 Play interactively: https://quizbytes.dev`,
    `🔔 Subscribe for daily tech quizzes!`,
    ``,
    `#${cat.replace(/[/ ]/g, "")} #TechQuiz #AIQuiz #LearnAI #Shorts`,
  ].join("\n");
  const ytTags = [cat, "tech quiz", "AI quiz", "coding quiz", "learn to code", "shorts", diff.toLowerCase(), ...cat.toLowerCase().split("/")];

  log(prefix, "📤 Uploading to YouTube…");
  log(prefix, `   Title: ${ytTitle}`);
  const videoId = await uploadToYouTube(outFile, ytTitle, ytDesc, ytTags);
  log(prefix, `✓  Uploaded! https://www.youtube.com/shorts/${videoId}`);

  await setThumbnail(videoId, thumbBuffer);
  log(prefix, "✓  Thumbnail set");

  try { fs.unlinkSync(outFile); } catch { /* ignore */ }

  return videoId;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("🚀 DAILY UPLOAD — 2 Shorts today");
  console.log("═".repeat(60) + "\n");

  // Pick topics (env override → daily rotation)
  const topic1Cfg = {
    topic:      process.env.TOPIC1      ?? pickByDay(EXPLAINER_TOPICS).topic,
    category:   process.env.CATEGORY1   ?? pickByDay(EXPLAINER_TOPICS).category,
    difficulty: process.env.DIFFICULTY1 ?? pickByDay(EXPLAINER_TOPICS).difficulty,
  };
  const topic2Cfg = {
    topic:      process.env.TOPIC2      ?? pickByDay(CODING_TOPICS, 7).topic,
    category:   process.env.CATEGORY2   ?? pickByDay(CODING_TOPICS, 7).category,
    difficulty: process.env.DIFFICULTY2 ?? pickByDay(CODING_TOPICS, 7).difficulty,
  };
  const id1 = process.env.SERIES_ID1 ? Number(process.env.SERIES_ID1) : null;
  const id2 = process.env.SERIES_ID2 ? Number(process.env.SERIES_ID2) : null;

  console.log("📹 Video 1 (Explainer):", id1 ? `series ${id1}` : topic1Cfg.topic);
  console.log("📹 Video 2 (Tech Q&A):", id2 ? `series ${id2}` : topic2Cfg.topic);
  console.log();

  // Upload Video 1 — Explainer
  const videoId1 = await generateAndUpload(topic1Cfg, "explainer", id1, "[V1]");
  console.log();

  // Upload Video 2 — Technical coding Q&A
  const videoId2 = await generateAndUpload(topic2Cfg, "quiz-reveal", id2, "[V2]");
  console.log();

  console.log("═".repeat(60));
  console.log("🎉 DONE — both Shorts uploaded:");
  console.log(`   Video 1: https://www.youtube.com/shorts/${videoId1}`);
  console.log(`   Video 2: https://www.youtube.com/shorts/${videoId2}`);
  console.log("═".repeat(60) + "\n");
}

main().catch(async err => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("Fatal:", msg);
  await sendTelegramAlert(`🚨 *QuizBytes Daily — Upload FAILED*\n\nFatal error:\n\`${msg}\``);
  process.exit(1);
});

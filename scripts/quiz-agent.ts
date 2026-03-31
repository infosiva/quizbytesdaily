#!/usr/bin/env npx tsx
// QuizBytes Daily — Persistent Quiz Topic Agent
// Always-running VPS daemon (PM2). Finds trending topics, runs an AI review
// sub-agent, then triggers the daily-generate pipeline on the Vercel app.
//
// PM2 start:
//   pm2 start scripts/quiz-agent.ts --interpreter "npx tsx" --name quiz-agent
//
// Required env vars (add to .env.local on VPS):
//   QUIZBYTES_URL=https://quizbytes.dev
//   CRON_SECRET=<same value as CRON_SECRET on Vercel>
//   GROQ_API_KEY=<Groq key for AI review sub-agent>
//   TELEGRAM_BOT_TOKEN=<bot token>
//   TELEGRAM_CHAT_ID=<your chat id>
//
// Optional:
//   QUEUE_THRESHOLD=2        # min queued videos; generate more if below (default 2)
//   POLL_INTERVAL_HOURS=4    # hours between checks (default 4)
//   REVIEW_MIN_SCORE=7       # minimum AI review score to proceed (default 7)

import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import Groq from "groq-sdk";

// ── Config ────────────────────────────────────────────────────────────────────

const QUIZBYTES_URL   = (process.env.QUIZBYTES_URL  || "https://quizbytes.dev").replace(/\/$/, "");
const CRON_SECRET     = process.env.CRON_SECRET     || "";
const TELEGRAM_TOKEN  = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT   = process.env.TELEGRAM_CHAT_ID   || "";
const QUEUE_THRESHOLD = parseInt(process.env.QUEUE_THRESHOLD      || "2", 10);
const POLL_HOURS      = parseFloat(process.env.POLL_INTERVAL_HOURS || "4");
const REVIEW_MIN      = parseInt(process.env.REVIEW_MIN_SCORE     || "7", 10);

const POLL_MS = POLL_HOURS * 60 * 60 * 1000;

// ── Groq AI client ────────────────────────────────────────────────────────────

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// ── Topic sources (no auth needed) ───────────────────────────────────────────

interface CandidateTopic {
  title: string;
  source: string;
  url?: string;
  score?: number; // HN points / GitHub stars / etc.
}

async function fetchHNTopics(): Promise<CandidateTopic[]> {
  const tags = ["AI", "LLM", "Python", "Machine Learning", "TypeScript"];
  const query = encodeURIComponent(tags.join(" OR "));
  const url = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&hitsPerPage=20`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const data = await res.json() as { hits?: Array<{ title?: string; objectID?: string; points?: number }> };
  return (data.hits ?? [])
    .filter(h => h.title && h.points && h.points > 50)
    .map(h => ({
      title:  h.title!,
      source: "HackerNews",
      url:    `https://news.ycombinator.com/item?id=${h.objectID}`,
      score:  h.points,
    }));
}

async function fetchGitHubTrending(): Promise<CandidateTopic[]> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split("T")[0];
  const url = `https://api.github.com/search/repositories?q=topic:ai+created:>${oneWeekAgo}&sort=stars&order=desc&per_page=10`;
  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const data = await res.json() as { items?: Array<{ full_name?: string; description?: string; stargazers_count?: number }> };
  return (data.items ?? []).map(r => ({
    title:  r.full_name || "",
    source: "GitHub",
    score:  r.stargazers_count,
  }));
}

async function fetchAllCandidates(): Promise<CandidateTopic[]> {
  const [hn, gh] = await Promise.allSettled([fetchHNTopics(), fetchGitHubTrending()]);
  const topics: CandidateTopic[] = [
    ...(hn.status === "fulfilled" ? hn.value : []),
    ...(gh.status === "fulfilled" ? gh.value : []),
  ];
  return topics.slice(0, 15);
}

// ── AI Review Sub-Agent ───────────────────────────────────────────────────────

interface ReviewResult {
  topic: string;
  category: string;
  difficulty: string;
  layout: string;
  icon: string;
  score: number;       // 1-10
  reasoning: string;
}

async function reviewTopics(candidates: CandidateTopic[]): Promise<ReviewResult | null> {
  if (!groq || candidates.length === 0) return null;

  const list = candidates
    .map((c, i) => `${i + 1}. "${c.title}" (${c.source}, score=${c.score ?? 0})`)
    .join("\n");

  const prompt = `You are a quiz content reviewer for QuizBytes Daily — a YouTube Shorts channel posting daily tech quiz questions.

Evaluate these trending topics and pick the BEST one for a quiz Short. Choose topics that:
- Have a clear factual answer (not opinion-based)
- Are interesting to developers (Python, AI, JS, algorithms, system design, DevOps)
- Are genuinely trending/relevant in ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
- Are specific enough to make a good quiz question

Topics:
${list}

Respond in valid JSON only (no markdown):
{
  "topic": "A clear quiz topic title (e.g. 'How does LLM context window work?')",
  "category": "one of: AI/ML, Python, JavaScript, TypeScript, Algorithms, System Design, DevOps, AI Engineering, AI Evaluation, AI Productivity",
  "difficulty": "Beginner | Intermediate | Advanced",
  "layout": "quiz-reveal",
  "icon": "single emoji",
  "score": <integer 1-10, where 10 = perfect quiz topic>,
  "reasoning": "one sentence why this is a good quiz topic"
}`;

  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 400,
    });
    const text = res.choices[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as ReviewResult;
  } catch (err) {
    log(`[review] AI review error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

// ── Queue check ───────────────────────────────────────────────────────────────

interface StatsResponse {
  total: number;
  published: number;
}

async function getQueuedCount(): Promise<number> {
  try {
    const res = await fetch(`${QUIZBYTES_URL}/api/stats`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return 0;
    const data = await res.json() as StatsResponse;
    // pending = total - published
    return Math.max(0, (data.total || 0) - (data.published || 0));
  } catch {
    return 0;
  }
}

// ── Trigger generation ────────────────────────────────────────────────────────

async function triggerGenerate(review: ReviewResult | null): Promise<boolean> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (CRON_SECRET) headers["Authorization"] = `Bearer ${CRON_SECRET}`;

  const body = review
    ? JSON.stringify({
        topic:      review.topic,
        category:   review.category,
        difficulty: review.difficulty,
        layout:     review.layout,
        icon:       review.icon,
      })
    : "{}";

  try {
    const res = await fetch(`${QUIZBYTES_URL}/api/cron/daily-generate`, {
      method:  "POST",
      headers,
      body,
      signal:  AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      log(`[trigger] HTTP ${res.status}: ${txt.slice(0, 200)}`);
      return false;
    }
    const data = await res.json() as { success?: boolean; title?: string; seriesId?: number };
    log(`[trigger] ✓ Generated: "${data.title}" (id=${data.seriesId})`);
    return true;
  } catch (err) {
    log(`[trigger] Error: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// ── Telegram notification ─────────────────────────────────────────────────────

async function notify(msg: string): Promise<void> {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    TELEGRAM_CHAT,
        text:       msg,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch { /* non-critical */ }
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(msg: string): void {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${msg}`);
}

// ── Main loop ─────────────────────────────────────────────────────────────────

async function cycle(): Promise<void> {
  log("━━━ Quiz Agent Cycle Starting ━━━");

  // 1. Check how many videos are queued
  const queued = await getQueuedCount();
  log(`[queue] ${queued} video(s) pending upload (threshold: ${QUEUE_THRESHOLD})`);

  if (queued >= QUEUE_THRESHOLD) {
    log(`[queue] Queue healthy — skipping generation this cycle`);
    return;
  }

  // 2. Fetch trending topics from live sources
  log("[topics] Fetching trending topics...");
  let candidates: CandidateTopic[] = [];
  try {
    candidates = await fetchAllCandidates();
    log(`[topics] Found ${candidates.length} candidates`);
  } catch (err) {
    log(`[topics] Fetch failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 3. AI Review Sub-Agent — score topics and pick the best
  let review: ReviewResult | null = null;
  if (candidates.length > 0) {
    log("[review] Running AI review sub-agent...");
    review = await reviewTopics(candidates);
    if (review) {
      log(`[review] Best topic: "${review.topic}" — score ${review.score}/10 — ${review.reasoning}`);
    }
  }

  // 4. Only proceed if AI score is good enough
  if (review && review.score < REVIEW_MIN) {
    log(`[review] Score ${review.score} < threshold ${REVIEW_MIN} — skipping, letting Vercel auto-pick`);
    review = null;
  }

  // 5. Trigger generation
  log(review
    ? `[generate] Triggering with AI-reviewed topic: "${review.topic}" (${review.category})`
    : `[generate] Triggering with auto-picked topic (no AI review result)`
  );

  const ok = await triggerGenerate(review);

  if (ok) {
    const msg = review
      ? `🤖 <b>Quiz Agent</b> triggered generation\n\n${review.icon} <b>${review.topic}</b>\n📂 ${review.category} · ${review.difficulty}\n⭐ AI review score: <b>${review.score}/10</b>\n<i>${review.reasoning}</i>`
      : `🤖 <b>Quiz Agent</b> triggered generation (auto-picked topic)`;
    await notify(msg);
    log("[done] ✓ Generation triggered successfully");
  } else {
    log("[done] ✗ Generation failed — will retry next cycle");
    await notify(`⚠️ <b>Quiz Agent</b> failed to trigger generation. Will retry in ${POLL_HOURS}h.`);
  }
}

async function main(): Promise<void> {
  log(`🎯 Quiz Agent started`);
  log(`   Site:       ${QUIZBYTES_URL}`);
  log(`   Poll every: ${POLL_HOURS}h`);
  log(`   Queue min:  ${QUEUE_THRESHOLD}`);
  log(`   AI min score: ${REVIEW_MIN}/10`);
  log(`   Groq AI:    ${groq ? "✓ ready" : "✗ not configured (will auto-pick)"}`);
  log(`   Telegram:   ${TELEGRAM_TOKEN ? "✓ ready" : "✗ not configured"}`);
  log("");

  await notify(`🎯 <b>Quiz Agent started</b>\nPolling every ${POLL_HOURS}h · Queue min ${QUEUE_THRESHOLD}`);

  // Run immediately on start, then loop
  while (true) {
    try {
      await cycle();
    } catch (err) {
      log(`[main] Unhandled error: ${err instanceof Error ? err.message : String(err)}`);
    }
    log(`\n⏸  Next cycle in ${POLL_HOURS}h (${new Date(Date.now() + POLL_MS).toUTCString()})\n`);
    await new Promise(r => setTimeout(r, POLL_MS));
  }
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});

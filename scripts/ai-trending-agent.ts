#!/usr/bin/env npx tsx
/**
 * ai-trending-agent.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Rides AI/tech trends the moment they break — like a news channel.
 * Run every 4 hours via cron. Only publishes when something is ACTUALLY HOT.
 *
 * Philosophy:
 *   Don't upload generic content every day.
 *   Upload immediately when something goes viral — catch the wave at peak.
 *
 * Pipeline:
 *   1. Fetch live signals (HN, Reddit, GitHub, arXiv, HuggingFace, TechCrunch)
 *      weighted by RECENCY (last 24h) + VIRALITY (score per hour)
 *   2. Cross-check all 3 channel DBs to avoid repeating covered topics
 *   3. Groq decides: is there something GENUINELY HOT right now?
 *      → YES → generate + upload immediately
 *      → NO  → skip (no mediocre content)
 *   4. Generate slides → render MP4 → upload to YouTube + set thumbnail
 *   5. Telegram alert with YouTube link
 *
 * Cron (every 4 hours — add to crontab):
 *   0 0,4,8,12,16,20 * * * cd /path/to/quizbytesdaily && npx tsx scripts/ai-trending-agent.ts >> logs/ai-trending.log 2>&1
 *
 * Override topic (manual trigger):
 *   FORCE_TOPIC="Llama 4 Scout explained" npx tsx scripts/ai-trending-agent.ts
 */

import * as path   from "path";
import * as fs     from "fs";
import * as dotenv from "dotenv";

// Trending-specific secrets take priority (channel token, OAuth creds)
dotenv.config({ path: path.resolve(__dirname, "..", ".env.trending") });
// Shared infra (Turso, Groq, Telegram) — won't override already-set keys
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import Groq      from "groq-sdk";
import Database  from "better-sqlite3";

import { generateQuizSeries, type LayoutId } from "@/lib/quiz-generator";
import { createSeries, insertSlides, getSeriesBySlug, listSeries, deleteSeries } from "@/lib/db";
import { renderSeries }           from "@/lib/video-renderer";
import { buildThumbnailJpeg }     from "@/lib/thumbnail-svg";

// ── Constants ─────────────────────────────────────────────────────────────────

const QUICKTECH_DB      = path.resolve(__dirname, "../../quicktech/data/quicktech.db");
const CRACKTHECODEAI_DB = path.resolve(__dirname, "../../quicktech/channels/CrackTheCodeAI/data/crackthecodeai.db");
const STATE_FILE        = path.resolve(__dirname, "..", "data", "trending-agent-state.json");

// Minimum virality score to trigger a publish (tune this as needed)
// Helps avoid publishing weak/generic content
const MIN_VIRALITY_SCORE = 40;

// ── Types ─────────────────────────────────────────────────────────────────────

interface TrendSignal {
  title:       string;   // cleaned topic title
  source:      string;   // hn | reddit | github | arxiv | huggingface | techcrunch | devto
  rawScore:    number;   // upvotes / stars / likes
  ageHours:    number;   // how old is this signal (hours since posted)
  viralScore:  number;   // rawScore / ageHours — rate of attention
  url?:        string;
}

interface AgentState {
  lastPublishedAt: string;
  lastTopic:       string;
  publishedToday:  number;
  date:            string;
}

// ── Logger ────────────────────────────────────────────────────────────────────

function log(msg: string) {
  const ts = new Date().toISOString().replace("T", " ").slice(0, 19);
  console.log(`[${ts}] ${msg}`);
}

// ── State management (avoid publishing same topic twice) ──────────────────────

function loadState(): AgentState {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as AgentState;
    }
  } catch { /* ignore */ }
  return { lastPublishedAt: "", lastTopic: "", publishedToday: 0, date: "" };
}

function saveState(state: AgentState): void {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

// ── Telegram ──────────────────────────────────────────────────────────────────

async function sendTelegram(msg: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId   = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "Markdown" }),
    });
  } catch { /* best-effort */ }
}

// ── Live trend fetchers with virality scoring ─────────────────────────────────

// Virality = points earned per hour since posted (recency × engagement)
function viralScore(rawScore: number, ageHours: number): number {
  return ageHours <= 0 ? rawScore : rawScore / Math.max(ageHours, 0.5);
}

function ageHoursFromTimestamp(unixSeconds: number): number {
  return (Date.now() / 1000 - unixSeconds) / 3600;
}

/** Hacker News — top stories from last 24h, AI/ML filtered */
async function fetchHN(): Promise<TrendSignal[]> {
  const res = await fetch(
    "https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=30&numericFilters=created_at_i>%s,points>20&query=AI+LLM+Claude+GPT+agent+model+open+source"
      .replace("%s", String(Math.floor(Date.now() / 1000 - 86400))),
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return [];
  const data = await res.json() as {
    hits?: Array<{ title?: string; points?: number; created_at_i?: number; url?: string }>;
  };
  return (data.hits ?? [])
    .filter((h) => h.title && (h.points ?? 0) > 30)
    .map((h) => {
      const age = ageHoursFromTimestamp(h.created_at_i ?? 0);
      return {
        title:      cleanTitle(h.title!),
        source:     "hn",
        rawScore:   h.points ?? 0,
        ageHours:   age,
        viralScore: viralScore(h.points ?? 0, age),
        url:        h.url,
      };
    })
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 12);
}

/** Reddit — hot posts from AI/ML/LocalLLaMA subs, last 48h */
async function fetchReddit(): Promise<TrendSignal[]> {
  const res = await fetch(
    "https://www.reddit.com/r/MachineLearning+LocalLLaMA+artificial+singularity/hot.json?limit=30&t=day",
    {
      headers: { "User-Agent": "ai-trending-agent/1.0 (educational content)" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) return [];
  const data = await res.json() as {
    data?: { children?: Array<{ data: { title: string; score: number; created_utc: number; url: string } }> };
  };
  return (data.data?.children ?? [])
    .filter((c) => c.data.score > 50)
    .map((c) => {
      const age = ageHoursFromTimestamp(c.data.created_utc);
      return {
        title:      cleanTitle(c.data.title),
        source:     "reddit",
        rawScore:   c.data.score,
        ageHours:   age,
        viralScore: viralScore(c.data.score, age),
        url:        c.data.url,
      };
    })
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 10);
}

/** GitHub — repos with rapid star growth in last 24h */
async function fetchGitHub(): Promise<TrendSignal[]> {
  const since = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const res = await fetch(
    `https://api.github.com/search/repositories?q=created:>${since}+stars:>20+topic:llm+topic:ai+topic:agent&sort=stars&order=desc&per_page=15`,
    {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) return [];
  const data = await res.json() as {
    items?: Array<{ name: string; description?: string; stargazers_count: number; created_at: string }>;
  };
  return (data.items ?? [])
    .filter((r) => r.stargazers_count > 20)
    .map((r) => {
      const age = (Date.now() - new Date(r.created_at).getTime()) / 3_600_000;
      const topic = r.description
        ? cleanTitle(r.description).slice(0, 75)
        : `${r.name.replace(/-/g, " ")}: new trending AI tool`;
      return {
        title:      topic,
        source:     "github",
        rawScore:   r.stargazers_count,
        ageHours:   age,
        viralScore: viralScore(r.stargazers_count, age),
      };
    })
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 8);
}

/** Hugging Face — trending models right now */
async function fetchHuggingFace(): Promise<TrendSignal[]> {
  const res = await fetch(
    "https://huggingface.co/api/models?sort=trending&direction=-1&limit=20",
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) return [];
  const models = await res.json() as Array<{
    id: string; likes?: number; pipeline_tag?: string; lastModified?: string;
  }>;
  return models
    .filter((m) => (m.likes ?? 0) > 10)
    .map((m, idx) => {
      const name     = (m.id.split("/").pop() ?? m.id).replace(/[-_]/g, " ");
      const pipeline = m.pipeline_tag ?? "AI model";
      const age      = m.lastModified ? ageHoursFromTimestamp(new Date(m.lastModified).getTime() / 1000) : 48;
      return {
        title:      `${name} — trending ${pipeline} on Hugging Face`,
        source:     "huggingface",
        rawScore:   (m.likes ?? 0) + (20 - idx) * 2, // boost recent items
        ageHours:   age,
        viralScore: viralScore(m.likes ?? 0, age),
      };
    })
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 6);
}

/** TechCrunch — latest AI articles (RSS) */
async function fetchTechCrunch(): Promise<TrendSignal[]> {
  const res = await fetch("https://techcrunch.com/feed/", {
    headers: { "User-Agent": "ai-trending-agent/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const xml   = await res.text();
  const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<pubDate>(.*?)<\/pubDate>[\s\S]*?<\/item>/g)];
  return items
    .slice(0, 15)
    .map((m) => {
      const raw  = m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      const pub  = new Date(m[2].trim());
      const age  = isNaN(pub.getTime()) ? 24 : (Date.now() - pub.getTime()) / 3_600_000;
      return {
        title:      cleanTitle(raw),
        source:     "techcrunch",
        rawScore:   100, // TC articles get baseline score
        ageHours:   age,
        viralScore: viralScore(100, age),
      };
    })
    .filter((s) => isAIRelated(s.title))
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 6);
}

/** ArXiv cs.AI — latest papers (within 48h) */
async function fetchArxiv(): Promise<TrendSignal[]> {
  const res = await fetch("https://rss.arxiv.org/rss/cs.AI+cs.LG+cs.CL", {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const xml   = await res.text();
  const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g)];
  return items
    .slice(0, 10)
    .map((m, idx) => ({
      title:      cleanTitle(m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim()).slice(0, 70) + " (new paper)",
      source:     "arxiv",
      rawScore:   10 - idx,
      ageHours:   Math.random() * 12, // assume recent (arXiv publishes daily)
      viralScore: (10 - idx) / 0.5,
    }))
    .slice(0, 4);
}

// ── Text helpers ──────────────────────────────────────────────────────────────

function cleanTitle(raw: string): string {
  return raw
    .replace(/^(show hn|ask hn|tell hn|launch\s*hn):\s*/i, "")
    .replace(/\s*\([^)]{0,20}\)\s*/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 90);
}

const AI_PATTERNS = /\b(llm|gpt|claude|gemini|llama|mistral|openai|anthropic|deepseek|groq|ai\s?agent|rag|embedding|fine.?tun|transformer|diffusion|multimodal|mcp|model.?context|copilot|cursor|windsurf|vibe.?cod|langgraph|langchain|crewai|autogen|ollama|hugging.?face|sora|grok|chatgpt|o3|o4|qwen|phi|cohere|perplexity|mistral|flux|imagen|vllm|tgi|llamaindex|haystack|dspy|instructor|guardrail|litellm|openrouter|together.ai|groq|cerebras|firework)\b/i;

function isAIRelated(text: string): boolean {
  return AI_PATTERNS.test(text);
}

function detectCategory(text: string): { category: string; layout: LayoutId; difficulty: string } {
  if (/\bvs\b|compar|benchmark|better|which\s+(is|wins|should)/i.test(text)) {
    return { category: "AI/ML", layout: "quiz-reveal", difficulty: "Beginner" };
  }
  if (/how.?to|tutorial|build|implement|step.?by|guide|getting.?started/i.test(text)) {
    return { category: "AI/ML", layout: "code-example", difficulty: "Intermediate" };
  }
  if (/tip|trick|best.?pract|secret|hack|boost/i.test(text)) {
    return { category: "AI Productivity", layout: "quick-tips", difficulty: "Beginner" };
  }
  if (/paper|research|arxiv|study|benchmark|dataset/i.test(text)) {
    return { category: "AI/ML", layout: "explainer", difficulty: "Advanced" };
  }
  return { category: "AI/ML", layout: "quiz-reveal", difficulty: "Intermediate" };
}

// ── Read covered topics from all channel DBs ──────────────────────────────────

function readLocalDbTitles(dbPath: string, query: string): string[] {
  if (!fs.existsSync(dbPath)) return [];
  try {
    const db   = new Database(dbPath, { readonly: true });
    const rows = db.prepare(query).all() as Array<Record<string, unknown>>;
    db.close();
    return rows.map((r) => String(r.title ?? r.name ?? "")).filter(Boolean);
  } catch (e) {
    log(`⚠️  Could not read ${dbPath}: ${(e as Error).message}`);
    return [];
  }
}

async function getCoveredTopics(): Promise<string[]> {
  const covered: string[] = [];

  // quizbytesdaily (Turso cloud)
  try {
    const series = await listSeries();
    series.forEach((s) => { covered.push(s.title); covered.push(s.topic); });
  } catch (e) {
    log(`⚠️  quizbytesdaily DB: ${(e as Error).message}`);
  }

  // quicktech local SQLite
  covered.push(...readLocalDbTitles(QUICKTECH_DB,
    "SELECT title FROM video_history ORDER BY created_at DESC LIMIT 300"));

  // CrackTheCodeAI local SQLite
  covered.push(...readLocalDbTitles(CRACKTHECODEAI_DB,
    "SELECT title FROM video_history ORDER BY created_at DESC LIMIT 150"));

  return [...new Set(covered.filter(Boolean).map((t) => t.toLowerCase()))];
}

// ── Check if topic was published in the last N hours ─────────────────────────

function isRecentlyPublished(topic: string, state: AgentState, hours = 48): boolean {
  if (!state.lastPublishedAt) return false;
  const lastMs  = new Date(state.lastPublishedAt).getTime();
  const ageMs   = Date.now() - lastMs;
  if (ageMs > hours * 3_600_000) return false;
  // fuzzy match — same topic?
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
  return clean(topic) === clean(state.lastTopic);
}

// ── AI-powered hot-topic detector & selector ──────────────────────────────────

interface SelectionResult {
  signal:      TrendSignal;
  topic:       string;
  category:    string;
  layout:      LayoutId;
  difficulty:  string;
  isHot:       boolean;   // Groq decided this is genuinely worth publishing
  confidence:  number;    // 0-100
  reason:      string;
}

async function detectAndSelect(
  signals: TrendSignal[],
  covered: string[],
): Promise<SelectionResult | null> {
  const apiKey = process.env.GROQ_API_KEY;

  // Filter out already-covered topics
  const fresh = signals.filter((s) => {
    const key = s.title.toLowerCase().slice(0, 35);
    return !covered.some((c) => {
      const cc = c.slice(0, 35);
      return cc.includes(key.slice(0, 20)) || key.includes(cc.slice(0, 20));
    });
  });

  const pool = fresh.length >= 3 ? fresh : signals;

  if (!apiKey) {
    // No Groq: just return the top viral signal if above threshold
    const top = pool[0];
    if (!top || top.viralScore < MIN_VIRALITY_SCORE) return null;
    const meta = detectCategory(top.title);
    return { signal: top, topic: top.title, ...meta, isHot: true, confidence: 70, reason: "fallback — no Groq key" };
  }

  const signalList = pool
    .slice(0, 20)
    .map((s, i) =>
      `${i + 1}. [${s.source.toUpperCase()}] viral:${s.viralScore.toFixed(0)} pts:${s.rawScore} age:${s.ageHours.toFixed(1)}h — "${s.title}"`
    )
    .join("\n");

  const coveredSample = covered.slice(0, 50).join(", ");

  const prompt = `You are a YouTube content strategist for a tech AI Shorts channel.
The channel publishes SHORT VIDEOS (60-90s) about AI and tech topics.
We ONLY publish when something is GENUINELY TRENDING — not generic evergreen content.

TODAY's LIVE TREND SIGNALS (sorted by virality = score/hour):
${signalList}

ALREADY COVERED (don't repeat these):
${coveredSample}

TASK: Decide if there is ONE topic worth publishing RIGHT NOW.

PUBLISH if:
- A major AI model just dropped (GPT-5, Claude 4, Llama 5, Gemini 3, etc.)
- A viral tool/demo is blowing up (e.g., new Cursor feature, MCP tool, agent framework)
- A hot debate or comparison is trending (X vs Y, who wins?)
- A major company announcement affecting AI devs
- A research breakthrough that practitioners care about
- A free tool launch with massive developer interest

SKIP if:
- Only generic evergreen topics (nothing actually broke today)
- Very academic/niche (no developer interest)
- Low confidence it's genuinely trending RIGHT NOW
- Already covered by our channel

Return ONLY JSON:
{
  "publish": true | false,
  "index": <1-based index, or null if publish=false>,
  "topic": "<cleaned up compelling title for the Short — max 10 words>",
  "category": "AI/ML" | "AI Productivity" | "AI Engineering",
  "layout": "quiz-reveal" | "explainer" | "quick-tips" | "code-example",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "confidence": <0-100>,
  "reason": "<1 sentence why this is worth publishing now>"
}`;

  try {
    const groq = new Groq({ apiKey });
    const chat = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      max_tokens:  300,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a YouTube content strategist. Return only valid JSON." },
        { role: "user",   content: prompt },
      ],
    });

    const text  = chat.choices[0]?.message?.content ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in Groq response");

    const r = JSON.parse(match[0]) as {
      publish: boolean; index?: number; topic?: string;
      category?: string; layout?: string; difficulty?: string;
      confidence?: number; reason?: string;
    };

    log(`🤖 Groq decision: publish=${r.publish} confidence=${r.confidence ?? "?"} — ${r.reason ?? ""}`);

    if (!r.publish || (r.confidence ?? 0) < 50) return null;

    const idx    = (r.index ?? 1) - 1;
    const signal = pool[idx] ?? pool[0];
    if (!signal) return null;

    return {
      signal,
      topic:      r.topic ?? signal.title,
      category:   r.category ?? "AI/ML",
      layout:     (r.layout ?? "quiz-reveal") as LayoutId,
      difficulty: r.difficulty ?? "Beginner",
      isHot:      true,
      confidence: r.confidence ?? 75,
      reason:     r.reason ?? "",
    };
  } catch (e) {
    log(`⚠️  Groq decision error: ${(e as Error).message}`);
    // Fallback: publish if top signal is very viral
    const top = pool[0];
    if (!top || top.viralScore < MIN_VIRALITY_SCORE * 2) return null;
    const meta = detectCategory(top.title);
    return {
      signal: top, topic: top.title, ...meta,
      isHot: true, confidence: 60, reason: "high virality score fallback",
    };
  }
}

// ── YouTube helpers ───────────────────────────────────────────────────────────

// In-memory access token cache for this process run.
// Access tokens are valid for 1 hour; caching avoids a second round-trip
// when both uploadToYouTube() and setThumbnail() call getYouTubeToken().
let _cachedAccessToken: string | null = null;
let _cachedAccessTokenExpiresAt = 0;

async function getYouTubeToken(): Promise<string> {
  // Return cached token if still valid (with 2-min safety margin)
  if (_cachedAccessToken && Date.now() < _cachedAccessTokenExpiresAt - 120_000) {
    return _cachedAccessToken;
  }

  // Strict: ONLY use AITrendingNow-specific token — NEVER fall back to quizbytesdaily's token
  const refreshToken = process.env.TRENDING_YOUTUBE_REFRESH_TOKEN;
  if (!refreshToken) throw new Error(
    "TRENDING_YOUTUBE_REFRESH_TOKEN not set.\n" +
    "Run: npx tsx scripts/setup-trending-oauth.ts\n" +
    "This agent will NOT fall back to YOUTUBE_REFRESH_TOKEN to avoid uploading to the wrong channel."
  );

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json() as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!data.access_token) {
    // Refresh token may have expired (test-mode apps: 7 days; production: 6 months inactive)
    const reason = data.error_description ?? data.error ?? "unknown";
    throw new Error(
      `Token refresh failed: ${reason}\n` +
      "If error is 'invalid_grant', the refresh token has expired.\n" +
      "Fix: re-run  npx tsx scripts/setup-trending-oauth.ts"
    );
  }

  // Cache for the token's lifetime (default 3600s)
  _cachedAccessToken = data.access_token;
  _cachedAccessTokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;

  return data.access_token;
}

async function uploadToYouTube(
  videoPath: string, title: string, description: string, tags: string[]
): Promise<string> {
  const token  = await getYouTubeToken();
  const buffer = fs.readFileSync(videoPath);

  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization:             `Bearer ${token}`,
        "Content-Type":            "application/json",
        "X-Upload-Content-Type":   "video/mp4",
        "X-Upload-Content-Length": String(buffer.byteLength),
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
    headers: { "Content-Type": "video/mp4", "Content-Length": String(buffer.byteLength) },
    body: new Uint8Array(buffer),
  });
  if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status}): ${(await uploadRes.text()).slice(0, 300)}`);
  const vid = await uploadRes.json() as { id?: string; error?: { message?: string } };
  if (!vid.id) throw new Error(vid.error?.message ?? "No video ID in response");
  return vid.id;
}

async function setThumbnail(videoId: string, thumb: Buffer): Promise<void> {
  const token = await getYouTubeToken();
  const res = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}&uploadType=media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "image/jpeg" },
      body: new Uint8Array(thumb),
    }
  );
  if (!res.ok) log(`⚠️  Thumbnail failed: ${res.statusText}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const runStart = Date.now();

  log("═══════════════════════════════════════════════════════════");
  log("🔥 AI Trending Agent — scanning for hot topics");
  log("═══════════════════════════════════════════════════════════");

  const state = loadState();
  const today = new Date().toISOString().slice(0, 10);
  if (state.date !== today) { state.publishedToday = 0; state.date = today; }

  // Manual override
  const forceTopic = process.env.FORCE_TOPIC;
  if (forceTopic) log(`🎯 FORCE_TOPIC override: "${forceTopic}"`);

  // ── 1. Fetch live signals in parallel ────────────────────────────────────────
  log("📡 Fetching live trend signals from all sources…");

  let signals: TrendSignal[] = [];

  if (forceTopic) {
    // Synthetic signal for forced topic
    const meta = detectCategory(forceTopic);
    signals = [{
      title: forceTopic, source: "manual", rawScore: 999,
      ageHours: 0, viralScore: 9999,
    }];
  } else {
    const [hn, reddit, github, hf, tc, arxiv] = await Promise.allSettled([
      fetchHN(),
      fetchReddit(),
      fetchGitHub(),
      fetchHuggingFace(),
      fetchTechCrunch(),
      fetchArxiv(),
    ]);

    const merge = <T>(r: PromiseSettledResult<T[]>, label: string): T[] => {
      if (r.status === "fulfilled") { log(`   ✓ ${label}: ${r.value.length} signals`); return r.value; }
      log(`   ✗ ${label}: ${r.reason}`); return [];
    };

    signals = [
      ...merge(hn,     "HN"),
      ...merge(reddit, "Reddit"),
      ...merge(github, "GitHub"),
      ...merge(hf,     "HuggingFace"),
      ...merge(tc,     "TechCrunch"),
      ...merge(arxiv,  "ArXiv"),
    ]
      .filter((s) => isAIRelated(s.title) && s.title.length > 12)
      .sort((a, b) => b.viralScore - a.viralScore);

    log(`   Total: ${signals.length} AI-related signals`);

    if (signals.length === 0) {
      log("   No AI signals found — skipping this run");
      await sendTelegram("ℹ️ *AI Trending Agent* — No trending AI signals found this run. Skipping.");
      return;
    }

    // Log top 5
    log("   Top signals by virality:");
    signals.slice(0, 5).forEach((s, i) =>
      log(`   ${i + 1}. [${s.source}] viral:${s.viralScore.toFixed(0)} — "${s.title.slice(0, 60)}"`)
    );
  }

  // ── 2. Get covered topics ─────────────────────────────────────────────────
  log("📚 Loading covered topics from all channel databases…");
  const covered = await getCoveredTopics();
  log(`   ${covered.length} topics already covered`);

  // ── 3. Groq decides: is anything hot enough? ─────────────────────────────
  log("🤖 Asking Groq to evaluate trending signals…");
  const selection = forceTopic
    ? (() => {
        const meta = detectCategory(forceTopic);
        return {
          signal: signals[0], topic: forceTopic, ...meta,
          isHot: true, confidence: 100, reason: "manual override",
        };
      })()
    : await detectAndSelect(signals, covered);

  if (!selection) {
    log("📭 Nothing hot enough to publish right now — skipping this run");
    log("   (Will check again at next cron tick in 4 hours)");
    await sendTelegram(
      `ℹ️ *AI Trending Agent* — Checked ${signals.length} signals, nothing hot enough to publish.\n` +
      `Top signal: _${signals[0]?.title?.slice(0, 60) ?? "none"}_ (viral: ${signals[0]?.viralScore?.toFixed(0) ?? "0"})`
    );
    return;
  }

  // Check if we already published this topic recently
  if (!forceTopic && isRecentlyPublished(selection.topic, state, 48)) {
    log(`⏭  Already published "${selection.topic}" recently — skipping`);
    return;
  }

  log(`✅ HOT TOPIC DETECTED: "${selection.topic}"`);
  log(`   Source: ${selection.signal.source.toUpperCase()} · Viral score: ${selection.signal.viralScore.toFixed(0)}`);
  log(`   Confidence: ${selection.confidence}% — ${selection.reason}`);

  // ── 4. Generate slides ────────────────────────────────────────────────────
  log("⚙️  Generating slide content with Groq…");
  const generated = await generateQuizSeries(
    selection.topic,
    selection.category,
    selection.difficulty,
    selection.layout,
  );
  log(`✓  "${generated.title}" — ${generated.slides.length} slides`);

  // ── 5. Save to DB ─────────────────────────────────────────────────────────
  let slug = generated.slug;
  if (await getSeriesBySlug(slug)) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  const series = await createSeries({
    slug, title: generated.title, topic: generated.topic,
    category: generated.category, difficulty: generated.difficulty,
  });
  await insertSlides(series.id, generated.slides.map((s) => {
    const { template, ...rest } = s as unknown as Record<string, unknown>;
    return { template: String(template ?? "unknown"), data: rest };
  }));
  log(`✓  Saved to DB as series id=${series.id}`);

  // ── 6. Render MP4 ─────────────────────────────────────────────────────────
  log("🎬 Rendering MP4…");
  // Render using quizbytesdaily's Turso DB as a temporary scratchpad,
  // then immediately delete the series so the admin UI is never polluted.
  const outFile = await renderSeries(series.id, (m) => log(`   ${m}`))
    .finally(async () => {
      try { await deleteSeries(series.id); } catch { /* best-effort */ }
      log(`✓  Cleaned up series id=${series.id} from quizbytesdaily DB`);
    });
  log(`✓  Rendered (${(fs.statSync(outFile).size / 1024 / 1024).toFixed(1)} MB)`);

  // ── 7. Thumbnail ──────────────────────────────────────────────────────────
  const thumb = await buildThumbnailJpeg(series.title, series.category, series.difficulty);

  // ── 8. Upload ─────────────────────────────────────────────────────────────
  const ytTitle = `${series.title} #Shorts #AI`;
  const ytDesc  = [
    `🔥 ${selection.reason}`,
    ``,
    `${series.topic}`,
    ``,
    `📚 Daily AI & tech Shorts — subscribe to stay ahead!`,
    `https://quizbytes.dev`,
    ``,
    `#AI #MachineLearning #TechShorts #AINews #${series.category.replace(/[/ ]/g, "")} #Trending`,
  ].join("\n");

  const ytTags = [
    "AI", "machine learning", "artificial intelligence", "tech news",
    "AI shorts", "trending AI", series.category, series.difficulty.toLowerCase(),
    ...selection.topic.toLowerCase().split(/\W+/).filter((w) => w.length > 3).slice(0, 6),
  ];

  log(`📤 Uploading: "${ytTitle}"`);
  const videoId    = await uploadToYouTube(outFile, ytTitle, ytDesc, ytTags);
  const youtubeUrl = `https://www.youtube.com/shorts/${videoId}`;
  log(`✓  Live: ${youtubeUrl}`);

  await setThumbnail(videoId, thumb);
  try { fs.unlinkSync(outFile); } catch { /* ignore */ }

  // ── 9. Update state ───────────────────────────────────────────────────────
  state.lastPublishedAt = new Date().toISOString();
  state.lastTopic       = selection.topic;
  state.publishedToday  = (state.publishedToday ?? 0) + 1;
  saveState(state);

  const elapsed = ((Date.now() - runStart) / 1000).toFixed(1);

  log("═══════════════════════════════════════════════════════════");
  log(`🎉 PUBLISHED in ${elapsed}s`);
  log(`   Topic:  ${series.title}`);
  log(`   Source: ${selection.signal.source} · viral:${selection.signal.viralScore.toFixed(0)}`);
  log(`   URL:    ${youtubeUrl}`);
  log("═══════════════════════════════════════════════════════════");

  await sendTelegram(
    `🔥 *AI Trending Agent — Short published!*\n\n` +
    `📹 *${series.title}*\n` +
    `🏷 ${series.category} · ${series.difficulty}\n` +
    `📡 Source: ${selection.signal.source.toUpperCase()} · Viral: ${selection.signal.viralScore.toFixed(0)}\n` +
    `🧠 ${selection.reason}\n\n` +
    `[▶ Watch now](${youtubeUrl})\n\n` +
    `⏱ ${elapsed}s · published today: ${state.publishedToday}`
  );
}

main().catch(async (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  log(`💥 FATAL: ${msg}`);
  await sendTelegram(`🚨 *AI Trending Agent — FAILED*\n\n\`${msg.slice(0, 500)}\``);
  process.exit(1);
});

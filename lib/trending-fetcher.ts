// ── Live Trending Topic Fetcher ────────────────────────────────────────────────
// Fetches real-time AI/tech trends from multiple free public sources:
//   1. Hacker News "Ask HN" + "Show HN" top stories → tech topics
//   2. GitHub Trending repositories (via unofficial scrape-free API)
//   3. ArXiv latest AI/ML papers (RSS)
// Falls back to curated static list if all sources fail or return nothing.

import { TRENDING_TOPICS } from "@/lib/quiz-generator";
import { type LayoutId } from "@/lib/quiz-generator";

export interface LiveTrendingTopic {
  topic: string;
  category: string;
  layout: LayoutId;
  difficulty: string;
  icon: string;
  source: string; // "hn" | "github" | "arxiv" | "static"
}

// ── Category detection heuristics ─────────────────────────────────────────────

const CATEGORY_RULES: { pattern: RegExp; category: string; icon: string }[] = [
  { pattern: /\b(llm|gpt|claude|gemini|llama|mistral|openai|anthropic|deepseek|groq|ai agent|rag|embedding|fine.?tun|transformer|diffusion|multimodal|mcp|model context|copilot|cursor|windsurf|vibe.?cod|langgraph|langchain|crewai|autogen|ollama|hugging.?face|stable.?diffusion|midjourney|sora|grok)\b/i, category: "AI/ML",         icon: "🤖" },
  { pattern: /\b(python|pip|uv|ruff|pydantic|fastapi|django|flask|pandas|numpy|pytorch|polars|asyncio|celery|sqlalchemy)\b/i,                                                                                                                                                                                                                       category: "Python",        icon: "🐍" },
  { pattern: /\b(javascript|typescript|react|next\.?js|vue|angular|node|bun|deno|svelte|vite|webpack|tailwind|prisma|remix)\b/i,                                                                                                                                                                                                                   category: "JavaScript",    icon: "⚡" },
  { pattern: /\b(docker|kubernetes|k8s|terraform|ansible|github.?actions|ci.?cd|devops|helm|argo|gitops|prometheus|grafana|aws|gcp|azure|cloud)\b/i,                                                                                                                                                                                               category: "DevOps",        icon: "🚀" },
  { pattern: /\b(system.?design|microservice|api.?gateway|cdn|cache|database|sharding|distributed|load.?balanc|message.?queue|kafka|redis|postgres|mysql)\b/i,                                                                                                                                                                                    category: "System Design", icon: "🏗" },
  { pattern: /\b(algorithm|leetcode|data.?structure|graph|tree|dp|dynamic.?program|sorting|binary.?search|bfs|dfs|heap|trie)\b/i,                                                                                                                                                                                                                 category: "Algorithms",    icon: "🧮" },
];

function detectCategory(text: string): { category: string; icon: string } {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) {
      return { category: rule.category, icon: rule.icon };
    }
  }
  // Default: AI/ML (most content on HN/GitHub is AI-adjacent these days)
  return { category: "AI/ML", icon: "🤖" };
}

function pickLayout(category: string, title: string): LayoutId {
  const lower = title.toLowerCase();
  if (/vs |compare|benchmark|difference|better/i.test(lower)) return "quiz-reveal";
  if (/how to|tutorial|build|implement|example|code|step/i.test(lower)) return "code-example";
  if (/tip|trick|cheat|quick|best practice|dos and don/i.test(lower)) return "quick-tips";
  if (category === "Algorithms" || category === "Python" || category === "JavaScript") return "code-example";
  return "explainer";
}

function pickDifficulty(title: string): string {
  if (/advanced|deep.?dive|internals|architecture|distributed|production|at scale/i.test(title)) return "Advanced";
  if (/intermediate|pattern|optimization|performance/i.test(title)) return "Intermediate";
  return "Beginner";
}

// ── Clean a raw title into a quiz-friendly topic ───────────────────────────────
function cleanTitle(raw: string): string {
  return raw
    .replace(/^(show hn|ask hn|tell hn):\s*/i, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")   // strip (author), (2024), etc.
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 80);
}

// ── Source 1: Hacker News Top Stories ─────────────────────────────────────────
async function fetchHN(): Promise<LiveTrendingTopic[]> {
  const res = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
    next: { revalidate: 3600 }, // cache 1h
  });
  if (!res.ok) throw new Error("HN fetch failed");
  const ids = (await res.json() as number[]).slice(0, 30);

  const items = await Promise.allSettled(
    ids.map((id) =>
      fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
        .then((r) => r.json() as Promise<{ title?: string; score?: number; type?: string }>)
    )
  );

  const results: LiveTrendingTopic[] = [];
  for (const r of items) {
    if (r.status !== "fulfilled") continue;
    const item = r.value;
    if (!item.title || item.type !== "story") continue;

    const title = cleanTitle(item.title);
    if (title.length < 10) continue;

    const { category, icon } = detectCategory(title);
    // Only keep tech-relevant topics
    if (!CATEGORY_RULES.some((rule) => rule.pattern.test(title))) continue;

    results.push({
      topic:      title,
      category,
      icon,
      layout:     pickLayout(category, title),
      difficulty: pickDifficulty(title),
      source:     "hn",
    });
  }
  return results.slice(0, 8);
}

// ── Source 2: GitHub Trending (via gh-trending API) ───────────────────────────
async function fetchGitHubTrending(): Promise<LiveTrendingTopic[]> {
  // Uses the public unofficial trending API
  const res = await fetch("https://gh-trending-api.waningflow.com/repositories?since=daily", {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error("GitHub trending fetch failed");

  const repos = await res.json() as Array<{
    name?: string;
    description?: string;
    language?: string;
    author?: string;
  }>;

  const results: LiveTrendingTopic[] = [];
  for (const repo of repos.slice(0, 20)) {
    const desc = `${repo.name ?? ""} ${repo.description ?? ""}`;
    if (!desc.trim()) continue;

    const { category, icon } = detectCategory(desc);
    if (!CATEGORY_RULES.some((rule) => rule.pattern.test(desc))) continue;

    const topic = cleanTitle(
      repo.description?.slice(0, 70) ??
      `${repo.author}/${repo.name}: What it does and why it's trending`
    );
    if (topic.length < 10) continue;

    results.push({
      topic,
      category,
      icon,
      layout:     pickLayout(category, topic),
      difficulty: "Beginner",
      source:     "github",
    });
  }
  return results.slice(0, 6);
}

// ── Source 3: ArXiv AI/ML latest papers (RSS) ─────────────────────────────────
async function fetchArxiv(): Promise<LiveTrendingTopic[]> {
  const url =
    "https://rss.arxiv.org/rss/cs.AI+cs.LG+cs.CL";
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("ArXiv fetch failed");
  const xml = await res.text();

  // Simple regex parse — no xml library needed
  const titleMatches = [...xml.matchAll(/<title><!\[CDATA\[(.+?)\]\]><\/title>/g)];
  const titles = titleMatches
    .map((m) => m[1].trim())
    .filter((t) => !t.startsWith("cs."))   // skip feed title
    .slice(0, 15);

  return titles.map((raw) => {
    const topic = cleanTitle(raw).slice(0, 75);
    return {
      topic:      topic + " (new paper)",
      category:   "AI/ML",
      icon:       "🤖",
      layout:     "explainer" as LayoutId,
      difficulty: "Intermediate",
      source:     "arxiv",
    };
  }).slice(0, 5);
}

// ── Static fallback: curated 2026 hot releases ────────────────────────────────
function staticFallback(): LiveTrendingTopic[] {
  return (TRENDING_TOPICS["AI/ML"] ?? []).slice(0, 10).map((topic) => ({
    topic,
    category:   "AI/ML",
    icon:       "🤖",
    layout:     "quiz-reveal" as LayoutId,
    difficulty: "Beginner",
    source:     "static",
  }));
}

// ── Deduplicate by topic similarity ───────────────────────────────────────────
function dedupe(topics: LiveTrendingTopic[]): LiveTrendingTopic[] {
  const seen = new Set<string>();
  return topics.filter((t) => {
    const key = t.topic.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Main export: fetch live trending topics ────────────────────────────────────
export async function fetchLiveTrending(): Promise<LiveTrendingTopic[]> {
  const [hn, github, arxiv] = await Promise.allSettled([
    fetchHN(),
    fetchGitHubTrending(),
    fetchArxiv(),
  ]);

  const combined: LiveTrendingTopic[] = [
    ...(hn.status === "fulfilled" ? hn.value : []),
    ...(github.status === "fulfilled" ? github.value : []),
    ...(arxiv.status === "fulfilled" ? arxiv.value : []),
  ];

  const deduped = dedupe(combined);

  // If we got meaningful results from live sources, return them
  if (deduped.length >= 5) return deduped.slice(0, 20);

  // Otherwise fall back to curated static list
  console.warn("[trending] Live fetch returned too few results — using static fallback");
  return staticFallback();
}

// ── Pick the single best topic for today (for daily cron) ─────────────────────
// Prefers HN/GitHub AI topics; falls back to curated rotation
export async function fetchOneLiveTopic(): Promise<LiveTrendingTopic> {
  try {
    const topics = await fetchLiveTrending();
    // Prefer AI/ML topics from live sources
    const aiTopics = topics.filter((t) => t.category === "AI/ML" && t.source !== "static");
    if (aiTopics.length > 0) {
      // Pick one deterministically by day-of-year so it doesn't change on retry
      const day = Math.floor(Date.now() / 86_400_000);
      return aiTopics[day % aiTopics.length];
    }
    if (topics.length > 0) {
      const day = Math.floor(Date.now() / 86_400_000);
      return topics[day % topics.length];
    }
  } catch (err) {
    console.warn("[trending] fetchOneLiveTopic failed, using static:", err);
  }
  // Final fallback
  const statics = staticFallback();
  const day = Math.floor(Date.now() / 86_400_000);
  return statics[day % statics.length];
}

// ── Live Trending Topic Fetcher ────────────────────────────────────────────────
// Fetches real-time AI/tech trends from:
//   1. HN Algolia API  — search "AI LLM Python" in top stories (single fast call)
//   2. GitHub Search API — repos created last 7 days, sorted by stars (no auth)
//   3. ArXiv RSS        — latest cs.AI + cs.LG papers
// Falls back to curated static list if all live sources return nothing useful.

import { TRENDING_TOPICS, type LayoutId } from "@/lib/quiz-generator";

export interface LiveTrendingTopic {
  topic: string;
  category: string;
  layout: LayoutId;
  difficulty: string;
  icon: string;
  source: "hn" | "github" | "arxiv" | "static";
}

// ── Category detection ────────────────────────────────────────────────────────

const CATEGORY_RULES: { pattern: RegExp; category: string; icon: string }[] = [
  { pattern: /\b(llm|gpt|claude|gemini|llama|mistral|openai|anthropic|deepseek|groq|ai.?agent|rag|embedding|fine.?tun|transformer|diffusion|multimodal|mcp|model.?context|copilot|cursor|windsurf|vibe.?cod|langgraph|langchain|crewai|autogen|ollama|hugging.?face|stable.?diffusion|midjourney|sora|grok|chatgpt|o3|o4)\b/i, category: "AI/ML",         icon: "🤖" },
  { pattern: /\b(python|pip|uv|ruff|pydantic|fastapi|django|flask|pandas|numpy|pytorch|polars|asyncio|celery|sqlalchemy|pytorch|tensorflow)\b/i,                                                                                                                                                                                                   category: "Python",        icon: "🐍" },
  { pattern: /\b(javascript|typescript|react|next\.?js|vue|angular|node\.?js|bun|deno|svelte|vite|webpack|tailwind|prisma|remix|htmx)\b/i,                                                                                                                                                                                                        category: "JavaScript",    icon: "⚡" },
  { pattern: /\b(docker|kubernetes|k8s|terraform|ansible|github.?actions|ci.?cd|devops|helm|argo|gitops|prometheus|grafana|aws|gcp|azure|cloud)\b/i,                                                                                                                                                                                               category: "DevOps",        icon: "🚀" },
  { pattern: /\b(system.?design|microservice|api.?gateway|cdn|sharding|distributed|load.?balanc|message.?queue|kafka|redis|postgres|database)\b/i,                                                                                                                                                                                                category: "System Design", icon: "🏗" },
  { pattern: /\b(algorithm|leetcode|data.?structure|graph.?(theory|algorithm)|tree|dynamic.?program|sorting|binary.?search|bfs|dfs|heap|trie)\b/i,                                                                                                                                                                                                category: "Algorithms",    icon: "🧮" },
];

function detectCategory(text: string): { category: string; icon: string } {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(text)) return { category: rule.category, icon: rule.icon };
  }
  return { category: "AI/ML", icon: "🤖" }; // default — most HN tech content is AI adjacent
}

function pickLayout(category: string, title: string): LayoutId {
  if (/\bvs\b|compar|benchmark|differ|better|which/i.test(title)) return "quiz-reveal";
  if (/how.?to|tutorial|build|implement|example|step.?by|walkthrough/i.test(title)) return "code-example";
  if (/tip|trick|cheat|best.?pract|dos.?and/i.test(title)) return "quick-tips";
  if (category === "Algorithms" || category === "Python" || category === "JavaScript") return "code-example";
  return "explainer";
}

function pickDifficulty(title: string): string {
  if (/advanced|deep.?dive|intern(als)?|architect|distributed|at.?scale|production/i.test(title)) return "Advanced";
  if (/intermediate|pattern|optim|perform/i.test(title)) return "Intermediate";
  return "Beginner";
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^(show hn|ask hn|tell hn|launch\s*hn):\s*/i, "")
    .replace(/\s*\([^)]{0,20}\)\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 90);
}

// ── Source 1: HN Algolia (single API call, searches AI+tech stories) ──────────
async function fetchHN(): Promise<LiveTrendingTopic[]> {
  // Two parallel searches: AI/LLM topics + Python/DevOps topics
  const [aiRes, devRes] = await Promise.all([
    fetch("https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=15&query=AI+LLM+agent+model", {
      next: { revalidate: 3600 },
    }),
    fetch("https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=10&query=python+typescript+kubernetes+developer+tool", {
      next: { revalidate: 3600 },
    }),
  ]);

  const [aiData, devData] = await Promise.all([
    aiRes.json() as Promise<{ hits?: Array<{ title?: string; points?: number }> }>,
    devRes.json() as Promise<{ hits?: Array<{ title?: string; points?: number }> }>,
  ]);

  const allHits = [
    ...(aiData.hits ?? []),
    ...(devData.hits ?? []),
  ];

  const results: LiveTrendingTopic[] = [];
  for (const hit of allHits) {
    if (!hit.title) continue;
    const title = cleanTitle(hit.title);
    if (title.length < 12) continue;

    // Only keep items that match at least one tech category
    if (!CATEGORY_RULES.some((r) => r.pattern.test(title))) continue;

    const { category, icon } = detectCategory(title);
    results.push({
      topic:      title,
      category,
      icon,
      layout:     pickLayout(category, title),
      difficulty: pickDifficulty(title),
      source:     "hn",
    });
  }

  // Dedupe within this source
  const seen = new Set<string>();
  return results.filter((t) => {
    const k = t.topic.slice(0, 30).toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k); return true;
  }).slice(0, 10);
}

// ── Source 2: GitHub Search API — repos trending this week ────────────────────
async function fetchGitHubTrending(): Promise<LiveTrendingTopic[]> {
  // Search repos created in the last 7 days with >10 stars, sorted by stars
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const url = `https://api.github.com/search/repositories?q=created:>${since}+stars:>10+language:python+language:typescript&sort=stars&order=desc&per_page=15`;

  const res = await fetch(url, {
    headers: { Accept: "application/vnd.github+json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);

  const data = await res.json() as {
    items?: Array<{ name: string; description?: string; language?: string; stargazers_count: number }>;
  };

  const results: LiveTrendingTopic[] = [];
  for (const repo of (data.items ?? []).slice(0, 12)) {
    const text = `${repo.name} ${repo.description ?? ""}`;
    const { category, icon } = detectCategory(text);

    // Prefer AI-related repos for our channel
    if (!CATEGORY_RULES.some((r) => r.pattern.test(text))) continue;

    const topic = repo.description
      ? cleanTitle(repo.description).slice(0, 75)
      : `${repo.name}: What it is and how to use it`;

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

// ── Source 3: ArXiv AI/ML latest papers ──────────────────────────────────────
async function fetchArxiv(): Promise<LiveTrendingTopic[]> {
  const res = await fetch(
    "https://rss.arxiv.org/rss/cs.AI+cs.LG+cs.CL",
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`ArXiv ${res.status}`);
  const xml = await res.text();

  // Extract titles from both <title> and <item> blocks
  const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g)];
  const titles = items
    .map((m) => m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim())
    .filter((t) => t.length > 15)
    .slice(0, 8);

  return titles.map((raw) => ({
    topic:      cleanTitle(raw).slice(0, 70) + " (new research)",
    category:   "AI/ML" as const,
    icon:       "🤖",
    layout:     "explainer" as LayoutId,
    difficulty: "Intermediate",
    source:     "arxiv" as const,
  })).slice(0, 4);
}

// ── Static fallback ───────────────────────────────────────────────────────────
function staticFallback(): LiveTrendingTopic[] {
  return (TRENDING_TOPICS["AI/ML"] ?? []).slice(0, 12).map((topic) => ({
    topic,
    category: "AI/ML" as const,
    icon: "🤖",
    layout: "quiz-reveal" as LayoutId,
    difficulty: "Beginner" as const,
    source: "static" as const,
  }));
}

// ── Global dedup across all sources ──────────────────────────────────────────
function dedupe(topics: LiveTrendingTopic[]): LiveTrendingTopic[] {
  const seen = new Set<string>();
  return topics.filter((t) => {
    const key = t.topic.toLowerCase().slice(0, 35);
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function fetchLiveTrending(): Promise<LiveTrendingTopic[]> {
  const [hn, github, arxiv] = await Promise.allSettled([
    fetchHN(),
    fetchGitHubTrending(),
    fetchArxiv(),
  ]);

  const live: LiveTrendingTopic[] = [
    ...(hn.status === "fulfilled" ? hn.value : []),
    ...(github.status === "fulfilled" ? github.value : []),
    ...(arxiv.status === "fulfilled" ? arxiv.value : []),
  ];

  const deduped = dedupe(live);
  if (deduped.length >= 4) return deduped.slice(0, 20);

  // Supplement with static if live sources are thin
  const combined = dedupe([...deduped, ...staticFallback()]);
  return combined.slice(0, 20);
}

// ── Pick ONE topic for daily cron ─────────────────────────────────────────────
export async function fetchOneLiveTopic(): Promise<LiveTrendingTopic> {
  try {
    const topics = await fetchLiveTrending();
    // Prefer live AI/ML topics
    const aiLive = topics.filter((t) => t.category === "AI/ML" && t.source !== "static");
    const pool = aiLive.length > 0 ? aiLive : topics.filter((t) => t.source !== "static");
    if (pool.length > 0) {
      const day = Math.floor(Date.now() / 86_400_000);
      return pool[day % pool.length];
    }
  } catch (err) {
    console.warn("[trending] fetchOneLiveTopic error:", err);
  }
  const statics = staticFallback();
  const day = Math.floor(Date.now() / 86_400_000);
  return statics[day % statics.length];
}

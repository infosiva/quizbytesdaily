// ── Live Trending Topic Fetcher ────────────────────────────────────────────────
// Fetches real-time AI/tech trends from:
//   1. HN Algolia API      — search "AI LLM Python" in top stories (single fast call)
//   2. GitHub Search API   — repos created last 7 days, sorted by stars (no auth)
//   3. ArXiv RSS           — latest cs.AI + cs.LG papers
//   4. Reddit              — hot posts from ML/Python/programming subs
//   5. Dev.to              — top articles by tag
//   6. Stack Overflow      — hot questions on tech tags
//   7. Product Hunt        — new AI/dev tool launches (RSS)
//   8. Lobste.rs           — tech link aggregator hottest posts (JSON API)
//   9. Hugging Face        — trending open-source models (public API)
//  10. Papers With Code    — latest ML papers with code (public API)
//  11. TechCrunch          — tech industry news (RSS)
// Falls back to curated static list if all live sources return nothing useful.

import { TRENDING_TOPICS, type LayoutId } from "@/lib/quiz-generator";

export interface LiveTrendingTopic {
  topic: string;
  category: string;
  layout: LayoutId;
  difficulty: string;
  icon: string;
  source:
    | "hn" | "github" | "arxiv" | "reddit" | "devto" | "stackoverflow"
    | "producthunt" | "lobsters" | "huggingface" | "paperswithcode" | "techcrunch"
    | "static";
  score?: number;   // HN points, GitHub stars, Reddit upvotes, HF likes, etc.
}

// ── Category detection ────────────────────────────────────────────────────────

const CATEGORY_RULES: { pattern: RegExp; category: string; icon: string }[] = [
  // AI Productivity — MCP tooling, Claude workflows, task automation (before AI/ML so MCP server topics land here)
  { pattern: /\b(mcp.?server|mcp.?tool|model.?context.?protocol|claude.?project|claude.?workflow|claude.?subscription|claude.?pro|ai.?productivity|ai.?workflow|ai.?automation|prompt.?workflow|ai.?assistant.?tips|cursor.?rule|copilot.?tip|github.?copilot.?tip|automat.{1,15}(task|daily|email|pr|code)|pr.?description.?ai|batch.?api|claude.?code.?tip|ai.?writing)\b/i, category: "AI Productivity", icon: "💡" },
  // AI Evaluation — must come before AI/ML so RAGAS/DeepEval etc. are correctly tagged
  { pattern: /\b(ragas|deepeval|promptfoo|braintrust|langfuse|langsmith|arize|helicone|trulens|llm.?eval|llm.?test|llm.?observ|hallucin|faithfulness|context.?recall|llm.?as.?judge|prompt.?test|eval.?framework|ai.?benchmark)\b/i, category: "AI Evaluation", icon: "🎯" },
  // AI Engineering — vector DBs, RAG pipelines, LLM infra
  { pattern: /\b(vector.?db|vector.?database|pinecone|chroma|weaviate|qdrant|pgvector|milvus|faiss|lancedb|hybrid.?search|rerank|vllm|quantiz|llm.?serving|llm.?gateway|llm.?prod|llm.?deploy|rag.?pipeline|advanced.?rag|hyde|graph.?rag|self.?rag|ann.?search|embedding.?search)\b/i, category: "AI Engineering", icon: "⚙️" },
  // General AI/ML models and frameworks
  { pattern: /\b(llm|gpt|claude|gemini|llama|mistral|openai|anthropic|deepseek|groq|ai.?agent|rag|embedding|fine.?tun|transformer|diffusion|multimodal|mcp|model.?context|copilot|cursor|windsurf|vibe.?cod|langgraph|langchain|crewai|autogen|smolagents|pydantic.?ai|mastra|ollama|hugging.?face|stable.?diffusion|midjourney|sora|grok|chatgpt|o3|o4)\b/i, category: "AI/ML", icon: "🤖" },
  { pattern: /\b(python|pip|uv|ruff|pydantic|fastapi|django|flask|pandas|numpy|pytorch|polars|asyncio|celery|sqlalchemy|tensorflow)\b/i, category: "Python",        icon: "🐍" },
  { pattern: /\b(javascript|typescript|react|next\.?js|vue|angular|node\.?js|bun|deno|svelte|vite|webpack|tailwind|prisma|remix|htmx|trpc)\b/i, category: "JavaScript",    icon: "⚡" },
  { pattern: /\b(docker|kubernetes|k8s|terraform|ansible|github.?actions|ci.?cd|devops|helm|argo|gitops|prometheus|grafana|aws|gcp|azure|cloud|opentelemetry|otel)\b/i, category: "DevOps",        icon: "🚀" },
  { pattern: /\b(system.?design|microservice|api.?gateway|cdn|sharding|distributed|load.?balanc|message.?queue|kafka|redis|postgres|database|cqrs|event.?sourcing)\b/i, category: "System Design", icon: "🏗" },
  { pattern: /\b(algorithm|leetcode|data.?structure|graph.?(theory|algorithm)|tree|dynamic.?program|sorting|binary.?search|bfs|dfs|heap|trie|two.?pointer|sliding.?window)\b/i, category: "Algorithms",    icon: "🧮" },
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
      score:      hit.points ?? 0,
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
      score:      repo.stargazers_count,
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

// ── Source 4: Reddit hot posts (r/MachineLearning + r/Python + r/programming) ──
async function fetchReddit(): Promise<LiveTrendingTopic[]> {
  // Multireddit — combines top-upvoted posts across three relevant subs
  const res = await fetch(
    "https://www.reddit.com/r/MachineLearning+Python+programming+artificial+LocalLLaMA/hot.json?limit=25&t=week",
    {
      headers: { "User-Agent": "QuizBytesDaily/1.0 (educational quiz content)" },
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) throw new Error(`Reddit ${res.status}`);
  const data = await res.json() as {
    data?: { children?: Array<{ data: { title: string; score: number; selftext?: string } }> };
  };

  const results: LiveTrendingTopic[] = [];
  for (const child of (data.data?.children ?? []).slice(0, 20)) {
    const { title, score } = child.data;
    if (score < 20 || !title) continue;
    const cleaned = cleanTitle(title);
    if (cleaned.length < 12) continue;
    if (!CATEGORY_RULES.some((r) => r.pattern.test(cleaned))) continue;
    const { category, icon } = detectCategory(cleaned);
    results.push({
      topic:      cleaned,
      category,
      icon,
      layout:     pickLayout(category, cleaned),
      difficulty: pickDifficulty(cleaned),
      source:     "reddit",
      score,
    });
  }
  return results.slice(0, 8);
}

// ── Source 5: Dev.to trending articles ────────────────────────────────────────
async function fetchDevTo(): Promise<LiveTrendingTopic[]> {
  // Fetch top articles from the last week across AI, Python, JS tags
  const [aiRes, pyRes, jsRes] = await Promise.all([
    fetch("https://dev.to/api/articles?tags=ai,machinelearning,llm&top=7&per_page=8", { next: { revalidate: 3600 } }),
    fetch("https://dev.to/api/articles?tags=python&top=7&per_page=6",                  { next: { revalidate: 3600 } }),
    fetch("https://dev.to/api/articles?tags=javascript,typescript&top=7&per_page=5",   { next: { revalidate: 3600 } }),
  ]);

  type DevToArticle = { title: string; tag_list: string[]; positive_reactions_count: number };
  const [aiArticles, pyArticles, jsArticles] = await Promise.all([
    aiRes.ok ? (aiRes.json() as Promise<DevToArticle[]>) : Promise.resolve([] as DevToArticle[]),
    pyRes.ok ? (pyRes.json() as Promise<DevToArticle[]>) : Promise.resolve([] as DevToArticle[]),
    jsRes.ok ? (jsRes.json() as Promise<DevToArticle[]>) : Promise.resolve([] as DevToArticle[]),
  ]);

  const all = [...aiArticles, ...pyArticles, ...jsArticles];
  const results: LiveTrendingTopic[] = [];
  for (const article of all) {
    if (!article.title || article.positive_reactions_count < 5) continue;
    const cleaned = cleanTitle(article.title);
    if (cleaned.length < 12) continue;
    const { category, icon } = detectCategory(`${cleaned} ${article.tag_list.join(" ")}`);
    results.push({
      topic:      cleaned,
      category,
      icon,
      layout:     pickLayout(category, cleaned),
      difficulty: pickDifficulty(cleaned),
      source:     "devto",
      score:      article.positive_reactions_count,
    });
  }
  return results.slice(0, 8);
}

// ── Source 6: Stack Overflow trending (hot questions, tech tags) ──────────────
async function fetchStackOverflow(): Promise<LiveTrendingTopic[]> {
  // No auth needed for this basic search
  const tags = "python;javascript;machine-learning;llm;ai;typescript";
  const res = await fetch(
    `https://api.stackexchange.com/2.3/questions?order=desc&sort=hot&tagged=${tags}&site=stackoverflow&pagesize=15&filter=default`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`SO ${res.status}`);
  const data = await res.json() as {
    items?: Array<{ title: string; score: number; tags: string[] }>;
  };

  const results: LiveTrendingTopic[] = [];
  for (const q of (data.items ?? []).slice(0, 12)) {
    if (!q.title || q.score < 3) continue;
    const cleaned = cleanTitle(q.title);
    if (cleaned.length < 12) continue;
    const { category, icon } = detectCategory(`${cleaned} ${q.tags.join(" ")}`);
    results.push({
      topic:      cleaned,
      category,
      icon,
      layout:     "code-example", // SO questions = code-focused
      difficulty: pickDifficulty(cleaned),
      source:     "stackoverflow",
    });
  }
  return results.slice(0, 6);
}

// ── Source 7: Product Hunt — new AI/dev tool launches (RSS) ──────────────────
async function fetchProductHunt(): Promise<LiveTrendingTopic[]> {
  const res = await fetch("https://www.producthunt.com/feed", {
    headers: { "User-Agent": "QuizBytesDaily/1.0 (educational quiz content)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`ProductHunt RSS ${res.status}`);
  const xml = await res.text();

  // Parse <title> from each <item>
  const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g)];
  const results: LiveTrendingTopic[] = [];

  for (const m of items.slice(0, 20)) {
    const raw = m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const cleaned = cleanTitle(raw);
    if (cleaned.length < 10) continue;
    if (!CATEGORY_RULES.some((r) => r.pattern.test(cleaned))) continue;
    const { category, icon } = detectCategory(cleaned);
    results.push({
      topic:      cleaned,
      category,
      icon,
      layout:     "quick-tips",   // product launches → "here's what it does" style
      difficulty: "Beginner",
      source:     "producthunt",
    });
  }
  return results.slice(0, 6);
}

// ── Source 8: Lobste.rs — tech link aggregator hottest (JSON API) ─────────────
async function fetchLobsters(): Promise<LiveTrendingTopic[]> {
  const res = await fetch("https://lobste.rs/hottest.json", {
    headers: { "User-Agent": "QuizBytesDaily/1.0 (educational quiz content)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Lobsters ${res.status}`);
  const data = await res.json() as Array<{
    title: string;
    score: number;
    tags: string[];
  }>;

  const results: LiveTrendingTopic[] = [];
  for (const item of data.slice(0, 25)) {
    if (!item.title || item.score < 3) continue;
    const text = `${item.title} ${item.tags.join(" ")}`;
    if (!CATEGORY_RULES.some((r) => r.pattern.test(text))) continue;
    const cleaned = cleanTitle(item.title);
    if (cleaned.length < 12) continue;
    const { category, icon } = detectCategory(text);
    results.push({
      topic:      cleaned,
      category,
      icon,
      layout:     pickLayout(category, cleaned),
      difficulty: pickDifficulty(cleaned),
      source:     "lobsters",
      score:      item.score,
    });
  }
  return results.slice(0, 6);
}

// ── Source 9: Hugging Face — trending open-source models (public API) ─────────
async function fetchHuggingFace(): Promise<LiveTrendingTopic[]> {
  const res = await fetch(
    "https://huggingface.co/api/models?sort=trending&direction=-1&limit=20",
    {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    }
  );
  if (!res.ok) throw new Error(`HuggingFace ${res.status}`);
  const models = await res.json() as Array<{
    id: string;
    tags?: string[];
    likes?: number;
    pipeline_tag?: string;
  }>;

  const results: LiveTrendingTopic[] = [];
  for (const model of models.slice(0, 15)) {
    if (!model.id) continue;
    const name = model.id.split("/").pop() ?? model.id;
    // "Llama-3.1-8B-Instruct" → "Llama 3.1 8B Instruct"
    const readable = name.replace(/[-_]/g, " ").replace(/\s{2,}/g, " ").trim();
    const pipelineLabel = model.pipeline_tag ?? "";
    const tags = (model.tags ?? []).slice(0, 6).join(" ");
    const text = `${readable} ${pipelineLabel} ${tags}`;

    // Only keep models that are tech-relevant (most HF models are)
    const isTechRelevant = CATEGORY_RULES.some((r) => r.pattern.test(text))
      || /llm|language.?model|transformer|diffusion|vision|speech|text.?gen|chat|instruct/i.test(text);
    if (!isTechRelevant) continue;

    const topic = pipelineLabel
      ? `${readable} (${pipelineLabel.replace(/-/g, " ")}): trending on Hugging Face`
      : `${readable}: trending open-source AI model`;

    results.push({
      topic:      topic.slice(0, 85),
      category:   "AI/ML",
      icon:       "🤗",
      layout:     "explainer",
      difficulty: "Intermediate",
      source:     "huggingface",
      score:      model.likes ?? 0,
    });
  }
  return results.slice(0, 5);
}

// ── Source 10: Papers With Code — latest ML papers (public API) ───────────────
async function fetchPapersWithCode(): Promise<LiveTrendingTopic[]> {
  const res = await fetch(
    "https://paperswithcode.com/api/v1/papers/?ordering=-date&items_per_page=12",
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`PapersWithCode ${res.status}`);
  const data = await res.json() as {
    results?: Array<{ title: string; abstract?: string }>;
  };

  return (data.results ?? [])
    .filter((p) => p.title && p.title.length > 15)
    .slice(0, 8)
    .map((paper) => ({
      topic:      cleanTitle(paper.title).slice(0, 70) + " (research)",
      category:   "AI/ML" as const,
      icon:       "📄",
      layout:     "explainer" as LayoutId,
      difficulty: "Advanced" as const,
      source:     "paperswithcode" as const,
    }));
}

// ── Source 11: TechCrunch — tech industry news (RSS) ─────────────────────────
async function fetchTechCrunch(): Promise<LiveTrendingTopic[]> {
  const res = await fetch("https://techcrunch.com/feed/", {
    headers: { "User-Agent": "QuizBytesDaily/1.0 (educational quiz content)" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`TechCrunch RSS ${res.status}`);
  const xml = await res.text();

  const items = [...xml.matchAll(/<item>[\s\S]*?<title>(.*?)<\/title>[\s\S]*?<\/item>/g)];
  const results: LiveTrendingTopic[] = [];

  for (const m of items.slice(0, 20)) {
    const raw = m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const cleaned = cleanTitle(raw);
    if (cleaned.length < 12) continue;
    // Only include items that match a known tech category
    if (!CATEGORY_RULES.some((r) => r.pattern.test(cleaned))) continue;
    const { category, icon } = detectCategory(cleaned);
    results.push({
      topic:      cleaned,
      category,
      icon,
      layout:     pickLayout(category, cleaned),
      difficulty: pickDifficulty(cleaned),
      source:     "techcrunch",
    });
  }
  return results.slice(0, 5);
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
  const [
    hn, github, arxiv, reddit, devto, stackoverflow,
    producthunt, lobsters, huggingface, paperswithcode, techcrunch,
  ] = await Promise.allSettled([
    fetchHN(),
    fetchGitHubTrending(),
    fetchArxiv(),
    fetchReddit(),
    fetchDevTo(),
    fetchStackOverflow(),
    fetchProductHunt(),
    fetchLobsters(),
    fetchHuggingFace(),
    fetchPapersWithCode(),
    fetchTechCrunch(),
  ]);

  const live: LiveTrendingTopic[] = [
    ...(hn.status            === "fulfilled" ? hn.value            : []),
    ...(github.status        === "fulfilled" ? github.value        : []),
    ...(arxiv.status         === "fulfilled" ? arxiv.value         : []),
    ...(reddit.status        === "fulfilled" ? reddit.value        : []),
    ...(devto.status         === "fulfilled" ? devto.value         : []),
    ...(stackoverflow.status === "fulfilled" ? stackoverflow.value : []),
    ...(producthunt.status   === "fulfilled" ? producthunt.value   : []),
    ...(lobsters.status      === "fulfilled" ? lobsters.value      : []),
    ...(huggingface.status   === "fulfilled" ? huggingface.value   : []),
    ...(paperswithcode.status=== "fulfilled" ? paperswithcode.value: []),
    ...(techcrunch.status    === "fulfilled" ? techcrunch.value    : []),
  ];

  const deduped = dedupe(live);
  if (deduped.length >= 4) return deduped.slice(0, 30);

  // Supplement with static if live sources are thin
  const combined = dedupe([...deduped, ...staticFallback()]);
  return combined.slice(0, 30);
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

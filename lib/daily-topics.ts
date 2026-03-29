// ── Daily topic rotation ───────────────────────────────────────────────────────
// Uses the day-of-year to rotate through topic lists deterministically.
// Each category has a curated list of topics and a default layout + difficulty.

import { TRENDING_TOPICS, type LayoutId } from "@/lib/quiz-generator";

// ── Layout display labels ─────────────────────────────────────────────────────
export const LAYOUT_LABELS: Record<string, string> = {
  "quiz-reveal":  "🧩 Quiz",
  "explainer":    "📖 Explainer",
  "code-example": "💻 Code Example",
  "quick-tips":   "⚡ Quick Tips",
};

// ── Hot suggestions shown after a Decline ─────────────────────────────────────
export interface HotSuggestion {
  idx: number;
  category: string;
  topic: string;
  layout: LayoutId;
  difficulty: string;
  icon: string;
  typeLabel: string; // e.g. "🧩 Quiz"
}

// Shown in Telegram after a Decline — hottest 2026 AI topics first
export const HOT_SUGGESTIONS: HotSuggestion[] = [
  { idx: 0, icon: "🤖", category: "AI/ML",         topic: "MCP: The USB-C for AI agents",              layout: "explainer",    difficulty: "Beginner",     typeLabel: "📖 Explainer"    },
  { idx: 1, icon: "🤖", category: "AI/ML",         topic: "Claude Sonnet 4.5 vs GPT-4o compared",      layout: "quiz-reveal",  difficulty: "Beginner",     typeLabel: "🧩 Quiz"         },
  { idx: 2, icon: "🤖", category: "AI/ML",         topic: "Gemini 2.5 Flash: Google's fastest model",  layout: "explainer",    difficulty: "Beginner",     typeLabel: "📖 Explainer"    },
  { idx: 3, icon: "🤖", category: "AI/ML",         topic: "Vibe coding with AI: How it works",         layout: "quick-tips",   difficulty: "Beginner",     typeLabel: "⚡ Quick Tips"   },
  { idx: 4, icon: "🤖", category: "AI/ML",         topic: "Llama 4 Scout vs Maverick by Meta",         layout: "quiz-reveal",  difficulty: "Beginner",     typeLabel: "🧩 Quiz"         },
  { idx: 5, icon: "🤖", category: "AI/ML",         topic: "RAG vs Fine-tuning: When to use which",     layout: "quiz-reveal",  difficulty: "Intermediate", typeLabel: "🧩 Quiz"         },
  { idx: 6, icon: "🐍", category: "Python",        topic: "UV package manager vs pip",                 layout: "code-example", difficulty: "Beginner",     typeLabel: "💻 Code Example" },
  { idx: 7, icon: "⚡", category: "JavaScript",    topic: "Vercel AI SDK streaming in Next.js",        layout: "code-example", difficulty: "Beginner",     typeLabel: "💻 Code Example" },
];

// ── Single daily topic picker ──────────────────────────────────────────────────
// Flat rotation across hot AI/tech topics — one per day, AI/ML weighted 50%.
// Daily rotation — AI/ML heavily weighted, hottest 2026 releases first
const DAILY_ROTATION: Omit<HotSuggestion, "idx">[] = [
  // 🔥 Hottest 2026 AI releases — leads the rotation
  { icon: "🤖", category: "AI/ML",         topic: "Model Context Protocol (MCP) explained",             layout: "explainer",    difficulty: "Beginner",     typeLabel: "📖 Explainer"    },
  { icon: "🤖", category: "AI/ML",         topic: "Claude Sonnet 4.5 vs GPT-4o: Which is better?",     layout: "quiz-reveal",  difficulty: "Beginner",     typeLabel: "🧩 Quiz"         },
  { icon: "🐍", category: "Python",        topic: "UV package manager: Faster than pip",                layout: "code-example", difficulty: "Beginner",     typeLabel: "💻 Code Example" },
  { icon: "🤖", category: "AI/ML",         topic: "Gemini 2.5 Flash: Google's fastest model explained", layout: "explainer",    difficulty: "Beginner",     typeLabel: "📖 Explainer"    },
  { icon: "🤖", category: "AI/ML",         topic: "Vibe coding with AI: How it actually works",         layout: "quick-tips",   difficulty: "Beginner",     typeLabel: "⚡ Quick Tips"   },
  { icon: "🏗", category: "System Design", topic: "Rate limiting algorithms",                           layout: "quiz-reveal",  difficulty: "Intermediate", typeLabel: "🧩 Quiz"         },
  { icon: "🤖", category: "AI/ML",         topic: "Llama 4 Scout vs Maverick: Meta's open models",     layout: "quiz-reveal",  difficulty: "Beginner",     typeLabel: "🧩 Quiz"         },
  { icon: "⚡", category: "JavaScript",    topic: "Vercel AI SDK: Streaming AI responses in Next.js",  layout: "code-example", difficulty: "Beginner",     typeLabel: "💻 Code Example" },
  { icon: "🤖", category: "AI/ML",         topic: "Claude Code vs Cursor vs Copilot compared",         layout: "quiz-reveal",  difficulty: "Beginner",     typeLabel: "🧩 Quiz"         },
  { icon: "🐍", category: "Python",        topic: "Pydantic AI: Type-safe AI agents",                  layout: "code-example", difficulty: "Intermediate", typeLabel: "💻 Code Example" },
  { icon: "🤖", category: "AI/ML",         topic: "LangGraph: Build AI agent workflows",               layout: "explainer",    difficulty: "Intermediate", typeLabel: "📖 Explainer"    },
  { icon: "🧮", category: "Algorithms",    topic: "Two-pointer technique",                             layout: "code-example", difficulty: "Beginner",     typeLabel: "💻 Code Example" },
  { icon: "🤖", category: "AI/ML",         topic: "RAG vs Fine-tuning: When to use which",             layout: "quiz-reveal",  difficulty: "Intermediate", typeLabel: "🧩 Quiz"         },
  { icon: "🚀", category: "DevOps",        topic: "Docker multi-stage builds",                         layout: "quick-tips",   difficulty: "Beginner",     typeLabel: "⚡ Quick Tips"   },
  { icon: "🤖", category: "AI/ML",         topic: "OpenAI Agents SDK: Build AI agents in Python",      layout: "code-example", difficulty: "Intermediate", typeLabel: "💻 Code Example" },
  { icon: "🐍", category: "Python",        topic: "Dataclasses vs Pydantic models",                    layout: "code-example", difficulty: "Intermediate", typeLabel: "💻 Code Example" },
  { icon: "🤖", category: "AI/ML",         topic: "Mixture of Experts architecture",                   layout: "explainer",    difficulty: "Intermediate", typeLabel: "📖 Explainer"    },
  { icon: "⚡", category: "JavaScript",    topic: "React server components deep dive",                  layout: "explainer",    difficulty: "Beginner",     typeLabel: "📖 Explainer"    },
  { icon: "🤖", category: "AI/ML",         topic: "Function calling in LLMs: How it works",            layout: "code-example", difficulty: "Intermediate", typeLabel: "💻 Code Example" },
  { icon: "🏗", category: "System Design", topic: "Event-driven architecture",                         layout: "explainer",    difficulty: "Intermediate", typeLabel: "📖 Explainer"    },
  { icon: "🤖", category: "AI/ML",         topic: "Ollama: Run LLMs locally for free",                 layout: "quick-tips",   difficulty: "Beginner",     typeLabel: "⚡ Quick Tips"   },
  { icon: "🧮", category: "Algorithms",    topic: "Sliding window pattern",                            layout: "code-example", difficulty: "Beginner",     typeLabel: "💻 Code Example" },
  { icon: "🤖", category: "AI/ML",         topic: "CrewAI: Multi-agent orchestration explained",       layout: "explainer",    difficulty: "Intermediate", typeLabel: "📖 Explainer"    },
  { icon: "🐍", category: "Python",        topic: "asyncio.gather vs asyncio.wait",                    layout: "code-example", difficulty: "Intermediate", typeLabel: "💻 Code Example" },
  { icon: "🤖", category: "AI/ML",         topic: "DeepSeek R2: New reasoning model explained",        layout: "quiz-reveal",  difficulty: "Beginner",     typeLabel: "🧩 Quiz"         },
  { icon: "🧮", category: "Algorithms",    topic: "Dynamic programming tabulation",                    layout: "quiz-reveal",  difficulty: "Intermediate", typeLabel: "🧩 Quiz"         },
  { icon: "🤖", category: "AI/ML",         topic: "Embedding models and semantic search",              layout: "explainer",    difficulty: "Beginner",     typeLabel: "📖 Explainer"    },
  { icon: "🐍", category: "Python",        topic: "FastAPI dependency injection",                      layout: "code-example", difficulty: "Intermediate", typeLabel: "💻 Code Example" },
];

export function getOneDailyTopic(date?: Date): Omit<HotSuggestion, "idx"> {
  const d = date ?? new Date();
  const day = dayOfYear(d);
  return DAILY_ROTATION[day % DAILY_ROTATION.length];
}

export interface DailyTopic {
  category: string;
  topic: string;
  layout: LayoutId;
  difficulty: string;
  icon: string;
  uploadHourUtc: number; // which UTC hour to upload this video
}

// Category schedule — one per category with default layout, difficulty, upload time
const CATEGORY_SCHEDULE: {
  category: string;
  layout: LayoutId;
  difficulty: string;
  icon: string;
  uploadHourUtc: number;
}[] = [
  { category: "AI/ML",         layout: "quiz-reveal",  difficulty: "Intermediate", icon: "🤖", uploadHourUtc: 9  },
  { category: "Python",        layout: "code-example", difficulty: "Beginner",     icon: "🐍", uploadHourUtc: 10 },
  { category: "Algorithms",    layout: "quiz-reveal",  difficulty: "Intermediate", icon: "🧮", uploadHourUtc: 11 },
  { category: "JavaScript",    layout: "code-example", difficulty: "Beginner",     icon: "⚡", uploadHourUtc: 12 },
  { category: "System Design", layout: "explainer",    difficulty: "Advanced",     icon: "🏗",  uploadHourUtc: 13 },
  { category: "DevOps",        layout: "quick-tips",   difficulty: "Intermediate", icon: "🚀", uploadHourUtc: 14 },
];

// Extended topic lists per category (cycles every N topics)
const EXTENDED_TOPICS: Record<string, string[]> = {
  ...TRENDING_TOPICS,
  "AI/ML": [
    "Context window limits in LLMs",
    "Mixture of Experts architecture",
    "RAG vs Fine-tuning: When to use which",
    "Prompt caching strategies for cost reduction",
    "Vision language models explained",
    "AI agents vs chatbots: Key differences",
    "Embedding models and semantic search",
    "Vector databases: How they work",
    "Chain-of-thought prompting techniques",
    "Quantization: Making LLMs run faster",
    "Function calling in LLMs",
    "Structured outputs from AI models",
    "Retrieval Augmented Generation (RAG)",
    "Transformer attention mechanism",
    "Model context protocol (MCP) explained",
    "AI hallucination: Causes and fixes",
  ],
  "Python": [
    "Python type hints in 2026",
    "Async generators explained",
    "Dataclasses vs Pydantic models",
    "UV package manager: Faster than pip",
    "Python 3.13 GIL removal impact",
    "Polars vs Pandas: Speed comparison",
    "FastAPI dependency injection",
    "Ruff: Python's fastest linter",
    "Context managers and __enter__/__exit__",
    "Python decorators with arguments",
    "Generator expressions vs list comprehensions",
    "Walrus operator (:=) use cases",
    "match-case statement patterns",
    "functools.cache vs functools.lru_cache",
    "Pydantic v2 validation techniques",
    "asyncio.gather vs asyncio.wait",
  ],
  "Algorithms": [
    "Two-pointer technique",
    "Sliding window pattern",
    "Binary search variants",
    "Graph BFS vs DFS",
    "Dynamic programming tabulation",
    "Heap operations explained",
    "Trie data structure",
    "Union-Find (Disjoint Set)",
    "Backtracking template",
    "Monotonic stack pattern",
    "Kadane's algorithm",
    "Floyd's cycle detection",
    "Topological sort",
    "Segment tree basics",
    "Bit manipulation tricks",
    "Prefix sum technique",
  ],
  "System Design": [
    "Event-driven architecture",
    "CQRS pattern explained",
    "Database sharding strategies",
    "Rate limiting algorithms",
    "Consistent hashing",
    "CAP theorem in practice",
    "Circuit breaker pattern",
    "API gateway design",
    "Message queues vs event streams",
    "Read replicas and write scaling",
    "Saga pattern for distributed transactions",
    "Service mesh explained",
    "Blue-green deployments",
    "Feature flags in production",
    "Idempotency in API design",
    "WebSockets vs Server-Sent Events",
  ],
  "JavaScript": [
    "JS Temporal API explained",
    "React server components deep dive",
    "Web Workers for CPU tasks",
    "ES2025 features overview",
    "Signals in JavaScript frameworks",
    "Bun vs Node.js: Benchmarks",
    "Fetch streaming with ReadableStream",
    "TypeScript 5 decorators",
    "JavaScript WeakRef and FinalizationRegistry",
    "Promise.withResolvers() explained",
    "Array groupBy method",
    "Proxy objects and meta-programming",
    "Module federation in webpack",
    "AbortController for fetch",
    "JavaScript Intl API for i18n",
    "Error cause chaining",
  ],
  "DevOps": [
    "Docker multi-stage builds",
    "Kubernetes HPA explained",
    "GitHub Actions caching strategies",
    "Terraform state management",
    "OpenTelemetry distributed tracing",
    "Argo CD GitOps workflow",
    "Helm chart best practices",
    "Container security scanning",
    "Kubernetes resource limits",
    "Docker Compose for local dev",
    "GitHub Actions reusable workflows",
    "OTEL metrics vs Prometheus",
    "Kubernetes rolling updates",
    "Secrets management with Vault",
    "CI/CD pipeline optimization",
    "Container image layer caching",
  ],
};

// Compute day-of-year (0-indexed) for deterministic rotation
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

// Get the upload datetime (UTC) for a given date + hour
function uploadDatetimeUtc(date: Date, hourUtc: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 1); // next day
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

// ── Main export: get today's topic plan for tomorrow's uploads ────────────────
export function getDailyTopics(date?: Date): DailyTopic[] {
  const d = date ?? new Date();
  const day = dayOfYear(d);

  return CATEGORY_SCHEDULE.map((cfg) => {
    const topics = EXTENDED_TOPICS[cfg.category] ?? TRENDING_TOPICS[cfg.category] ?? [];
    const topic = topics.length > 0 ? topics[day % topics.length] : `${cfg.category} fundamentals`;
    return {
      category: cfg.category,
      topic,
      layout: cfg.layout,
      difficulty: cfg.difficulty,
      icon: cfg.icon,
      uploadHourUtc: cfg.uploadHourUtc,
    };
  });
}

// Get the scheduled_at datetime string for a given upload slot
export function getScheduledAt(date: Date, hourUtc: number): string {
  return uploadDatetimeUtc(date, hourUtc);
}

// Format hour for display (e.g. 9 → "9:00 AM", 13 → "1:00 PM")
export function fmtHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

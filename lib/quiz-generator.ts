import Groq from "groq-sdk";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GeneratedSlide {
  template: string;
  data: Record<string, unknown>;
}

export interface GeneratedSeries {
  slug: string;
  title: string;
  topic: string;
  category: string;
  difficulty: string;
  slides: GeneratedSlide[];
}

// ── Layout catalogue ──────────────────────────────────────────────────────────

export const LAYOUTS = [
  {
    id: "quiz-reveal",
    name: "Quiz Reveal",
    icon: "🎯",
    desc: "Concept intro + deep dive + quiz question + answer reveal",
    slides: 10,
    color: "#a855f7",
  },
  {
    id: "explainer",
    name: "Explainer",
    icon: "📚",
    desc: "Educational deep-dive — pure learning, no quiz",
    slides: 9,
    color: "#22d3ee",
  },
  {
    id: "code-example",
    name: "Code Example",
    icon: "💻",
    desc: "Code snippet walkthrough with real-world examples",
    slides: 9,
    color: "#4ade80",
  },
  {
    id: "quick-tips",
    name: "Quick Tips",
    icon: "⚡",
    desc: "Punchy, actionable tips or facts on the topic",
    slides: 8,
    color: "#fbbf24",
  },
  {
    id: "cheat-sheet",
    name: "Cheat Sheet",
    icon: "📋",
    desc: "Dense numbered grid — N key things on one slide",
    slides: 3,
    color: "#22d3ee",
  },
] as const;

export type LayoutId = (typeof LAYOUTS)[number]["id"];

// ── Trending topic seeds (used to pre-populate the generate form) ─────────────

export const TRENDING_TOPICS: Record<string, string[]> = {

  // ─── AI/ML — models, tools, frameworks ────────────────────────────────────
  "AI/ML": [
    // 🔥 Model comparisons (highest search volume 2026)
    "Claude Opus 4.6 vs GPT-4.5: Which wins in 2026?",
    "Claude Sonnet 4.5 vs GPT-4o: Head-to-head comparison",
    "When to use Codex vs ChatGPT for code generation",
    "ChatGPT vs Claude: Which is better for coding?",
    "GPT-4o vs Gemini 2.5 Pro: Real-world test results",
    "Claude vs GPT-4: 10 tasks, one winner",
    "How to save 80% on Claude API costs — practical guide",
    "Claude Haiku vs Sonnet vs Opus: Pick the right model",
    "OpenAI model versions explained: gpt-3.5 vs gpt-4 vs o1",
    "Gemini 2.5 Flash: Google's fastest model explained",
    "Llama 4 Scout and Maverick: Meta's open models",
    "DeepSeek R2: China's reasoning model breakdown",
    "OpenAI o3 vs o4-mini: When to use each",
    // 🤖 AI agents & orchestration
    "How AI agents work: planning, memory, tools explained",
    "Sub-agents in AI: What they are and how they communicate",
    "Agent status tracking: How to monitor running agents",
    "Model Context Protocol (MCP): The USB-C for AI agents",
    "LangGraph for stateful AI agent workflows",
    "CrewAI: Multi-agent orchestration in Python",
    "OpenAI Agents SDK: Build AI agents in Python",
    "Pydantic AI: Type-safe AI agents explained",
    "AutoGen 0.4: Microsoft's async agent framework",
    // 💡 Core evergreen concepts
    "RAG vs Fine-tuning: When to use which in 2026",
    "Mixture of Experts: How GPT-4 and Mixtral scale",
    "Prompt caching: Cut your AI costs by 90%",
    "Function calling in LLMs: The agent backbone",
    "Structured outputs: Get reliable JSON from any LLM",
    "Agentic loops: Reflection, planning, and tool use",
  ],

  // ─── AI Evaluation — RAGAS, DeepEval, observability ───────────────────────
  "AI Evaluation": [
    // 🔥 Must-know eval tools (hot in 2026)
    "RAGAS: Evaluate your RAG pipeline automatically",
    "DeepEval: Unit testing for LLM applications",
    "PromptFoo: Open-source LLM prompt testing",
    "Braintrust: Eval + tracing for production AI",
    "Langfuse: Open-source LLM observability explained",
    "LangSmith: Trace and evaluate LangChain apps",
    "Arize Phoenix: Visual LLM debugging and evals",
    "TruLens: RAG evaluation with TruEra",
    // 🧠 Hallucination & error handling
    "Hallucination in LLMs: Why it happens and how to fix it",
    "How to detect AI hallucinations before they reach users",
    "Grounding techniques: Stop your LLM from making things up",
    "Error handling patterns for AI agents in production",
    "Retry and fallback strategies for flaky LLM calls",
    "Graceful degradation in AI-powered apps",
    "AI agent error recovery: Retry vs rethink vs escalate",
    "Guardrails AI: Input/output validation for LLMs",
    "NeMo Guardrails: Safe dialogue management",
    // 📊 Evaluation concepts
    "RAG evaluation metrics: Faithfulness, relevance, recall",
    "LLM-as-judge: Use GPT-4 to evaluate GPT-4",
    "Benchmark your LLM: MMLU, HellaSwag, HumanEval",
    "A/B testing prompts in production",
    "Red-teaming your AI: Safety evaluation basics",
    "Sub-agent tracing: Track what each agent actually did",
  ],

  // ─── AI Engineering — Vector DBs, RAG, production LLM ────────────────────
  "AI Engineering": [
    // 🗄️ Vector databases: dev vs production
    "Vector DB for dev: Chroma vs FAISS vs LanceDB",
    "Vector DB for production: Pinecone vs Weaviate vs Qdrant",
    "pgvector: Add vector search to your Postgres DB",
    "Milvus vs Qdrant: Which vector DB scales better?",
    "Chroma vs Pinecone: When to switch to managed DB",
    "Hybrid search: BM25 + vector embeddings combined",
    "Vector DB chunking strategies that actually work",
    "Approximate nearest neighbor (ANN) search explained",
    // 🚀 Advanced RAG patterns
    "Advanced RAG: From naive to production-grade",
    "Reranking with Cohere or cross-encoders in RAG",
    "HyDE: Hypothetical Document Embeddings for better recall",
    "Parent-child chunking for smarter RAG retrieval",
    "Query expansion and decomposition in RAG",
    "Multi-vector retrieval: ColBERT and late interaction",
    "Graph RAG: Microsoft's knowledge graph retrieval",
    "Self-RAG: LLM decides when to retrieve",
    // ⚡ LLM in production
    "vLLM: Serve LLMs 24x faster in production",
    "Quantization: INT4 vs INT8 vs FP16 tradeoffs",
    "LLM gateway: Rate limiting, caching, and routing",
    "Token budgeting: Control LLM costs at scale",
    "Streaming responses in production AI apps",
    "Prompt versioning and management in production",
  ],

  // ─── Python ────────────────────────────────────────────────────────────────
  "Python": [
    "UV package manager: 10x faster than pip",
    "Python 3.13 GIL removal: What actually changes",
    "Pydantic v2: 5x faster validation in pure Rust",
    "Async generators for streaming AI responses",
    "Dataclasses vs Pydantic vs attrs: Which to choose",
    "Polars vs Pandas: 10x faster dataframes",
    "FastAPI async dependency injection deep-dive",
    "Ruff: Replace flake8 + isort + pylint in one tool",
    "Python __slots__ and memory optimization",
    "httpx vs requests for async HTTP in Python",
    "Typer: Build CLI tools with type hints",
    "Python protocols vs ABCs: Structural subtyping",
  ],

  // ─── Algorithms ────────────────────────────────────────────────────────────
  "Algorithms": [
    "Two-pointer technique: When and how to use it",
    "Sliding window: Fixed vs dynamic window patterns",
    "Binary search on answer space (not just arrays)",
    "Graph BFS vs DFS: Choosing the right traversal",
    "Dynamic programming: Tabulation vs memoization",
    "Heap and priority queue patterns",
    "Trie data structure for prefix search",
    "Union-Find (Disjoint Set Union) explained",
    "Monotonic stack: Next greater element patterns",
    "Backtracking template for combinations and subsets",
    "KMP algorithm for string pattern matching",
    "Topological sort: Course schedule pattern",
  ],

  // ─── System Design ─────────────────────────────────────────────────────────
  "System Design": [
    "Event-driven architecture with Kafka",
    "CQRS + event sourcing pattern explained",
    "Database sharding: Range vs hash vs directory",
    "Rate limiting: Token bucket vs sliding window",
    "Consistent hashing for distributed caches",
    "CAP theorem: Choosing CP vs AP systems",
    "Circuit breaker pattern in microservices",
    "API gateway vs service mesh (Istio/Envoy)",
    "Distributed tracing with OpenTelemetry",
    "Designing an LLM-powered search system",
    "Multi-tenant SaaS database strategies",
    "LLM system design: Cost, latency, reliability",
  ],

  // ─── JavaScript ────────────────────────────────────────────────────────────
  "JavaScript": [
    "React 19 new features: useActionState and more",
    "React server components vs client components",
    "Next.js 15 caching model explained",
    "Bun 1.x vs Node.js: Real benchmark comparison",
    "Signals vs useState: Reactivity models compared",
    "ES2025: Top new JavaScript features",
    "Web Workers: Run AI inference in the browser",
    "TypeScript 5.x decorators and metadata",
    "Vercel AI SDK useChat and streaming patterns",
    "tRPC: Type-safe APIs without code generation",
    "Zod vs Valibot: TypeScript schema validation",
    "Vite vs Turbopack: Build tool showdown 2026",
  ],

  // ─── AI Productivity — MCP, Claude workflows, automation ─────────────────
  "AI Productivity": [
    // 🔧 MCP tooling
    "MCP: Connect Claude to your tools in minutes",
    "Build a custom MCP server from scratch",
    "MCP filesystem server: Let AI access your files safely",
    "MCP GitHub server: AI-powered code review automation",
    "MCP for databases: Query Postgres with natural language",
    "Best MCP servers for developers in 2026",
    // 🤖 Claude workflows
    "Claude.ai Projects: Organize your AI workflows",
    "Claude Pro vs Free: What's actually different?",
    "Claude system prompts: Custom instructions that save hours",
    "Claude Code vs Cursor vs GitHub Copilot: Which wins?",
    "Automate code reviews with Claude",
    "Claude for technical documentation: 10x faster writing",
    // 💰 AI cost optimisation (trending search 2026)
    "How to save 80% on Claude API costs",
    "Claude Haiku: When cheaper is actually better",
    "Prompt caching with Claude: Pay once, reuse forever",
    "Batch API vs real-time: Save 50% on background tasks",
    "Token budgeting: Control LLM spend at scale",
    "Router pattern: Use cheap models for simple tasks",
    // ⚡ Task automation
    "Automate your daily standups with AI",
    "Automate PR descriptions with Claude",
    "AI-powered email triage: Zero inbox in 10 minutes",
    "Writing prompts that work for recurring tasks",
    "Claude + Notion: Build your AI-powered second brain",
    "Claude Code: Turn your terminal into an AI dev pair",
  ],

  // ─── DevOps ────────────────────────────────────────────────────────────────
  "DevOps": [
    "Docker multi-stage builds for smaller images",
    "Kubernetes HPA: Auto-scale on CPU and custom metrics",
    "GitHub Actions: Matrix builds and caching tricks",
    "Terraform vs OpenTofu: State of IaC in 2026",
    "OpenTelemetry: Traces, metrics, logs unified",
    "Argo CD: GitOps for Kubernetes deployments",
    "Helm 3 chart best practices",
    "Trivy: Container and IaC security scanning",
    "Dagger: Write your CI/CD in Python or Go",
    "Pulumi vs Terraform: Typed IaC comparison",
    "K3s vs K8s: Lightweight Kubernetes for AI workloads",
    "GPU cluster setup for LLM inference",
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function parseJson(text: string): { title: string; slides: GeneratedSlide[] } {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  return JSON.parse(cleaned);
}

function difficultyNote(d: string) {
  return d === "Beginner"
    ? "clear simple language, no jargon"
    : d === "Intermediate"
    ? "assume basic knowledge, use proper terms"
    : "assume solid knowledge, go deep";
}

// ── Prompt: Quiz Reveal (8–12 slides — dynamic) ───────────────────────────────
function buildQuizRevealPrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);

  return `Create an educational ${category} quiz series about: "${topic}"
(If the topic contains typos or is phrased as a question/sentence, interpret the intent as a clean tech topic title and use that normalized form in the "title" field and throughout the content.)
Difficulty: ${difficulty} (${diffNote})

CONTENT QUALITY (apply to every body field):
- Include SPECIFIC details: exact names, numbers, percentages, APIs, error types, or real companies/tools
- Bad: "helps with performance" → Good: "cuts cold-start latency by ~60% vs classic loaders"
- Bad: "stores data" → Good: "persists key-value pairs in RAM; evicts LRU when maxmemory hit"
- Card bodies should read like a crisp senior-engineer explanation, not a textbook definition

DECIDE HOW MANY SLIDES to generate based on topic depth:
- 6 slides: simple/focused topics with one clear concept
- 7–8 slides: moderate depth with multiple aspects worth covering
- 9–10 slides: complex/multi-faceted topics that need deeper explanation

Set "totalSlides" to the actual count you generate (between 6 and 10).
IMPORTANT: slideNum must go 1, 2, 3 … totalSlides without gaps or repeats.

REQUIRED SLIDE ORDER (always include these):
1. Introduction — definition + 3 key aspects
2. How It Works — step-by-step pipeline
3. Why It Matters — benefits + real use cases
[INSERT 1–5 optional deep-dive slides here for complex topics]
N-1. Quick Quiz! — one meaningful knowledge-testing question
N. Answer — correct answer + 3 reinforcing takeaways

OPTIONAL SLIDES to insert between slide 3 and Quick Quiz (include based on topic depth):
- "Key Concepts" — core terminology and distinctions (definition-steps)
- "Advanced Details" — inner workings, technical depth (definition-steps)
- "Real-World Scenario" — concrete production example (definition-steps or pipeline)
- "Common Pitfalls" — mistakes and how to avoid them (definition-steps)
- "Comparison" — vs alternatives or similar tools (definition-steps)
- "Architecture / Data Flow" — system diagram with connected steps (flowchart) — USE for topics that have a clear pipeline: RAG, transformers, CI/CD, microservices, OAuth, etc.
- "Code Check!" — a code-based quiz question (code-quiz) — USE for coding topics (Python, JS, algorithms, data structures). Show a real, runnable code snippet and ask "What does this output?", "What's the bug?", or "What is the time complexity?". The code must be short (4–10 lines), use only standard library, and have one clearly correct answer.

QUIZ QUESTION UPGRADE RULE:
- For coding topics (Python, JavaScript, TypeScript, algorithms, data structures, async programming, etc.):
  * REPLACE the standard "definition-steps" quiz question with a "code-quiz" slide.
  * Also ADD a "Code Check!" optional slide BEFORE the main quiz when the topic has ≥8 slides.
  * This gives viewers a deeper, hands-on challenge instead of a text-only question.

Return ONLY raw JSON — no markdown fences, no extra text.
Copy and expand this structure for "${topic}":

{
  "title": "Series title — punchy, max 8 words",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "What is ${topic}?",
      "slideNum": 1,
      "totalSlides": 10,
      "definition": {
        "color": "cyan",
        "title": "Core concept name (max 6 words)",
        "body": "What it is and why it exists — 2 sentences (max 280 chars)"
      },
      "cards": [
        { "color": "cyan",   "icon": "search", "title": "Key aspect 1 (max 22 chars)", "body": "Clear explanation with context (max 100 chars)" },
        { "color": "purple", "icon": "gear",   "title": "Key aspect 2 (max 22 chars)", "body": "Clear explanation with context (max 100 chars)" },
        { "color": "green",  "icon": "check",  "title": "Key aspect 3 (max 22 chars)", "body": "Clear explanation with context (max 100 chars)" }
      ]
    },
    {
      "template": "pipeline",
      "heading": "How ${topic} Works",
      "subtitle": "Step-by-step flow",
      "slideNum": 2,
      "totalSlides": 10,
      "cards": [
        { "color": "cyan",   "icon": "code",     "title": "Step 1 (max 22 chars)", "body": "What happens here — be specific (max 90 chars)" },
        { "color": "purple", "icon": "gear",     "title": "Step 2 (max 22 chars)", "body": "What happens here — be specific (max 90 chars)" },
        { "color": "green",  "icon": "database", "title": "Step 3 (max 22 chars)", "body": "What happens here — be specific (max 90 chars)" },
        { "color": "pink",   "icon": "robot",    "title": "Step 4 (max 22 chars)", "body": "What happens here — be specific (max 90 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Why It Matters",
      "slideNum": 3,
      "totalSlides": 10,
      "definition": {
        "color": "purple",
        "title": "Real-world benefit (max 7 words)",
        "body": "Why engineers and developers actually use this in production (max 280 chars)"
      },
      "cards": [
        { "color": "cyan",   "icon": "lightning", "title": "Use case 1 (max 22 chars)", "body": "Real scenario with specifics (max 100 chars)" },
        { "color": "purple", "icon": "layers",    "title": "Use case 2 (max 22 chars)", "body": "Real scenario with specifics (max 100 chars)" },
        { "color": "green",  "icon": "check",     "title": "Use case 3 (max 22 chars)", "body": "Real scenario with specifics (max 100 chars)" }
      ]
    },
    {
      "template": "flowchart",
      "heading": "Architecture / Data Flow",
      "slideNum": 4,
      "totalSlides": 10,
      "nodes": [
        { "color": "cyan",   "title": "Component / Step 1 (max 22 chars)", "body": "What it does — 1 sentence (max 80 chars)" },
        { "color": "purple", "title": "Component / Step 2 (max 22 chars)", "body": "What it does — 1 sentence (max 80 chars)" },
        { "color": "green",  "title": "Component / Step 3 (max 22 chars)", "body": "What it does — 1 sentence (max 80 chars)" },
        { "color": "amber",  "title": "Component / Step 4 (max 22 chars)", "body": "What it does — 1 sentence (max 80 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Key Concepts",
      "slideNum": 5,
      "totalSlides": 10,
      "definition": {
        "color": "amber",
        "title": "Most important technical detail (max 7 words)",
        "body": "The key insight every developer must understand about this topic (max 280 chars)"
      },
      "cards": [
        { "color": "cyan",   "icon": "brain",    "title": "Concept 1 (max 22 chars)",  "body": "Clear technical explanation (max 100 chars)" },
        { "color": "purple", "icon": "layers",   "title": "Concept 2 (max 22 chars)",  "body": "Clear technical explanation (max 100 chars)" },
        { "color": "green",  "icon": "code",     "title": "Concept 3 (max 22 chars)",  "body": "Clear technical explanation (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Common Pitfalls",
      "slideNum": 5,
      "totalSlides": 10,
      "definition": {
        "color": "pink",
        "title": "The #1 mistake developers make (max 7 words)",
        "body": "What trips most people up when first using this — and why (max 280 chars)"
      },
      "cards": [
        { "color": "pink",   "icon": "warning", "title": "Mistake (max 22 chars)",      "body": "What most people do wrong (max 100 chars)" },
        { "color": "cyan",   "icon": "check",   "title": "Better approach (max 22 chars)", "body": "The correct pattern to follow (max 100 chars)" },
        { "color": "green",  "icon": "lightning","title": "Pro tip (max 22 chars)",       "body": "Expert-level time-saving insight (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Advanced Details",
      "slideNum": 6,
      "totalSlides": 10,
      "definition": {
        "color": "cyan",
        "title": "Under the hood — what really happens (max 7 words)",
        "body": "The technical depth that separates beginners from experts on this topic (max 280 chars)"
      },
      "cards": [
        { "color": "cyan",   "icon": "gear",     "title": "Detail 1 (max 22 chars)", "body": "Technical specifics (max 100 chars)" },
        { "color": "purple", "icon": "database", "title": "Detail 2 (max 22 chars)", "body": "Technical specifics (max 100 chars)" },
        { "color": "green",  "icon": "code",     "title": "Detail 3 (max 22 chars)", "body": "Technical specifics (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Quick Quiz! 🎯",
      "slideNum": 7,
      "totalSlides": 8,
      "definition": {
        "color": "amber",
        "title": "Write a real knowledge-testing question here?",
        "body": "Pick the best answer ↓"
      },
      "cards": [
        { "color": "cyan",   "icon": "opt_a", "title": "Option A text (max 36 chars)", "body": " " },
        { "color": "purple", "icon": "opt_b", "title": "Option B text (max 36 chars)", "body": " " },
        { "color": "green",  "icon": "opt_c", "title": "Option C text (max 36 chars)", "body": " " },
        { "color": "pink",   "icon": "opt_d", "title": "Option D text (max 36 chars)", "body": " " }
      ]
    },
    {
      "_comment": "USE THIS TEMPLATE instead of definition-steps quiz for code-based topics. Replace the quiz slide above with this.",
      "template": "code-quiz",
      "heading": "Code Check! 💻",
      "slideNum": 7,
      "totalSlides": 8,
      "language": "python",
      "code": "def mystery(n):\n    if n <= 1:\n        return n\n    return mystery(n-1) + mystery(n-2)\n\nprint(mystery(6))",
      "question": "What does this code print?",
      "cards": [
        { "color": "cyan",   "icon": "opt_a", "title": "5", "body": " " },
        { "color": "purple", "icon": "opt_b", "title": "8", "body": " " },
        { "color": "green",  "icon": "opt_c", "title": "13", "body": " " },
        { "color": "pink",   "icon": "opt_d", "title": "RecursionError", "body": " " }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Answer ✅",
      "slideNum": 8,
      "totalSlides": 8,
      "definition": {
        "color": "green",
        "title": "X)  Correct answer text here",
        "body": "Why this is correct — and what the key insight is (max 280 chars)"
      },
      "cards": [
        { "color": "green",  "icon": "check", "title": "Key takeaway 1 (max 24 chars)", "body": "Reinforcing fact with detail (max 100 chars)" },
        { "color": "cyan",   "icon": "check", "title": "Key takeaway 2 (max 24 chars)", "body": "Reinforcing fact with detail (max 100 chars)" },
        { "color": "purple", "icon": "check", "title": "Key takeaway 3 (max 24 chars)", "body": "Reinforcing fact with detail (max 100 chars)" }
      ]
    }
  ]
}

STRICT RULES:
- Decide totalSlides (6–10) based on topic complexity. Set it consistently on every slide.
- slideNum MUST be sequential: 1, 2, 3, … totalSlides — no gaps, no repeats
- For simpler topics: omit slides 4 and/or 6 (Key Concepts, Advanced Details). Adjust all slideNum/totalSlides accordingly.
- For complex topics: keep all optional slides or add extra ones (Comparison, Real-World Scenario)
- Quiz Question: definition.title IS the question (end with ?), definition.body = "Pick the best answer ↓"
  — cards MUST use icons opt_a, opt_b, opt_c, opt_d — body MUST be a single space " "
  — exactly one option should be clearly correct
- Answer slide: definition.title MUST start with the correct letter: "A)  " or "B)  " or "C)  " or "D)  "
  — cards: 3 reinforcing takeaways with "check" icon in green/cyan/purple
- code-quiz slide rules:
  — template MUST be "code-quiz", heading "Code Check! 💻", heading "Quick Quiz! 🎯" comes AFTER it
  — code field: actual runnable code, max 10 lines, use \\n for line breaks in JSON
  — language field: "python", "javascript", "typescript", "go", "sql", or similar
  — question field: "What does this code output?", "What is the bug?", "What is the time complexity?", etc.
  — cards: 4 options with icons opt_a..opt_d; exactly one clearly correct; body MUST be a single space " "
  — options should be short and specific (actual values, error names, or O() notation)
  — DO NOT include "A) " prefix in card titles — the letter badge is rendered automatically
- colors MUST be one of: "cyan", "purple", "green", "pink", "amber"
- icons MUST be one of: "search", "gear", "database", "book", "brain", "robot", "plus", "lock", "lightning", "check", "warning", "clock", "code", "layers", "opt_a", "opt_b", "opt_c", "opt_d"
- Return ONLY raw JSON`;
}

// ── Prompt: Explainer (7–10 slides — dynamic) ─────────────────────────────────
function buildExplainerPrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);
  return `Create an educational ${category} explainer series about: "${topic}"
(If the topic contains typos or is phrased as a question/sentence, interpret the intent as a clean tech topic title and use that normalized form in the "title" field and throughout the content.)
Difficulty: ${difficulty} (${diffNote})

CONTENT QUALITY (apply to every body field):
- Include SPECIFIC details: exact names, numbers, percentages, APIs, error types, or real companies/tools
- Bad: "helps with performance" → Good: "cuts cold-start latency by ~60% vs classic loaders"
- Bad: "stores data" → Good: "persists key-value pairs in RAM; evicts LRU when maxmemory hit"
- Card bodies should read like a crisp senior-engineer explanation, not a textbook definition

DECIDE HOW MANY SLIDES (5–8) based on topic depth:
- 5 slides: simple/focused topics
- 6–7 slides: moderate depth with multiple aspects
- 8 slides: complex topics needing thorough coverage

Set "totalSlides" to the actual count you generate.
IMPORTANT: slideNum must be sequential 1 … totalSlides with no gaps.

REQUIRED SLIDE ORDER:
1. What is it? [definition-steps]
2. How It Works [pipeline]
3. Why It Matters [definition-steps]
[1–3 optional deep-dive slides for complex topics]
N-1. Common Pitfalls [definition-steps]
N. Advanced Patterns or Real-World Example [definition-steps]

OPTIONAL SLIDES between slide 3 and Common Pitfalls:
- Key Concepts / Architecture — technical depth (definition-steps)
- Real-World Example — concrete scenario from production (definition-steps or pipeline)
- Comparison — vs alternatives or similar approaches (definition-steps)
- Advanced Patterns — how experts use it (definition-steps)

Return ONLY raw JSON — no markdown fences, no extra text.

{
  "title": "Punchy title for the series (max 8 words)",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "What is ${topic}?",
      "slideNum": 1, "totalSlides": 9,
      "definition": { "color": "cyan", "title": "Core concept (max 6 words)", "body": "What it is and why developers use it — 2 sentences (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "search", "title": "Key point 1 (max 22 chars)", "body": "Explanation with real context (max 100 chars)" },
        { "color": "purple", "icon": "gear",   "title": "Key point 2 (max 22 chars)", "body": "Explanation with real context (max 100 chars)" },
        { "color": "green",  "icon": "check",  "title": "Key point 3 (max 22 chars)", "body": "Explanation with real context (max 100 chars)" }
      ]
    },
    {
      "template": "pipeline",
      "heading": "How It Works",
      "subtitle": "Step by step",
      "slideNum": 2, "totalSlides": 9,
      "cards": [
        { "color": "cyan",   "icon": "code",     "title": "Step 1 (max 22 chars)", "body": "Specific action/process (max 90 chars)" },
        { "color": "purple", "icon": "gear",     "title": "Step 2 (max 22 chars)", "body": "Specific action/process (max 90 chars)" },
        { "color": "green",  "icon": "database", "title": "Step 3 (max 22 chars)", "body": "Specific action/process (max 90 chars)" },
        { "color": "pink",   "icon": "robot",    "title": "Step 4 (max 22 chars)", "body": "Specific action/process (max 90 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Why It Matters",
      "slideNum": 3, "totalSlides": 9,
      "definition": { "color": "purple", "title": "Core benefit (max 7 words)", "body": "Why engineers rely on this in production — specific impact (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "lightning", "title": "Use case 1 (max 22 chars)", "body": "Real production scenario (max 100 chars)" },
        { "color": "purple", "icon": "layers",    "title": "Use case 2 (max 22 chars)", "body": "Real production scenario (max 100 chars)" },
        { "color": "green",  "icon": "check",     "title": "Use case 3 (max 22 chars)", "body": "Real production scenario (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Key Architecture",
      "slideNum": 4, "totalSlides": 9,
      "definition": { "color": "amber", "title": "Internal structure — how it's built (max 7 words)", "body": "The architectural decisions that make this work the way it does (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "layers",   "title": "Component 1 (max 22 chars)", "body": "Role and responsibility (max 100 chars)" },
        { "color": "purple", "icon": "database", "title": "Component 2 (max 22 chars)", "body": "Role and responsibility (max 100 chars)" },
        { "color": "green",  "icon": "gear",     "title": "Component 3 (max 22 chars)", "body": "Role and responsibility (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Real-World Example",
      "slideNum": 5, "totalSlides": 9,
      "definition": { "color": "green", "title": "Concrete example from production (max 7 words)", "body": "How a real company or project uses this — specific names welcome (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "code",   "title": "Example aspect 1 (max 22 chars)", "body": "Specifics of real usage (max 100 chars)" },
        { "color": "purple", "icon": "layers", "title": "Example aspect 2 (max 22 chars)", "body": "Specifics of real usage (max 100 chars)" },
        { "color": "green",  "icon": "check",  "title": "Outcome (max 22 chars)",           "body": "What was achieved (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Advanced Patterns",
      "slideNum": 6, "totalSlides": 9,
      "definition": { "color": "cyan", "title": "How experts level up their usage (max 7 words)", "body": "The patterns and techniques that separate good code from great code (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "brain",     "title": "Pattern 1 (max 22 chars)", "body": "When and how to apply it (max 100 chars)" },
        { "color": "purple", "icon": "lightning", "title": "Pattern 2 (max 22 chars)", "body": "When and how to apply it (max 100 chars)" },
        { "color": "green",  "icon": "code",      "title": "Pattern 3 (max 22 chars)", "body": "When and how to apply it (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Common Pitfalls",
      "slideNum": 7, "totalSlides": 8,
      "definition": { "color": "pink", "title": "The #1 mistake (max 7 words)", "body": "What trips developers up most — and how to catch it early (max 280 chars)" },
      "cards": [
        { "color": "pink",   "icon": "warning", "title": "Mistake 1 (max 22 chars)",       "body": "What to avoid and why (max 100 chars)" },
        { "color": "cyan",   "icon": "check",   "title": "Better approach (max 22 chars)", "body": "The correct pattern (max 100 chars)" },
        { "color": "green",  "icon": "lightning","title": "Pro tip (max 22 chars)",         "body": "Expert shortcut or trick (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Advanced Patterns",
      "slideNum": 8, "totalSlides": 8,
      "definition": { "color": "cyan", "title": "How experts level up their usage (max 7 words)", "body": "The patterns and techniques that separate good code from great code (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "brain",     "title": "Pattern 1 (max 22 chars)", "body": "When and how to apply it (max 100 chars)" },
        { "color": "purple", "icon": "lightning", "title": "Pattern 2 (max 22 chars)", "body": "When and how to apply it (max 100 chars)" },
        { "color": "green",  "icon": "code",      "title": "Pattern 3 (max 22 chars)", "body": "When and how to apply it (max 100 chars)" }
      ]
    }
  ]
}
STRICT RULES:
- Decide totalSlides (5–8) based on complexity. Set it consistently on every slide.
- slideNum MUST be sequential 1 … totalSlides — no gaps.
- For simpler topics: omit optional slides (4, 5, 6). Adjust all slideNum/totalSlides.
- colors: "cyan","purple","green","pink","amber" only
- icons: "search","gear","database","book","brain","robot","plus","lock","lightning","check","warning","clock","code","layers" only
- Return ONLY raw JSON`;
}

// ── Prompt: Code Example (7–10 slides — dynamic) ──────────────────────────────
function buildCodeExamplePrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);
  return `Create a code-focused ${category} series about: "${topic}"
(If the topic contains typos or is phrased as a question/sentence, interpret the intent as a clean tech topic title and use that normalized form in the "title" field and throughout the content.)
Difficulty: ${difficulty} (${diffNote})

CONTENT QUALITY (apply to every body field):
- Include SPECIFIC details: exact names, numbers, percentages, APIs, error types, or real companies/tools
- Bad: "helps with performance" → Good: "cuts cold-start latency by ~60% vs classic loaders"
- Bad: "stores data" → Good: "persists key-value pairs in RAM; evicts LRU when maxmemory hit"
- Card bodies should read like a crisp senior-engineer explanation, not a textbook definition

DECIDE HOW MANY SLIDES (5–8) based on topic depth:
- 5 slides: focused single pattern or function
- 6–7 slides: moderate depth with multiple patterns
- 8 slides: complex API or system with many aspects

Set "totalSlides" to the actual count you generate.
IMPORTANT: slideNum must be sequential 1 … totalSlides with no gaps.

REQUIRED SLIDE ORDER:
1. The Problem [definition-steps]
2. The Solution [definition-steps]
3. Code Walkthrough [pipeline]
[1–3 optional deep-dive slides for complex topics]
N-1. Real Project Usage [definition-steps]
N. Common Mistakes [definition-steps]

OPTIONAL SLIDES between slide 3 and Real Project Usage:
- Advanced Pattern — a more powerful usage variant (definition-steps or pipeline)
- Edge Cases / Gotchas — surprising behaviors (definition-steps)
- Performance Considerations — when and why it matters (definition-steps)

Return ONLY raw JSON — no markdown fences, no extra text.

{
  "title": "Punchy code-focused title (max 8 words)",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "The Problem",
      "slideNum": 1, "totalSlides": 9,
      "definition": { "color": "pink", "title": "What pain does this solve? (max 7 words)", "body": "The real developer pain before this solution existed — be specific (max 280 chars)" },
      "cards": [
        { "color": "pink",   "icon": "warning", "title": "Pain point 1 (max 22 chars)", "body": "Without ${topic} — real impact (max 100 chars)" },
        { "color": "cyan",   "icon": "warning", "title": "Pain point 2 (max 22 chars)", "body": "Without ${topic} — real impact (max 100 chars)" },
        { "color": "purple", "icon": "code",    "title": "Pain point 3 (max 22 chars)", "body": "Without ${topic} — real impact (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "The Solution",
      "slideNum": 2, "totalSlides": 9,
      "definition": { "color": "cyan", "title": "How ${topic} fixes it (max 7 words)", "body": "The elegant solution — what makes it work and why it's the right approach (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "code",  "title": "Core syntax (max 22 chars)",   "body": "Basic usage pattern — be specific (max 100 chars)" },
        { "color": "purple", "icon": "gear",  "title": "Key parameter (max 22 chars)",  "body": "What it controls — with example (max 100 chars)" },
        { "color": "green",  "icon": "check", "title": "Return / result (max 22 chars)", "body": "What you get back (max 100 chars)" }
      ]
    },
    {
      "template": "pipeline",
      "heading": "Code Walkthrough",
      "subtitle": "Step by step",
      "slideNum": 3, "totalSlides": 9,
      "cards": [
        { "color": "cyan",   "icon": "code",      "title": "Import / Setup (max 22 chars)",   "body": "What these lines do — specific (max 90 chars)" },
        { "color": "purple", "icon": "gear",      "title": "Core Logic (max 22 chars)",        "body": "The main logic here (max 90 chars)" },
        { "color": "green",  "icon": "check",     "title": "Output / Return (max 22 chars)",   "body": "What we get back (max 90 chars)" },
        { "color": "amber",  "icon": "lightning", "title": "Result (max 22 chars)",            "body": "What you see when you run it (max 90 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Advanced Pattern",
      "slideNum": 4, "totalSlides": 9,
      "definition": { "color": "purple", "title": "Taking it further (max 7 words)", "body": "A more powerful usage pattern for complex scenarios in real projects (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "brain",     "title": "Advanced use 1 (max 22 chars)", "body": "When and how to apply (max 100 chars)" },
        { "color": "purple", "icon": "layers",    "title": "Advanced use 2 (max 22 chars)", "body": "When and how to apply (max 100 chars)" },
        { "color": "green",  "icon": "lightning", "title": "Pro shortcut (max 22 chars)",   "body": "Expert-level idiom (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Edge Cases & Gotchas",
      "slideNum": 5, "totalSlides": 9,
      "definition": { "color": "amber", "title": "Surprising behaviors to know (max 7 words)", "body": "The edge cases that trip up even experienced developers using ${topic} (max 280 chars)" },
      "cards": [
        { "color": "pink",   "icon": "warning", "title": "Gotcha 1 (max 22 chars)", "body": "What happens and why (max 100 chars)" },
        { "color": "cyan",   "icon": "warning", "title": "Gotcha 2 (max 22 chars)", "body": "What happens and why (max 100 chars)" },
        { "color": "green",  "icon": "check",   "title": "Safe pattern (max 22 chars)", "body": "How to avoid these traps (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Real Project Usage",
      "slideNum": 6, "totalSlides": 9,
      "definition": { "color": "green", "title": "Where you'd use this in production (max 7 words)", "body": "A realistic scenario from a real project — be specific about the context (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "layers", "title": "Project type 1 (max 22 chars)", "body": "How it's used there (max 100 chars)" },
        { "color": "purple", "icon": "code",   "title": "Project type 2 (max 22 chars)", "body": "How it's used there (max 100 chars)" },
        { "color": "green",  "icon": "check",  "title": "Best practice (max 22 chars)",  "body": "The pattern to follow (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Common Mistakes",
      "slideNum": 7, "totalSlides": 8,
      "definition": { "color": "pink", "title": "The bug most developers write (max 7 words)", "body": "The mistake causing silent bugs or bad performance — with the correct fix (max 280 chars)" },
      "cards": [
        { "color": "pink",   "icon": "warning",   "title": "Wrong way (max 22 chars)",   "body": "What not to write — why it fails (max 100 chars)" },
        { "color": "green",  "icon": "check",     "title": "Right way (max 22 chars)",    "body": "The correct pattern — why it works (max 100 chars)" },
        { "color": "amber",  "icon": "lightning", "title": "Pro shortcut (max 22 chars)", "body": "The advanced idiom pros use (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Real Project Usage",
      "slideNum": 8, "totalSlides": 8,
      "definition": { "color": "green", "title": "Where you'd use this in production (max 7 words)", "body": "A realistic scenario from a real project — be specific about the context (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "layers", "title": "Project type 1 (max 22 chars)", "body": "How it's used there (max 100 chars)" },
        { "color": "purple", "icon": "code",   "title": "Project type 2 (max 22 chars)", "body": "How it's used there (max 100 chars)" },
        { "color": "green",  "icon": "check",  "title": "Best practice (max 22 chars)",  "body": "The pattern to follow (max 100 chars)" }
      ]
    }
  ]
}
STRICT RULES:
- Decide totalSlides (5–8) based on complexity. Set it consistently on every slide.
- slideNum MUST be sequential 1 … totalSlides — no gaps.
- For simpler topics: omit optional slides 4 and/or 5. Adjust all slideNum/totalSlides.
- colors: "cyan","purple","green","pink","amber" only
- icons: "search","gear","database","book","brain","robot","plus","lock","lightning","check","warning","clock","code","layers" only
- Return ONLY raw JSON`;
}

// ── Prompt: Quick Tips (6–9 slides — dynamic) ─────────────────────────────────
function buildQuickTipsPrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);
  return `Create a quick-tips ${category} series about: "${topic}"
(If the topic contains typos or is phrased as a question/sentence, interpret the intent as a clean tech topic title and use that normalized form in the "title" field and throughout the content.)
Difficulty: ${difficulty} (${diffNote})

CONTENT QUALITY (apply to every body field):
- Include SPECIFIC details: exact names, numbers, percentages, APIs, error types, or real companies/tools
- Bad: "helps with performance" → Good: "cuts cold-start latency by ~60% vs classic loaders"
- Bad: "stores data" → Good: "persists key-value pairs in RAM; evicts LRU when maxmemory hit"
- Card bodies should read like a crisp senior-engineer explanation, not a textbook definition

DECIDE HOW MANY TIP SLIDES (4–7 tips) based on topic richness:
- 4 tips: focused topic with fewer distinct actionable insights
- 5–6 tips: moderate depth
- 7 tips: rich topic with many distinct actionable tips

Total slides = tip count (no Resources or CTA at the end).
Set "totalSlides" to the actual count you generate.
IMPORTANT: slideNum must be sequential 1 … totalSlides with no gaps.

Each tip slide: one concrete, actionable insight with a clear "Do this / Because / Pro move" structure.

Return ONLY raw JSON — no markdown fences, no extra text.

{
  "title": "Punchy tips title (max 8 words)",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "Tip #1: [one-line punchy tip title]",
      "slideNum": 1, "totalSlides": 7,
      "definition": { "color": "cyan", "title": "The key insight in 6–8 words", "body": "Why this tip matters and the full context to apply it correctly (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "check",     "title": "Do this (max 22 chars)",     "body": "Specific, concrete action to take (max 100 chars)" },
        { "color": "green",  "icon": "check",     "title": "Because (max 22 chars)",      "body": "The real reason it works (max 100 chars)" },
        { "color": "purple", "icon": "lightning", "title": "Pro move (max 22 chars)",     "body": "Advanced application or variation (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #2: [one-line punchy tip title]",
      "slideNum": 2, "totalSlides": 7,
      "definition": { "color": "purple", "title": "The key insight in 6–8 words", "body": "Why this tip matters and the full context to apply it correctly (max 280 chars)" },
      "cards": [
        { "color": "purple", "icon": "check",     "title": "Do this (max 22 chars)",  "body": "Specific, concrete action to take (max 100 chars)" },
        { "color": "cyan",   "icon": "check",     "title": "Because (max 22 chars)",   "body": "The real reason it works (max 100 chars)" },
        { "color": "green",  "icon": "lightning", "title": "Pro move (max 22 chars)",  "body": "Advanced application or variation (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #3: [one-line punchy tip title]",
      "slideNum": 3, "totalSlides": 7,
      "definition": { "color": "green", "title": "The key insight in 6–8 words", "body": "Why this tip matters and the full context to apply it correctly (max 280 chars)" },
      "cards": [
        { "color": "green",  "icon": "check",     "title": "Do this (max 22 chars)",  "body": "Specific, concrete action to take (max 100 chars)" },
        { "color": "purple", "icon": "check",     "title": "Because (max 22 chars)",   "body": "The real reason it works (max 100 chars)" },
        { "color": "cyan",   "icon": "lightning", "title": "Pro move (max 22 chars)",  "body": "Advanced application or variation (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #4: [one-line punchy tip title]",
      "slideNum": 4, "totalSlides": 7,
      "definition": { "color": "amber", "title": "The key insight in 6–8 words", "body": "Why this tip matters and the full context to apply it correctly (max 280 chars)" },
      "cards": [
        { "color": "amber",  "icon": "check",     "title": "Do this (max 22 chars)",  "body": "Specific, concrete action to take (max 100 chars)" },
        { "color": "cyan",   "icon": "check",     "title": "Because (max 22 chars)",   "body": "The real reason it works (max 100 chars)" },
        { "color": "purple", "icon": "lightning", "title": "Pro move (max 22 chars)",  "body": "Advanced application or variation (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #5: [one-line punchy tip title]",
      "slideNum": 5, "totalSlides": 7,
      "definition": { "color": "pink", "title": "The key insight in 6–8 words", "body": "Why this tip matters and the full context to apply it correctly (max 280 chars)" },
      "cards": [
        { "color": "pink",   "icon": "check",     "title": "Do this (max 22 chars)",  "body": "Specific, concrete action to take (max 100 chars)" },
        { "color": "green",  "icon": "check",     "title": "Because (max 22 chars)",   "body": "The real reason it works (max 100 chars)" },
        { "color": "amber",  "icon": "lightning", "title": "Pro move (max 22 chars)",  "body": "Advanced application or variation (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #6: [one-line punchy tip title]",
      "slideNum": 6, "totalSlides": 7,
      "definition": { "color": "cyan", "title": "The key insight in 6–8 words", "body": "Why this tip matters and the full context to apply it correctly (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "check",     "title": "Do this (max 22 chars)",  "body": "Specific, concrete action to take (max 100 chars)" },
        { "color": "green",  "icon": "check",     "title": "Because (max 22 chars)",   "body": "The real reason it works (max 100 chars)" },
        { "color": "purple", "icon": "lightning", "title": "Pro move (max 22 chars)",  "body": "Advanced application or variation (max 100 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #7: [one-line punchy tip title]",
      "slideNum": 7, "totalSlides": 7,
      "definition": { "color": "amber", "title": "The key insight in 6–8 words", "body": "Why this tip matters and the full context to apply it correctly (max 280 chars)" },
      "cards": [
        { "color": "amber",  "icon": "check",     "title": "Do this (max 22 chars)",  "body": "Specific, concrete action to take (max 100 chars)" },
        { "color": "cyan",   "icon": "check",     "title": "Because (max 22 chars)",   "body": "The real reason it works (max 100 chars)" },
        { "color": "purple", "icon": "lightning", "title": "Pro move (max 22 chars)",  "body": "Advanced application or variation (max 100 chars)" }
      ]
    }
  ]
}
STRICT RULES:
- heading for each tip slide MUST start with "Tip #N: " followed by a concrete one-line title
- Decide totalSlides (4–7) based on topic richness. All slides are tip slides only.
- slideNum MUST be sequential 1 … totalSlides — no gaps.
- colors: "cyan","purple","green","pink","amber" only
- icons: "search","gear","database","book","brain","robot","plus","lock","lightning","check","warning","clock","code","layers" only
- Return ONLY raw JSON`;
}

// ── Prompt: Cheat Sheet (3 slides: intro + grid-overview + CTA) ───────────────
function buildCheatSheetPrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);
  return `Create a ${category} cheat-sheet series about: "${topic}"
(If the topic contains typos or is phrased as a question/sentence, interpret the intent as a clean tech topic title and use that normalized form in the "title" field and throughout the content.)
Difficulty: ${difficulty} (${diffNote})

CONTENT QUALITY: use specific technical details, real tool names, numbers, and code concepts — not generic descriptions.

Generate exactly 2 slides (the CTA will be added automatically):

Slide 1: a definition-steps intro slide — what the topic is + 3 key aspects
Slide 2: a grid-overview cheat-sheet slide — 6 to 8 numbered items, each a concrete, actionable thing to know/do

STRICT RULES:
- Slide 1 template MUST be "definition-steps"
- Slide 2 template MUST be "grid-overview"
- slideNum: 1 and 2, totalSlides: 3 (CTA will be slide 3)
- grid-overview items: 6 to 8 items — pick the number based on topic richness
  - title: max 4 words — ultra-concise
  - body: max 8 words — one concrete takeaway
- definition-steps: definition + 3 cards (color: cyan/purple/green)
- colors: "cyan","purple","green","pink","amber" only
- icons: "search","gear","database","book","brain","robot","plus","lock","lightning","check","warning","clock","code","layers" only

Return ONLY raw JSON:
{
  "title": "N ${topic} Things You Must Know",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "What is ${topic}?",
      "slideNum": 1, "totalSlides": 3,
      "definition": { "color": "cyan", "title": "Core concept (max 6 words)", "body": "What it is and why it matters (max 280 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "search", "title": "Key point 1 (max 22 chars)", "body": "Concise explanation (max 100 chars)" },
        { "color": "purple", "icon": "gear",   "title": "Key point 2 (max 22 chars)", "body": "Concise explanation (max 100 chars)" },
        { "color": "green",  "icon": "check",  "title": "Key point 3 (max 22 chars)", "body": "Concise explanation (max 100 chars)" }
      ]
    },
    {
      "template": "grid-overview",
      "heading": "8 ${topic} Things Every Dev Should Know",
      "slideNum": 2, "totalSlides": 3,
      "items": [
        { "title": "Item 1 (max 4 words)", "body": "One concrete takeaway (max 8 words)" },
        { "title": "Item 2 (max 4 words)", "body": "One concrete takeaway (max 8 words)" },
        { "title": "Item 3 (max 4 words)", "body": "One concrete takeaway (max 8 words)" },
        { "title": "Item 4 (max 4 words)", "body": "One concrete takeaway (max 8 words)" },
        { "title": "Item 5 (max 4 words)", "body": "One concrete takeaway (max 8 words)" },
        { "title": "Item 6 (max 4 words)", "body": "One concrete takeaway (max 8 words)" },
        { "title": "Item 7 (max 4 words)", "body": "One concrete takeaway (max 8 words)" },
        { "title": "Item 8 (max 4 words)", "body": "One concrete takeaway (max 8 words)" }
      ]
    }
  ]
}`;
}

// ── Route prompt by layout ─────────────────────────────────────────────────────
function buildPrompt(topic: string, category: string, difficulty: string, layout: LayoutId = "quiz-reveal"): string {
  switch (layout) {
    case "explainer":    return buildExplainerPrompt(topic, category, difficulty);
    case "code-example": return buildCodeExamplePrompt(topic, category, difficulty);
    case "quick-tips":   return buildQuickTipsPrompt(topic, category, difficulty);
    case "cheat-sheet":  return buildCheatSheetPrompt(topic, category, difficulty);
    default:             return buildQuizRevealPrompt(topic, category, difficulty);
  }
}

const SYSTEM_MSG =
  "You are an expert technical educator creating engaging educational content. Always respond with valid JSON only. No markdown, no extra text.";

// ── Provider 1: Groq (Llama 3.3-70B) — 100K tokens/day free ──────────────────

async function tryGroq(prompt: string): Promise<string> {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const chat = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 6144,
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_MSG },
      { role: "user", content: prompt },
    ],
  });
  return chat.choices[0]?.message?.content ?? "";
}

// ── Provider 2: Google Gemini (gemini-2.0-flash) — 1500 req/day free ─────────

async function tryGemini(prompt: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 6144 },
        systemInstruction: { parts: [{ text: SYSTEM_MSG }] },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Provider 3: NVIDIA NIM (Llama 3.3-70B) — free credits ────────────────────

async function tryNvidia(prompt: string): Promise<string> {
  const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      max_tokens: 6144,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_MSG },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`NVIDIA NIM HTTP ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// ── Provider 4: OpenAI (gpt-4o-mini) ─────────────────────────────────────────

async function tryOpenAI(prompt: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 6144,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_MSG },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// ── Provider 5: OpenRouter (Qwen free tier) ───────────────────────────────────

async function tryOpenRouter(prompt: string): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://quizbytes.dev",
      "X-Title": "QuizBytesDaily",
    },
    body: JSON.stringify({
      model: "qwen/qwen3-235b-a22b:free",
      max_tokens: 6144,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_MSG },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// ── Main: try providers in order, first success wins ─────────────────────────

export async function generateQuizSeries(
  topic: string,
  category: string,
  difficulty: string,
  layout: LayoutId = "quiz-reveal"
): Promise<GeneratedSeries> {
  const prompt = buildPrompt(topic, category, difficulty, layout);

  const providers = [
    { name: "Groq",        fn: () => tryGroq(prompt),        key: process.env.GROQ_API_KEY },
    { name: "Gemini",      fn: () => tryGemini(prompt),      key: process.env.GEMINI_API_KEY },
    { name: "NVIDIA NIM",  fn: () => tryNvidia(prompt),      key: process.env.NVIDIA_API_KEY },
    { name: "OpenAI",      fn: () => tryOpenAI(prompt),      key: process.env.OPENAI_API_KEY },
    { name: "OpenRouter",  fn: () => tryOpenRouter(prompt),  key: process.env.OPENROUTER_API_KEY },
  ].filter((p) => !!p.key);

  if (providers.length === 0) {
    throw new Error(
      "No LLM API key configured. Add at least one of: GROQ_API_KEY, GEMINI_API_KEY, NVIDIA_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY"
    );
  }

  const errors: string[] = [];

  for (const provider of providers) {
    try {
      console.log(`[quiz-generator] Trying ${provider.name}…`);
      const text = await provider.fn();
      const parsed = parseJson(text);

      // Fix totalSlides across all LLM slides and append a CTA at the end
      const rawSlides = parsed.slides as unknown as Array<Record<string, unknown>>;
      const total = rawSlides.length + 1;
      const CTA_COPY: Record<string, { heading: string; subtitle: string }> = {
        "quiz-reveal":   { heading: "Enjoyed This Quiz?",        subtitle: "New quiz every day — subscribe so you never miss one" },
        "explainer":     { heading: "Found This Useful?",        subtitle: "New tech explainer every day — subscribe to keep learning" },
        "code-example":  { heading: "Levelled Up Your Code?",    subtitle: "New code examples every day — subscribe to keep growing" },
        "quick-tips":    { heading: "Found These Tips Useful?",  subtitle: "Daily tips to make you a sharper developer — subscribe now" },
        "cheat-sheet":   { heading: "Save This Cheat Sheet?",    subtitle: "New cheat sheets every day — subscribe for quick references" },
      };
      const ctaCopy = CTA_COPY[layout] ?? { heading: "Enjoyed This?", subtitle: "New content every day — subscribe so you never miss one" };
      const slides = [
        ...rawSlides.map((s, i) => ({ ...s, slideNum: i + 1, totalSlides: total })),
        { template: "cta", ...ctaCopy, slideNum: total, totalSlides: total },
      ] as unknown as GeneratedSlide[];

      // Use the LLM-generated title as canonical topic (normalizes typos/question-form input)
      const normalizedTopic = (parsed.title as string | undefined) ?? topic;
      console.log(`[quiz-generator] ✓ ${provider.name} succeeded (${rawSlides.length} content + 1 CTA = ${total} slides)`);
      return {
        slug: slugify(`${normalizedTopic}-${Date.now()}`),
        title: normalizedTopic,
        topic: normalizedTopic,
        category,
        difficulty,
        slides,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[quiz-generator] ✗ ${provider.name}: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`All providers failed:\n${errors.join("\n")}`);
}

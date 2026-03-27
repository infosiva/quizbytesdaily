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
    desc: "Concept intro + quiz question + answer reveal",
    slides: 7,
    color: "#a855f7",
  },
  {
    id: "explainer",
    name: "Explainer",
    icon: "📚",
    desc: "Educational deep-dive — pure learning, no quiz",
    slides: 6,
    color: "#22d3ee",
  },
  {
    id: "code-example",
    name: "Code Example",
    icon: "💻",
    desc: "Code snippet walkthrough with real-world example",
    slides: 6,
    color: "#4ade80",
  },
  {
    id: "quick-tips",
    name: "Quick Tips",
    icon: "⚡",
    desc: "5 punchy, actionable tips or facts on the topic",
    slides: 5,
    color: "#fbbf24",
  },
] as const;

export type LayoutId = (typeof LAYOUTS)[number]["id"];

// ── Trending topic seeds (used to pre-populate the generate form) ─────────────

export const TRENDING_TOPICS: Record<string, string[]> = {
  "AI/ML": [
    "Context window limits in LLMs", "Mixture of Experts architecture",
    "RAG vs Fine-tuning", "Prompt caching strategies", "Vision language models",
    "AI agents vs chatbots", "Embedding models explained", "Vector databases",
  ],
  "Python": [
    "Python type hints in 2026", "Async generators", "Dataclasses vs Pydantic",
    "UV package manager", "Python 3.13 GIL removal", "Polars vs Pandas",
    "FastAPI dependency injection", "Ruff linter",
  ],
  "Algorithms": [
    "Two-pointer technique", "Sliding window pattern", "Binary search variants",
    "Graph BFS vs DFS", "Dynamic programming tabulation", "Heap operations",
    "Trie data structure", "Union-Find algorithm",
  ],
  "System Design": [
    "Event-driven architecture", "CQRS pattern", "Database sharding",
    "Rate limiting strategies", "Consistent hashing", "CAP theorem",
    "Circuit breaker pattern", "API gateway design",
  ],
  "JavaScript": [
    "JS temporal API", "React server components", "Web Workers explained",
    "ES2025 features", "Signals in JavaScript", "Bun vs Node.js",
    "Fetch streaming", "TypeScript 5 decorators",
  ],
  "DevOps": [
    "Docker multi-stage builds", "Kubernetes HPA", "GitHub Actions caching",
    "Terraform state management", "OpenTelemetry tracing", "Argo CD GitOps",
    "Helm chart best practices", "Container security scanning",
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

// ── Prompt: Quiz Reveal (7 slides — default) ──────────────────────────────────
function buildQuizRevealPrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);

  return `Create a 7-slide educational ${category} series about: "${topic}"
Difficulty: ${difficulty} (${diffNote})

Return ONLY raw JSON — no markdown fences, no extra text.
Copy this EXACT structure and fill in the content for "${topic}":

{
  "title": "Series title — punchy, max 8 words",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "What is ${topic}?",
      "slideNum": 1,
      "totalSlides": 7,
      "definition": {
        "color": "cyan",
        "title": "Core concept name (max 6 words)",
        "body": "What it is and why it exists — 2 sentences max (max 140 chars)"
      },
      "cards": [
        { "color": "cyan",   "icon": "search", "title": "Key aspect 1 (max 20 chars)", "body": "Explanation (max 44 chars)" },
        { "color": "purple", "icon": "gear",   "title": "Key aspect 2 (max 20 chars)", "body": "Explanation (max 44 chars)" },
        { "color": "green",  "icon": "check",  "title": "Key aspect 3 (max 20 chars)", "body": "Explanation (max 44 chars)" }
      ]
    },
    {
      "template": "pipeline",
      "heading": "How ${topic} Works",
      "subtitle": "Step-by-step flow",
      "slideNum": 2,
      "totalSlides": 7,
      "cards": [
        { "color": "cyan",   "icon": "code",     "title": "Step 1 name (max 20 chars)", "body": "What happens here (max 42 chars)" },
        { "color": "purple", "icon": "gear",     "title": "Step 2 name (max 20 chars)", "body": "What happens here (max 42 chars)" },
        { "color": "green",  "icon": "database", "title": "Step 3 name (max 20 chars)", "body": "What happens here (max 42 chars)" },
        { "color": "pink",   "icon": "robot",    "title": "Step 4 name (max 20 chars)", "body": "What happens here (max 42 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Why It Matters",
      "slideNum": 3,
      "totalSlides": 7,
      "definition": {
        "color": "purple",
        "title": "Real-world benefit (max 6 words)",
        "body": "Why engineers and developers actually use this in production (max 140 chars)"
      },
      "cards": [
        { "color": "cyan",   "icon": "lightning", "title": "Use case 1 (max 20 chars)", "body": "Real scenario (max 44 chars)" },
        { "color": "purple", "icon": "book",      "title": "Use case 2 (max 20 chars)", "body": "Real scenario (max 44 chars)" },
        { "color": "green",  "icon": "check",     "title": "Use case 3 (max 20 chars)", "body": "Real scenario (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Key Things to Know",
      "slideNum": 4,
      "totalSlides": 7,
      "definition": {
        "color": "amber",
        "title": "Most important insight (max 7 words)",
        "body": "The one thing you must understand before using this in production (max 140 chars)"
      },
      "cards": [
        { "color": "pink",   "icon": "warning", "title": "Common mistake (max 20 chars)",  "body": "What to avoid (max 44 chars)" },
        { "color": "cyan",   "icon": "gear",    "title": "Best practice (max 20 chars)",   "body": "The right approach (max 44 chars)" },
        { "color": "green",  "icon": "check",   "title": "Pro tip (max 20 chars)",         "body": "Time-saving insight (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Quick Quiz! 🎯",
      "slideNum": 5,
      "totalSlides": 7,
      "definition": {
        "color": "amber",
        "title": "Write a real knowledge-testing question here?",
        "body": "Pick the best answer ↓"
      },
      "cards": [
        { "color": "cyan",   "icon": "opt_a", "title": "A)  Option A text (max 34 chars)", "body": " " },
        { "color": "purple", "icon": "opt_b", "title": "B)  Option B text (max 34 chars)", "body": " " },
        { "color": "green",  "icon": "opt_c", "title": "C)  Option C text (max 34 chars)", "body": " " },
        { "color": "pink",   "icon": "opt_d", "title": "D)  Option D text (max 34 chars)", "body": " " }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Answer ✅",
      "slideNum": 6,
      "totalSlides": 7,
      "definition": {
        "color": "green",
        "title": "X)  Correct answer text here",
        "body": "Why this is correct — and what the key insight is (max 150 chars)"
      },
      "cards": [
        { "color": "green",  "icon": "check", "title": "Key takeaway 1 (max 22 chars)", "body": "Reinforcing fact (max 44 chars)" },
        { "color": "cyan",   "icon": "check", "title": "Key takeaway 2 (max 22 chars)", "body": "Reinforcing fact (max 44 chars)" },
        { "color": "purple", "icon": "check", "title": "Key takeaway 3 (max 22 chars)", "body": "Reinforcing fact (max 44 chars)" }
      ]
    },
    {
      "template": "cta",
      "heading": "Enjoyed This Quiz?",
      "slideNum": 7,
      "totalSlides": 7,
      "cards": []
    }
  ]
}

STRICT RULES:
- Slide 1–4: use real educational content about "${topic}"
- Slide 5 (quiz): definition.title IS the question (end with ?), definition.body = "Pick the best answer ↓"
  — cards MUST use icons opt_a, opt_b, opt_c, opt_d — body MUST be a single space " "
  — exactly one option should be clearly correct
- Slide 6 (answer): definition.title MUST start with the correct letter: "A)  " or "B)  " or "C)  " or "D)  "
  — cards: 3 reinforcing takeaways with "check" icon in green/cyan/purple
- Slide 7 (cta): only heading and slideNum/totalSlides, cards: []
- colors MUST be one of: "cyan", "purple", "green", "pink", "amber"
- icons MUST be one of: "search", "gear", "database", "book", "brain", "robot", "plus", "lock", "lightning", "check", "warning", "clock", "code", "layers", "opt_a", "opt_b", "opt_c", "opt_d"
- Return ONLY raw JSON`;
}

// ── Prompt: Explainer (6 slides — no quiz) ────────────────────────────────────
function buildExplainerPrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);
  return `Create a 6-slide educational ${category} explainer about: "${topic}"
Difficulty: ${difficulty} (${diffNote})
Return ONLY raw JSON — no markdown fences, no extra text.

{
  "title": "Punchy title for the series (max 8 words)",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "What is ${topic}?",
      "slideNum": 1, "totalSlides": 6,
      "definition": { "color": "cyan", "title": "Core concept (max 6 words)", "body": "What it is — 2 sentences (max 140 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "search", "title": "Key point 1 (max 20 chars)", "body": "Brief explanation (max 44 chars)" },
        { "color": "purple", "icon": "gear",   "title": "Key point 2 (max 20 chars)", "body": "Brief explanation (max 44 chars)" },
        { "color": "green",  "icon": "check",  "title": "Key point 3 (max 20 chars)", "body": "Brief explanation (max 44 chars)" }
      ]
    },
    {
      "template": "pipeline",
      "heading": "How It Works",
      "subtitle": "Step by step",
      "slideNum": 2, "totalSlides": 6,
      "cards": [
        { "color": "cyan",   "icon": "code",     "title": "Step 1 (max 20 chars)", "body": "What happens (max 42 chars)" },
        { "color": "purple", "icon": "gear",     "title": "Step 2 (max 20 chars)", "body": "What happens (max 42 chars)" },
        { "color": "green",  "icon": "database", "title": "Step 3 (max 20 chars)", "body": "What happens (max 42 chars)" },
        { "color": "pink",   "icon": "robot",    "title": "Step 4 (max 20 chars)", "body": "What happens (max 42 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Why It Matters",
      "slideNum": 3, "totalSlides": 6,
      "definition": { "color": "purple", "title": "Core benefit (max 7 words)", "body": "Why engineers use it in production (max 140 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "lightning", "title": "Use case 1 (max 20 chars)", "body": "Real scenario (max 44 chars)" },
        { "color": "purple", "icon": "book",      "title": "Use case 2 (max 20 chars)", "body": "Real scenario (max 44 chars)" },
        { "color": "green",  "icon": "check",     "title": "Use case 3 (max 20 chars)", "body": "Real scenario (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Common Pitfalls",
      "slideNum": 4, "totalSlides": 6,
      "definition": { "color": "pink", "title": "The #1 mistake (max 7 words)", "body": "What trips people up and why (max 140 chars)" },
      "cards": [
        { "color": "pink",   "icon": "warning", "title": "Mistake 1 (max 20 chars)",     "body": "What to avoid (max 44 chars)" },
        { "color": "cyan",   "icon": "check",   "title": "Better approach (max 20 chars)","body": "What to do instead (max 44 chars)" },
        { "color": "green",  "icon": "check",   "title": "Pro tip (max 20 chars)",        "body": "Expert insight (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Real-World Example",
      "slideNum": 5, "totalSlides": 6,
      "definition": { "color": "amber", "title": "Concrete example (max 7 words)", "body": "How it looks in a real codebase or system (max 140 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "code",  "title": "Example component 1 (max 20 chars)", "body": "What it does (max 44 chars)" },
        { "color": "purple", "icon": "gear",  "title": "Example component 2 (max 20 chars)", "body": "What it does (max 44 chars)" },
        { "color": "green",  "icon": "check", "title": "Result (max 20 chars)",               "body": "Outcome/output (max 44 chars)" }
      ]
    },
    { "template": "cta", "heading": "Enjoyed This?", "slideNum": 6, "totalSlides": 6, "cards": [] }
  ]
}
STRICT RULES:
- colors: "cyan","purple","green","pink","amber" only
- icons: "search","gear","database","book","brain","robot","plus","lock","lightning","check","warning","clock","code","layers" only
- Return ONLY raw JSON`;
}

// ── Prompt: Code Example (6 slides) ──────────────────────────────────────────
function buildCodeExamplePrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);
  return `Create a 6-slide code-focused ${category} series about: "${topic}"
Difficulty: ${difficulty} (${diffNote})
Return ONLY raw JSON — no markdown fences, no extra text.

{
  "title": "Punchy code-focused title (max 8 words)",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "The Problem",
      "slideNum": 1, "totalSlides": 6,
      "definition": { "color": "pink", "title": "What problem does this solve? (max 7 words)", "body": "The pain point before this solution existed (max 140 chars)" },
      "cards": [
        { "color": "pink",   "icon": "warning", "title": "Pain point 1 (max 20 chars)", "body": "Without ${topic} (max 44 chars)" },
        { "color": "cyan",   "icon": "check",   "title": "Pain point 2 (max 20 chars)", "body": "Without ${topic} (max 44 chars)" },
        { "color": "purple", "icon": "code",    "title": "Pain point 3 (max 20 chars)", "body": "Without ${topic} (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "The Solution",
      "slideNum": 2, "totalSlides": 6,
      "definition": { "color": "cyan", "title": "How ${topic} fixes it (max 7 words)", "body": "The elegant solution and what makes it work (max 140 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "code",  "title": "Core syntax (max 20 chars)",  "body": "Basic usage pattern (max 44 chars)" },
        { "color": "purple", "icon": "gear",  "title": "Key parameter (max 20 chars)", "body": "What it controls (max 44 chars)" },
        { "color": "green",  "icon": "check", "title": "Return value (max 20 chars)",  "body": "What you get back (max 44 chars)" }
      ]
    },
    {
      "template": "pipeline",
      "heading": "Code Walkthrough",
      "subtitle": "Step by step",
      "slideNum": 3, "totalSlides": 6,
      "cards": [
        { "color": "cyan",   "icon": "code",  "title": "Line 1-2: Setup (max 20 chars)",    "body": "What these lines do (max 42 chars)" },
        { "color": "purple", "icon": "gear",  "title": "Line 3-4: Core (max 20 chars)",     "body": "The main logic here (max 42 chars)" },
        { "color": "green",  "icon": "check", "title": "Line 5-6: Output (max 20 chars)",   "body": "What we return/print (max 42 chars)" },
        { "color": "amber",  "icon": "lightning", "title": "Result (max 20 chars)",         "body": "What you see when you run it (max 42 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Real Project Usage",
      "slideNum": 4, "totalSlides": 6,
      "definition": { "color": "green", "title": "Where you'd use this in production (max 7 words)", "body": "A realistic scenario from a real project or codebase (max 140 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "layers", "title": "Project type 1 (max 20 chars)", "body": "How it's used there (max 44 chars)" },
        { "color": "purple", "icon": "code",   "title": "Project type 2 (max 20 chars)", "body": "How it's used there (max 44 chars)" },
        { "color": "green",  "icon": "check",  "title": "Best practice (max 20 chars)",  "body": "The pattern to follow (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Common Mistakes",
      "slideNum": 5, "totalSlides": 6,
      "definition": { "color": "pink", "title": "The bug most beginners write (max 7 words)", "body": "The mistake that causes silent bugs or bad performance (max 140 chars)" },
      "cards": [
        { "color": "pink",   "icon": "warning", "title": "Wrong way (max 20 chars)",  "body": "What not to write (max 44 chars)" },
        { "color": "green",  "icon": "check",   "title": "Right way (max 20 chars)",   "body": "The correct pattern (max 44 chars)" },
        { "color": "amber",  "icon": "lightning","title": "Pro shortcut (max 20 chars)", "body": "The advanced idiom (max 44 chars)" }
      ]
    },
    { "template": "cta", "heading": "Code Every Day", "slideNum": 6, "totalSlides": 6, "cards": [] }
  ]
}
STRICT RULES:
- colors: "cyan","purple","green","pink","amber" only
- icons: "search","gear","database","book","brain","robot","plus","lock","lightning","check","warning","clock","code","layers" only
- Return ONLY raw JSON`;
}

// ── Prompt: Quick Tips (5 slides) ─────────────────────────────────────────────
function buildQuickTipsPrompt(topic: string, category: string, difficulty: string): string {
  const diffNote = difficultyNote(difficulty);
  return `Create a 5-slide quick-tips ${category} series about: "${topic}"
Difficulty: ${difficulty} (${diffNote})
Each slide is a single punchy tip or fact. High-signal, low-fluff.
Return ONLY raw JSON — no markdown fences, no extra text.

{
  "title": "Punchy tips title (max 8 words)",
  "slides": [
    {
      "template": "definition-steps",
      "heading": "Tip #1: [one-line tip title]",
      "slideNum": 1, "totalSlides": 5,
      "definition": { "color": "cyan", "title": "The key insight in 6 words", "body": "Why this tip matters and how to apply it (max 140 chars)" },
      "cards": [
        { "color": "cyan",   "icon": "check", "title": "Do this (max 20 chars)",     "body": "Specific action (max 44 chars)" },
        { "color": "green",  "icon": "check", "title": "Because (max 20 chars)",      "body": "The reason it works (max 44 chars)" },
        { "color": "purple", "icon": "lightning", "title": "Pro move (max 20 chars)", "body": "Advanced application (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #2: [one-line tip title]",
      "slideNum": 2, "totalSlides": 5,
      "definition": { "color": "purple", "title": "The key insight in 6 words", "body": "Why this tip matters and how to apply it (max 140 chars)" },
      "cards": [
        { "color": "purple", "icon": "check",     "title": "Do this (max 20 chars)",     "body": "Specific action (max 44 chars)" },
        { "color": "cyan",   "icon": "check",     "title": "Because (max 20 chars)",      "body": "The reason it works (max 44 chars)" },
        { "color": "green",  "icon": "lightning", "title": "Pro move (max 20 chars)",     "body": "Advanced application (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #3: [one-line tip title]",
      "slideNum": 3, "totalSlides": 5,
      "definition": { "color": "green", "title": "The key insight in 6 words", "body": "Why this tip matters and how to apply it (max 140 chars)" },
      "cards": [
        { "color": "green",  "icon": "check",     "title": "Do this (max 20 chars)",     "body": "Specific action (max 44 chars)" },
        { "color": "purple", "icon": "check",     "title": "Because (max 20 chars)",      "body": "The reason it works (max 44 chars)" },
        { "color": "cyan",   "icon": "lightning", "title": "Pro move (max 20 chars)",     "body": "Advanced application (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #4: [one-line tip title]",
      "slideNum": 4, "totalSlides": 5,
      "definition": { "color": "amber", "title": "The key insight in 6 words", "body": "Why this tip matters and how to apply it (max 140 chars)" },
      "cards": [
        { "color": "amber",  "icon": "check",     "title": "Do this (max 20 chars)",     "body": "Specific action (max 44 chars)" },
        { "color": "cyan",   "icon": "check",     "title": "Because (max 20 chars)",      "body": "The reason it works (max 44 chars)" },
        { "color": "purple", "icon": "lightning", "title": "Pro move (max 20 chars)",     "body": "Advanced application (max 44 chars)" }
      ]
    },
    {
      "template": "definition-steps",
      "heading": "Tip #5: [one-line tip title]",
      "slideNum": 5, "totalSlides": 5,
      "definition": { "color": "pink", "title": "The key insight in 6 words", "body": "Why this tip matters and how to apply it (max 140 chars)" },
      "cards": [
        { "color": "pink",   "icon": "check",     "title": "Do this (max 20 chars)",     "body": "Specific action (max 44 chars)" },
        { "color": "green",  "icon": "check",     "title": "Because (max 20 chars)",      "body": "The reason it works (max 44 chars)" },
        { "color": "amber",  "icon": "lightning", "title": "Pro move (max 20 chars)",     "body": "Advanced application (max 44 chars)" }
      ]
    }
  ]
}
STRICT RULES:
- heading for each slide MUST start with "Tip #N: " followed by a concrete one-line tip title
- colors: "cyan","purple","green","pink","amber" only
- icons: "search","gear","database","book","brain","robot","plus","lock","lightning","check","warning","clock","code","layers" only
- Return ONLY raw JSON`;
}

// ── Route prompt by layout ─────────────────────────────────────────────────────
function buildPrompt(topic: string, category: string, difficulty: string, layout: LayoutId = "quiz-reveal"): string {
  switch (layout) {
    case "explainer":    return buildExplainerPrompt(topic, category, difficulty);
    case "code-example": return buildCodeExamplePrompt(topic, category, difficulty);
    case "quick-tips":   return buildQuickTipsPrompt(topic, category, difficulty);
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
    max_tokens: 4096,
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
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
      max_tokens: 4096,
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
      max_tokens: 4096,
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
      max_tokens: 4096,
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
      console.log(`[quiz-generator] ✓ ${provider.name} succeeded`);
      return {
        slug: slugify(`${topic}-${Date.now()}`),
        title: parsed.title ?? topic,
        topic,
        category,
        difficulty,
        slides: parsed.slides,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[quiz-generator] ✗ ${provider.name}: ${msg}`);
      errors.push(`${provider.name}: ${msg}`);
    }
  }

  throw new Error(`All providers failed:\n${errors.join("\n")}`);
}

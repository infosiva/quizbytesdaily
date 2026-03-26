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

function buildPrompt(topic: string, category: string, difficulty: string): string {
  const diffNote =
    difficulty === "Beginner"
      ? "clear simple language, no jargon"
      : difficulty === "Intermediate"
      ? "assume basic knowledge, use proper terms"
      : "assume solid knowledge, go deep";

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
  difficulty: string
): Promise<GeneratedSeries> {
  const prompt = buildPrompt(topic, category, difficulty);

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

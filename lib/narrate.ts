/**
 * lib/narrate.ts
 * Extracts a natural-language narration script from each slide's data.
 * Used by the video renderer to generate per-slide TTS voice-over.
 */

interface CardLike { title?: string; body?: string; label?: string }

function clean(s: unknown): string {
  return String(s ?? "")
    .replace(/\*\*/g, "")   // strip markdown bold
    .replace(/`/g, "")       // strip backticks
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Returns a natural-language narration string for the given slide.
 * Returns "" for slides that should be silent (e.g. pure-code slides).
 */
export function slideNarration(template: string, data: Record<string, unknown>): string {
  switch (template) {

    case "definition-steps": {
      const parts: string[] = [];
      const heading  = clean(data.heading);
      const subtitle = clean(data.subtitle);
      if (heading)  parts.push(heading);
      if (subtitle && subtitle !== heading) parts.push(subtitle);

      const def = data.definition as { title?: string; body?: string } | undefined;
      if (def?.title) {
        parts.push(`${clean(def.title)}. ${clean(def.body)}`);
      }

      const cards = (data.cards ?? []) as CardLike[];
      for (const c of cards.slice(0, 4)) {
        const t = clean(c.title);
        const b = clean(c.body);
        if (t) parts.push(b ? `${t}. ${b}` : t);
      }
      return parts.join(". ").replace(/\.+/g, ".").replace(/\s+/g, " ").trim();
    }

    case "code-quiz": {
      const parts: string[] = [];
      const question = clean(data.question ?? data.heading ?? "");
      if (question) parts.push(`Here's a coding question. ${question}`);

      const cards = (data.cards ?? []) as CardLike[];
      const labels = ["A", "B", "C", "D"];
      cards.forEach((c, i) => {
        const t = clean(c.title ?? c.label);
        if (t) parts.push(`Option ${labels[i] ?? String(i + 1)}: ${t}`);
      });
      if (cards.length > 0) parts.push("Take a moment to think.");
      return parts.join(". ").trim();
    }

    case "pipeline":
    case "grid-overview": {
      const parts: string[] = [];
      const heading = clean(data.heading);
      if (heading) parts.push(heading);
      const subtitle = clean(data.subtitle);
      if (subtitle) parts.push(subtitle);
      const cards = (data.cards ?? []) as CardLike[];
      for (const c of cards.slice(0, 5)) {
        const t = clean(c.title ?? c.label);
        const b = clean(c.body);
        if (t) parts.push(b ? `${t}. ${b}` : t);
      }
      return parts.join(". ").trim();
    }

    case "flowchart": {
      const heading = clean(data.heading);
      const nodes   = (data.nodes ?? []) as { label?: string }[];
      const flow    = nodes.map((n) => clean(n.label)).filter(Boolean).join(", then ");
      return [heading, flow].filter(Boolean).join(". ");
    }

    case "comparison-table": {
      const parts: string[] = [clean(data.heading)];
      const rows = (data.rows ?? []) as { label?: string; a?: string; b?: string }[];
      for (const row of rows.slice(0, 5)) {
        if (row.label && (row.a || row.b)) {
          parts.push(`${clean(row.label)}: ${clean(row.a)} versus ${clean(row.b)}`);
        }
      }
      return parts.filter(Boolean).join(". ");
    }

    case "cta":
      return "Subscribe for daily tech quizzes and don't miss tomorrow's challenge!";

    default: {
      // Generic fallback — read heading + any short string values
      const parts: string[] = [];
      for (const [key, val] of Object.entries(data)) {
        if (["slideNum", "totalSlides", "color", "language"].includes(key)) continue;
        if (typeof val === "string" && val.length > 2 && val.length < 300) {
          parts.push(clean(val));
        }
      }
      return parts.slice(0, 6).join(". ").trim();
    }
  }
}

// ── Voice pool — randomly chosen per video for variety ────────────────────────
export const VOICES = [
  "en-US-GuyNeural",    // calm male
  "en-US-AriaNeural",   // friendly female
  "en-US-EricNeural",   // warm male
  "en-US-JennyNeural",  // professional female
  "en-GB-RyanNeural",   // British male
  "en-AU-WilliamNeural", // Australian male
];

/** Pick a random voice for the day (same voice within one video) */
export function pickVoice(): string {
  return VOICES[Math.floor(Math.random() * VOICES.length)];
}

// ── Daily topic rotation ───────────────────────────────────────────────────────
// All topic content derives from TRENDING_TOPICS in quiz-generator.ts.
// To add topics or categories: update TRENDING_TOPICS — nothing else changes here.

import { TRENDING_TOPICS, type LayoutId } from "@/lib/quiz-generator";
import { CAT_EMOJI } from "@/lib/config";

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
  typeLabel: string;
}

// ── Category defaults — layout, difficulty, upload hour ───────────────────────
// Only metadata lives here; actual topics come from TRENDING_TOPICS.
const CATEGORY_DEFAULTS: Record<string, {
  layout: LayoutId;
  difficulty: string;
  uploadHourUtc: number;
}> = {
  "AI/ML":          { layout: "quiz-reveal",  difficulty: "Intermediate", uploadHourUtc: 9  },
  "Python":         { layout: "code-example", difficulty: "Beginner",     uploadHourUtc: 10 },
  "AI Productivity":{ layout: "quick-tips",   difficulty: "Beginner",     uploadHourUtc: 11 },
  "Algorithms":     { layout: "quiz-reveal",  difficulty: "Intermediate", uploadHourUtc: 12 },
  "JavaScript":     { layout: "code-example", difficulty: "Beginner",     uploadHourUtc: 13 },
  "System Design":  { layout: "explainer",    difficulty: "Advanced",     uploadHourUtc: 14 },
  "DevOps":         { layout: "quick-tips",   difficulty: "Intermediate", uploadHourUtc: 15 },
  "AI Evaluation":  { layout: "quiz-reveal",  difficulty: "Intermediate", uploadHourUtc: 16 },
  "AI Engineering": { layout: "explainer",    difficulty: "Intermediate", uploadHourUtc: 17 },
};

// Fallback defaults for categories not listed above
const DEFAULT_CAT_META = { layout: "explainer" as LayoutId, difficulty: "Beginner", uploadHourUtc: 9 };

function getCatMeta(cat: string) {
  return CATEGORY_DEFAULTS[cat] ?? DEFAULT_CAT_META;
}

// ── Compute day-of-year (0-indexed) ───────────────────────────────────────────
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86_400_000);
}

// ── Daily rotation — built dynamically from TRENDING_TOPICS ───────────────────
// Interleaves all categories so you get variety across every day.
// Rebuilds automatically when TRENDING_TOPICS is updated.
function buildDailyRotation(): Omit<HotSuggestion, "idx">[] {
  const cats = Object.keys(TRENDING_TOPICS);
  const result: Omit<HotSuggestion, "idx">[] = [];
  const maxLen = Math.max(...cats.map((c) => (TRENDING_TOPICS[c] ?? []).length), 1);

  for (let round = 0; round < maxLen; round++) {
    for (const cat of cats) {
      const topics = TRENDING_TOPICS[cat] ?? [];
      if (topics.length === 0) continue;
      const topic  = topics[round % topics.length];
      const meta   = getCatMeta(cat);
      const icon   = CAT_EMOJI[cat] ?? "💡";
      result.push({
        icon, category: cat, topic,
        layout: meta.layout,
        difficulty: meta.difficulty,
        typeLabel: LAYOUT_LABELS[meta.layout] ?? "📖 Explainer",
      });
    }
  }
  return result;
}

const _DAILY_ROTATION = buildDailyRotation();

export function getOneDailyTopic(date?: Date): Omit<HotSuggestion, "idx"> {
  const day = dayOfYear(date ?? new Date());
  return _DAILY_ROTATION[day % _DAILY_ROTATION.length];
}

// ── Hot suggestions — top picks from priority categories ──────────────────────
// Dynamically picks the first 8 topics from the hottest categories.
// No hardcoding — just update TRENDING_TOPICS to change what appears here.
function buildHotSuggestions(): HotSuggestion[] {
  // Categories shown in order; first entry gets more slots
  const slots: { cat: string; count: number }[] = [
    { cat: "AI/ML",           count: 3 },
    { cat: "AI Productivity", count: 2 },
    { cat: "Python",          count: 1 },
    { cat: "JavaScript",      count: 1 },
    { cat: "Algorithms",      count: 1 },
  ];

  const result: HotSuggestion[] = [];
  for (const { cat, count } of slots) {
    const topics = TRENDING_TOPICS[cat] ?? [];
    const meta   = getCatMeta(cat);
    const icon   = CAT_EMOJI[cat] ?? "💡";
    for (let i = 0; i < Math.min(count, topics.length); i++) {
      result.push({
        idx: result.length, icon, category: cat,
        topic: topics[i],
        layout: meta.layout,
        difficulty: meta.difficulty,
        typeLabel: LAYOUT_LABELS[meta.layout] ?? "📖 Explainer",
      });
    }
    if (result.length >= 8) break;
  }
  return result;
}

// Exported for backward compatibility (Telegram bot reads this)
export const HOT_SUGGESTIONS: HotSuggestion[] = buildHotSuggestions();

// ── Daily topic plan ──────────────────────────────────────────────────────────

export interface DailyTopic {
  category: string;
  topic: string;
  layout: LayoutId;
  difficulty: string;
  icon: string;
  uploadHourUtc: number;
}

// Returns today's upload plan: one topic per scheduled category, chosen by day-of-year.
// Topics rotate through TRENDING_TOPICS — fully automatic, no list to maintain.
export function getDailyTopics(date?: Date): DailyTopic[] {
  const day  = dayOfYear(date ?? new Date());
  // Only schedule categories that have a defined upload slot
  const scheduled = Object.keys(CATEGORY_DEFAULTS);

  return scheduled.map((cat) => {
    const topics = TRENDING_TOPICS[cat] ?? [];
    const topic  = topics.length > 0 ? topics[day % topics.length] : `${cat} fundamentals`;
    const meta   = getCatMeta(cat);
    return {
      category: cat,
      topic,
      layout:   meta.layout,
      difficulty: meta.difficulty,
      icon:     CAT_EMOJI[cat] ?? "💡",
      uploadHourUtc: meta.uploadHourUtc,
    };
  });
}

// Get the scheduled_at datetime string for a given upload slot
export function getScheduledAt(date: Date, hourUtc: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + 1); // next day
  d.setUTCHours(hourUtc, 0, 0, 0);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

// Format hour for display (e.g. 9 → "9:00 AM", 13 → "1:00 PM")
export function fmtHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

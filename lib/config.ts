export const channelConfig = {
  name: "QuizBytesDaily",
  handle: "@QuizBytesDaily",
  tagline: "Test your tech knowledge, daily.",
  subtext: "Bite-sized quiz Shorts on Python, Algorithms, AI & more",
  youtubeUrl: "https://www.youtube.com/@QuizBytesDaily",
  youtubeSubscribeUrl: "https://www.youtube.com/@QuizBytesDaily?sub_confirmation=1",
  websiteUrl: "https://quizbytes.dev",
  description:
    "A daily tech quiz Shorts channel. Every day we post a bite-sized quiz question on Python, Algorithms, AI, System Design, and JavaScript. Test yourself, learn something new, and level up — one question at a time.",
  stats: {
    videos: "50+",
    cadence: "Daily Uploads",
    access: "Free & Open",
  },
} as const;

export const brandColors = {
  background: "#0a0a0f",
  card: "#111118",
  border: "#1e1e2e",
  primary: "#a855f7",   // vivid purple
  accent: "#22d3ee",    // cyan
  highlight: "#fbbf24", // amber
  danger: "#f87171",    // red
  success: "#4ade80",   // green
} as const;

// Categories are derived from TRENDING_TOPICS keys in quiz-generator.ts — do NOT hardcode here.
// Use Object.keys(TRENDING_TOPICS) wherever a category list is needed.

export const difficulties = ["Beginner", "Intermediate", "Advanced"] as const;
export type Difficulty = (typeof difficulties)[number];

// ── Category emojis — shared across all pages ──────────────────────────────────
// Add a new key here when adding a new TRENDING_TOPICS category.
export const CAT_EMOJI: Record<string, string> = {
  "AI/ML":          "🤖",
  "AI Evaluation":  "🎯",
  "AI Engineering": "⚙️",
  "AI Productivity":"💡",
  "Python":         "🐍",
  "Algorithms":     "🧮",
  "JavaScript":     "⚡",
  "TypeScript":     "📘",
  "System Design":  "🏗️",
  "DevOps":         "🛠️",
  "React":          "⚛️",
  "Docker":         "🐳",
  "Database":       "🗄️",
  "Data Structures":"🌳",
  "Machine Learning":"🧠",
};

import type { Category, Difficulty } from "./config";

export interface QuizVideo {
  id: string;
  title: string;
  /** YouTube Short video ID — leave "" until published */
  youtubeId: string;
  category: Category;
  difficulty: Difficulty;
  /** ISO date string e.g. "2026-03-25" */
  date: string;
  featured?: boolean;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Add your published Shorts here. Example entry:
//
// {
//   id: "q001",
//   title: "What does *args actually do in Python?",
//   youtubeId: "abc123xyz",          ← YouTube Short video ID
//   category: "Python",              ← "Python" | "Algorithms" | "JavaScript" | "AI/ML" | "System Design"
//   difficulty: "Beginner",          ← "Beginner" | "Intermediate" | "Advanced"
//   date: "2026-03-25",              ← ISO date
//   featured: true,                  ← optional: shows in Preview section
//   description: "Short blurb shown under the title on the card.",
// },
// ─────────────────────────────────────────────────────────────────────────────
export const videos: QuizVideo[] = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function videoUrl(v: QuizVideo): string {
  return v.youtubeId
    ? `https://www.youtube.com/shorts/${v.youtubeId}`
    : "https://www.youtube.com/@QuizBytesDaily";
}

export function thumbnailUrl(v: QuizVideo): string {
  return v.youtubeId ? `https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg` : "";
}

export function getFeaturedVideo(): QuizVideo | undefined {
  return videos.find((v) => v.featured) ?? videos[0];
}

export function getVideosByCategory(category: Category): QuizVideo[] {
  if (category === "All") return videos;
  return videos.filter((v) => v.category === category);
}

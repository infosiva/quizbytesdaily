import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug } from "@/lib/db";

// ── Category colour map ────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, { primary: string; dark: string; accent: string }> = {
  "Python":           { primary: "#60a5fa", dark: "#1d4ed8", accent: "#3b82f6" },
  "Algorithms":       { primary: "#c084fc", dark: "#6d28d9", accent: "#a855f7" },
  "JavaScript":       { primary: "#fbbf24", dark: "#b45309", accent: "#f59e0b" },
  "TypeScript":       { primary: "#38bdf8", dark: "#0369a1", accent: "#0ea5e9" },
  "AI/ML":            { primary: "#22d3ee", dark: "#0e7490", accent: "#06b6d4" },
  "System Design":    { primary: "#4ade80", dark: "#166534", accent: "#22c55e" },
  "React":            { primary: "#67e8f9", dark: "#164e63", accent: "#22d3ee" },
  "Docker":           { primary: "#60a5fa", dark: "#1e3a8a", accent: "#3b82f6" },
  "Database":         { primary: "#fb923c", dark: "#9a3412", accent: "#f97316" },
  "Machine Learning": { primary: "#a78bfa", dark: "#4c1d95", accent: "#8b5cf6" },
  "DevOps":           { primary: "#34d399", dark: "#064e3b", accent: "#10b981" },
  "Data Structures":  { primary: "#f472b6", dark: "#831843", accent: "#ec4899" },
};
const FALLBACK_COLORS = [
  { primary: "#f472b6", dark: "#831843", accent: "#ec4899" },
  { primary: "#fb923c", dark: "#7c2d12", accent: "#f97316" },
  { primary: "#a78bfa", dark: "#4c1d95", accent: "#8b5cf6" },
  { primary: "#34d399", dark: "#064e3b", accent: "#10b981" },
  { primary: "#38bdf8", dark: "#0c4a6e", accent: "#0ea5e9" },
];
function getColor(cat: string) {
  if (cat in CAT_COLORS) return CAT_COLORS[cat];
  const h = [...cat].reduce((a, c) => a + c.charCodeAt(0), 0);
  return FALLBACK_COLORS[h % FALLBACK_COLORS.length];
}

// ── Difficulty labels ────────────────────────────────────────────────────────
const DIFF_LABEL: Record<string, { text: string; color: string }> = {
  Beginner:     { text: "BEGINNER",     color: "#4ade80" },
  Intermediate: { text: "INTERMEDIATE", color: "#fbbf24" },
  Advanced:     { text: "ADVANCED",     color: "#f87171" },
};

// ── SVG text-safe escape ──────────────────────────────────────────────────────
function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Word-wrap: split title into ≤2 lines of ≤28 chars ─────────────────────────
function wrapTitle(title: string): [string, string] {
  if (title.length <= 26) return [title, ""];
  const words = title.split(" ");
  let line1 = "";
  let line2 = "";
  for (const w of words) {
    if (line1.length === 0) { line1 = w; continue; }
    if (line1.length + 1 + w.length <= 26) { line1 += " " + w; }
    else { line2 += (line2 ? " " : "") + w; }
  }
  // If line2 is very long, truncate
  if (line2.length > 30) line2 = line2.slice(0, 28) + "…";
  return [line1, line2];
}

// ── Dot-grid path (reusable pattern) ─────────────────────────────────────────
function dotGrid(color: string) {
  // 20×20 tiling of a single 2px dot — generated inline as pattern element
  return `
    <defs>
      <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1.2" fill="${color}" opacity="0.18"/>
      </pattern>
    </defs>
    <rect width="1280" height="720" fill="url(#dots)"/>
  `;
}

// ── Circuit lines decoration (top-right area) ─────────────────────────────────
function circuitLines(color: string) {
  return `
    <g opacity="0.12" stroke="${color}" stroke-width="1.5" fill="none">
      <polyline points="900,0 900,80 960,80 960,140 1040,140"/>
      <polyline points="1100,0 1100,60 1040,60 1040,140"/>
      <circle cx="960" cy="80"  r="4" fill="${color}"/>
      <circle cx="1040" cy="140" r="4" fill="${color}"/>
      <polyline points="1200,200 1140,200 1140,260 1060,260"/>
      <circle cx="1140" cy="200" r="3" fill="${color}"/>
      <polyline points="820,600 820,660 880,660 880,720"/>
      <circle cx="820" cy="660" r="3" fill="${color}"/>
    </g>
  `;
}

// ── Main SVG builder ──────────────────────────────────────────────────────────
function buildSvg(
  title: string,
  category: string,
  difficulty: string,
  slideCount: number,
): string {
  const col = getColor(category);
  const diff = DIFF_LABEL[difficulty] ?? { text: difficulty.toUpperCase(), color: "#94a3b8" };
  const [line1, line2] = wrapTitle(esc(title));
  const titleY1 = line2 ? 320 : 360;
  const titleY2 = titleY1 + 72;

  // Category badge width estimate (8px per char + 32px padding)
  const catText = esc(category.toUpperCase());
  const catW = catText.length * 9 + 36;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <linearGradient id="bggrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#08080f"/>
      <stop offset="60%" stop-color="#0d0b1c"/>
      <stop offset="100%" stop-color="#090b18"/>
    </linearGradient>
    <radialGradient id="topright" cx="90%" cy="5%" r="55%">
      <stop offset="0%" stop-color="${col.dark}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${col.dark}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bottomleft" cx="5%" cy="95%" r="40%">
      <stop offset="0%" stop-color="${col.accent}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${col.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="centreglow" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="${col.primary}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${col.primary}" stop-opacity="0"/>
    </radialGradient>
    <filter id="textglow">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bggrad)"/>
  <rect width="1280" height="720" fill="url(#topright)"/>
  <rect width="1280" height="720" fill="url(#bottomleft)"/>
  <rect width="1280" height="720" fill="url(#centreglow)"/>

  <!-- Dot grid -->
  ${dotGrid(col.primary)}

  <!-- Circuit decorations -->
  ${circuitLines(col.primary)}

  <!-- Left accent bar -->
  <rect x="0" y="0" width="6" height="720" fill="${col.primary}" opacity="0.9"/>

  <!-- Large decorative "?" watermark -->
  <text x="860" y="640" font-size="600" font-weight="900"
    font-family="Arial Black,Arial,sans-serif"
    fill="${col.primary}" opacity="0.045" text-anchor="middle"
    transform="rotate(-8,860,640)">?</text>

  <!-- Hexagon decoration top-right -->
  <polygon points="1160,120 1200,96 1240,120 1240,168 1200,192 1160,168"
    fill="none" stroke="${col.primary}" stroke-width="1.5" opacity="0.2"/>
  <polygon points="1100,80 1130,62 1160,80 1160,116 1130,134 1100,116"
    fill="none" stroke="${col.primary}" stroke-width="1" opacity="0.12"/>

  <!-- ── Content area ─────────────────────────────── -->

  <!-- Category badge -->
  <rect x="48" y="52" width="${catW}" height="38" rx="8"
    fill="${col.dark}" opacity="0.85"/>
  <rect x="48" y="52" width="${catW}" height="38" rx="8"
    fill="none" stroke="${col.primary}" stroke-width="1" opacity="0.5"/>
  <text x="${48 + catW / 2}" y="77" text-anchor="middle"
    font-size="16" font-weight="800" letter-spacing="2"
    font-family="Arial,sans-serif" fill="${col.primary}">${catText}</text>

  <!-- Title lines -->
  <text x="48" y="${titleY1}"
    font-size="62" font-weight="900"
    font-family="Arial Black,Arial,sans-serif"
    fill="white" filter="url(#textglow)" opacity="0.96">${line1}</text>
  ${line2 ? `<text x="48" y="${titleY2}"
    font-size="62" font-weight="900"
    font-family="Arial Black,Arial,sans-serif"
    fill="white" opacity="0.96">${line2}</text>` : ""}

  <!-- Divider line -->
  <rect x="48" y="${line2 ? titleY2 + 28 : titleY1 + 28}" width="120" height="4" rx="2" fill="${col.primary}" opacity="0.7"/>

  <!-- Difficulty chip -->
  <rect x="48" y="${line2 ? titleY2 + 52 : titleY1 + 52}" width="${diff.text.length * 8 + 28}" height="30" rx="6"
    fill="${diff.color}18"/>
  <rect x="48" y="${line2 ? titleY2 + 52 : titleY1 + 52}" width="${diff.text.length * 8 + 28}" height="30" rx="6"
    fill="none" stroke="${diff.color}" stroke-width="1" opacity="0.5"/>
  <text x="${48 + (diff.text.length * 8 + 28) / 2}" y="${(line2 ? titleY2 : titleY1) + 72}"
    text-anchor="middle" font-size="13" font-weight="700" letter-spacing="1.5"
    font-family="Arial,sans-serif" fill="${diff.color}">${diff.text}</text>

  <!-- Slide count badge (bottom right) -->
  <rect x="${1280 - 48 - 110}" y="${720 - 48 - 38}" width="110" height="38" rx="8"
    fill="#ffffff08"/>
  <rect x="${1280 - 48 - 110}" y="${720 - 48 - 38}" width="110" height="38" rx="8"
    fill="none" stroke="${col.primary}" stroke-width="1" opacity="0.3"/>
  <text x="${1280 - 48 - 55}" y="${720 - 48 - 12}"
    text-anchor="middle" font-size="15" font-weight="700"
    font-family="Arial,sans-serif" fill="${col.primary}" opacity="0.9">
    ${slideCount} slides
  </text>

  <!-- Brand bottom-left -->
  <text x="48" y="${720 - 22}"
    font-size="18" font-weight="700" letter-spacing="0.5"
    font-family="Arial,sans-serif" fill="${col.primary}" opacity="0.6">QuizBytesDaily</text>

</svg>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const series = await getSeriesBySlug(slug);
  if (!series) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Count slides via slide_count if present (listSeries joins it, but getSeriesBySlug doesn't)
  // We'll use a fallback of 0 and query if needed — for now reuse series.slide_count if truthy
  const slideCount = (series as { slide_count?: number }).slide_count ?? 0;

  const svg = buildSvg(
    series.title,
    series.category,
    series.difficulty,
    slideCount,
  );

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}

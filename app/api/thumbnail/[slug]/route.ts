import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug } from "@/lib/db";

// ── Category colour map ────────────────────────────────────────────────────────
const CAT_COLORS: Record<string, { primary: string; dark: string; accent: string }> = {
  "Python":           { primary: "#60a5fa", dark: "#1d4ed8", accent: "#3b82f6" },
  "Algorithms":       { primary: "#c084fc", dark: "#6d28d9", accent: "#a855f7" },
  "JavaScript":       { primary: "#fbbf24", dark: "#b45309", accent: "#f59e0b" },
  "TypeScript":       { primary: "#38bdf8", dark: "#0369a1", accent: "#0ea5e9" },
  "AI/ML":            { primary: "#22d3ee", dark: "#0e7490", accent: "#06b6d4" },
  "AI":               { primary: "#22d3ee", dark: "#0e7490", accent: "#06b6d4" },
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

const DIFF_LABEL: Record<string, { text: string; color: string }> = {
  Beginner:     { text: "BEGINNER",     color: "#4ade80" },
  Intermediate: { text: "INTERMEDIATE", color: "#fbbf24" },
  Advanced:     { text: "ADVANCED",     color: "#f87171" },
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapTitle(title: string): [string, string] {
  if (title.length <= 24) return [title, ""];
  const words = title.split(" ");
  let line1 = "";
  let line2 = "";
  for (const w of words) {
    if (!line1) { line1 = w; continue; }
    if (line1.length + 1 + w.length <= 24) line1 += " " + w;
    else line2 += (line2 ? " " : "") + w;
  }
  if (line2.length > 26) line2 = line2.slice(0, 24) + "…";
  return [line1, line2];
}

// ── Abstract grid decoration (replaces ? mark) ────────────────────────────────
function abstractGrid(color: string) {
  // Isometric cube pattern — on-brand for tech/quiz channel
  const lines: string[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 820 + col * 72 - row * 36;
      const y = 160 + row * 60 + col * 20;
      const op = 0.06 - row * 0.008;
      if (op <= 0) continue;
      lines.push(`
        <polygon points="${x},${y} ${x + 36},${y - 20} ${x + 72},${y} ${x + 72},${y + 40} ${x + 36},${y + 60} ${x},${y + 40}"
          fill="none" stroke="${color}" stroke-width="1" opacity="${op.toFixed(3)}"/>
      `);
    }
  }
  return lines.join("");
}

// ── Animated-feel stat blobs ──────────────────────────────────────────────────
function glowOrbs(color: string) {
  return `
    <circle cx="960" cy="120" r="180" fill="${color}" opacity="0.04"/>
    <circle cx="1100" cy="580" r="120" fill="${color}" opacity="0.03"/>
    <circle cx="200" cy="600" r="200" fill="${color}" opacity="0.03"/>
  `;
}

// ── Main SVG builder (1280×720, crisp text) ───────────────────────────────────
function buildSvg(title: string, category: string, difficulty: string, slideCount: number): string {
  const col  = getColor(category);
  const diff = DIFF_LABEL[difficulty] ?? { text: difficulty.toUpperCase(), color: "#94a3b8" };
  const [line1, line2] = wrapTitle(esc(title));
  const titleY1 = line2 ? 310 : 350;
  const titleY2 = titleY1 + 76;

  const catText = esc(category.toUpperCase());
  const catW    = catText.length * 9.5 + 36;
  const diffW   = diff.text.length * 8.5 + 28;
  const afterTitle = line2 ? titleY2 : titleY1;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
    <stop offset="0%"   stop-color="#08080f"/>
    <stop offset="55%"  stop-color="#0d0b1c"/>
    <stop offset="100%" stop-color="#090b18"/>
  </linearGradient>
  <linearGradient id="titlegrad" x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" x1="48" y1="0" x2="800" y2="0">
    <stop offset="0%"   stop-color="#ffffff"/>
    <stop offset="70%"  stop-color="#e2e8f0"/>
    <stop offset="100%" stop-color="${col.primary}"/>
  </linearGradient>
  <radialGradient id="topright" cx="90%" cy="5%" r="55%">
    <stop offset="0%" stop-color="${col.dark}" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="${col.dark}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="botleft" cx="5%" cy="95%" r="40%">
    <stop offset="0%" stop-color="${col.accent}" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="${col.accent}" stop-opacity="0"/>
  </radialGradient>
</defs>

<!-- Background -->
<rect width="1280" height="720" fill="url(#bg)"/>
<rect width="1280" height="720" fill="url(#topright)"/>
<rect width="1280" height="720" fill="url(#botleft)"/>

<!-- Glow orbs -->
${glowOrbs(col.primary)}

<!-- Isometric grid (replaces ? mark) -->
${abstractGrid(col.primary)}

<!-- Dot grid overlay -->
<defs>
  <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="${col.primary}" opacity="0.14"/>
  </pattern>
</defs>
<rect width="1280" height="720" fill="url(#dots)"/>

<!-- Left accent bar -->
<rect x="0" y="0" width="5" height="720" fill="${col.primary}" opacity="0.95"/>

<!-- Top accent stripe -->
<rect x="0" y="0" width="1280" height="3" fill="url(#titlegrad)" opacity="0.6"/>

<!-- ── Content ────────────────── -->

<!-- Category badge -->
<rect x="48" y="52" width="${catW}" height="38" rx="9"
  fill="${col.dark}" opacity="0.9"/>
<rect x="48" y="52" width="${catW}" height="38" rx="9"
  fill="none" stroke="${col.primary}" stroke-width="1.5" opacity="0.6"/>
<text x="${48 + catW / 2}" y="78" text-anchor="middle"
  font-size="15" font-weight="800" letter-spacing="2.5"
  font-family="Arial,Helvetica,sans-serif" fill="${col.primary}">${catText}</text>

<!-- Title — crisp, no blur -->
<text x="48" y="${titleY1}"
  font-size="68" font-weight="900"
  font-family="Arial Black,Arial,Helvetica,sans-serif"
  fill="white">${line1}</text>
${line2 ? `<text x="48" y="${titleY2}"
  font-size="68" font-weight="900"
  font-family="Arial Black,Arial,Helvetica,sans-serif"
  fill="${col.primary}">${line2}</text>` : ""}

<!-- Accent divider -->
<rect x="48" y="${afterTitle + 24}" width="100" height="4" rx="2" fill="${col.primary}" opacity="0.85"/>
<rect x="160" y="${afterTitle + 26}" width="40" height="2" rx="1" fill="${col.primary}" opacity="0.35"/>

<!-- Difficulty pill -->
<rect x="48" y="${afterTitle + 46}" width="${diffW}" height="32" rx="7"
  fill="${diff.color}18"/>
<rect x="48" y="${afterTitle + 46}" width="${diffW}" height="32" rx="7"
  fill="none" stroke="${diff.color}" stroke-width="1.5" opacity="0.6"/>
<text x="${48 + diffW / 2}" y="${afterTitle + 68}"
  text-anchor="middle" font-size="13" font-weight="800" letter-spacing="2"
  font-family="Arial,Helvetica,sans-serif" fill="${diff.color}">${diff.text}</text>

<!-- Slide count — bottom right -->
${slideCount > 0 ? `
<rect x="${1280 - 48 - 118}" y="${720 - 48 - 38}" width="118" height="38" rx="9"
  fill="#ffffff06"/>
<rect x="${1280 - 48 - 118}" y="${720 - 48 - 38}" width="118" height="38" rx="9"
  fill="none" stroke="${col.primary}" stroke-width="1" opacity="0.3"/>
<text x="${1280 - 48 - 59}" y="${720 - 48 - 12}"
  text-anchor="middle" font-size="15" font-weight="700"
  font-family="Arial,Helvetica,sans-serif" fill="${col.primary}" opacity="0.9">
  ${slideCount} slides
</text>` : ""}

<!-- Brand — bottom left -->
<text x="48" y="${720 - 22}"
  font-size="17" font-weight="700" letter-spacing="0.5"
  font-family="Arial,Helvetica,sans-serif" fill="${col.primary}" opacity="0.55">QuizBytesDaily</text>

</svg>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const series   = await getSeriesBySlug(slug);
  if (!series) return new NextResponse("Not found", { status: 404 });

  const slideCount = (series as { slide_count?: number }).slide_count ?? 0;
  const svg        = buildSvg(series.title, series.category, series.difficulty, slideCount);

  return new NextResponse(svg, {
    headers: {
      "Content-Type":  "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
    },
  });
}

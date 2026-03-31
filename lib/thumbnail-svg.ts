/**
 * thumbnail-svg.ts
 * Generates 1280×720 JPEG thumbnails for YouTube quiz shorts.
 *
 * Text is rendered as SVG <path> elements using Poppins Bold via opentype.js
 * (same approach as slide-svg.ts) so Sharp/librsvg needs no system fonts.
 */

import { thumbSvgPath, thumbWrapText, thumbTextW, thumbGetSharp } from "./slide-svg";

// ── Canvas size ────────────────────────────────────────────────────────────────
const W = 1280;
const H = 720;

// ── Category → colour map ─────────────────────────────────────────────────────
const CAT_COLORS: Record<string, { primary: string; dark: string; accent: string }> = {
  "Python":           { primary: "#60a5fa", dark: "#1d4ed8",  accent: "#3b82f6" },
  "Algorithms":       { primary: "#c084fc", dark: "#6d28d9",  accent: "#a855f7" },
  "JavaScript":       { primary: "#fbbf24", dark: "#b45309",  accent: "#f59e0b" },
  "TypeScript":       { primary: "#38bdf8", dark: "#0369a1",  accent: "#0ea5e9" },
  "AI/ML":            { primary: "#22d3ee", dark: "#0e7490",  accent: "#06b6d4" },
  "AI":               { primary: "#22d3ee", dark: "#0e7490",  accent: "#06b6d4" },
  "System Design":    { primary: "#4ade80", dark: "#166534",  accent: "#22c55e" },
  "React":            { primary: "#67e8f9", dark: "#164e63",  accent: "#22d3ee" },
  "Docker":           { primary: "#60a5fa", dark: "#1e3a8a",  accent: "#3b82f6" },
  "Database":         { primary: "#fb923c", dark: "#9a3412",  accent: "#f97316" },
  "Machine Learning": { primary: "#a78bfa", dark: "#4c1d95",  accent: "#8b5cf6" },
  "DevOps":           { primary: "#34d399", dark: "#064e3b",  accent: "#10b981" },
  "Data Structures":  { primary: "#f472b6", dark: "#831843",  accent: "#ec4899" },
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

const DIFF_COLORS: Record<string, string> = {
  Beginner:     "#4ade80",
  Intermediate: "#fbbf24",
  Advanced:     "#f87171",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function roundRect(x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string): string {
  const s = stroke ? ` fill="none" stroke="${stroke}" stroke-width="1.5"` : ` fill="${fill}"`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"${s}/>`;
}

// ── SVG wrapper (1280×720) ────────────────────────────────────────────────────
function svgWrapper(content: string, col: { primary: string; dark: string; accent: string }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
    <stop offset="0%"   stop-color="#06060f"/>
    <stop offset="50%"  stop-color="#09091e"/>
    <stop offset="100%" stop-color="#07071a"/>
  </linearGradient>
  <radialGradient id="gltr" cx="92%" cy="4%"  r="48%">
    <stop offset="0%"   stop-color="${col.dark}"    stop-opacity="0.65"/>
    <stop offset="100%" stop-color="${col.dark}"    stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glbl" cx="4%"  cy="92%" r="40%">
    <stop offset="0%"   stop-color="${col.accent}"  stop-opacity="0.18"/>
    <stop offset="100%" stop-color="${col.accent}"  stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="qglow" cx="82%" cy="50%" r="35%">
    <stop offset="0%"   stop-color="${col.primary}" stop-opacity="0.28"/>
    <stop offset="55%"  stop-color="${col.primary}" stop-opacity="0.08"/>
    <stop offset="100%" stop-color="${col.primary}" stop-opacity="0"/>
  </radialGradient>
  <pattern id="dots" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1.3" fill="${col.primary}" opacity="0.16"/>
  </pattern>
</defs>
<!-- Background -->
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#gltr)"/>
<rect width="${W}" height="${H}" fill="url(#glbl)"/>
<rect width="${W}" height="${H}" fill="url(#qglow)"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
${content}
</svg>`;
}

// ── Main SVG builder ──────────────────────────────────────────────────────────
export function buildThumbnailSvg(
  title: string,
  category: string,
  difficulty: string,
): string {
  const col      = getColor(category);
  const diffColor = DIFF_COLORS[difficulty] ?? "#94a3b8";
  const parts: string[] = [];

  // Left accent stripe
  parts.push(`<rect x="0" y="0" width="8" height="${H}" fill="${col.primary}" opacity="0.95"/>`);

  // ── RIGHT SIDE: question mark visual ──────────────────────────────────────
  const qcx = 1040;
  const qcy = 360;
  parts.push(`<circle cx="${qcx}" cy="${qcy}" r="248" fill="${col.primary}" opacity="0.06"/>`);
  parts.push(`<circle cx="${qcx}" cy="${qcy}" r="208" fill="none" stroke="${col.primary}" stroke-width="1.5" opacity="0.2"/>`);
  parts.push(`<circle cx="${qcx}" cy="${qcy}" r="158" fill="${col.dark}" opacity="0.4"/>`);
  // "?" rendered as path — no font needed
  const qStr  = "?";
  const qFs   = 220;
  const qW    = thumbTextW(qStr, qFs);
  parts.push(thumbSvgPath(qStr, qcx - qW / 2, qcy + qFs * 0.38, qFs, col.primary));

  // ── LEFT SIDE content (x = 28, max-right = 840) ───────────────────────────
  const PADX   = 28;
  const MAXW   = 820; // available width for text in left panel

  // Category badge
  const catText = category.toUpperCase();
  const catFs   = 18;
  const catBadgeW = thumbTextW(catText, catFs) + 36;
  parts.push(roundRect(PADX, 48, catBadgeW, 40, 9, `${col.dark}cc`));
  parts.push(roundRect(PADX, 48, catBadgeW, 40, 9, "none", `${col.primary}90`));
  parts.push(thumbSvgPath(catText, PADX + 18, 48 + 28, catFs, col.primary));

  // "QUIZ" badge next to category
  const quizText  = "QUIZ";
  const quizFs    = 17;
  const quizBadgeX = PADX + catBadgeW + 14;
  const quizBadgeW = thumbTextW(quizText, quizFs) + 30;
  parts.push(roundRect(quizBadgeX, 48, quizBadgeW, 40, 9, `${col.accent}22`));
  parts.push(thumbSvgPath(quizText, quizBadgeX + 15, 48 + 28, quizFs, col.accent));

  // Difficulty chip (right of quiz badge)
  const diffText  = difficulty.toUpperCase();
  const diffFs    = 16;
  const diffBadgeX = quizBadgeX + quizBadgeW + 14;
  const diffBadgeW = thumbTextW(diffText, diffFs) + 28;
  parts.push(roundRect(diffBadgeX, 48, diffBadgeW, 40, 9, `${diffColor}18`));
  parts.push(roundRect(diffBadgeX, 48, diffBadgeW, 40, 9, "none", `${diffColor}80`));
  parts.push(thumbSvgPath(diffText, diffBadgeX + 14, 48 + 27, diffFs, diffColor));

  // ── Title ─────────────────────────────────────────────────────────────────
  // Auto-size: start at 88px, shrink until text fits in ≤3 lines
  let titleFs = 88;
  let titleLines: string[] = [];
  for (let it = 0; it < 10; it++) {
    titleLines = thumbWrapText(title, MAXW, titleFs);
    if (titleLines.length <= 3) break;
    titleFs = Math.max(56, titleFs - 6);
  }

  const titleLH     = Math.round(titleFs * 1.2);
  const totalTitleH = titleLines.length * titleLH;
  // Center the title block vertically between badges and brand line
  const contentTop  = 115; // below badges
  const contentBot  = H - 68; // above brand
  const titleY      = Math.round((contentTop + contentBot - totalTitleH) / 2) + Math.round(titleFs * 0.82);

  titleLines.forEach((line, i) => {
    const isLastAndMultiple = i === titleLines.length - 1 && titleLines.length > 1;
    const fill = isLastAndMultiple ? col.primary : "#ffffff";
    parts.push(thumbSvgPath(line, PADX, titleY + i * titleLH, titleFs, fill));
  });

  // Accent underline after title
  const underY = titleY + (titleLines.length - 1) * titleLH + 22;
  parts.push(`<rect x="${PADX}" y="${underY}" width="88" height="5" rx="2.5" fill="${col.primary}" opacity="0.9"/>`);
  parts.push(`<rect x="${PADX + 98}" y="${underY + 1}" width="36" height="3" rx="1.5" fill="${col.primary}" opacity="0.35"/>`);

  // "DAILY TECH QUIZ" tagline
  const tagText = "DAILY TECH QUIZ";
  const tagFs   = 17;
  parts.push(thumbSvgPath(tagText, PADX, underY + 38, tagFs, `${col.primary}80`));

  // Brand (bottom-left)
  const brandText = "@QuizBytesDaily";
  const brandFs   = 20;
  parts.push(thumbSvgPath(brandText, PADX, H - 22, brandFs, `${col.primary}88`));

  return svgWrapper(parts.join("\n"), col);
}

// ── Vertical title card 1080×1920 (for video first frame) ────────────────────
// Used as the first frame of the rendered MP4 so YouTube auto-picks a good thumbnail.
export function buildTitleCardSvg(
  title: string,
  category: string,
  difficulty: string,
): string {
  const TW = 1080, TH = 1920;
  const col = getColor(category);
  const diffColor = DIFF_COLORS[difficulty] ?? "#94a3b8";
  const parts: string[] = [];

  const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${TH}" viewBox="0 0 ${TW} ${TH}">
<defs>
  <linearGradient id="tcbg" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%"   stop-color="#07071a"/>
    <stop offset="60%"  stop-color="#0b0b20"/>
    <stop offset="100%" stop-color="#060614"/>
  </linearGradient>
  <radialGradient id="tglow" cx="50%" cy="48%" r="52%">
    <stop offset="0%"   stop-color="${col.dark}"    stop-opacity="0.70"/>
    <stop offset="60%"  stop-color="${col.dark}"    stop-opacity="0.25"/>
    <stop offset="100%" stop-color="${col.dark}"    stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="tbglow" cx="50%" cy="48%" r="38%">
    <stop offset="0%"   stop-color="${col.primary}" stop-opacity="0.15"/>
    <stop offset="100%" stop-color="${col.primary}" stop-opacity="0"/>
  </radialGradient>
  <pattern id="tdots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1.5" fill="${col.primary}" opacity="0.12"/>
  </pattern>
</defs>
<rect width="${TW}" height="${TH}" fill="url(#tcbg)"/>
<rect width="${TW}" height="${TH}" fill="url(#tglow)"/>
<rect width="${TW}" height="${TH}" fill="url(#tbglow)"/>
<rect width="${TW}" height="${TH}" fill="url(#tdots)"/>`;

  // Glow rings around ? — smaller, centred higher to leave room for title
  const cx = TW / 2;
  const qcy = 680;
  parts.push(`<circle cx="${cx}" cy="${qcy}" r="260" fill="${col.primary}" opacity="0.06"/>`);
  parts.push(`<circle cx="${cx}" cy="${qcy}" r="200" fill="none" stroke="${col.primary}" stroke-width="2" opacity="0.18"/>`);
  parts.push(`<circle cx="${cx}" cy="${qcy}" r="148" fill="${col.dark}" opacity="0.55"/>`);
  parts.push(`<circle cx="${cx}" cy="${qcy}" r="144" fill="none" stroke="${col.primary}" stroke-width="1.5" opacity="0.22"/>`);

  // "?" — smaller
  const qFs = 200;
  const qStr = "?";
  const qW   = thumbTextW(qStr, qFs);
  parts.push(thumbSvgPath(qStr, cx - qW / 2, qcy + qFs * 0.38, qFs, col.primary));

  // ── Top badges ───────────────────────────────────────────────────────────
  const PADX = 72;
  const catText   = category.toUpperCase();
  const catFs     = 26;
  const catBadgeW = thumbTextW(catText, catFs) + 48;
  parts.push(roundRect(PADX, 80, catBadgeW, 52, 12, `${col.dark}cc`));
  parts.push(roundRect(PADX, 80, catBadgeW, 52, 12, "none", `${col.primary}90`));
  parts.push(thumbSvgPath(catText, PADX + 24, 80 + 35, catFs, col.primary));

  const diffText   = difficulty.toUpperCase();
  const diffFs     = 24;
  const diffBadgeX = PADX + catBadgeW + 20;
  const diffBadgeW = thumbTextW(diffText, diffFs) + 40;
  parts.push(roundRect(diffBadgeX, 80, diffBadgeW, 52, 12, `${diffColor}18`));
  parts.push(roundRect(diffBadgeX, 80, diffBadgeW, 52, 12, "none", `${diffColor}70`));
  parts.push(thumbSvgPath(diffText, diffBadgeX + 20, 80 + 34, diffFs, diffColor));

  // ── Title — positioned higher, more breathing room ────────────────────────
  const MAXW = TW - PADX * 2;
  let titleFs = 100;
  let titleLines: string[] = [];
  for (let it = 0; it < 10; it++) {
    titleLines = thumbWrapText(title, MAXW, titleFs);
    if (titleLines.length <= 3) break;
    titleFs = Math.max(66, titleFs - 6);
  }
  const titleLH = Math.round(titleFs * 1.2);
  const ty = 1000;  // was 1180 — moved up 180px
  titleLines.forEach((line, i) => {
    const fill = (i === titleLines.length - 1 && titleLines.length > 1) ? col.primary : "#ffffff";
    parts.push(thumbSvgPath(line, PADX, ty + i * titleLH, titleFs, fill));
  });

  // Underline accent
  const ulY = ty + titleLines.length * titleLH + 14;
  parts.push(`<rect x="${PADX}" y="${ulY}" width="110" height="6" rx="3" fill="${col.primary}" opacity="0.85"/>`);
  parts.push(`<rect x="${PADX + 124}" y="${ulY + 1}" width="50" height="4" rx="2" fill="${col.primary}" opacity="0.32"/>`);

  // Category tag line below underline (extra visual info + spacing)
  parts.push(thumbSvgPath(`${category} · Quiz`, PADX, ulY + 52, 30, `${col.primary}70`));

  // Brand
  const brandText = "@QuizBytesDaily";
  const brandFs   = 30;
  parts.push(thumbSvgPath(brandText, PADX, TH - 72, brandFs, `${col.primary}90`));

  // Left accent stripe
  parts.push(`<rect x="0" y="0" width="10" height="${TH}" fill="${col.primary}" opacity="0.90"/>`);

  return `${bg}\n${parts.join("\n")}\n</svg>`;
}

export async function buildTitleCardPng(
  title: string,
  category: string,
  difficulty: string,
): Promise<Buffer> {
  const svg   = buildTitleCardSvg(title, category, difficulty);
  const sharp = await thumbGetSharp();
  return sharp(Buffer.from(svg)).png().toBuffer();
}

// ── JPEG render (Sharp) ───────────────────────────────────────────────────────
export async function buildThumbnailJpeg(
  title: string,
  category: string,
  difficulty: string,
): Promise<Buffer> {
  const svg   = buildThumbnailSvg(title, category, difficulty);
  const sharp = await thumbGetSharp();
  return sharp(Buffer.from(svg)).jpeg({ quality: 93 }).toBuffer();
}

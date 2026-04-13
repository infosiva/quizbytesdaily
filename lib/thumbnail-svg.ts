/**
 * thumbnail-svg.ts
 * Generates 1280×720 JPEG thumbnails for YouTube quiz shorts.
 *
 * Text is rendered as SVG <path> elements using Poppins Bold via opentype.js
 * (same approach as slide-svg.ts) so Sharp/librsvg needs no system fonts.
 *
 * NEW: optional `question` param — shows the actual quiz question on the
 * thumbnail so viewers instantly see "CAN YOU ANSWER THIS?" which drives clicks.
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
  if (stroke) return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${stroke}" stroke-width="1.5"/>`;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
}

// ── SVG wrapper (1280×720) — enhanced gradients for 2026 look ────────────────
function svgWrapper(content: string, col: { primary: string; dark: string; accent: string }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1" gradientUnits="objectBoundingBox">
    <stop offset="0%"   stop-color="#04040e"/>
    <stop offset="55%"  stop-color="#070715"/>
    <stop offset="100%" stop-color="#050512"/>
  </linearGradient>
  <!-- Top-right category glow -->
  <radialGradient id="gltr" cx="100%" cy="0%" r="60%">
    <stop offset="0%"   stop-color="${col.dark}"    stop-opacity="0.85"/>
    <stop offset="55%"  stop-color="${col.dark}"    stop-opacity="0.20"/>
    <stop offset="100%" stop-color="${col.dark}"    stop-opacity="0"/>
  </radialGradient>
  <!-- Bottom-left subtle accent -->
  <radialGradient id="glbl" cx="0%" cy="100%" r="48%">
    <stop offset="0%"   stop-color="${col.accent}"  stop-opacity="0.25"/>
    <stop offset="100%" stop-color="${col.accent}"  stop-opacity="0"/>
  </radialGradient>
  <!-- Right-centre "?" halo -->
  <radialGradient id="qglow" cx="80%" cy="50%" r="38%">
    <stop offset="0%"   stop-color="${col.primary}" stop-opacity="0.36"/>
    <stop offset="50%"  stop-color="${col.primary}" stop-opacity="0.12"/>
    <stop offset="100%" stop-color="${col.primary}" stop-opacity="0"/>
  </radialGradient>
  <!-- Left content area warm glow -->
  <radialGradient id="lglow" cx="20%" cy="50%" r="42%">
    <stop offset="0%"   stop-color="${col.primary}" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="${col.primary}" stop-opacity="0"/>
  </radialGradient>
  <!-- Dot pattern -->
  <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1.4" fill="${col.primary}" opacity="0.14"/>
  </pattern>
  <!-- Vertical divider gradient -->
  <linearGradient id="divider" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%"   stop-color="${col.primary}" stop-opacity="0"/>
    <stop offset="30%"  stop-color="${col.primary}" stop-opacity="0.35"/>
    <stop offset="70%"  stop-color="${col.primary}" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="${col.primary}" stop-opacity="0"/>
  </linearGradient>
</defs>
<!-- Background layers -->
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#gltr)"/>
<rect width="${W}" height="${H}" fill="url(#glbl)"/>
<rect width="${W}" height="${H}" fill="url(#qglow)"/>
<rect width="${W}" height="${H}" fill="url(#lglow)"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
${content}
</svg>`;
}

// ── Main SVG builder ──────────────────────────────────────────────────────────
export function buildThumbnailSvg(
  title: string,
  category: string,
  difficulty: string,
  question?: string,          // first quiz question text (makes thumbnail context-aware)
): string {
  const col       = getColor(category);
  const diffColor = DIFF_COLORS[difficulty] ?? "#94a3b8";
  const parts: string[] = [];
  const hasQuestion = Boolean(question?.trim());

  // ── Left accent stripe ─────────────────────────────────────────────────────
  parts.push(`<rect x="0" y="0" width="10" height="${H}" fill="${col.primary}" opacity="0.95"/>`);

  // ── Vertical divider between left content and right "?" decoration ─────────
  parts.push(`<rect x="830" y="0" width="1.5" height="${H}" fill="url(#divider)"/>`);

  // ── RIGHT SIDE — "?" decoration ────────────────────────────────────────────
  const qcx = 1060, qcy = 360;
  // Outer halo rings
  parts.push(`<circle cx="${qcx}" cy="${qcy}" r="295" fill="${col.primary}" opacity="0.03"/>`);
  parts.push(`<circle cx="${qcx}" cy="${qcy}" r="248" fill="none" stroke="${col.primary}" stroke-width="1" opacity="0.10"/>`);
  parts.push(`<circle cx="${qcx}" cy="${qcy}" r="198" fill="none" stroke="${col.primary}" stroke-width="1.5" opacity="0.18"/>`);
  // Inner glow disc
  parts.push(`<circle cx="${qcx}" cy="${qcy}" r="152" fill="${col.dark}" opacity="0.60"/>`);
  parts.push(`<circle cx="${qcx}" cy="${qcy}" r="148" fill="none" stroke="${col.primary}" stroke-width="2" opacity="0.35"/>`);
  // "?" glyph
  const qStr = "?";
  const qFs  = 210;
  const qW   = thumbTextW(qStr, qFs);
  parts.push(thumbSvgPath(qStr, qcx - qW / 2, qcy + qFs * 0.38, qFs, col.primary));

  // ── LEFT SIDE — content area (x: 26 .. 820) ────────────────────────────────
  const PADX = 26;
  const MAXW = 786;

  // ── TOP BADGES ─────────────────────────────────────────────────────────────
  const catText   = category.toUpperCase();
  const catFs     = 20;
  const catBadgeW = thumbTextW(catText, catFs) + 36;
  const BADGE_Y   = 44;
  const BADGE_H   = 44;

  // Category badge
  parts.push(roundRect(PADX, BADGE_Y, catBadgeW, BADGE_H, 10, `${col.dark}dd`));
  parts.push(roundRect(PADX, BADGE_Y, catBadgeW, BADGE_H, 10, "none", `${col.primary}90`));
  parts.push(thumbSvgPath(catText, PADX + 18, BADGE_Y + 30, catFs, col.primary));

  // Difficulty badge
  const diffText   = difficulty.toUpperCase();
  const diffFs     = 18;
  const diffBadgeX = PADX + catBadgeW + 14;
  const diffBadgeW = thumbTextW(diffText, diffFs) + 28;
  parts.push(roundRect(diffBadgeX, BADGE_Y, diffBadgeW, BADGE_H, 10, `${diffColor}18`));
  parts.push(roundRect(diffBadgeX, BADGE_Y, diffBadgeW, BADGE_H, 10, "none", `${diffColor}70`));
  parts.push(thumbSvgPath(diffText, diffBadgeX + 14, BADGE_Y + 30, diffFs, diffColor));

  // ── CONTENT ────────────────────────────────────────────────────────────────
  if (hasQuestion) {
    // ── Question-based layout ─────────────────────────────────────────────
    // "CAN YOU ANSWER THIS?" hook line
    const hookText = "CAN YOU ANSWER THIS?";
    const hookFs   = 34;
    parts.push(thumbSvgPath(hookText, PADX, 128, hookFs, `${col.primary}cc`));

    // Separator line
    parts.push(`<rect x="${PADX}" y="144" width="580" height="2.5" rx="1.25" fill="${col.primary}" opacity="0.30"/>`);

    // Question text — auto-size, max 3 lines
    let qFs2 = 66;
    let qLines: string[] = [];
    for (let it = 0; it < 10; it++) {
      qLines = thumbWrapText(question!, MAXW, qFs2);
      if (qLines.length <= 3) break;
      qFs2 = Math.max(44, qFs2 - 5);
    }
    const qLH    = Math.round(qFs2 * 1.22);
    const qTextY = 162 + qFs2; // first baseline

    qLines.forEach((line, i) => {
      const isLast = i === qLines.length - 1;
      const fill   = (isLast && qLines.length > 1) ? col.primary : "#ffffff";
      parts.push(thumbSvgPath(line, PADX, qTextY + i * qLH, qFs2, fill));
    });

    const afterQY = qTextY + (qLines.length - 1) * qLH;

    // "A B C D" option chips — colorful indicator that it's multiple choice
    const chipLabels = ["A", "B", "C", "D"];
    const chipColors = ["#60a5fa", "#c084fc", "#4ade80", "#f472b6"];
    const chipW = 52, chipH = 42, chipGap = 12;
    const chipsY = Math.min(afterQY + 36, 550);

    chipLabels.forEach((label, i) => {
      const cx = PADX + i * (chipW + chipGap);
      // Filled background
      parts.push(roundRect(cx, chipsY, chipW, chipH, 10, `${chipColors[i]}22`));
      // Border
      parts.push(roundRect(cx, chipsY, chipW, chipH, 10, "none", `${chipColors[i]}65`));
      // Letter
      const lW = thumbTextW(label, 23);
      parts.push(thumbSvgPath(label, cx + (chipW - lW) / 2, chipsY + 30, 23, chipColors[i]));
    });

    // Underline accent
    const ulY = chipsY + chipH + 20;
    if (ulY < H - 60) {
      parts.push(`<rect x="${PADX}" y="${ulY}" width="90" height="4" rx="2" fill="${col.primary}" opacity="0.75"/>`);
      parts.push(`<rect x="${PADX + 104}" y="${ulY + 1}" width="40" height="2.5" rx="1.25" fill="${col.primary}" opacity="0.28"/>`);
      if (ulY + 36 < H - 28) {
        parts.push(thumbSvgPath("DAILY TECH QUIZ", PADX, ulY + 34, 17, `${col.primary}70`));
      }
    }

  } else {
    // ── Title-only fallback layout ────────────────────────────────────────
    let titleFs = 86;
    let titleLines: string[] = [];
    for (let it = 0; it < 10; it++) {
      titleLines = thumbWrapText(title, MAXW, titleFs);
      if (titleLines.length <= 3) break;
      titleFs = Math.max(54, titleFs - 6);
    }
    const titleLH    = Math.round(titleFs * 1.2);
    const totalTitleH = titleLines.length * titleLH;
    const contentTop  = 115;
    const contentBot  = H - 68;
    const titleY      = Math.round((contentTop + contentBot - totalTitleH) / 2) + Math.round(titleFs * 0.82);

    titleLines.forEach((line, i) => {
      const isLast = i === titleLines.length - 1;
      const fill   = (isLast && titleLines.length > 1) ? col.primary : "#ffffff";
      parts.push(thumbSvgPath(line, PADX, titleY + i * titleLH, titleFs, fill));
    });

    const underY = titleY + (titleLines.length - 1) * titleLH + 22;
    parts.push(`<rect x="${PADX}" y="${underY}" width="88" height="5" rx="2.5" fill="${col.primary}" opacity="0.90"/>`);
    parts.push(`<rect x="${PADX + 102}" y="${underY + 1}" width="38" height="3" rx="1.5" fill="${col.primary}" opacity="0.32"/>`);
    parts.push(thumbSvgPath("DAILY TECH QUIZ", PADX, underY + 38, 17, `${col.primary}80`));
  }

  // ── Brand — bottom left ────────────────────────────────────────────────────
  parts.push(thumbSvgPath("@QuizBytesDaily", PADX, H - 20, 22, `${col.primary}92`));

  // ── URL — bottom right ─────────────────────────────────────────────────────
  const urlText = "quizbytes.dev";
  const urlFs   = 18;
  const urlW    = thumbTextW(urlText, urlFs);
  parts.push(thumbSvgPath(urlText, W - urlW - 22, H - 20, urlFs, "#47556988"));

  return svgWrapper(parts.join("\n"), col);
}

// ── Vertical title card 1080×1920 (for video first frame) ────────────────────
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

  // Glow rings around ? — centred higher to leave room for title
  const cx = TW / 2;
  const qcy = 680;
  parts.push(`<circle cx="${cx}" cy="${qcy}" r="260" fill="${col.primary}" opacity="0.06"/>`);
  parts.push(`<circle cx="${cx}" cy="${qcy}" r="200" fill="none" stroke="${col.primary}" stroke-width="2" opacity="0.18"/>`);
  parts.push(`<circle cx="${cx}" cy="${qcy}" r="148" fill="${col.dark}" opacity="0.55"/>`);
  parts.push(`<circle cx="${cx}" cy="${qcy}" r="144" fill="none" stroke="${col.primary}" stroke-width="1.5" opacity="0.22"/>`);

  // "?" glyph
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
  const ty = 1000;
  titleLines.forEach((line, i) => {
    const fill = (i === titleLines.length - 1 && titleLines.length > 1) ? col.primary : "#ffffff";
    parts.push(thumbSvgPath(line, PADX, ty + i * titleLH, titleFs, fill));
  });

  // Underline accent
  const ulY = ty + titleLines.length * titleLH + 14;
  parts.push(`<rect x="${PADX}" y="${ulY}" width="110" height="6" rx="3" fill="${col.primary}" opacity="0.85"/>`);
  parts.push(`<rect x="${PADX + 124}" y="${ulY + 1}" width="50" height="4" rx="2" fill="${col.primary}" opacity="0.32"/>`);

  // Category tag line below underline
  parts.push(thumbSvgPath(`${category} · Quiz`, PADX, ulY + 52, 30, `${col.primary}70`));

  // Brand
  parts.push(thumbSvgPath("@QuizBytesDaily", PADX, TH - 72, 30, `${col.primary}90`));

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
  question?: string,
): Promise<Buffer> {
  const svg   = buildThumbnailSvg(title, category, difficulty, question);
  const sharp = await thumbGetSharp();
  return sharp(Buffer.from(svg)).jpeg({ quality: 94 }).toBuffer();
}

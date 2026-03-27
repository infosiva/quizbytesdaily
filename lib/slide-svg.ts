/**
 * slide-svg.ts
 * Generates 1080×1920 PNG frames for each quiz slide template.
 * Uses SVG for visual design (gradients, icons, card borders) then
 * converts to PNG via Sharp — same quality as the browser preview.
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";

// ── Canvas size ────────────────────────────────────────────────────────────────
const W = 1080;
const H = 1920;

// ── Colour palette ─────────────────────────────────────────────────────────────
const CARD_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  cyan:   { text: "#22d3ee", border: "#22d3ee66", bg: "#22d3ee18" },
  purple: { text: "#a855f7", border: "#a855f766", bg: "#a855f718" },
  green:  { text: "#4ade80", border: "#4ade8066", bg: "#4ade8018" },
  pink:   { text: "#f472b6", border: "#f472b666", bg: "#f472b618" },
  amber:  { text: "#fbbf24", border: "#fbbf2466", bg: "#fbbf2418" },
};

// ── Font: embed DejaVu Bold as base64 so it works on every platform ────────────
let _fontB64: string | null = null;
function getFontB64(): string {
  if (_fontB64 !== null) return _fontB64;
  const p = path.join(process.cwd(), "fonts", "DejaVuSans-Bold.ttf");
  _fontB64 = fs.existsSync(p) ? fs.readFileSync(p).toString("base64") : "";
  return _fontB64;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Approximate character width for DejaVu Sans Bold at given font-size
function charW(fontSize: number): number { return fontSize * 0.6; }

function wrapText(text: string, maxW: number, fontSize: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length * charW(fontSize) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Render multi-line text block; returns SVG elements string + total height
function textBlock(
  text: string,
  x: number,
  y: number,
  maxW: number,
  fontSize: number,
  fill: string,
  opts: { anchor?: "start" | "middle"; lineH?: number } = {}
): { svg: string; height: number } {
  const lines = wrapText(text, maxW, fontSize);
  const lh = opts.lineH ?? Math.round(fontSize * 1.35);
  const anchor = opts.anchor ?? "start";
  const tx = anchor === "middle" ? x + maxW / 2 : x;
  const svgLines = lines.map((line, i) =>
    `<text x="${tx}" y="${y + i * lh}" font-size="${fontSize}" fill="${fill}" text-anchor="${anchor}" font-family="DVB,Arial,sans-serif" font-weight="700">${esc(line)}</text>`
  );
  return { svg: svgLines.join("\n"), height: lines.length * lh };
}

// ── SVG icons (scaled 24×24 paths, centered at cx,cy, sized to `size`) ─────────
function iconSvg(name: string, color: string, cx: number, cy: number, size: number): string {
  const s = size / 24;
  const ox = cx - size / 2;
  const oy = cy - size / 2;
  const g = (inner: string) =>
    `<g transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${s.toFixed(4)})">${inner}</g>`;

  switch (name) {
    case "search":
      return g(`<circle cx="11" cy="11" r="7" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);
    case "gear":
      return g(`<circle cx="12" cy="12" r="3" fill="none" stroke="${color}" stroke-width="2"/>
        <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18 18l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18 6l1.77-1.77" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`);
    case "database":
      return g(`<ellipse cx="12" cy="5" rx="9" ry="3" fill="none" stroke="${color}" stroke-width="2"/>
        <path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" fill="none" stroke="${color}" stroke-width="2"/>
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" fill="none" stroke="${color}" stroke-width="2"/>`);
    case "book":
      return g(`<path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" fill="${color}"/>`);
    case "brain":
      return g(`<circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="2"/>
        <path d="M9 8c0-1.66 1.34-3 3-3s3 1.34 3 3M9 16c0 1.66 1.34 3 3 3s3-1.34 3-3M7 12h10M12 9v6" stroke="${color}" stroke-width="1.8" stroke-linecap="round" fill="none"/>`);
    case "robot":
      return g(`<rect x="7" y="8" width="10" height="10" rx="2" fill="none" stroke="${color}" stroke-width="2"/>
        <path d="M12 8V6" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="5.5" r="1.5" fill="${color}"/>
        <circle cx="9.5" cy="12.5" r="1.2" fill="${color}"/>
        <circle cx="14.5" cy="12.5" r="1.2" fill="${color}"/>
        <path d="M9.5 17h5M5 11h2M17 11h2" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`);
    case "plus":
      return g(`<path d="M12 5v14M5 12h14" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`);
    case "lock":
      return g(`<rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="${color}" stroke-width="2"/>
        <path d="M8 11V7a4 4 0 1 1 8 0v4" fill="none" stroke="${color}" stroke-width="2"/>
        <circle cx="12" cy="16" r="1" fill="${color}"/>`);
    case "lightning":
      return g(`<path d="M13 2L3 14h9l-1 8 10-12h-9z" fill="${color}"/>`);
    case "check":
      return g(`<circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="2.5"/>
        <polyline points="9,12 11,14 15,10" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`);
    case "warning":
      return g(`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="9" x2="12" y2="13" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="17" r="1" fill="${color}"/>`);
    case "clock":
      return g(`<circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="2"/>
        <polyline points="12,7 12,12 15.5,15.5" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`);
    case "code":
      return g(`<polyline points="16,18 22,12 16,6" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="8,6 2,12 8,18" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
    case "layers":
      return g(`<polygon points="12,2 2,7 12,12 22,7" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <polyline points="2,17 12,22 22,17" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
        <polyline points="2,12 12,17 22,12" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`);
    case "opt_a": case "opt_b": case "opt_c": case "opt_d": {
      const letter = name.slice(-1).toUpperCase();
      return g(`<circle cx="12" cy="12" r="10" fill="${color}22" stroke="${color}" stroke-width="1.8"/>
        <text x="12" y="17.5" text-anchor="middle" font-size="13" font-weight="700" fill="${color}" font-family="Arial,sans-serif">${letter}</text>`);
    }
    default:
      return g(`<circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="2"/>
        <text x="12" y="16" text-anchor="middle" font-size="10" fill="${color}">•</text>`);
  }
}

// ── Rounded rect helper ────────────────────────────────────────────────────────
function roundRect(x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string): string {
  const sw = stroke ? ` stroke="${stroke}" stroke-width="2"` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${sw}/>`;
}

// ── Top progress bar ───────────────────────────────────────────────────────────
function progressBar(slideNum: number, totalSlides: number, color: string): string {
  if (!totalSlides || totalSlides <= 1) return "";
  const dotW = 16;
  const dotH = 10;
  const gap  = 8;
  const totalW = totalSlides * dotW + (totalSlides - 1) * gap;
  const startX = (W - totalW) / 2;
  const dots = Array.from({ length: totalSlides }, (_, i) => {
    const x = startX + i * (dotW + gap);
    const isCurrent = i + 1 === slideNum;
    const isPast    = i + 1 < slideNum;
    const fill = isCurrent ? color : isPast ? `${color}88` : "#1e1e2e";
    const w    = isCurrent ? dotW * 2 : dotW;
    return `<rect x="${x.toFixed(1)}" y="24" width="${w}" height="${dotH}" rx="${dotH / 2}" fill="${fill}"/>`;
  }).join("\n");
  return dots;
}

// ── Card renderer — returns SVG + actual rendered height ──────────────────────
interface CardData { color: string; icon: string; title: string; body: string }

function renderCard(card: CardData, x: number, y: number, availW: number, compact: boolean): { svg: string; height: number } {
  const col    = CARD_COLORS[card.color] ?? CARD_COLORS.purple;
  const padH   = compact ? 28 : 36;
  const padV   = compact ? 24 : 30;
  const iconSz = compact ? 72 : 90;
  const titleFs = compact ? 38 : 44;
  const bodyFs  = compact ? 30 : 36;
  const titleX  = x + padV + iconSz + 24;
  const titleMaxW = availW - padV - iconSz - 24 - padV;

  const titleLines  = wrapText(String(card.title ?? ""), titleMaxW, titleFs);
  const bodyLines   = card.body && card.body.trim()
    ? wrapText(String(card.body), titleMaxW, bodyFs)
    : [];

  const titleH = titleLines.length * Math.round(titleFs * 1.3);
  const bodyH  = bodyLines.length  * Math.round(bodyFs * 1.3);
  const innerH = titleH + (bodyLines.length ? 10 + bodyH : 0);
  const cardH  = Math.max(iconSz + 2 * padH, innerH + 2 * padH);

  const textY  = y + padH + Math.round((cardH - 2 * padH - innerH) / 2);
  const iconCX = x + padV + iconSz / 2;
  const iconCY = y + cardH / 2;

  const svgParts: string[] = [
    // Card background
    roundRect(x, y, availW, cardH, 18, col.bg),
    // Card border
    roundRect(x, y, availW, cardH, 18, "none", col.border),
    // Left accent stripe
    roundRect(x, y, 8, cardH, 4, col.text),
    // Icon background circle
    `<circle cx="${iconCX}" cy="${iconCY}" r="${iconSz / 2 + 4}" fill="${col.text}22"/>`,
    // Icon
    iconSvg(card.icon, col.text, iconCX, iconCY, iconSz),
    // Title lines
    ...titleLines.map((line, i) =>
      `<text x="${titleX}" y="${textY + i * Math.round(titleFs * 1.3)}" font-size="${titleFs}" fill="${col.text}" font-family="DVB,Arial,sans-serif" font-weight="700">${esc(line)}</text>`
    ),
    // Body lines
    ...bodyLines.map((line, i) =>
      `<text x="${titleX}" y="${textY + titleH + 10 + i * Math.round(bodyFs * 1.3)}" font-size="${bodyFs}" fill="#94a3b8" font-family="DVB,Arial,sans-serif">${esc(line)}</text>`
    ),
  ];

  return { svg: svgParts.join("\n"), height: cardH };
}

// ── SVG wrapper with shared defs ───────────────────────────────────────────────
function svgWrapper(content: string): string {
  const fontB64 = getFontB64();
  const fontStyle = fontB64
    ? `<style>@font-face{font-family:'DVB';src:url('data:font/truetype;base64,${fontB64}') format('truetype');}</style>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  ${fontStyle}
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0d0d20"/>
    <stop offset="100%" stop-color="#09091a"/>
  </linearGradient>
  <linearGradient id="hg" gradientUnits="userSpaceOnUse" x1="72" y1="0" x2="${W - 72}" y2="0">
    <stop offset="0%" stop-color="#22d3ee"/>
    <stop offset="65%" stop-color="#60a5fa"/>
    <stop offset="100%" stop-color="#a5f3fc"/>
  </linearGradient>
  <radialGradient id="blob1" cx="0.15" cy="0.12" r="0.5">
    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="blob2" cx="0.85" cy="0.88" r="0.45">
    <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
  </radialGradient>
</defs>
<!-- Background -->
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#blob1)"/>
<rect width="${W}" height="${H}" fill="url(#blob2)"/>
${content}
</svg>`;
}

// ── Slide data interfaces ──────────────────────────────────────────────────────
export interface DefinitionStepsData {
  heading: string;
  subtitle?: string;
  slideNum?: number;
  totalSlides?: number;
  definition?: { color: string; title: string; body: string };
  cards?: CardData[];
}

export interface PipelineData {
  heading: string;
  subtitle?: string;
  slideNum?: number;
  totalSlides?: number;
  cards?: CardData[];
}

export interface CtaData {
  heading?: string;
  slideNum?: number;
  totalSlides?: number;
}

// ── Slide type → accent color ──────────────────────────────────────────────────
function slideAccentColor(heading: string): string {
  if (heading.includes("Quiz") || heading.includes("?"))      return "#fbbf24"; // amber
  if (heading.includes("Answer") || heading.includes("✅"))   return "#4ade80"; // green
  return "#a855f7"; // default purple
}

// ── definition-steps slide ────────────────────────────────────────────────────
function buildDefinitionStepsSvg(data: DefinitionStepsData): string {
  const PADX     = 72;
  const AVAIL    = W - PADX * 2;
  const headingFs = 72;
  const accentCol = slideAccentColor(data.heading ?? "");

  const parts: string[] = [];

  // Progress dots
  parts.push(progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, accentCol));

  let y = 90;

  // Heading
  const headLines = wrapText(esc(data.heading ?? ""), AVAIL, headingFs);
  const headLH    = Math.round(headingFs * 1.2);
  headLines.forEach((line, i) => {
    parts.push(`<text x="${PADX}" y="${y + i * headLH}" font-size="${headingFs}" fill="url(#hg)" font-family="DVB,Arial,sans-serif" font-weight="700">${line}</text>`);
  });
  y += headLines.length * headLH + 20;

  // Subtitle
  if (data.subtitle) {
    parts.push(`<text x="${PADX}" y="${y}" font-size="36" fill="#475569" font-family="DVB,Arial,sans-serif">${esc(data.subtitle)}</text>`);
    y += 50;
  }

  y += 28; // gap before content

  // Definition box
  if (data.definition) {
    const defCol = CARD_COLORS[data.definition.color] ?? CARD_COLORS.cyan;
    const defPadX = 40;
    const defPadY = 32;
    const titleLines = wrapText(String(data.definition.title ?? ""), AVAIL - defPadX * 2, 46);
    const bodyLines  = wrapText(String(data.definition.body  ?? ""), AVAIL - defPadX * 2, 36);
    const titleH = titleLines.length * Math.round(46 * 1.3);
    const bodyH  = bodyLines.length  * Math.round(36 * 1.3);
    const boxH   = titleH + bodyH + defPadY * 2 + 16;

    // Box
    parts.push(roundRect(PADX, y, AVAIL, boxH, 20, defCol.bg));
    parts.push(roundRect(PADX, y, AVAIL, boxH, 20, "none", defCol.border));
    // Top accent line
    parts.push(`<rect x="${PADX + 20}" y="${y}" width="${AVAIL - 40}" height="4" rx="2" fill="${defCol.text}"/>`);

    let ty = y + defPadY + 6;
    titleLines.forEach((line, i) => {
      parts.push(`<text x="${W / 2}" y="${ty + i * Math.round(46 * 1.3)}" font-size="46" fill="${defCol.text}" text-anchor="middle" font-family="DVB,Arial,sans-serif" font-weight="700">${esc(line)}</text>`);
    });
    ty += titleH + 16;
    bodyLines.forEach((line, i) => {
      parts.push(`<text x="${W / 2}" y="${ty + i * Math.round(36 * 1.3)}" font-size="36" fill="rgba(255,255,255,0.72)" text-anchor="middle" font-family="DVB,Arial,sans-serif">${esc(line)}</text>`);
    });

    y += boxH + 28;
  }

  // Cards
  const cards = data.cards ?? [];
  const compact = cards.length >= 4;
  const cardGap = compact ? 14 : 20;

  for (const card of cards) {
    const { svg, height } = renderCard(card, PADX, y, AVAIL, compact);
    parts.push(svg);
    y += height + cardGap;
  }

  // Footer
  const footerY = H - 60;
  // Divider line
  parts.push(`<line x1="${PADX}" y1="${footerY - 20}" x2="${W - PADX}" y2="${footerY - 20}" stroke="#1e1e2e" stroke-width="2"/>`);
  // Handle
  parts.push(`<text x="${PADX}" y="${footerY + 10}" font-size="34" fill="#374151" font-family="DVB,Arial,sans-serif">@QuizBytesDaily</text>`);
  // Slide counter
  if (data.slideNum && data.totalSlides) {
    parts.push(`<text x="${W - PADX}" y="${footerY + 10}" font-size="46" fill="#374151" text-anchor="end" font-family="DVB,Arial,sans-serif">${data.slideNum}/${data.totalSlides}</text>`);
  }

  return svgWrapper(parts.join("\n"));
}

// ── pipeline slide ─────────────────────────────────────────────────────────────
function buildPipelineSvg(data: PipelineData): string {
  const PADX     = 72;
  const AVAIL    = W - PADX * 2;
  const headingFs = 72;
  const accentCol = "#22d3ee";

  const parts: string[] = [];
  parts.push(progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, accentCol));

  let y = 90;

  // Heading
  const headLines = wrapText(esc(data.heading ?? ""), AVAIL, headingFs);
  const headLH    = Math.round(headingFs * 1.2);
  headLines.forEach((line, i) => {
    parts.push(`<text x="${PADX}" y="${y + i * headLH}" font-size="${headingFs}" fill="url(#hg)" font-family="DVB,Arial,sans-serif" font-weight="700">${line}</text>`);
  });
  y += headLines.length * headLH + 20;

  if (data.subtitle) {
    parts.push(`<text x="${PADX}" y="${y}" font-size="36" fill="#475569" font-family="DVB,Arial,sans-serif">${esc(data.subtitle)}</text>`);
    y += 50;
  }

  y += 36;

  const cards   = data.cards ?? [];
  const compact = cards.length >= 5;
  const arrowH  = 36;

  for (let i = 0; i < cards.length; i++) {
    if (i > 0) {
      // Arrow between cards
      const prevCol = CARD_COLORS[cards[i - 1].color] ?? CARD_COLORS.cyan;
      const cx = W / 2;
      parts.push(`<text x="${cx}" y="${y + arrowH - 4}" font-size="32" fill="${prevCol.text}" text-anchor="middle" font-family="Arial,sans-serif" opacity="0.8">▼</text>`);
      y += arrowH;
    }
    const { svg, height } = renderCard(cards[i], PADX, y, AVAIL, compact);
    parts.push(svg);
    y += height;
  }

  // Footer
  const footerY = H - 60;
  parts.push(`<line x1="${PADX}" y1="${footerY - 20}" x2="${W - PADX}" y2="${footerY - 20}" stroke="#1e1e2e" stroke-width="2"/>`);
  parts.push(`<text x="${PADX}" y="${footerY + 10}" font-size="34" fill="#374151" font-family="DVB,Arial,sans-serif">@QuizBytesDaily</text>`);
  if (data.slideNum && data.totalSlides) {
    parts.push(`<text x="${W - PADX}" y="${footerY + 10}" font-size="46" fill="#374151" text-anchor="end" font-family="DVB,Arial,sans-serif">${data.slideNum}/${data.totalSlides}</text>`);
  }

  return svgWrapper(parts.join("\n"));
}

// ── CTA slide ──────────────────────────────────────────────────────────────────
function buildCtaSvg(data: CtaData): string {
  const CX = W / 2;
  const parts: string[] = [
    progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, "#22d3ee"),

    // Big emoji area (drawn as text)
    `<text x="${CX}" y="700" font-size="220" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">🎉</text>`,

    // Heading gradient
    `<text x="${CX}" y="1000" font-size="96" fill="url(#hg)" text-anchor="middle" font-family="DVB,Arial,sans-serif" font-weight="700">${esc(data.heading ?? "Enjoyed This Quiz?")}</text>`,

    // Subtitle
    `<text x="${CX}" y="1090" font-size="40" fill="#64748b" text-anchor="middle" font-family="DVB,Arial,sans-serif">New quiz every day — subscribe so you never miss one</text>`,

    // Subscribe button
    roundRect(CX - 360, 1160, 720, 120, 28, "#a855f7"),
    `<text x="${CX}" y="1238" font-size="52" fill="white" text-anchor="middle" font-family="DVB,Arial,sans-serif" font-weight="700">▶ Subscribe on YouTube</text>`,

    // Divider
    `<line x1="${CX - 180}" y1="1340" x2="${CX + 180}" y2="1340" stroke="#1e1e2e" stroke-width="2"/>`,

    // Website
    `<text x="${CX}" y="1410" font-size="36" fill="#475569" text-anchor="middle" font-family="DVB,Arial,sans-serif">Browse all quizzes at</text>`,
    `<text x="${CX}" y="1470" font-size="50" fill="#22d3ee" text-anchor="middle" font-family="DVB,Arial,sans-serif" font-weight="700">quizbytes.dev</text>`,

    // Footer
    `<text x="72" y="${H - 50}" font-size="34" fill="#374151" font-family="DVB,Arial,sans-serif">@QuizBytesDaily</text>`,
    data.slideNum && data.totalSlides
      ? `<text x="${W - 72}" y="${H - 50}" font-size="46" fill="#374151" text-anchor="end" font-family="DVB,Arial,sans-serif">${data.slideNum}/${data.totalSlides}</text>`
      : "",
  ];

  return svgWrapper(parts.join("\n"));
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function slideToSvg(
  template: string,
  data: Record<string, unknown>
): string {
  switch (template) {
    case "definition-steps":
      return buildDefinitionStepsSvg(data as unknown as DefinitionStepsData);
    case "pipeline":
      return buildPipelineSvg(data as unknown as PipelineData);
    case "cta":
      return buildCtaSvg(data as unknown as CtaData);
    default:
      // Fallback: plain slide with just a heading
      return buildDefinitionStepsSvg({
        heading: String(data.heading ?? template),
        slideNum: data.slideNum as number,
        totalSlides: data.totalSlides as number,
      });
  }
}

/** Convert a slide data object to a PNG Buffer using Sharp */
export async function slideToPng(
  template: string,
  data: Record<string, unknown>
): Promise<Buffer> {
  const svg = slideToSvg(template, data);
  return sharp(Buffer.from(svg)).png().toBuffer();
}

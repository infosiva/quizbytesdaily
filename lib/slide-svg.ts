/**
 * slide-svg.ts
 * Generates 1080×1920 PNG frames for each quiz slide template.
 * Uses SVG for visual design (gradients, icons, card borders) then
 * converts to PNG via Sharp — same quality as the browser preview.
 */

import fs from "fs";
import path from "path";

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

// ── Font: use file:// URI so librsvg can load it (data: URIs not supported) ────
let _fontPath: string | null = null;
function getFontPath(): string {
  if (_fontPath !== null) return _fontPath;
  const p = path.join(process.cwd(), "fonts", "DejaVuSans-Bold.ttf");
  _fontPath = fs.existsSync(p) ? p : "";
  return _fontPath;
}

// ── Sharp (lazy require — prevents Next.js bundling this native module) ────────
async function getSharp() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const m = require("sharp") as { default: typeof import("sharp") };
  return m.default ?? (m as unknown as typeof import("sharp"));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

// ── SVG icons (24×24 viewBox, centered at cx,cy, scaled to `size`) ────────────
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

// ── Progress dots bar at top ───────────────────────────────────────────────────
function progressBar(slideNum: number, totalSlides: number, color: string): string {
  if (!totalSlides || totalSlides <= 1) return "";
  const dotW = 18;
  const dotH = 10;
  const gap  = 10;
  const totalW = totalSlides * dotW + (totalSlides - 1) * gap;
  const startX = (W - totalW) / 2;
  return Array.from({ length: totalSlides }, (_, i) => {
    const x   = startX + i * (dotW + gap);
    const isCurrent = i + 1 === slideNum;
    const isPast    = i + 1 < slideNum;
    const fill = isCurrent ? color : isPast ? `${color}77` : "#1e1e2e";
    const w    = isCurrent ? dotW * 2.4 : dotW;
    return `<rect x="${x.toFixed(1)}" y="30" width="${w}" height="${dotH}" rx="${dotH / 2}" fill="${fill}"/>`;
  }).join("\n");
}

// ── Card at exact height (fills allocated space, text vertically centered) ─────
interface CardData { color: string; icon: string; title: string; body: string }

function renderCardAtHeight(card: CardData, x: number, y: number, availW: number, h: number): string {
  const col    = CARD_COLORS[card.color] ?? CARD_COLORS.purple;
  const padV   = 36;                                              // left/right inner padding
  const iconSz = Math.min(90, Math.max(52, Math.floor(h * 0.5))); // icon scales with card height
  const iconCX = x + padV + iconSz / 2;
  const iconCY = y + h / 2;

  const titleX    = x + padV + iconSz + 28;
  const titleMaxW = availW - padV - iconSz - 28 - padV;

  // Font sizes scale with available height
  const titleFs = Math.min(50, Math.max(30, Math.floor(h * 0.235)));
  const bodyFs  = Math.min(38, Math.max(24, Math.floor(h * 0.172)));
  const titleLH = Math.round(titleFs * 1.28);
  const bodyLH  = Math.round(bodyFs * 1.28);

  const titleLines = wrapText(String(card.title ?? ""), titleMaxW, titleFs);
  const bodyLines  = card.body?.trim() ? wrapText(String(card.body), titleMaxW, bodyFs) : [];
  const titleH     = titleLines.length * titleLH;
  const bodyH      = bodyLines.length * bodyLH;
  const textGap    = bodyLines.length > 0 ? 10 : 0;
  const totalTextH = titleH + textGap + bodyH;

  // Center text block vertically within the card
  const textStartY = y + (h - totalTextH) / 2 + titleFs * 0.82;

  const parts = [
    roundRect(x, y, availW, h, 20, col.bg),
    roundRect(x, y, availW, h, 20, "none", col.border),
    roundRect(x, y, 8, h, 4, col.text),                                  // left accent stripe
    `<circle cx="${iconCX}" cy="${iconCY}" r="${(iconSz / 2 + 7).toFixed(0)}" fill="${col.text}1e"/>`, // icon halo
    iconSvg(card.icon, col.text, iconCX, iconCY, iconSz),
    ...titleLines.map((line, i) =>
      `<text x="${titleX}" y="${(textStartY + i * titleLH).toFixed(1)}" font-size="${titleFs}" fill="${col.text}" font-family="DVB,Arial,sans-serif" font-weight="700">${esc(line)}</text>`
    ),
    ...bodyLines.map((line, i) =>
      `<text x="${titleX}" y="${(textStartY + titleH + textGap + i * bodyLH).toFixed(1)}" font-size="${bodyFs}" fill="#94a3b8" font-family="DVB,Arial,sans-serif">${esc(line)}</text>`
    ),
  ];
  return parts.join("\n");
}

// ── Definition box at exact height (text/title centered inside) ────────────────
function renderDefBoxAtHeight(
  def: { color: string; title: string; body: string },
  x: number, y: number, w: number, h: number
): string {
  const defCol = CARD_COLORS[def.color] ?? CARD_COLORS.cyan;
  const padX   = 48;

  const titleFs = Math.min(52, Math.max(34, Math.floor(h * 0.22)));
  const bodyFs  = Math.min(40, Math.max(26, Math.floor(h * 0.165)));
  const titleLH = Math.round(titleFs * 1.28);
  const bodyLH  = Math.round(bodyFs * 1.28);

  const titleLines = wrapText(String(def.title ?? ""), w - padX * 2, titleFs);
  const bodyLines  = wrapText(String(def.body  ?? ""), w - padX * 2, bodyFs);
  const titleH     = titleLines.length * titleLH;
  const bodyH      = bodyLines.length * bodyLH;
  const textGap    = bodyLines.length > 0 ? 14 : 0;
  const totalTextH = titleH + textGap + bodyH;

  const textStartY = y + (h - totalTextH) / 2 + titleFs * 0.82;
  const cx = x + w / 2;

  return [
    roundRect(x, y, w, h, 20, defCol.bg),
    roundRect(x, y, w, h, 20, "none", defCol.border),
    // top accent bar
    `<rect x="${x + 20}" y="${y}" width="${w - 40}" height="5" rx="2.5" fill="${defCol.text}"/>`,
    ...titleLines.map((line, i) =>
      `<text x="${cx.toFixed(0)}" y="${(textStartY + i * titleLH).toFixed(1)}" font-size="${titleFs}" fill="${defCol.text}" text-anchor="middle" font-family="DVB,Arial,sans-serif" font-weight="700">${esc(line)}</text>`
    ),
    ...bodyLines.map((line, i) =>
      `<text x="${cx.toFixed(0)}" y="${(textStartY + titleH + textGap + i * bodyLH).toFixed(1)}" font-size="${bodyFs}" fill="rgba(255,255,255,0.72)" text-anchor="middle" font-family="DVB,Arial,sans-serif">${esc(line)}</text>`
    ),
  ].join("\n");
}

// ── SVG wrapper with shared defs ───────────────────────────────────────────────
function svgWrapper(content: string): string {
  const fontPath  = getFontPath();
  // librsvg (used by Sharp) does NOT support data: URI fonts — must use file://
  const fontStyle = fontPath
    ? `<style>@font-face{font-family:'DVB';src:url('file://${fontPath}') format('truetype');}</style>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  ${fontStyle}
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0d0d20"/>
    <stop offset="100%" stop-color="#09091a"/>
  </linearGradient>
  <linearGradient id="hg" gradientUnits="userSpaceOnUse" x1="72" y1="0" x2="${W - 72}" y2="0">
    <stop offset="0%"   stop-color="#22d3ee"/>
    <stop offset="65%"  stop-color="#60a5fa"/>
    <stop offset="100%" stop-color="#a5f3fc"/>
  </linearGradient>
  <radialGradient id="blob1" cx="0.15" cy="0.12" r="0.5">
    <stop offset="0%"   stop-color="#a855f7" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="blob2" cx="0.85" cy="0.88" r="0.45">
    <stop offset="0%"   stop-color="#22d3ee" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="#22d3ee" stop-opacity="0"/>
  </radialGradient>
</defs>
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

// ── Accent colour per slide type ───────────────────────────────────────────────
function slideAccentColor(heading: string): string {
  if (heading.includes("Quiz") || heading.includes("?"))    return "#fbbf24";
  if (heading.includes("Answer") || heading.includes("✅")) return "#4ade80";
  return "#a855f7";
}

// ── Shared footer renderer ─────────────────────────────────────────────────────
function footer(parts: string[], slideNum?: number, totalSlides?: number): void {
  const PADX    = 72;
  const dividerY = H - 108;
  parts.push(`<line x1="${PADX}" y1="${dividerY}" x2="${W - PADX}" y2="${dividerY}" stroke="#1e1e2e" stroke-width="2"/>`);
  parts.push(`<text x="${PADX}" y="${H - 54}" font-size="34" fill="#374151" font-family="DVB,Arial,sans-serif">@QuizBytesDaily</text>`);
  if (slideNum && totalSlides) {
    parts.push(`<text x="${W - PADX}" y="${H - 54}" font-size="46" fill="#374151" text-anchor="end" font-family="DVB,Arial,sans-serif">${slideNum}/${totalSlides}</text>`);
  }
}

// ── definition-steps slide ─────────────────────────────────────────────────────
// Content items (def box + cards) are distributed evenly to fill 1080×1920.
function buildDefinitionStepsSvg(data: DefinitionStepsData): string {
  const PADX      = 72;
  const AVAIL     = W - PADX * 2;
  const headingFs = 78;
  const accentCol = slideAccentColor(data.heading ?? "");

  const parts: string[] = [];
  parts.push(progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, accentCol));

  // Heading
  let y = 108;
  const headLines = wrapText(esc(data.heading ?? ""), AVAIL, headingFs);
  const headLH    = Math.round(headingFs * 1.15);
  headLines.forEach((line, i) => {
    parts.push(`<text x="${PADX}" y="${y + i * headLH}" font-size="${headingFs}" fill="url(#hg)" font-family="DVB,Arial,sans-serif" font-weight="700">${line}</text>`);
  });
  y += headLines.length * headLH + 18;

  if (data.subtitle) {
    parts.push(`<text x="${PADX}" y="${y}" font-size="38" fill="#475569" font-family="DVB,Arial,sans-serif">${esc(data.subtitle)}</text>`);
    y += 54;
  }

  // Thin separator below heading
  parts.push(`<line x1="${PADX}" y1="${y + 8}" x2="${W - PADX}" y2="${y + 8}" stroke="#1e1e2e" stroke-width="1.5"/>`);

  // Distribute content items evenly in available vertical space
  const CONTENT_START = y + 34;
  const FOOTER_DIV    = H - 108;          // top of footer divider line
  const CONTENT_H     = FOOTER_DIV - 20 - CONTENT_START;

  const hasDef   = !!data.definition;
  const numCards = data.cards?.length ?? 0;
  const total    = (hasDef ? 1 : 0) + numCards;

  if (total > 0 && CONTENT_H > 0) {
    const GAP      = total <= 2 ? 36 : total <= 3 ? 28 : total <= 4 ? 22 : 16;
    const totalGap = Math.max(0, total - 1) * GAP;
    const itemH    = Math.floor((CONTENT_H - totalGap) / total);
    let cy         = CONTENT_START;

    if (hasDef && data.definition) {
      parts.push(renderDefBoxAtHeight(data.definition, PADX, cy, AVAIL, itemH));
      cy += itemH + GAP;
    }
    for (const card of data.cards ?? []) {
      parts.push(renderCardAtHeight(card, PADX, cy, AVAIL, itemH));
      cy += itemH + GAP;
    }
  }

  footer(parts, data.slideNum, data.totalSlides);
  return svgWrapper(parts.join("\n"));
}

// ── pipeline slide ─────────────────────────────────────────────────────────────
// Pipeline cards fill available height; arrows between them use a fixed allocation.
function buildPipelineSvg(data: PipelineData): string {
  const PADX      = 72;
  const AVAIL     = W - PADX * 2;
  const headingFs = 78;

  const parts: string[] = [];
  parts.push(progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, "#22d3ee"));

  let y = 108;
  const headLines = wrapText(esc(data.heading ?? ""), AVAIL, headingFs);
  const headLH    = Math.round(headingFs * 1.15);
  headLines.forEach((line, i) => {
    parts.push(`<text x="${PADX}" y="${y + i * headLH}" font-size="${headingFs}" fill="url(#hg)" font-family="DVB,Arial,sans-serif" font-weight="700">${line}</text>`);
  });
  y += headLines.length * headLH + 18;

  if (data.subtitle) {
    parts.push(`<text x="${PADX}" y="${y}" font-size="38" fill="#475569" font-family="DVB,Arial,sans-serif">${esc(data.subtitle)}</text>`);
    y += 54;
  }

  parts.push(`<line x1="${PADX}" y1="${y + 8}" x2="${W - PADX}" y2="${y + 8}" stroke="#1e1e2e" stroke-width="1.5"/>`);

  const CONTENT_START = y + 34;
  const FOOTER_DIV    = H - 108;
  const CONTENT_H     = FOOTER_DIV - 20 - CONTENT_START;

  const cards = data.cards ?? [];
  if (cards.length > 0) {
    const ARROW_H  = 46;
    const numArrows = cards.length - 1;
    const GAP      = 10;
    const itemH    = Math.floor(
      (CONTENT_H - numArrows * ARROW_H - numArrows * GAP) / cards.length
    );

    let cy = CONTENT_START;
    for (let i = 0; i < cards.length; i++) {
      if (i > 0) {
        const prevCol = CARD_COLORS[cards[i - 1].color] ?? CARD_COLORS.cyan;
        parts.push(`<text x="${W / 2}" y="${(cy + ARROW_H * 0.72).toFixed(0)}" font-size="28" fill="${prevCol.text}" text-anchor="middle" opacity="0.7">▼</text>`);
        cy += ARROW_H + GAP;
      }
      parts.push(renderCardAtHeight(cards[i], PADX, cy, AVAIL, itemH));
      cy += itemH;
    }
  }

  footer(parts, data.slideNum, data.totalSlides);
  return svgWrapper(parts.join("\n"));
}

// ── CTA slide (vertically centered) ───────────────────────────────────────────
function buildCtaSvg(data: CtaData): string {
  const CX   = W / 2;
  const parts: string[] = [
    progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, "#22d3ee"),
  ];

  // Estimate total content height and center it
  // emoji≈200 + gap40 + heading≈115 + gap20 + subtitle≈52 + gap36 + button120 + gap44 + divider + gap32 + browse52 + gap12 + site64 ≈ 787px
  let y = Math.round((H - 790) / 2);

  // Big emoji
  parts.push(`<text x="${CX}" y="${y + 190}" font-size="200" text-anchor="middle" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">🎉</text>`);
  y += 250;

  // Heading
  parts.push(`<text x="${CX}" y="${y + 96}" font-size="96" fill="url(#hg)" text-anchor="middle" font-family="DVB,Arial,sans-serif" font-weight="700">${esc(data.heading ?? "Enjoyed This Quiz?")}</text>`);
  y += 130;

  // Subtitle
  parts.push(`<text x="${CX}" y="${y + 44}" font-size="40" fill="#64748b" text-anchor="middle" font-family="DVB,Arial,sans-serif">New quiz every day — subscribe so you never miss one</text>`);
  y += 80;

  // Subscribe button
  parts.push(roundRect(CX - 340, y, 680, 120, 28, "#a855f7"));
  parts.push(`<text x="${CX}" y="${y + 78}" font-size="48" fill="white" text-anchor="middle" font-family="DVB,Arial,sans-serif" font-weight="700">▶ Subscribe on YouTube</text>`);
  y += 160;

  // Divider + website
  parts.push(`<line x1="${CX - 200}" y1="${y}" x2="${CX + 200}" y2="${y}" stroke="#1e1e2e" stroke-width="2"/>`);
  y += 40;
  parts.push(`<text x="${CX}" y="${y}" font-size="36" fill="#475569" text-anchor="middle" font-family="DVB,Arial,sans-serif">Browse all quizzes at</text>`);
  y += 56;
  parts.push(`<text x="${CX}" y="${y}" font-size="58" fill="#22d3ee" text-anchor="middle" font-family="DVB,Arial,sans-serif" font-weight="700">quizbytes.dev</text>`);

  footer(parts, data.slideNum, data.totalSlides);
  return svgWrapper(parts.join("\n"));
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function slideToSvg(template: string, data: Record<string, unknown>): string {
  switch (template) {
    case "definition-steps":
      return buildDefinitionStepsSvg(data as unknown as DefinitionStepsData);
    case "pipeline":
      return buildPipelineSvg(data as unknown as PipelineData);
    case "cta":
      return buildCtaSvg(data as unknown as CtaData);
    default:
      return buildDefinitionStepsSvg({
        heading:     String(data.heading ?? template),
        slideNum:    data.slideNum as number,
        totalSlides: data.totalSlides as number,
      });
  }
}

/** Convert a slide template + data to a PNG Buffer using Sharp (lazy-loaded). */
export async function slideToPng(
  template: string,
  data: Record<string, unknown>
): Promise<Buffer> {
  const svg   = slideToSvg(template, data);
  const sharp = await getSharp();
  return sharp(Buffer.from(svg)).png().toBuffer();
}

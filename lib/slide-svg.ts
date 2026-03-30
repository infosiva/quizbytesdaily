/**
 * slide-svg.ts
 * Generates 1080×1920 PNG frames for each quiz slide template.
 *
 * TEXT RENDERING STRATEGY:
 *   All text is converted to SVG <path> elements using opentype.js.
 *   This is the ONLY reliable approach across all environments:
 *   - Vercel Lambda: librsvg @font-face (file:// and data:) both fail silently
 *   - Local macOS: works with paths
 *   - VPS: works with paths
 *   No @font-face, no system font dependency — just pure vector glyph outlines.
 */

import { POPPINS_BOLD_B64 } from "./font-poppins";

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

// ── opentype.js — parse font once, cache for all subsequent renders ────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _otFont: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function otFont(): any {
  if (_otFont) return _otFont;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const opentype = require("opentype.js") as { parse: (buf: ArrayBuffer) => unknown };
  const raw = Buffer.from(POPPINS_BOLD_B64, "base64");
  // Slice to get a proper ArrayBuffer (Buffer's .buffer may be a shared backing store)
  _otFont = opentype.parse(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer);
  return _otFont;
}

/** Advance width of `text` rendered at `fontSize`. Used for line-wrapping. */
function textW(text: string, fontSize: number): number {
  return (otFont().getAdvanceWidth(normalizeText(text), fontSize) as number);
}

/**
 * Render `text` as an SVG `<path>` element using Poppins Bold glyph outlines.
 * No font loading required — the path data is pure geometry.
 *
 * @param anchor  "start" | "middle" | "end"  — same semantics as SVG text-anchor
 */
/** Replace Unicode chars absent from Poppins Bold with ASCII equivalents. */
function normalizeText(t: string): string {
  return t
    .replace(/→/g, ">")
    .replace(/←/g, "<")
    .replace(/↑/g, "^")
    .replace(/↓/g, "v")
    .replace(/—/g, "-")
    .replace(/–/g, "-")
    .replace(/…/g, "...")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/·/g, ".");
}

function svgPath(
  text: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  anchor: "start" | "middle" | "end" = "start"
): string {
  if (!text?.trim()) return "";
  const t    = normalizeText(text);
  const font = otFont();
  let ax = x;
  if (anchor !== "start") {
    const w = font.getAdvanceWidth(t, fontSize) as number;
    ax = anchor === "middle" ? x - w / 2 : x - w;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const path = font.getPath(t, ax, y, fontSize) as any;
  const d = path.toPathData(1) as string;
  if (!d) return "";
  return `<path d="${d}" fill="${fill}"/>`;
}

// ── Sharp (lazy require — prevents Next.js bundling this native module) ────────
async function getSharp() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const m = require("sharp") as { default: typeof import("sharp") };
  return m.default ?? (m as unknown as typeof import("sharp"));
}

// ── Text wrapping (uses actual font metrics for accurate line breaks) ──────────
function wrapText(text: string, maxW: number, fontSize: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (textW(test, fontSize) > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Word counting helper ───────────────────────────────────────────────────────
function countWords(text: string): number {
  if (!text?.trim()) return 0;
  return text.trim().split(/\s+/).length;
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
      const font = otFont();
      const lw = font.getAdvanceWidth(letter, 13) as number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lp = font.getPath(letter, 12 - lw / 2, 17.5, 13) as any;
      return g(`<circle cx="12" cy="12" r="10" fill="${color}22" stroke="${color}" stroke-width="1.8"/>
        <path d="${lp.toPathData(1)}" fill="${color}"/>`);
    }
    default:
      return g(`<circle cx="12" cy="12" r="9" fill="none" stroke="${color}" stroke-width="2"/>
        <circle cx="12" cy="12" r="2.5" fill="${color}"/>`);
  }
}

// ── Rounded rect helper ────────────────────────────────────────────────────────
function roundRect(x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string): string {
  const sw = stroke ? ` stroke="${stroke}" stroke-width="2"` : "";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${sw}/>`;
}

// ── Progress dots (placed in footer area between divider and branding) ─────────
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
    return `<rect x="${x.toFixed(1)}" y="${H - 90}" width="${w}" height="${dotH}" rx="${dotH / 2}" fill="${fill}"/>`;
  }).join("\n");
}

// ── Card at exact height (adaptive font — shrinks until text fits) ─────────────
interface CardData { color: string; icon: string; title: string; body: string }

// revealedWords: undefined = show all; 0 = box only (no text); N = first N words
function renderCardAtHeight(card: CardData, x: number, y: number, availW: number, h: number, revealedWords?: number): string {
  const col    = CARD_COLORS[card.color] ?? CARD_COLORS.purple;
  const padV   = 32;
  const iconSz = Math.min(76, Math.max(40, Math.floor(h * 0.38)));
  const iconCX = x + padV + iconSz / 2;
  const iconCY = y + h / 2;

  const titleX    = x + padV + iconSz + 22;
  const titleMaxW = availW - padV - iconSz - 22 - padV;
  const availH    = h - 32;

  const fullTitle = String(card.title ?? "");
  const fullBody  = card.body?.trim() ? String(card.body) : "";

  // Font sizing uses FULL text for layout stability across all reveal frames
  let titleFs = Math.min(34, Math.max(18, Math.floor(h * 0.15)));
  let bodyFs  = Math.min(26, Math.max(14, Math.floor(h * 0.11)));
  let titleLH = 0, bodyLH = 0;
  for (let it = 0; it < 14; it++) {
    titleLH = Math.round(titleFs * 1.28);
    bodyLH  = Math.round(bodyFs  * 1.28);
    const tl = wrapText(fullTitle, titleMaxW, titleFs);
    const bl = fullBody ? wrapText(fullBody, titleMaxW, bodyFs) : [];
    const gap    = bl.length > 0 ? 8 : 0;
    const totalH = tl.length * titleLH + gap + bl.length * bodyLH;
    if (totalH <= availH || (titleFs <= 18 && bodyFs <= 14)) break;
    titleFs = Math.max(18, titleFs - 2);
    bodyFs  = Math.max(14, bodyFs  - 2);
  }

  // Layout anchor from full text (stable position regardless of reveal state)
  titleLH = Math.round(titleFs * 1.28);
  bodyLH  = Math.round(bodyFs  * 1.28);
  const fullTitleLines = wrapText(fullTitle, titleMaxW, titleFs);
  const fullBodyLines  = fullBody ? wrapText(fullBody, titleMaxW, bodyFs) : [];
  const textGap    = fullBodyLines.length > 0 ? 8 : 0;
  const titleH     = fullTitleLines.length * titleLH;
  const totalTextH = titleH + textGap + fullBodyLines.length * bodyLH;
  const textStartY = y + (h - totalTextH) / 2 + titleFs * 0.82;

  // Partial text reveal based on word budget
  let titleLines = fullTitleLines;
  let bodyLines  = fullBodyLines;
  if (revealedWords !== undefined) {
    const tw = fullTitle.split(/\s+/).filter(Boolean);
    const bw = fullBody ? fullBody.split(/\s+/).filter(Boolean) : [];
    if (revealedWords <= 0) {
      titleLines = [];
      bodyLines  = [];
    } else if (revealedWords < tw.length) {
      titleLines = wrapText(tw.slice(0, revealedWords).join(" "), titleMaxW, titleFs);
      bodyLines  = [];
    } else {
      const bodyBudget = revealedWords - tw.length;
      bodyLines = bodyBudget <= 0 ? [] : wrapText(bw.slice(0, bodyBudget).join(" "), titleMaxW, bodyFs);
    }
  }

  return [
    roundRect(x, y, availW, h, 20, col.bg),
    roundRect(x, y, availW, h, 20, "none", col.border),
    roundRect(x, y, 8, h, 4, col.text),
    `<circle cx="${iconCX}" cy="${iconCY}" r="${(iconSz / 2 + 6).toFixed(0)}" fill="${col.text}1e"/>`,
    iconSvg(card.icon, col.text, iconCX, iconCY, iconSz),
    ...titleLines.map((line, i) => svgPath(line, titleX, textStartY + i * titleLH, titleFs, col.text)),
    ...bodyLines.map((line, i)  => svgPath(line, titleX, textStartY + titleH + textGap + i * bodyLH, bodyFs, "#94a3b8")),
  ].join("\n");
}

// ── Definition box at exact height (adaptive font — shrinks until text fits) ───
// revealedWords: undefined = show all; 0 = box only (no text); N = first N words
function renderDefBoxAtHeight(
  def: { color: string; title: string; body: string },
  x: number, y: number, w: number, h: number,
  revealedWords?: number
): string {
  const defCol = CARD_COLORS[def.color] ?? CARD_COLORS.cyan;
  const padX   = 48;
  const innerW = w - padX * 2 - 16; // 16 = left stripe
  const availH = h - 44;

  const fullTitle = String(def.title ?? "");
  const fullBody  = def.body?.trim() ? String(def.body) : "";

  // Font sizing uses FULL text for layout stability
  let titleFs = Math.min(36, Math.max(18, Math.floor(h * 0.15)));
  let bodyFs  = Math.min(28, Math.max(14, Math.floor(h * 0.11)));
  let titleLH = 0, bodyLH = 0;
  for (let it = 0; it < 14; it++) {
    titleLH = Math.round(titleFs * 1.28);
    bodyLH  = Math.round(bodyFs  * 1.28);
    const tl = wrapText(fullTitle, innerW, titleFs);
    const bl = fullBody ? wrapText(fullBody, innerW, bodyFs) : [];
    const gap    = bl.length > 0 ? 12 : 0;
    const totalH = tl.length * titleLH + gap + bl.length * bodyLH;
    if (totalH <= availH || (titleFs <= 18 && bodyFs <= 14)) break;
    titleFs = Math.max(18, titleFs - 2);
    bodyFs  = Math.max(14, bodyFs  - 2);
  }

  // Layout anchor from full text
  titleLH = Math.round(titleFs * 1.28);
  bodyLH  = Math.round(bodyFs  * 1.28);
  const fullTitleLines = wrapText(fullTitle, innerW, titleFs);
  const fullBodyLines  = fullBody ? wrapText(fullBody, innerW, bodyFs) : [];
  const textGap    = fullBodyLines.length > 0 ? 12 : 0;
  const titleH     = fullTitleLines.length * titleLH;
  const totalTextH = titleH + textGap + fullBodyLines.length * bodyLH;
  const textStartY = y + (h - totalTextH) / 2 + titleFs * 0.82;
  const cx = x + w / 2;

  // Partial text reveal
  let titleLines = fullTitleLines;
  let bodyLines  = fullBodyLines;
  if (revealedWords !== undefined) {
    const tw = fullTitle.split(/\s+/).filter(Boolean);
    const bw = fullBody ? fullBody.split(/\s+/).filter(Boolean) : [];
    if (revealedWords <= 0) {
      titleLines = [];
      bodyLines  = [];
    } else if (revealedWords < tw.length) {
      titleLines = wrapText(tw.slice(0, revealedWords).join(" "), innerW, titleFs);
      bodyLines  = [];
    } else {
      const bodyBudget = revealedWords - tw.length;
      bodyLines = bodyBudget <= 0 ? [] : wrapText(bw.slice(0, bodyBudget).join(" "), innerW, bodyFs);
    }
  }

  return [
    roundRect(x, y, w, h, 20, defCol.bg),
    roundRect(x, y, w, h, 20, "none", defCol.border),
    `<rect x="${x}" y="${y + 20}" width="8" height="${h - 40}" rx="4" fill="${defCol.text}"/>`,
    ...titleLines.map((line, i) => svgPath(line, cx, textStartY + i * titleLH, titleFs, defCol.text, "middle")),
    ...bodyLines.map((line, i)  => svgPath(line, cx, textStartY + titleH + textGap + i * bodyLH, bodyFs, "rgba(255,255,255,0.72)", "middle")),
  ].join("\n");
}

// ── SVG wrapper — no @font-face needed (all text is paths) ────────────────────
function svgWrapper(content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
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

// ── grid-overview slide ────────────────────────────────────────────────────────
// Dense numbered grid layout: heading + N items in 2 columns.
// Great for "8 Python Tips", "Top 6 Design Patterns" cheat-sheets.
// Single full-reveal frame — dense grids don't benefit from incremental reveal.

export interface GridOverviewData {
  heading: string;
  items: Array<{ title: string; body?: string }>;
  accentColor?: string;  // override heading accent (defaults to purple)
  slideNum?: number;
  totalSlides?: number;
}

// GRID_ITEM_COLORS: cycle through palette for each numbered item
const GRID_COLORS = ["cyan", "purple", "green", "pink", "amber", "cyan", "purple", "green", "pink", "amber"];

function buildGridOverviewSvg(data: GridOverviewData): string {
  const PADX    = 64;
  const AVAIL   = W - PADX * 2;
  const COLS    = 2;
  const GUTTER  = 24;
  const cellW   = Math.floor((AVAIL - GUTTER) / COLS);
  const items   = data.items ?? [];
  const ROWS    = Math.ceil(items.length / COLS);
  const accent  = data.accentColor ?? "#a855f7";

  const parts: string[] = [];
  parts.push(progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, accent));

  // ── Heading ──
  const headingFs  = 52;
  const headingLH  = Math.round(headingFs * 1.2);
  const headLines  = wrapText(data.heading ?? "", AVAIL - 24, headingFs);
  const headH      = headLines.length * headingLH;

  // Accent bar on the left
  parts.push(`<rect x="${PADX}" y="92" width="10" height="${headH + 12}" rx="5" fill="${accent}"/>`);

  let y = 100;
  headLines.forEach((line, i) => {
    parts.push(svgPath(line, PADX + 28, y + i * headingLH, headingFs, "url(#hg)"));
  });
  y += headH + 32;

  // ── Divider ──
  parts.push(`<line x1="${PADX}" y1="${y}" x2="${W - PADX}" y2="${y}" stroke="#1e1e2e" stroke-width="1.5"/>`);
  y += 24;

  // ── Grid items ──
  const FOOTER_DIV  = H - 108;
  const gridAvailH  = FOOTER_DIV - 20 - y;
  const GAP         = 16;
  const rawCellH    = Math.floor((gridAvailH - (ROWS - 1) * GAP) / ROWS);
  const cellH       = Math.max(180, Math.min(380, rawCellH));

  const CIRC_R   = 32;

  for (let idx = 0; idx < items.length; idx++) {
    const col   = idx % COLS;
    const row   = Math.floor(idx / COLS);
    const cx    = PADX + col * (cellW + GUTTER);
    const cy    = y + row * (cellH + GAP);
    const item  = items[idx];
    const colName = GRID_COLORS[idx % GRID_COLORS.length];
    const col2  = CARD_COLORS[colName] ?? CARD_COLORS.purple;

    // Cell background
    parts.push(roundRect(cx, cy, cellW, cellH, 16, col2.bg));
    parts.push(roundRect(cx, cy, cellW, cellH, 16, "none", col2.border));

    // Numbered circle
    const circCX = cx + CIRC_R + 14;
    const circCY = cy + CIRC_R + 14;
    parts.push(`<circle cx="${circCX}" cy="${circCY}" r="${CIRC_R}" fill="${col2.text}22"/>`);
    parts.push(`<circle cx="${circCX}" cy="${circCY}" r="${CIRC_R}" fill="none" stroke="${col2.text}" stroke-width="2"/>`);
    const numStr = String(idx + 1);
    const numFs  = numStr.length > 1 ? 22 : 26;
    parts.push(svgPath(numStr, circCX, circCY + numFs * 0.38, numFs, col2.text, "middle"));

    // Text block (to the right of circle)
    const textX   = cx + CIRC_R * 2 + 26;
    const textMaxW = cellW - CIRC_R * 2 - 40;
    const titleFs = Math.min(34, Math.max(24, Math.floor(cellH * 0.16)));
    const bodyFs  = Math.min(26, Math.max(18, Math.floor(cellH * 0.12)));
    const titleLH = Math.round(titleFs * 1.25);
    const bodyLH  = Math.round(bodyFs  * 1.3);

    const titleLines = wrapText(item.title ?? "", textMaxW, titleFs);
    const bodyLines  = item.body?.trim()
      ? wrapText(item.body, textMaxW, bodyFs)
      : [];

    const totalTextH = titleLines.length * titleLH + (bodyLines.length > 0 ? 8 + bodyLines.length * bodyLH : 0);
    const textStartY = cy + (cellH - totalTextH) / 2 + titleFs * 0.82;

    titleLines.forEach((line, i) => {
      parts.push(svgPath(line, textX, textStartY + i * titleLH, titleFs, col2.text));
    });
    bodyLines.forEach((line, i) => {
      parts.push(svgPath(line, textX, textStartY + titleLines.length * titleLH + 8 + i * bodyLH, bodyFs, "#94a3b8"));
    });
  }

  footer(parts, data.slideNum, data.totalSlides);
  return svgWrapper(parts.join("\n"));
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
  parts.push(svgPath("@QuizBytesDaily", PADX, H - 54, 34, "#374151"));
  if (slideNum && totalSlides) {
    parts.push(svgPath(`${slideNum}/${totalSlides}`, W - PADX, H - 54, 46, "#374151", "end"));
  }
}

// ── definition-steps slide ─────────────────────────────────────────────────────
// wordBudget = total content words to reveal (Infinity = all). Word-by-word
// typing effect: all box shapes visible from frame 0; text fills in word by word.
function buildDefinitionStepsSvg(data: DefinitionStepsData, wordBudget = Infinity): string {
  const PADX      = 72;
  const AVAIL     = W - PADX * 2;
  const headingFs = 46;
  const accentCol = slideAccentColor(data.heading ?? "");

  const parts: string[] = [];
  parts.push(progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, accentCol));

  let y = 100;
  const headLines = wrapText(data.heading ?? "", AVAIL, headingFs);
  const headLH    = Math.round(headingFs * 1.15);
  headLines.forEach((line, i) => {
    parts.push(svgPath(line, PADX, y + i * headLH, headingFs, "url(#hg)"));
  });
  y += headLines.length * headLH + 14;

  if (data.subtitle) {
    parts.push(svgPath(data.subtitle, PADX, y, 36, "#475569"));
    y += 48;
  }

  parts.push(`<line x1="${PADX}" y1="${y + 8}" x2="${W - PADX}" y2="${y + 8}" stroke="#1e1e2e" stroke-width="1.5"/>`);

  const CONTENT_START = y + 28;
  const FOOTER_DIV    = H - 108;
  const CONTENT_H     = FOOTER_DIV - 20 - CONTENT_START;

  const hasDef   = !!data.definition;
  const numCards = data.cards?.length ?? 0;
  const total    = (hasDef ? 1 : 0) + numCards;

  if (total > 0 && CONTENT_H > 0) {
    const GAP        = total <= 2 ? 24 : total <= 3 ? 18 : total <= 4 ? 14 : 12;
    const totalGap   = Math.max(0, total - 1) * GAP;
    const MAX_ITEM_H = total <= 1 ? 900 : total <= 2 ? 620 : total <= 3 ? 480 : total <= 4 ? 370 : 290;
    const itemH      = Math.min(MAX_ITEM_H, Math.floor((CONTENT_H - totalGap) / total));

    // Track remaining word budget across all content items
    let remaining = wordBudget;
    let cy        = CONTENT_START;

    if (hasDef && data.definition) {
      const defWords = countWords(data.definition.title) + countWords(data.definition.body ?? "");
      const revealed = remaining === Infinity ? undefined : Math.max(0, remaining);
      parts.push(renderDefBoxAtHeight(data.definition, PADX, cy, AVAIL, itemH, revealed));
      if (remaining !== Infinity) remaining -= defWords;
      cy += itemH + GAP;
    }
    for (const card of data.cards ?? []) {
      const cardWords = countWords(card.title) + countWords(card.body ?? "");
      const revealed  = remaining === Infinity ? undefined : Math.max(0, remaining);
      parts.push(renderCardAtHeight(card, PADX, cy, AVAIL, itemH, revealed));
      if (remaining !== Infinity) remaining -= cardWords;
      cy += itemH + GAP;
    }
  }

  footer(parts, data.slideNum, data.totalSlides);
  return svgWrapper(parts.join("\n"));
}

// ── pipeline slide ─────────────────────────────────────────────────────────────
// wordBudget = total content words to reveal (Infinity = all). Arrows appear
// between steps as each step's text begins typing in.
function buildPipelineSvg(data: PipelineData, wordBudget = Infinity): string {
  const PADX      = 72;
  const AVAIL     = W - PADX * 2;
  const headingFs = 46;

  const parts: string[] = [];
  parts.push(progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, "#22d3ee"));

  let y = 100;
  const headLines = wrapText(data.heading ?? "", AVAIL, headingFs);
  const headLH    = Math.round(headingFs * 1.15);
  headLines.forEach((line, i) => {
    parts.push(svgPath(line, PADX, y + i * headLH, headingFs, "url(#hg)"));
  });
  y += headLines.length * headLH + 14;

  if (data.subtitle) {
    parts.push(svgPath(data.subtitle, PADX, y, 36, "#475569"));
    y += 48;
  }

  parts.push(`<line x1="${PADX}" y1="${y + 8}" x2="${W - PADX}" y2="${y + 8}" stroke="#1e1e2e" stroke-width="1.5"/>`);

  const CONTENT_START = y + 28;
  const FOOTER_DIV    = H - 108;
  const CONTENT_H     = FOOTER_DIV - 20 - CONTENT_START;

  const cards = data.cards ?? [];
  if (cards.length > 0) {
    const ARROW_H    = 36;
    const numArrows  = cards.length - 1;
    const GAP        = 8;
    const MAX_CARD_H = cards.length <= 2 ? 600 : cards.length <= 3 ? 440 : cards.length <= 4 ? 330 : 260;
    const itemH      = Math.min(MAX_CARD_H, Math.floor(
      (CONTENT_H - numArrows * ARROW_H - numArrows * GAP) / cards.length
    ));

    let remaining = wordBudget;
    let cy = CONTENT_START;

    for (let i = 0; i < cards.length; i++) {
      if (i > 0) {
        // Arrow appears when this card's text has started being typed
        const showArrow = remaining === Infinity || remaining > 0;
        if (showArrow) {
          const prevCol = CARD_COLORS[cards[i - 1].color] ?? CARD_COLORS.cyan;
          const ax = W / 2;
          const ay = cy + ARROW_H * 0.35;
          parts.push(`<polygon points="${(ax-12).toFixed(1)},${ay.toFixed(1)} ${(ax+12).toFixed(1)},${ay.toFixed(1)} ${ax.toFixed(1)},${(ay+20).toFixed(1)}" fill="${prevCol.text}" opacity="0.7"/>`);
        }
        cy += ARROW_H + GAP;
      }
      const cardWords = countWords(cards[i].title) + countWords(cards[i].body ?? "");
      const revealed  = remaining === Infinity ? undefined : Math.max(0, remaining);
      parts.push(renderCardAtHeight(cards[i], PADX, cy, AVAIL, itemH, revealed));
      if (remaining !== Infinity) remaining -= cardWords;
      cy += itemH;
    }
  }

  footer(parts, data.slideNum, data.totalSlides);
  return svgWrapper(parts.join("\n"));
}

// ── CTA slide ─────────────────────────────────────────────────────────────────
function buildCtaSvg(data: CtaData): string {
  const CX   = W / 2;
  const parts: string[] = [progressBar(data.slideNum ?? 1, data.totalSlides ?? 1, "#22d3ee")];

  // Total block height: star(200) + heading(100) + subtitle(120) + btn(110) = ~530
  let y = Math.round((H - 530) / 2);

  // Decorative star-burst
  const sx = CX, sy = y + 90;
  const starPts = Array.from({ length: 10 }, (_, i) => {
    const angle = (i * Math.PI) / 5 - Math.PI / 2;
    const r = i % 2 === 0 ? 74 : 30;
    return `${(sx + r * Math.cos(angle)).toFixed(1)},${(sy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
  parts.push(`<polygon points="${starPts}" fill="#a855f7" opacity="0.9"/>`);
  parts.push(`<circle cx="${sx}" cy="${sy}" r="28" fill="#22d3ee" opacity="0.85"/>`);
  parts.push(`<polyline points="${(sx-12).toFixed(0)},${sy.toFixed(0)} ${(sx-3).toFixed(0)},${(sy+11).toFixed(0)} ${(sx+14).toFixed(0)},${(sy-11).toFixed(0)}" fill="none" stroke="white" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`);
  y += 200;

  // Heading
  const headText = data.heading ?? "Enjoyed This Quiz?";
  const PADX = 72;
  const headLines = wrapText(headText, W - PADX * 2, 68);
  const headLH = Math.round(68 * 1.15);
  headLines.forEach((line, i) => {
    parts.push(svgPath(line, CX, y + 68 + i * headLH, 68, "url(#hg)", "middle"));
  });
  y += headLines.length * headLH + 28;

  // Subtitle
  const subText = "New quiz every day — subscribe so you never miss one";
  const subLines = wrapText(subText, W - PADX * 2, 34);
  subLines.forEach((line, i) => {
    parts.push(svgPath(line, CX, y + 34 + i * 46, 34, "#64748b", "middle"));
  });
  y += subLines.length * 46 + 36;

  // Subscribe button
  parts.push(roundRect(CX - 310, y, 620, 100, 24, "#a855f7"));
  const btnTx = CX - 252;
  const btnTy = y + 62;
  parts.push(`<polygon points="${btnTx.toFixed(0)},${(btnTy-20).toFixed(0)} ${btnTx.toFixed(0)},${(btnTy+8).toFixed(0)} ${(btnTx+22).toFixed(0)},${(btnTy-6).toFixed(0)}" fill="white"/>`);
  parts.push(svgPath("Subscribe on YouTube", btnTx + 34, btnTy, 40, "white"));

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
    case "grid-overview":
      return buildGridOverviewSvg(data as unknown as GridOverviewData);
    default:
      return buildDefinitionStepsSvg({
        heading:     String(data.heading ?? template),
        slideNum:    data.slideNum as number,
        totalSlides: data.totalSlides as number,
      });
  }
}

/**
 * Return a sequence of SVGs for a slide with a per-card reveal effect.
 * Frame 0 = all box shapes visible, no text (structure preview).
 * Frames 1…N = one additional card/definition revealed per frame.
 * This is cleaner than word-by-word: viewers see each full card pop in.
 *
 * Typical frame counts:
 *   definition-steps (def + 3 cards) → 5 frames (empty + def + 3 cards)
 *   pipeline         (4 cards)       → 5 frames (empty + 4 cards)
 *   cta                              → 1 frame  (static)
 */
export function slideToRevealFrames(template: string, data: Record<string, unknown>): string[] {
  if (template === "cta") return [buildCtaSvg(data as unknown as CtaData)];
  // grid-overview: single static frame — dense grids don't benefit from incremental reveal
  if (template === "grid-overview") return [buildGridOverviewSvg(data as unknown as GridOverviewData)];

  if (template === "pipeline") {
    // single full frame, all text upfront
    return [buildPipelineSvg(data as unknown as PipelineData)];
  }

  // definition-steps (and default fallback) — single full frame, all text upfront
  const d = data as unknown as DefinitionStepsData;
  return [buildDefinitionStepsSvg(d)];
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

/**
 * Render all reveal frames for a slide to PNG buffers.
 * The video renderer uses these to create a progressive pop-in effect.
 */
export async function slideToPngFrames(
  template: string,
  data: Record<string, unknown>
): Promise<Buffer[]> {
  const frames = slideToRevealFrames(template, data);
  const sharp  = await getSharp();
  return Promise.all(frames.map(svg => sharp(Buffer.from(svg)).png().toBuffer()));
}

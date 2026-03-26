import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { getSlides, getSeriesById } from "./db";

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT_REG  = "/System/Library/Fonts/Supplemental/Arial.ttf";
const FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf";

// ffmpeg-full includes drawtext (libfreetype). Use it if available.
const FFMPEG_FULL = "/usr/local/opt/ffmpeg-full/bin/ffmpeg";
const FFMPEG = fs.existsSync(FFMPEG_FULL) ? FFMPEG_FULL : "ffmpeg";

const W   = 1080;
const H   = 1920;
const FPS = 30;

// Durations (seconds)
const DEF_STEPS_DUR = 9;  // definition-steps slides
const PIPELINE_DUR  = 9;  // pipeline slides
const CTA_DUR       = 7;  // CTA slide

const RENDERS_DIR = path.join(process.cwd(), "data", "renders");

// ── Card / definition color map ───────────────────────────────────────────────

const CARD_COLORS: Record<string, string> = {
  cyan:   "0x22D3EE",
  purple: "0xA855F7",
  green:  "0x4ADE80",
  pink:   "0xF472B6",
  amber:  "0xFBBF24",
};

// Unicode icons that render reliably in Arial
const ICON_CHARS: Record<string, string> = {
  search:    "◎",
  gear:      "⚙",
  database:  "▤",
  book:      "☷",
  brain:     "◈",
  robot:     "◉",
  plus:      "+",
  lock:      "⊕",
  lightning: "▶",
  check:     "✓",
  warning:   "⚠",
  clock:     "○",
  code:      "<>",
  layers:    "◧",
  opt_a:     "A",
  opt_b:     "B",
  opt_c:     "C",
  opt_d:     "D",
};

// ── Slide data types ──────────────────────────────────────────────────────────

interface CardData {
  color: string;
  icon: string;
  title: string;
  body: string;
}

interface DefinitionData {
  color: string;
  title: string;
  body: string;
}

interface DefinitionStepsData {
  heading: string;
  subtitle?: string;
  slideNum?: number;
  totalSlides?: number;
  definition?: DefinitionData;
  cards?: CardData[];
}

interface PipelineData {
  heading: string;
  subtitle?: string;
  cards?: CardData[];
}

interface CtaData {
  heading?: string;
}

// ── Temp text file helpers ────────────────────────────────────────────────────

function writeTempText(dir: string, text: string): string {
  const name = `t_${Math.random().toString(36).slice(2)}.txt`;
  const p = path.join(dir, name);
  fs.writeFileSync(p, String(text), "utf8");
  return p;
}

function escPath(p: string): string {
  return p.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'");
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = String(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (test.length > maxChars) {
      if (cur) lines.push(cur.trim());
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines.slice(0, 3);
}

function trunc(s: string, n: number): string {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// ── Filter helpers ────────────────────────────────────────────────────────────

function dt(
  dir: string,
  text: string,
  opts: { font?: string; x?: string; y: number; size: number; color: string; enable?: string }
): string {
  const f  = opts.font ?? FONT_REG;
  const x  = opts.x ?? "80";
  const tf = writeTempText(dir, text);
  const en = opts.enable ? `:enable='${opts.enable}'` : "";
  return `drawtext=fontfile='${escPath(f)}':textfile='${escPath(tf)}':x=${x}:y=${opts.y}:fontsize=${opts.size}:fontcolor=${opts.color}@1${en}`;
}

function db(
  x: number, y: number, w: number, h: number,
  color: string, opacity = 1, enable?: string
): string {
  const en = enable ? `:enable='${enable}'` : "";
  return `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=${color}@${opacity}:t=fill${en}`;
}

// Render a card row: background + left stripe + icon box + title + body
function renderCard(
  dir: string, parts: string[],
  card: CardData, cardY: number, cardH: number,
  iconX = 80, titleX = 148, titleSize = 38, bodySize = 30
) {
  const col      = CARD_COLORS[card.color] ?? "0xA855F7";
  const iconChar = ICON_CHARS[card.icon] ?? "•";

  // Card background + left stripe
  parts.push(db(60, cardY, 960, cardH, col, 0.06));
  parts.push(db(60, cardY, 7, cardH, col, 1));

  // Icon box
  const iconBoxSize = 48;
  const iconBoxY = cardY + Math.floor((cardH - iconBoxSize) / 2);
  parts.push(db(iconX, iconBoxY, iconBoxSize, iconBoxSize, col, 0.2));
  parts.push(dt(dir, iconChar, { font: FONT_BOLD, x: String(iconX + 10), y: iconBoxY + 10, size: 28, color: col }));

  // Title (may wrap)
  const titleLines = wrapLines(trunc(card.title, 28), 22);
  const titleBlockH = titleLines.length * (titleSize + 6);
  const hasBody = card.body && card.body.trim().length > 0;
  const totalTextH = titleBlockH + (hasBody ? bodySize + 8 : 0);
  const textStartY = cardY + Math.floor((cardH - totalTextH) / 2);

  titleLines.forEach((l, i) => {
    parts.push(dt(dir, l, { font: FONT_BOLD, x: String(titleX), y: textStartY + i * (titleSize + 4), size: titleSize, color: "0xFFFFFF" }));
  });

  // Body
  if (hasBody) {
    const bodyY = textStartY + titleBlockH + 4;
    const bodyLines = wrapLines(trunc(card.body, 42), 34);
    bodyLines.forEach((l, i) => {
      parts.push(dt(dir, l, { x: String(titleX), y: bodyY + i * (bodySize + 2), size: bodySize, color: "0x94A3B8" }));
    });
  }
}

// ── Slide builders ────────────────────────────────────────────────────────────

function buildDefinitionStepsSlide(input: string, d: DefinitionStepsData, dir: string): string {
  const parts: string[] = [];
  const cards  = d.cards ?? [];
  const defCol = d.definition ? (CARD_COLORS[d.definition.color] ?? "0xA855F7") : "0xA855F7";
  const accent = defCol;

  // Top accent bar
  parts.push(db(0, 0, W, 8, accent, 1));

  // Ambient glow
  parts.push(db(-80, -80, 480, 480, accent, 0.04));
  parts.push(db(W - 200, H - 280, 400, 400, "0x22D3EE", 0.03));

  // Heading
  const headLines = wrapLines(d.heading ?? "", 22);
  const headY     = 55;
  const headSize  = 64;
  headLines.forEach((l, i) => {
    parts.push(dt(dir, l, { font: FONT_BOLD, x: "(w-text_w)/2", y: headY + i * (headSize + 10), size: headSize, color: "0xFFFFFF" }));
  });

  let y = headY + headLines.length * (headSize + 10) + 40;

  // Definition box (if present)
  if (d.definition) {
    const defH = 290;
    parts.push(db(60, y, 7, defH, defCol, 1));
    parts.push(db(67, y, 953, defH, defCol, 0.08));

    const defTitleLines = wrapLines(trunc(d.definition.title, 40), 32);
    defTitleLines.forEach((l, i) => {
      parts.push(dt(dir, l, { font: FONT_BOLD, x: "88", y: y + 28 + i * 50, size: 38, color: defCol }));
    });

    const bodyStartY = y + 28 + defTitleLines.length * 50 + 14;
    const bodyLines  = wrapLines(d.definition.body ?? "", 44);
    bodyLines.forEach((l, i) => {
      parts.push(dt(dir, l, { x: "88", y: bodyStartY + i * 42, size: 30, color: "0x94A3B8" }));
    });

    y += defH + 36;
  }

  // Cards
  const cardCount  = Math.min(cards.length, 4);
  const cardH      = 155;
  const cardGap    = 18;
  const totalCards = cardH * cardCount + cardGap * (cardCount - 1);

  // Vertically center cards in remaining space above footer
  const footerY    = 1848;
  const remaining  = footerY - y - 40;
  const cardStartY = remaining > totalCards ? y + Math.floor((remaining - totalCards) / 2) : y;

  cards.slice(0, 4).forEach((card, i) => {
    renderCard(dir, parts, card, cardStartY + i * (cardH + cardGap), cardH);
  });

  // Handle
  parts.push(dt(dir, "@QuizBytesDaily", { x: "80", y: 1850, size: 28, color: "0x374151" }));

  return `${input}${parts.join(",")}`;
}

function buildPipelineSlide(input: string, d: PipelineData, dir: string): string {
  const parts  = [] as string[];
  const cards  = d.cards ?? [];
  const accent = cards[0] ? (CARD_COLORS[cards[0].color] ?? "0x22D3EE") : "0x22D3EE";

  // Top accent bar
  parts.push(db(0, 0, W, 8, accent, 1));

  // Heading
  const headLines = wrapLines(d.heading ?? "", 22);
  const headY     = 55;
  const headSize  = 64;
  headLines.forEach((l, i) => {
    parts.push(dt(dir, l, { font: FONT_BOLD, x: "(w-text_w)/2", y: headY + i * (headSize + 10), size: headSize, color: "0xFFFFFF" }));
  });

  let y = headY + headLines.length * (headSize + 10) + 16;

  if (d.subtitle) {
    parts.push(dt(dir, trunc(d.subtitle, 40), { x: "(w-text_w)/2", y, size: 32, color: "0x475569" }));
    y += 55;
  }

  y += 20;

  // Cards with arrows
  const cardH  = 150;
  const arrowH = 38;
  const total  = Math.min(cards.length, 6);
  const step   = cardH + arrowH;

  cards.slice(0, 6).forEach((card, i) => {
    const cardY = y + i * step;

    // Arrow before card (not first)
    if (i > 0) {
      const prevCol = CARD_COLORS[cards[i - 1].color] ?? "0xA855F7";
      parts.push(dt(dir, "▼", { font: FONT_BOLD, x: "(w-text_w)/2", y: cardY - arrowH + 4, size: 26, color: prevCol }));
    }

    renderCard(dir, parts, card, cardY, cardH, 80, 148, 36, 28);
  });

  // Make sure we don't overflow — warn handle may overlap on 6+ cards but keep it
  const lastCardEnd = y + total * step - arrowH;
  const handleY     = Math.max(lastCardEnd + 30, 1840);
  parts.push(dt(dir, "@QuizBytesDaily", { x: "80", y: handleY, size: 28, color: "0x374151" }));

  return `${input}${parts.join(",")}`;
}

function buildCtaSlide(input: string, _d: CtaData, dir: string): string {
  const parts: string[] = [];

  // Ambient glow blobs
  parts.push(db(-100, -100, 600, 600, "0xA855F7", 0.07));
  parts.push(db(W - 200, H - 300, 600, 600, "0x22D3EE", 0.05));

  // Top accent bar
  parts.push(db(0, 0, W, 8, "0xA855F7", 1));

  // Celebration emoji
  parts.push(dt(dir, "🎉", { x: "(w-text_w)/2", y: 560, size: 110, color: "0xFFFFFF" }));

  // Main heading
  parts.push(dt(dir, "Enjoyed This Quiz?", { font: FONT_BOLD, x: "(w-text_w)/2", y: 730, size: 62, color: "0xFFFFFF" }));

  // Sub-line
  parts.push(dt(dir, "New quiz every day — never miss one", { x: "(w-text_w)/2", y: 840, size: 34, color: "0x475569" }));

  // Separator
  parts.push(db(W / 2 - 130, 910, 260, 2, "0x1E1E2E", 1));

  // Subscribe button pill
  parts.push(db(120, 940, 840, 100, "0xA855F7", 1));
  parts.push(dt(dir, "▶  Subscribe on YouTube", { font: FONT_BOLD, x: "(w-text_w)/2", y: 972, size: 40, color: "0xFFFFFF" }));

  // Comment invite
  parts.push(dt(dir, "💬  Drop a comment if you're interested!", { x: "(w-text_w)/2", y: 1090, size: 34, color: "0x22D3EE" }));

  // Separator 2
  parts.push(db(W / 2 - 130, 1150, 260, 2, "0x1E1E2E", 1));

  // Website
  parts.push(dt(dir, "quizbytesdaily.com", { font: FONT_BOLD, x: "(w-text_w)/2", y: 1176, size: 36, color: "0x22D3EE" }));

  // Handle
  parts.push(dt(dir, "@QuizBytesDaily", { x: "80", y: 1850, size: 28, color: "0x374151" }));

  return `${input}${parts.join(",")}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function renderSeries(
  seriesId: number,
  onLog?: (msg: string) => void
): Promise<string> {
  fs.mkdirSync(RENDERS_DIR, { recursive: true });

  const series = getSeriesById(seriesId);
  if (!series) throw new Error(`Series ${seriesId} not found`);

  const slideRows = getSlides(seriesId);
  if (slideRows.length === 0) throw new Error("No slides found for this series");

  const outFile = path.join(RENDERS_DIR, `${series.slug}.mp4`);
  const tmpDir  = path.join(os.tmpdir(), `qbd-render-${seriesId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  function dur(template: string): number {
    if (template === "cta")      return CTA_DUR;
    if (template === "pipeline") return PIPELINE_DUR;
    return DEF_STEPS_DUR; // definition-steps (default)
  }

  try {
    const args: string[] = ["-y"];

    // Input streams — one color source per slide
    slideRows.forEach((row) => {
      args.push("-f", "lavfi", "-i", `color=c=0x0D0D20:s=${W}x${H}:d=${dur(row.template)}:r=${FPS}`);
    });

    // Build filter_complex
    let filterComplex = "";
    const labels: string[] = [];

    slideRows.forEach((row, i) => {
      const data = JSON.parse(row.data) as Record<string, unknown>;
      let f = `[${i}:v]`;

      switch (row.template) {
        case "definition-steps":
          f = buildDefinitionStepsSlide(f, data as unknown as DefinitionStepsData, tmpDir);
          break;
        case "pipeline":
          f = buildPipelineSlide(f, data as unknown as PipelineData, tmpDir);
          break;
        case "cta":
          f = buildCtaSlide(f, data as unknown as CtaData, tmpDir);
          break;
        default: {
          // Graceful fallback for unknown templates
          const tf = writeTempText(tmpDir, row.template);
          f += `drawtext=fontfile='${FONT_REG}':textfile='${escPath(tf)}':x=(w-text_w)/2:y=(h-text_h)/2:fontsize=48:fontcolor=0x94A3B8@1`;
        }
      }

      const label = `s${i}`;
      filterComplex += `${f}[${label}];`;
      labels.push(`[${label}]`);
    });

    filterComplex += `${labels.join("")}concat=n=${labels.length}:v=1:a=0[out]`;

    const totalDur = slideRows.reduce((s, r) => s + dur(r.template), 0);
    onLog?.(`[render] "${series.title}" — ${slideRows.length} slides, ~${totalDur}s`);

    args.push(
      "-filter_complex", filterComplex,
      "-map", "[out]",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      outFile
    );

    const result = spawnSync(FFMPEG, args, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: 180_000,
    });

    if (result.status !== 0) {
      const err = result.stderr ?? result.stdout ?? "";
      throw new Error(`FFmpeg error:\n${err.slice(-3000)}`);
    }

    onLog?.(`[render] Done → ${outFile}`);
    return outFile;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

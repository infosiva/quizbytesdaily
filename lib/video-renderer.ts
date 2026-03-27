import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { getSlides, getSeriesById } from "./db";

// ── Constants ─────────────────────────────────────────────────────────────────

function findFont(candidates: string[]): string {
  for (const f of candidates) {
    if (fs.existsSync(f)) return f;
  }
  return candidates[0]; // best-guess fallback
}

// Lazy-load @ffmpeg-installer so Next.js build doesn't try to resolve it at
// compile time (it's platform-native and only available at runtime on Vercel).
function getFFmpegPath(): string {
  const FFMPEG_FULL = "/usr/local/opt/ffmpeg-full/bin/ffmpeg";
  if (fs.existsSync(FFMPEG_FULL)) return FFMPEG_FULL;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const installer = require("@ffmpeg-installer/ffmpeg") as { path: string };
    return installer.path ?? "ffmpeg";
  } catch {
    return "ffmpeg";
  }
}

const BUNDLED_DIR = path.join(process.cwd(), "fonts");

const FONT_REG = findFont([
  path.join(BUNDLED_DIR, "DejaVuSans.ttf"),                          // bundled (works on Vercel)
  "/System/Library/Fonts/Supplemental/Arial.ttf",                    // macOS
  "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",                 // Debian/Ubuntu
  "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",               // RHEL/Amazon Linux
]);

const FONT_BOLD = findFont([
  path.join(BUNDLED_DIR, "DejaVuSans-Bold.ttf"),                     // bundled (works on Vercel)
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf",               // macOS
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",            // Debian/Ubuntu
  "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans-Bold.ttf",          // RHEL/Amazon Linux
]);

const W   = 1080;
const H   = 1920;
const FPS = 30;

// Durations (seconds)
const DEF_STEPS_DUR = 9;  // definition-steps slides
const PIPELINE_DUR  = 9;  // pipeline slides
const CTA_DUR       = 7;  // CTA slide

// Always use /tmp — works on Vercel (read-only cwd) and locally.
// The render route streams bytes back directly so we never need persistent storage.
const RENDERS_DIR = path.join(os.tmpdir(), "qbd-renders");

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
  slideNum?: number;
  totalSlides?: number;
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
  color: string, opacity = 1
): string {
  return `drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=${color}@${opacity}:t=fill`;
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
  const accent = d.definition
    ? (CARD_COLORS[d.definition.color] ?? "0xA855F7")
    : cards[0] ? (CARD_COLORS[cards[0].color] ?? "0xA855F7") : "0xA855F7";

  // Top accent bar (full width, bold)
  parts.push(db(0, 0, W, 10, accent, 1));

  // Heading
  const headLines = wrapLines(d.heading ?? "", 20);
  const headY     = 60;
  const headSize  = 72;
  headLines.forEach((l, i) => {
    parts.push(dt(dir, l, { font: FONT_BOLD, x: "(w-text_w)/2", y: headY + i * (headSize + 8), size: headSize, color: "0xFFFFFF" }));
  });

  // Underline accent below heading
  const headBottom = headY + headLines.length * (headSize + 8) + 16;
  parts.push(db(W / 2 - 80, headBottom, 160, 4, accent, 1));

  let y = headBottom + 40;

  // Definition box — tighter, more modern card style
  if (d.definition) {
    const defTitleLines = wrapLines(trunc(d.definition.title, 36), 28);
    const defBodyLines  = wrapLines(d.definition.body ?? "", 44);
    const defH = 50 + defTitleLines.length * 46 + (defBodyLines.length > 0 ? 14 + defBodyLines.length * 38 : 0) + 30;

    // Card background + thick left accent bar
    parts.push(db(60, y, W - 120, defH, accent, 0.10));
    parts.push(db(60, y, 8, defH, accent, 1));

    defTitleLines.forEach((l, i) => {
      parts.push(dt(dir, l, { font: FONT_BOLD, x: "90", y: y + 26 + i * 46, size: 40, color: accent }));
    });
    const defBodyY = y + 26 + defTitleLines.length * 46 + 12;
    defBodyLines.forEach((l, i) => {
      parts.push(dt(dir, l, { x: "90", y: defBodyY + i * 38, size: 30, color: "0xCBD5E1" }));
    });

    y += defH + 28;
  }

  // "Steps" label
  if (cards.length > 0) {
    parts.push(dt(dir, "KEY POINTS", { font: FONT_BOLD, x: "68", y, size: 26, color: `${accent}` }));
    // Horizontal rule after label
    parts.push(db(68, y + 34, W - 136, 1, "0x1E293B", 1));
    y += 52;
  }

  // Cards — numbered modern style, no centering gap
  const cardH   = 148;
  const cardGap = 16;

  cards.slice(0, 4).forEach((card, i) => {
    const cy = y + i * (cardH + cardGap);

    // Card background
    parts.push(db(60, cy, W - 120, cardH, "0x0F172A", 1));
    parts.push(db(60, cy, W - 120, cardH, accent, 0.07));
    // Left accent bar
    parts.push(db(60, cy, 6, cardH, accent, 1));

    // Circle label: A/B/C/D for quiz options, or step number otherwise
    const isQuizOpt = /^opt_[a-d]$/.test(card.icon ?? "");
    const circleLabel = isQuizOpt
      ? (ICON_CHARS[card.icon] ?? String(i + 1))  // "A", "B", "C", "D"
      : String(i + 1);
    const numX = 80;
    const numY = cy + Math.floor(cardH / 2) - 22;
    parts.push(db(numX, numY, 44, 44, accent, 0.25));
    parts.push(dt(dir, circleLabel, { font: FONT_BOLD, x: String(numX + 10), y: numY + 8, size: 30, color: accent }));

    // Title — strip redundant "A)  " prefix if circle already shows the letter
    const rawTitle   = isQuizOpt ? card.title.replace(/^[A-D]\)\s*/i, "") : card.title;
    const titleLines = wrapLines(trunc(rawTitle, 30), 24);
    const hasBody    = card.body && card.body.trim().length > 0;
    const totalH     = titleLines.length * 42 + (hasBody ? 34 : 0);
    const textY      = cy + Math.floor((cardH - totalH) / 2);

    titleLines.forEach((l, li) => {
      parts.push(dt(dir, l, { font: FONT_BOLD, x: "144", y: textY + li * 42, size: 36, color: "0xF1F5F9" }));
    });
    if (hasBody) {
      const bodyLines = wrapLines(trunc(card.body, 46), 38);
      bodyLines.slice(0, 1).forEach((l, li) => {
        parts.push(dt(dir, l, { x: "144", y: textY + titleLines.length * 42 + 4 + li * 32, size: 28, color: "0x94A3B8" }));
      });
    }
  });

  // Slide counter — bottom right
  if (d.slideNum != null && d.totalSlides != null) {
    parts.push(dt(dir, `${d.slideNum} / ${d.totalSlides}`, {
      font: FONT_BOLD, x: String(W - 195), y: 1858, size: 26, color: "0x374151",
    }));
  }

  // Handle — bottom left
  parts.push(dt(dir, "@QuizBytesDaily", { x: "80", y: 1858, size: 26, color: "0x374151" }));

  return `${input}${parts.join(",")}`;
}

function buildPipelineSlide(input: string, d: PipelineData, dir: string): string {
  const parts  = [] as string[];
  const cards  = d.cards ?? [];
  // Single accent color for the whole pipeline slide
  const accent = cards[0] ? (CARD_COLORS[cards[0].color] ?? "0x22D3EE") : "0x22D3EE";
  const accentKey = Object.keys(CARD_COLORS).find(k => CARD_COLORS[k] === accent) ?? "cyan";

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

    // Arrow before card (not first) — same accent color
    if (i > 0) {
      parts.push(dt(dir, "▼", { font: FONT_BOLD, x: "(w-text_w)/2", y: cardY - arrowH + 4, size: 26, color: accent }));
    }

    // Override card color with slide accent
    renderCard(dir, parts, { ...card, color: accentKey }, cardY, cardH, 80, 148, 36, 28);
  });

  // Make sure we don't overflow — warn handle may overlap on 6+ cards but keep it
  const lastCardEnd = y + total * step - arrowH;
  const handleY     = Math.max(lastCardEnd + 30, 1840);

  // Slide counter — bottom right
  if (d.slideNum != null && d.totalSlides != null) {
    parts.push(dt(dir, `${d.slideNum} / ${d.totalSlides}`, {
      font: FONT_BOLD, x: String(W - 195), y: handleY, size: 28, color: "0x374151",
    }));
  }

  parts.push(dt(dir, "@QuizBytesDaily", { x: "80", y: handleY, size: 28, color: "0x374151" }));

  return `${input}${parts.join(",")}`;
}

function buildCtaSlide(input: string, _d: CtaData, dir: string): string {
  const parts: string[] = [];
  const accent = "0xA855F7";

  // Top accent bar
  parts.push(db(0, 0, W, 8, accent, 1));
  // Bottom accent bar for balance
  parts.push(db(0, H - 8, W, 8, accent, 1));

  // Large "?" decorative — DejaVu-safe, no emoji
  parts.push(dt(dir, "?", { font: FONT_BOLD, x: "(w-text_w)/2", y: 480, size: 160, color: `${accent}` }));

  // Main heading
  parts.push(dt(dir, "Enjoyed This Quiz?", { font: FONT_BOLD, x: "(w-text_w)/2", y: 710, size: 62, color: "0xFFFFFF" }));

  // Sub-line
  parts.push(dt(dir, "New quiz every day -- never miss one", { x: "(w-text_w)/2", y: 820, size: 34, color: "0x94A3B8" }));

  // Divider
  parts.push(db(W / 2 - 200, 890, 400, 2, "0x374151", 1));

  // Subscribe button
  parts.push(db(120, 920, 840, 110, accent, 1));
  parts.push(dt(dir, "Subscribe on YouTube", { font: FONT_BOLD, x: "(w-text_w)/2", y: 958, size: 42, color: "0xFFFFFF" }));

  // Website line
  parts.push(dt(dir, "quizbytes.dev", { font: FONT_BOLD, x: "(w-text_w)/2", y: 1080, size: 40, color: accent }));

  // Sub-note
  parts.push(dt(dir, "Daily tech quizzes -- subscribe & learn!", { x: "(w-text_w)/2", y: 1160, size: 32, color: "0x94A3B8" }));

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

  const series = await getSeriesById(seriesId);
  if (!series) throw new Error(`Series ${seriesId} not found`);

  const slideRows = await getSlides(seriesId);
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

    const totalSlides = slideRows.length;
    slideRows.forEach((row, i) => {
      const data = JSON.parse(row.data) as Record<string, unknown>;
      // Inject slide position so builders can render "N / total" counters
      data.slideNum    = i + 1;
      data.totalSlides = totalSlides;
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

    // ── Ambient background music ──────────────────────────────────────────────
    // C minor chord (C3 + Eb3 + G3) with slow tremolo — no external files needed
    const musicIdx = slideRows.length;
    args.push("-f", "lavfi", "-i",
      `aevalsrc=0.04*sin(2*PI*t*130.81)*(0.85+0.15*sin(2*PI*t*0.3))+0.035*sin(2*PI*t*155.56)*(0.85+0.15*sin(2*PI*t*0.4))+0.03*sin(2*PI*t*196.0)*(0.85+0.15*sin(2*PI*t*0.25)):s=44100:c=mono:d=${totalDur}`
    );

    // Audio chain: mono → stereo → fade in/out → volume
    const fadeDur = Math.min(3, totalDur * 0.1);
    filterComplex += `;[${musicIdx}:a]aformat=channel_layouts=stereo,` +
      `afade=t=in:st=0:d=${fadeDur},` +
      `afade=t=out:st=${totalDur - fadeDur}:d=${fadeDur},` +
      `volume=0.14[aout]`;

    args.push(
      "-filter_complex", filterComplex,
      "-map", "[out]",
      "-map", "[aout]",
      "-c:v", "libx264",
      "-preset", "ultrafast",  // fastest encode — critical for Vercel 120s limit
      "-crf", "23",
      "-c:a", "aac",
      "-b:a", "96k",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-threads", "0",         // use all available cores
      outFile
    );

    // Resolve ffmpeg path at render time (lazy — avoids build-time resolution)
    const FFMPEG = getFFmpegPath();
    // Ensure binary is executable (Vercel may deploy without execute bit)
    try { fs.chmodSync(FFMPEG, 0o755); } catch { /* ignore */ }

    const result = spawnSync(FFMPEG, args, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: 180_000,
    });

    if (result.status !== 0 || result.error) {
      const spawnMsg = result.error ? ` [spawn: ${result.error.message}]` : "";
      const stderr = result.stderr ?? "";
      // FFmpeg prints version header (~300 chars) before the real error.
      // Extract lines that contain actual error keywords.
      const errorLines = stderr
        .split("\n")
        .filter((l) =>
          /error|invalid|cannot|failed|unable|not found|no such|unrecognized|undefined|option|unknown/i.test(l)
        )
        .join("\n")
        .slice(0, 3000);
      const fallback = stderr.slice(300, 3300); // skip version header
      throw new Error(`FFmpeg error${spawnMsg} (exit ${result.status}):\n${errorLines || fallback}`);
    }

    onLog?.(`[render] Done → ${outFile}`);
    return outFile;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

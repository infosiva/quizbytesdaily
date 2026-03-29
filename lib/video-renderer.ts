/**
 * video-renderer.ts
 * Renders a quiz series as an MP4 Short (1080×1920).
 *
 * Pipeline:
 *   DB slides  →  slide-svg.ts (SVG → PNG per slide via Sharp)
 *             →  FFmpeg (PNG inputs → concat → ambient music → H.264 MP4)
 *
 * Using PNG frames instead of FFmpeg drawtext gives us gradient headings,
 * real SVG icons, coloured card borders, and a progress bar — matching the
 * browser preview quality.
 */

import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { getSlides, getSeriesById } from "./db";
import { slideToPng } from "./slide-svg";

// ── Constants ──────────────────────────────────────────────────────────────────

const W   = 1080;
const H   = 1920;
const FPS = 30;

// Slide durations (seconds)
const DEF_STEPS_DUR = 9;
const PIPELINE_DUR  = 9;
const CTA_DUR       = 7;

// Output directory — always /tmp so it works on Vercel's read-only filesystem
const RENDERS_DIR = path.join(os.tmpdir(), "qbd-renders");

// ── FFmpeg path (lazy — avoids Next.js build-time resolution) ─────────────────

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

// ── Slide duration helper ─────────────────────────────────────────────────────

function dur(template: string): number {
  if (template === "cta")      return CTA_DUR;
  if (template === "pipeline") return PIPELINE_DUR;
  return DEF_STEPS_DUR;
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

  const totalSlides = slideRows.length;
  const totalDur    = slideRows.reduce((s, r) => s + dur(r.template), 0);

  onLog?.(`[render] "${series.title}" — ${totalSlides} slides, ~${totalDur}s`);

  try {
    // ── Step 1: render each slide to a PNG file ─────────────────────────────
    onLog?.("[render] Generating slide PNGs…");
    const pngPaths: string[] = [];

    for (let i = 0; i < slideRows.length; i++) {
      const row  = slideRows[i];
      const data = JSON.parse(row.data) as Record<string, unknown>;
      // Inject slide position for the progress bar and counter
      data.slideNum    = i + 1;
      data.totalSlides = totalSlides;

      const pngBuf  = await slideToPng(row.template, data);
      const pngPath = path.join(tmpDir, `slide_${i}.png`);
      fs.writeFileSync(pngPath, pngBuf);
      pngPaths.push(pngPath);
    }

    // ── Step 2: build FFmpeg args ───────────────────────────────────────────
    // Use one static-image input per slide (looped for the slide's duration),
    // concat them, then mix with generated ambient music.
    const args: string[] = ["-y"];

    // PNG inputs (one per slide) — each looped for its duration
    slideRows.forEach((row, i) => {
      args.push(
        "-loop", "1",
        "-t",    String(dur(row.template)),
        "-framerate", String(FPS),
        "-i",    pngPaths[i]
      );
    });

    // Ambient music input (C minor chord with slow tremolo)
    const musicIdx = slideRows.length;
    args.push("-f", "lavfi", "-i",
      `aevalsrc=0.04*sin(2*PI*t*130.81)*(0.85+0.15*sin(2*PI*t*0.3))` +
      `+0.035*sin(2*PI*t*155.56)*(0.85+0.15*sin(2*PI*t*0.4))` +
      `+0.03*sin(2*PI*t*196.0)*(0.85+0.15*sin(2*PI*t*0.25))` +
      `:s=44100:c=mono:d=${totalDur}`
    );

    // filter_complex: scale each PNG to exact video size, concat, fade music
    const labels: string[] = [];
    let filterComplex = "";

    slideRows.forEach((_row, i) => {
      // Scale PNG to exact video dimensions (handles any rounding in sharp output)
      filterComplex += `[${i}:v]scale=${W}:${H}:flags=lanczos,format=yuv420p[s${i}];`;
      labels.push(`[s${i}]`);
    });

    // Concat all slides, then draw a horizontal progress bar at the bottom
    filterComplex += `${labels.join("")}concat=n=${labels.length}:v=1:a=0[vconcat];`;
    filterComplex += `[vconcat]drawbox=x=0:y=${H - 10}:w='min(iw\\,(t/${totalDur})*iw)':h=10:color=0xa855f7@0.9:t=fill[vout]`;

    const fadeDur = Math.min(3, totalDur * 0.1);
    filterComplex +=
      `;[${musicIdx}:a]aformat=channel_layouts=stereo,` +
      `afade=t=in:st=0:d=${fadeDur},` +
      `afade=t=out:st=${totalDur - fadeDur}:d=${fadeDur},` +
      `volume=0.14[aout]`;

    args.push(
      "-filter_complex", filterComplex,
      "-map",    "[vout]",
      "-map",    "[aout]",
      "-c:v",    "libx264",
      "-preset", "ultrafast",   // fastest encode — critical for Vercel 120s limit
      "-crf",    "23",
      "-c:a",    "aac",
      "-b:a",    "96k",
      "-pix_fmt", "yuv420p",
      "-movflags", "+faststart",
      "-threads", "0",
      outFile
    );

    // ── Step 3: run FFmpeg ──────────────────────────────────────────────────
    onLog?.("[render] Running FFmpeg…");
    const FFMPEG = getFFmpegPath();
    try { fs.chmodSync(FFMPEG, 0o755); } catch { /* ignore */ }

    const result = spawnSync(FFMPEG, args, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: 180_000,
    });

    if (result.status !== 0 || result.error) {
      const spawnMsg   = result.error ? ` [spawn: ${result.error.message}]` : "";
      const stderr     = result.stderr ?? "";
      const errorLines = stderr
        .split("\n")
        .filter((l) =>
          /error|invalid|cannot|failed|unable|not found|no such|unrecognized|undefined|option|unknown/i.test(l)
        )
        .join("\n")
        .slice(0, 3000);
      const fallback = stderr.slice(300, 3300);
      throw new Error(
        `FFmpeg error${spawnMsg} (exit ${result.status}):\n${errorLines || fallback}`
      );
    }

    onLog?.(`[render] Done → ${outFile}`);
    return outFile;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

/**
 * video-renderer.ts
 * Renders a quiz series as an MP4 Short (1080×1920).
 *
 * Pipeline:
 *   DB slides  →  slide-svg.ts (SVG → reveal frames → PNG per frame)
 *             →  FFmpeg (PNG inputs → concat → ambient music → H.264 MP4)
 *
 * Progressive reveal: each slide generates N frames (heading → +item1 → +item2…)
 * creating a "pop-in" engagement effect in the video.
 * CTA slides are skipped — the video ends on the last quiz slide.
 */

import { spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { getSlides, getSeriesById } from "./db";
import { slideToPngFrames } from "./slide-svg";

// ── Constants ──────────────────────────────────────────────────────────────────

const W   = 1080;
const H   = 1920;
const FPS = 30;

// Slide durations (seconds)
const DEF_STEPS_DUR = 9;
const PIPELINE_DUR  = 9;

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

  // Skip CTA slides — video ends on the last content slide
  const renderRows  = slideRows.filter(r => r.template !== "cta");
  const totalSlides = renderRows.length;

  if (totalSlides === 0) throw new Error("No renderable slides (all were CTA)");
  onLog?.(`[render] "${series.title}" — ${totalSlides} slides (CTA skipped)`);

  try {
    // ── Step 1: render each slide as progressive reveal frames ─────────────
    // Each slide becomes N PNGs: frame 0 = heading only, frame N = all items.
    // This creates a pop-in engagement effect without requiring video editing.
    onLog?.("[render] Generating slide PNGs…");

    interface FrameEntry { path: string; dur: number }
    const frames: FrameEntry[] = [];

    for (let i = 0; i < renderRows.length; i++) {
      const row  = renderRows[i];
      const data = JSON.parse(row.data) as Record<string, unknown>;
      data.slideNum    = i + 1;
      data.totalSlides = totalSlides;

      const slideDur = dur(row.template);
      const bufs     = await slideToPngFrames(row.template, data);
      const frameDur = slideDur / bufs.length;

      for (let f = 0; f < bufs.length; f++) {
        const fPath = path.join(tmpDir, `slide_${i}_f${f}.png`);
        fs.writeFileSync(fPath, bufs[f]);
        frames.push({ path: fPath, dur: frameDur });
      }
    }

    if (frames.length === 0) throw new Error("No frames generated");
    const totalDur = frames.reduce((s, f) => s + f.dur, 0);
    onLog?.(`[render] ${frames.length} frames, ~${totalDur.toFixed(1)}s total`);

    // ── Step 2: build FFmpeg args ───────────────────────────────────────────
    const args: string[] = ["-y"];

    // One PNG input per reveal frame, each held for frameDur seconds
    frames.forEach((f) => {
      args.push(
        "-loop",      "1",
        "-t",         f.dur.toFixed(2),
        "-framerate", String(FPS),
        "-i",         f.path
      );
    });

    // Background music — C major chord (C4+E4+G4+C5) with gentle pulse and shimmer.
    // Amplitudes at 0.18–0.28 so the music is clearly audible at quiz-show volume.
    const musicIdx = frames.length;
    args.push("-f", "lavfi", "-i",
      `aevalsrc=` +
      // Root: C4 (261.63 Hz) with slow 0.25 Hz swell
      `0.28*sin(2*PI*t*261.63)*(0.85+0.15*sin(2*PI*t*0.25))` +
      // Third: E4 (329.63 Hz) with 0.35 Hz swell (slightly out of phase)
      `+0.22*sin(2*PI*t*329.63)*(0.85+0.15*sin(2*PI*t*0.35))` +
      // Fifth: G4 (392.00 Hz) with 0.3 Hz swell
      `+0.18*sin(2*PI*t*392.00)*(0.85+0.15*sin(2*PI*t*0.30))` +
      // Octave: C5 (523.25 Hz) — adds brightness / sparkle
      `+0.10*sin(2*PI*t*523.25)*(0.85+0.15*sin(2*PI*t*0.20))` +
      // Subtle second harmonic on root for warmth
      `+0.06*sin(2*PI*t*130.81)*(0.9+0.1*sin(2*PI*t*0.15))` +
      `:s=44100:c=mono:d=${totalDur}`
    );

    // filter_complex: scale + concat all frames, add progress bar, fade music
    const labels: string[] = [];
    let filterComplex = "";

    frames.forEach((_f, i) => {
      filterComplex += `[${i}:v]scale=${W}:${H}:flags=lanczos,format=yuv420p[s${i}];`;
      labels.push(`[s${i}]`);
    });

    filterComplex += `${labels.join("")}concat=n=${labels.length}:v=1:a=0[vconcat];`;
    filterComplex += `[vconcat]drawbox=x=0:y=${H - 10}:w='min(iw\\,(t/${totalDur})*iw)':h=10:color=0xa855f7@0.9:t=fill[vout]`;

    const fadeDur = Math.min(3, totalDur * 0.1);
    filterComplex +=
      `;[${musicIdx}:a]aformat=channel_layouts=stereo,` +
      `afade=t=in:st=0:d=${fadeDur},` +
      `afade=t=out:st=${totalDur - fadeDur}:d=${fadeDur},` +
      `volume=0.45[aout]`;  // 0.45 = clearly audible background; was 0.14 (inaudible)

    args.push(
      "-filter_complex", filterComplex,
      "-map",    "[vout]",
      "-map",    "[aout]",
      "-c:v",    "libx264",
      "-preset", "ultrafast",   // fastest encode — critical for Vercel 120s limit
      "-crf",    "26",          // slightly higher CRF = smaller file, still good quality
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

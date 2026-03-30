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
import { buildTitleCardPng } from "./thumbnail-svg";

// ── Constants ──────────────────────────────────────────────────────────────────

const W   = 1080;
const H   = 1920;
const FPS = 30;

// Slide durations (seconds)
const DEF_STEPS_DUR = 9;
const PIPELINE_DUR  = 9;
const CTA_DUR       = 4;  // subscribe bumper — short static frame

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
  if (template === "pipeline")  return PIPELINE_DUR;
  if (template === "flowchart") return PIPELINE_DUR;  // same pacing as pipeline
  if (template === "cta")       return CTA_DUR;
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

  const renderRows  = slideRows;
  const totalSlides = renderRows.length;

  if (totalSlides === 0) throw new Error("No slides to render");
  onLog?.(`[render] "${series.title}" — ${totalSlides} slides`);

  try {
    // ── Step 1: render all slides in parallel ───────────────────────────────
    // Renders all slides simultaneously so PNG generation time ≈ one slide's
    // time rather than N slides × one slide's time. Critical for Vercel 60s limit.
    onLog?.("[render] Generating slide PNGs (parallel)…");

    interface FrameEntry { path: string; dur: number }

    // Pre-render the title card (1080×1920) as first frame — YouTube auto-picks
    // this as the video thumbnail so the channel doesn't need verification.
    const titleCardBuf = await buildTitleCardPng(series.title, series.category, series.difficulty)
      .catch(() => null); // don't fail the whole render if title card fails

    const allSlides = await Promise.all(
      renderRows.map(async (row, i) => {
        const data = JSON.parse(row.data) as Record<string, unknown>;
        data.slideNum    = i + 1;
        data.totalSlides = totalSlides;
        const slideDur = dur(row.template);
        const bufs     = await slideToPngFrames(row.template, data);
        const frameDur = slideDur / bufs.length;
        return bufs.map((buf, f) => ({ buf, i, f, frameDur }));
      })
    );

    // Write PNGs in slide order and collect frame entries
    const frames: FrameEntry[] = [];

    // Prepend title card (1.5s) — becomes YouTube's auto-picked thumbnail
    if (titleCardBuf) {
      const tcPath = path.join(tmpDir, "titlecard.png");
      fs.writeFileSync(tcPath, titleCardBuf);
      frames.push({ path: tcPath, dur: 1.5 });
    }

    for (const slideFrames of allSlides) {
      for (const { buf, i, f, frameDur } of slideFrames) {
        const fPath = path.join(tmpDir, `slide_${i}_f${f}.png`);
        fs.writeFileSync(fPath, buf);
        frames.push({ path: fPath, dur: frameDur });
      }
    }

    if (frames.length === 0) throw new Error("No frames generated");
    const totalDur = frames.reduce((s, f) => s + f.dur, 0);
    onLog?.(`[render] ${frames.length} frames, ~${totalDur.toFixed(1)}s total`);

    // ── Step 2: build FFmpeg args ───────────────────────────────────────────
    const args: string[] = ["-y"];

    // One PNG input per reveal frame, each held for frameDur seconds.
    // Use 2 fps input for still images — 18 frames/slide instead of 270.
    // The output is forced back to 30 fps via -r below (frame duplication is free).
    frames.forEach((f) => {
      args.push(
        "-loop",      "1",
        "-t",         f.dur.toFixed(2),
        "-framerate", "2",
        "-i",         f.path
      );
    });

    // filter_complex: scale + concat all frames, add progress bar
    // No background music — video-only output (cleaner, faster, no audio overhead)
    const labels: string[] = [];
    let filterComplex = "";

    frames.forEach((_f, i) => {
      filterComplex += `[${i}:v]scale=${W}:${H}:flags=bilinear,format=yuv420p[s${i}];`;
      labels.push(`[s${i}]`);
    });

    filterComplex += `${labels.join("")}concat=n=${labels.length}:v=1:a=0[vconcat];`;
    filterComplex += `[vconcat]drawbox=x=0:y=${H - 10}:w='min(iw\\,(t/${totalDur})*iw)':h=10:color=0xa855f7@0.9:t=fill[vout]`;

    args.push(
      "-filter_complex", filterComplex,
      "-map",    "[vout]",
      "-c:v",    "libx264",
      "-preset", "ultrafast",   // fastest encode — critical for Vercel limit
      "-crf",    "26",
      "-r",      String(FPS),   // force 30fps output; input is 2fps (frame duplication is free)
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
      timeout: 270_000,
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

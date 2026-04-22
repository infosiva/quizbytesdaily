/**
 * video-renderer.ts
 * Renders a quiz series as an MP4 Short (1080×1920).
 *
 * Pipeline:
 *   DB slides  →  slide-svg.ts     (SVG → reveal frames → PNG per frame)
 *              →  tts.ts           (Edge TTS → per-slide MP3 narration)
 *              →  FFmpeg           (PNG frames + TTS audio + ambient music → H.264/AAC MP4)
 *
 * Audio stack:
 *   • Voice-over:  Microsoft Edge TTS (free, neural, no API key)
 *   • Background:  ffmpeg aevalsrc ambient synthesis (free, offline)
 *   • Mixing:      amix (TTS at 100%, ambient at 14%)
 *   • Voice & ambient variant are randomly chosen per video for variety.
 */

import { spawnSync }             from "child_process";
import path                      from "path";
import fs                        from "fs";
import os                        from "os";
import { getSlides, getSeriesById } from "./db";
import { slideToPngFrames }      from "./slide-svg";
import { buildTitleCardPng }     from "./thumbnail-svg";
import { edgeTTS, mp3Duration }  from "./tts";
import { slideNarration, pickVoice } from "./narrate";

// ── Constants ──────────────────────────────────────────────────────────────────

const W   = 1080;
const H   = 1920;
const FPS = 30;

// Minimum slide duration (seconds) — even if TTS is very short
const MIN_SLIDE_DUR = 4.5;
// Padding after TTS ends before next slide
const TTS_TAIL      = 0.6;
// Title card duration (no TTS — short silent intro)
const TITLE_DUR     = 2.0;
// CTA slide duration
const CTA_DUR       = 4.0;

// Output dir — always /tmp so it works on Vercel's read-only filesystem
const RENDERS_DIR = path.join(os.tmpdir(), "qbd-renders");

// ── Ambient music variants (ffmpeg aevalsrc synthesis) ───────────────────────
// Each variant produces a distinct ambient background feel.
// Randomly chosen per video so repeated viewers hear variety.

const AMBIENT_VARIANTS = [
  // 0: Deep space — low drone, ethereal
  "aevalsrc=sin(2*PI*55*t)*0.05+sin(2*PI*110*t)*0.035+sin(2*PI*165*t)*0.02:s=44100:c=stereo",
  // 1: Lofi chord — slightly warmer
  "aevalsrc=sin(2*PI*65.4*t)*0.045+sin(2*PI*98*t)*0.035+sin(2*PI*130.8*t)*0.025+sin(2*PI*196*t)*0.015:s=44100:c=stereo",
  // 2: Tech pulse — higher harmonics, slightly edgier
  "aevalsrc=sin(2*PI*82.4*t)*0.04+sin(2*PI*123.5*t)*0.03+sin(2*PI*247*t)*0.015:s=44100:c=stereo",
  // 3: Soft pad — just two notes, very minimal
  "aevalsrc=sin(2*PI*73.4*t)*0.05+sin(2*PI*146.8*t)*0.035:s=44100:c=stereo",
];

// ── FFmpeg path ────────────────────────────────────────────────────────────────

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

function runFFmpeg(args: string[], timeoutMs = 240_000): void {
  const FFMPEG = getFFmpegPath();
  try { fs.chmodSync(FFMPEG, 0o755); } catch { /* ignore */ }

  const result = spawnSync(FFMPEG, args, {
    encoding:  "utf8",
    maxBuffer: 20 * 1024 * 1024,
    timeout:   timeoutMs,
  });

  if (result.status !== 0 || result.error) {
    const spawnMsg   = result.error ? ` [spawn: ${result.error.message}]` : "";
    const stderr     = result.stderr ?? "";
    const errorLines = stderr
      .split("\n")
      .filter((l) => /error|invalid|cannot|failed|unable|not found|no such/i.test(l))
      .join("\n")
      .slice(0, 3000);
    throw new Error(`FFmpeg error${spawnMsg} (exit ${result.status}):\n${errorLines || stderr.slice(0, 1000)}`);
  }
}

// ── Silence MP3 generator ─────────────────────────────────────────────────────

/** Generate N seconds of silence as an MP3 file */
function generateSilence(outputPath: string, durationSecs: number): void {
  runFFmpeg([
    "-y",
    "-f", "lavfi",
    "-i", `anullsrc=r=24000:cl=mono`,
    "-t", durationSecs.toFixed(3),
    "-acodec", "libmp3lame",
    "-b:a", "48k",
    outputPath,
  ], 30_000);
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
  onLog?.(`[render] "${series.title}" — ${totalSlides} slides`);

  // Pick random voice + ambient variant for this video
  const voice          = pickVoice();
  const ambientVariant = Math.floor(Math.random() * AMBIENT_VARIANTS.length);
  onLog?.(`[render] Voice: ${voice} | Ambient: variant ${ambientVariant}`);

  try {
    // ── Step 1: Generate slide PNGs + TTS audio in parallel ────────────────
    onLog?.("[render] Generating PNGs + TTS audio in parallel…");

    interface SlideResult {
      frames:    Array<{ buf: Buffer; frameDur: number }>;
      ttsMp3:    string | null;  // path to MP3, or null if TTS failed
      slideDur:  number;         // final slide duration (seconds)
    }

    const titleCardBuf = await buildTitleCardPng(series.title, series.category, series.difficulty)
      .catch(() => null);

    // Generate PNGs + TTS for each slide simultaneously
    const slideResults: SlideResult[] = await Promise.all(
      slideRows.map(async (row, i): Promise<SlideResult> => {
        const data = JSON.parse(row.data) as Record<string, unknown>;
        data.slideNum    = i + 1;
        data.totalSlides = totalSlides;
        const isCta = row.template === "cta";

        // Generate PNG frames
        const bufs = await slideToPngFrames(row.template, data, series.category);

        // Generate TTS (skip for CTA — use predefined short line)
        let ttsMp3: string | null = null;
        let slideDur = isCta ? CTA_DUR : MIN_SLIDE_DUR;

        try {
          const narration = slideNarration(row.template, data);
          if (narration.trim().length > 3) {
            const mp3Buf    = await edgeTTS(narration, voice);
            const ttsDur    = mp3Duration(mp3Buf);
            slideDur        = Math.max(ttsDur + TTS_TAIL, MIN_SLIDE_DUR);
            ttsMp3          = path.join(tmpDir, `slide_${i}_tts.mp3`);
            fs.writeFileSync(ttsMp3, mp3Buf);
          }
        } catch (ttsErr) {
          // TTS failure is non-fatal — slide will be silent
          onLog?.(`[tts] Slide ${i + 1} TTS failed: ${ttsErr instanceof Error ? ttsErr.message : String(ttsErr)}`);
        }

        return {
          frames: bufs.map((buf) => ({ buf, frameDur: slideDur / bufs.length })),
          ttsMp3,
          slideDur,
        };
      })
    );

    // ── Step 2: Write PNG files + build frame list ──────────────────────────
    interface FrameEntry { path: string; dur: number }
    const frames: FrameEntry[] = [];

    // Title card (2s) — silent
    if (titleCardBuf) {
      const tcPath = path.join(tmpDir, "titlecard.png");
      fs.writeFileSync(tcPath, titleCardBuf);
      frames.push({ path: tcPath, dur: TITLE_DUR });
    }

    for (let i = 0; i < slideResults.length; i++) {
      const { frames: sFrames } = slideResults[i];
      for (let f = 0; f < sFrames.length; f++) {
        const fPath = path.join(tmpDir, `slide_${i}_f${f}.png`);
        fs.writeFileSync(fPath, sFrames[f].buf);
        frames.push({ path: fPath, dur: sFrames[f].frameDur });
      }
    }

    if (frames.length === 0) throw new Error("No frames generated");
    const totalVideoDur = frames.reduce((s, f) => s + f.dur, 0);
    onLog?.(`[render] ${frames.length} frames, ~${totalVideoDur.toFixed(1)}s total`);

    // ── Step 3: Build TTS audio track (concat per-slide MP3s + silence) ─────
    onLog?.("[render] Building TTS audio track…");

    // Title card → silence
    const titleSilencePath = path.join(tmpDir, "title_silence.mp3");
    generateSilence(titleSilencePath, TITLE_DUR);

    const audioListEntries: string[] = [`file '${titleSilencePath}'`];
    for (let i = 0; i < slideResults.length; i++) {
      const { ttsMp3, slideDur } = slideResults[i];
      if (ttsMp3 && fs.existsSync(ttsMp3)) {
        audioListEntries.push(`file '${ttsMp3}'`);
        // Pad to slide duration if TTS is shorter (silence tail)
        const ttsDur = mp3Duration(fs.readFileSync(ttsMp3));
        const pad    = slideDur - ttsDur;
        if (pad > 0.1) {
          const padPath = path.join(tmpDir, `slide_${i}_pad.mp3`);
          generateSilence(padPath, pad);
          audioListEntries.push(`file '${padPath}'`);
        }
      } else {
        // No TTS — full silence for this slide
        const silPath = path.join(tmpDir, `slide_${i}_silence.mp3`);
        generateSilence(silPath, slideDur);
        audioListEntries.push(`file '${silPath}'`);
      }
    }

    const audioListPath = path.join(tmpDir, "audio_list.txt");
    fs.writeFileSync(audioListPath, audioListEntries.join("\n"));

    const ttsConcatPath = path.join(tmpDir, "tts_concat.mp3");
    runFFmpeg([
      "-y",
      "-f", "concat", "-safe", "0",
      "-i", audioListPath,
      "-c", "copy",
      ttsConcatPath,
    ], 60_000);

    // ── Step 4: Build final video with audio ────────────────────────────────
    onLog?.("[render] Encoding final MP4 with audio…");

    const numPngInputs   = frames.length;
    const ttsInputIdx    = numPngInputs;
    const ambientInputIdx = numPngInputs + 1;

    const args: string[] = ["-y"];

    // PNG inputs (one per reveal frame)
    frames.forEach((f) => {
      args.push(
        "-loop",      "1",
        "-t",         f.dur.toFixed(3),
        "-framerate", "2",
        "-i",         f.path
      );
    });

    // TTS audio track
    args.push("-i", ttsConcatPath);

    // Ambient music (generated inline — no file needed)
    args.push(
      "-f",    "lavfi",
      "-i",    `${AMBIENT_VARIANTS[ambientVariant]},aformat=fltp:channel_layouts=stereo`
    );

    // filter_complex: video concat + progress bar, then audio mix
    const vLabels: string[] = [];
    let filterComplex = "";

    frames.forEach((_f, i) => {
      filterComplex += `[${i}:v]scale=${W}:${H}:flags=bilinear,format=yuv420p[s${i}];`;
      vLabels.push(`[s${i}]`);
    });

    filterComplex += `${vLabels.join("")}concat=n=${vLabels.length}:v=1:a=0[vconcat];`;
    filterComplex += `[vconcat]drawbox=x=0:y=${H - 8}:w='min(iw\\,(t/${totalVideoDur.toFixed(3)})*iw)':h=8:color=0xa855f7@0.9:t=fill[vout];`;
    // Mix TTS (weight 1.0) + ambient (weight 0.14) — TTS is clearly heard over subtle background
    filterComplex += `[${ttsInputIdx}:a][${ambientInputIdx}:a]amix=inputs=2:duration=first:dropout_transition=2:weights='1 0.14'[aout]`;

    args.push(
      "-filter_complex", filterComplex,
      "-map",    "[vout]",
      "-map",    "[aout]",
      "-c:v",    "libx264",
      "-preset", "ultrafast",
      "-crf",    "26",
      "-r",      String(FPS),
      "-pix_fmt", "yuv420p",
      "-c:a",    "aac",
      "-b:a",    "128k",
      "-ar",     "44100",
      "-movflags", "+faststart",
      "-threads", "0",
      outFile
    );

    runFFmpeg(args, 240_000);

    onLog?.(`[render] ✓ Done → ${outFile} (voice: ${voice}, ambient: ${ambientVariant})`);
    return outFile;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
}

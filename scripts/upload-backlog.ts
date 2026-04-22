#!/usr/bin/env npx tsx
/**
 * upload-backlog.ts
 * One-shot script — renders + uploads every 'queued' series to YouTube.
 * Run locally to bypass Vercel's function time limits.
 *
 *   npx tsx scripts/upload-backlog.ts
 */

import * as path   from "path";
import * as fs     from "fs";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { getQueuedForUpload, setSeriesStatus, updateSeriesYouTube } from "../lib/db";
import { renderSeries } from "../lib/video-renderer";

// ── YouTube helpers ───────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.YOUTUBE_CLIENT_ID ?? "",
      client_secret: process.env.YOUTUBE_CLIENT_SECRET ?? "",
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN ?? "",
      grant_type:    "refresh_token",
    }),
  });
  const d = await res.json() as { access_token?: string; error?: string; error_description?: string };
  if (!d.access_token) throw new Error(`Token refresh failed: ${d.error_description ?? d.error}`);
  return d.access_token;
}

async function uploadVideo(
  videoPath: string,
  title: string,
  category: string,
  difficulty: string
): Promise<string> {
  const token = await getAccessToken();
  const buf   = fs.readFileSync(videoPath);

  const desc = [
    `🧠 Daily Tech Quiz: ${title}`,
    "",
    "Think you know the answer? Drop it in the comments! 👇",
    "",
    `Category: ${category} | Difficulty: ${difficulty}`,
    "",
    "✅ Subscribe for daily bite-sized tech quizzes",
    "",
    `#TechQuiz #QuizBytesDaily #${category.replace(/[^a-zA-Z]/g, "")} #Shorts #LearnToCode`,
  ].join("\n");

  // Initiate resumable upload
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization:             `Bearer ${token}`,
        "Content-Type":            "application/json",
        "X-Upload-Content-Type":   "video/mp4",
        "X-Upload-Content-Length": String(buf.byteLength),
      },
      body: JSON.stringify({
        snippet: {
          title:       `${title} #Shorts`,
          description: desc,
          tags:        ["TechQuiz", "QuizBytesDaily", "Shorts", category, difficulty],
          categoryId:  "28",
        },
        status: { privacyStatus: "public", madeForKids: false, selfDeclaredMadeForKids: false },
      }),
    }
  );

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) throw new Error(`No upload URL (${initRes.status}): ${await initRes.text()}`);

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/mp4", "Content-Length": String(buf.byteLength) },
    body: buf as unknown as BodyInit,
  });

  const vid = await uploadRes.json() as { id?: string; error?: { message?: string } };
  if (!vid.id) throw new Error(vid.error?.message ?? "No video ID in response");
  return vid.id;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const queue = await getQueuedForUpload();

  if (queue.length === 0) {
    console.log("✅ No queued series — nothing to upload.");
    return;
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`📤 UPLOAD BACKLOG — ${queue.length} series queued`);
  console.log(`${"═".repeat(60)}\n`);

  let uploaded = 0;
  let failed   = 0;

  for (const series of queue) {
    console.log(`${"─".repeat(60)}`);
    console.log(`[${uploaded + failed + 1}/${queue.length}] #${series.id}: ${series.title}`);
    console.log(`   ${series.category} · ${series.difficulty}`);

    await setSeriesStatus(series.id, "publishing");
    let tmpFile: string | null = null;

    try {
      console.log("   🎬 Rendering…");
      tmpFile = await renderSeries(series.id, (m) => console.log(`   ${m}`));

      const sizeMb = (fs.statSync(tmpFile).size / 1024 / 1024).toFixed(1);
      console.log(`   ✓  Rendered (${sizeMb} MB)`);

      console.log("   📤 Uploading to YouTube…");
      const videoId  = await uploadVideo(tmpFile, series.title, series.category, series.difficulty);
      const videoUrl = `https://www.youtube.com/shorts/${videoId}`;
      await updateSeriesYouTube(series.id, videoId, videoUrl);

      console.log(`   ✅ Live: ${videoUrl}`);
      uploaded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`   ❌ Failed: ${msg.slice(0, 200)}`);
      await setSeriesStatus(series.id, "queued").catch(() => {});
      failed++;
    } finally {
      if (tmpFile) try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }

    console.log();
  }

  console.log(`${"═".repeat(60)}`);
  console.log(`🎉 Done — ${uploaded} uploaded, ${failed} failed`);
  console.log(`${"═".repeat(60)}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

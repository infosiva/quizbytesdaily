// GET /api/cron/upload-scheduled
// Vercel cron: runs hourly (9 AM – 4 PM UTC).
// Finds the next queued series due for upload, renders it to MP4, and uploads to YouTube.
// Processes one video per invocation to stay within Vercel's function time limits.

import { NextRequest, NextResponse } from "next/server";
import { getQueuedForUpload, setSeriesStatus, updateSeriesYouTube } from "@/lib/db";
import { renderSeries } from "@/lib/video-renderer";
import { sendMessage } from "@/lib/telegram";
import fs from "fs";

export const runtime    = "nodejs";
export const maxDuration = 300;

// ── Auth ───────────────────────────────────────────────────────────────────────
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization") ?? "";
  return auth === `Bearer ${secret}`;
}

// ── Refresh YouTube OAuth token ────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string; error_description?: string };
  if (!data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "Token refresh failed");
  }
  return data.access_token;
}

// ── Build YouTube tags from category ──────────────────────────────────────────
function buildTags(category: string, title: string): string[] {
  const common = ["QuizBytesDaily", "TechQuiz", "CodingQuiz", "LearnToCode", "Shorts", "ProgrammingQuiz"];
  const catTags: Record<string, string[]> = {
    "AI/ML":         ["AI", "MachineLearning", "LLM", "ArtificialIntelligence"],
    "Python":        ["Python", "PythonProgramming", "PythonTips"],
    "Algorithms":    ["Algorithms", "DataStructures", "LeetCode", "CodingInterview"],
    "JavaScript":    ["JavaScript", "JSProgramming", "WebDev"],
    "System Design": ["SystemDesign", "SoftwareEngineering", "BackendDev"],
    "DevOps":        ["DevOps", "Docker", "Kubernetes", "CloudComputing"],
  };
  return [...common, ...(catTags[category] ?? [])].slice(0, 15);
}

// ── Upload video to YouTube ───────────────────────────────────────────────────
async function uploadToYouTube(
  videoBuffer: Buffer,
  title: string,
  description: string,
  tags: string[]
): Promise<string> {
  const token = await getAccessToken();

  // Initiate resumable upload
  const initRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization:             `Bearer ${token}`,
        "Content-Type":            "application/json",
        "X-Upload-Content-Type":   "video/mp4",
        "X-Upload-Content-Length": String(videoBuffer.byteLength),
      },
      body: JSON.stringify({
        snippet: { title, description, tags, categoryId: "28" },
        status:  { privacyStatus: "public", madeForKids: false, selfDeclaredMadeForKids: false },
      }),
    }
  );

  const uploadUrl = initRes.headers.get("Location");
  if (!uploadUrl) {
    const err = await initRes.text();
    throw new Error(`Failed to init upload: ${err}`);
  }

  // Upload video bytes
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type":   "video/mp4",
      "Content-Length": String(videoBuffer.byteLength),
    },
    body: videoBuffer as unknown as BodyInit,
  });

  const vid = await uploadRes.json() as { id?: string; error?: { message?: string } };
  if (!vid.id) {
    throw new Error(vid.error?.message ?? "YouTube upload failed");
  }
  return vid.id;
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the first series due for upload
  const queue = await getQueuedForUpload();
  if (queue.length === 0) {
    return NextResponse.json({ ok: true, message: "No queued videos" });
  }

  const series = queue[0];
  console.log(`[upload-scheduled] Processing: #${series.id} "${series.title}"`);

  // Mark as 'publishing' to prevent double-processing
  await setSeriesStatus(series.id, "publishing");

  let tmpFile: string | null = null;
  try {
    // Render to MP4
    tmpFile = await renderSeries(series.id, (msg) => console.log(`[render] ${msg}`));
    const videoBuffer = fs.readFileSync(tmpFile);

    // Build YouTube metadata
    const description = [
      `🧠 Daily Tech Quiz: ${series.title}`,
      "",
      "Think you know the answer? Drop it in the comments! 👇",
      "",
      `Category: ${series.category} | Format: quiz shorts`,
      "",
      "✅ Subscribe for daily bite-sized tech quizzes",
      "",
      `#TechQuiz #QuizBytesDaily #${series.category.replace(/[^a-zA-Z]/g, "")} #Shorts #LearnToCode`,
    ].join("\n");

    const youtubeTitle = `${series.title} #Shorts`;
    const tags         = buildTags(series.category, series.title);

    // Upload to YouTube
    const videoId  = await uploadToYouTube(videoBuffer, youtubeTitle, description, tags);
    const videoUrl = `https://www.youtube.com/shorts/${videoId}`;

    // Update DB
    await updateSeriesYouTube(series.id, videoId, videoUrl);

    // Telegram notification
    const cat = series.category;
    await sendMessage(
      `✅ <b>Uploaded!</b> ${cat} quiz\n\n` +
      `📌 ${series.title}\n` +
      `🔗 <a href="${videoUrl}">${videoUrl}</a>`
    ).catch(() => {}); // Don't fail on Telegram error

    console.log(`[upload-scheduled] ✓ Uploaded: ${videoUrl}`);

    return NextResponse.json({
      ok: true,
      uploaded: { id: series.id, title: series.title, youtubeUrl: videoUrl },
      remaining: queue.length - 1,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[upload-scheduled] ✗ Failed: ${msg}`);

    // Revert status so it retries on next cron run
    await setSeriesStatus(series.id, "queued").catch(() => {});

    // Telegram error notification
    await sendMessage(
      `⚠️ <b>Upload failed</b> for "${series.title}"\n\nError: ${msg.slice(0, 200)}`
    ).catch(() => {});

    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  } finally {
    if (tmpFile) {
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
    }
  }
}

export const POST = GET;

import { NextRequest, NextResponse } from "next/server";
import { getSeriesBySlug, updateSeriesYouTube } from "@/lib/db";
import { buildThumbnailJpeg } from "@/lib/thumbnail-svg";

export const runtime    = "nodejs";
export const maxDuration = 300; // 5 min — large video uploads

// ── Refresh OAuth token ───────────────────────────────────────────────────────
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
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.error_description ?? data.error ?? "Token refresh failed");
  }
  return data.access_token as string;
}

// ── POST /api/youtube/upload ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Validate credentials are present
    const missing = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"].filter(
      (k) => !process.env[k]
    );
    if (missing.length) {
      return NextResponse.json(
        { error: `Missing env vars: ${missing.join(", ")}. Add them to .env.local.` },
        { status: 500 }
      );
    }

    const form          = await req.formData();
    const videoFile     = form.get("video")         as File | null;
    const seriesSlug    = (form.get("seriesSlug")   as string) || "";
    const title         = (form.get("title")         as string) || "QuizBytesDaily Quiz #Shorts";
    const description   = (form.get("description")   as string) || "";
    const tagsRaw       = (form.get("tags")           as string) || "";
    const privacyStatus = (form.get("privacyStatus")  as string) || "public";

    if (!videoFile) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const tags  = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    const token = await getAccessToken();

    // ── 1. Initiate resumable upload ─────────────────────────────────────────
    const videoBuffer = Buffer.from(await videoFile.arrayBuffer());

    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Upload-Content-Type":   videoFile.type || "video/mp4",
          "X-Upload-Content-Length": String(videoBuffer.byteLength),
        },
        body: JSON.stringify({
          snippet: {
            title,
            description,
            tags,
            categoryId: "28", // Science & Technology
          },
          status: {
            privacyStatus,
            madeForKids: false,
            selfDeclaredMadeForKids: false,
          },
        }),
      }
    );

    const uploadUrl = initRes.headers.get("Location");
    if (!uploadUrl) {
      const err = await initRes.text();
      return NextResponse.json({ error: `Failed to init upload: ${err}` }, { status: 500 });
    }

    // ── 2. Upload video bytes ────────────────────────────────────────────────
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type":   videoFile.type || "video/mp4",
        "Content-Length": String(videoBuffer.byteLength),
      },
      body: videoBuffer,
    });

    const vid = await uploadRes.json();
    if (!vid.id) {
      return NextResponse.json(
        { error: vid.error?.message ?? "Video upload failed — check YouTube API quota" },
        { status: 500 }
      );
    }

    // ── 3. Persist YouTube ID to DB (marks series as published) ─────────────
    const youtubeUrl = `https://www.youtube.com/shorts/${vid.id}`;
    if (seriesSlug) {
      try {
        const series = await getSeriesBySlug(seriesSlug);
        if (series) {
          await updateSeriesYouTube(series.id, vid.id as string, youtubeUrl);
        }
      } catch (dbErr) {
        console.warn("[upload] DB update failed:", dbErr);
        // Non-fatal — video is on YouTube, DB link is secondary
      }
    }

    // ── 4. Set custom thumbnail (server-generated from series slug) ───────────
    let thumbWarning: string | undefined;
    try {
      // Generate JPEG thumbnail from the series data
      let thumbBuffer: Buffer | null = null;
      if (seriesSlug) {
        const series = await getSeriesBySlug(seriesSlug);
        if (series) {
          thumbBuffer = await buildThumbnailJpeg(series.title, series.category, series.difficulty);
        }
      }

      if (thumbBuffer) {
        const thumbRes = await fetch(
          `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${vid.id}&uploadType=media`,
          {
            method: "POST",
            headers: {
              Authorization:    `Bearer ${token}`,
              "Content-Type":   "image/jpeg",
              "Content-Length": String(thumbBuffer.byteLength),
            },
            body: new Uint8Array(thumbBuffer),
          }
        );
        if (!thumbRes.ok) {
          const thumbErr = await thumbRes.json().catch(() => ({}));
          const errMsg   = (thumbErr as { error?: { message?: string } }).error?.message ?? thumbRes.statusText;
          // Not a fatal error — video uploaded successfully, thumbnail just didn't apply
          thumbWarning = `Thumbnail not applied: ${errMsg}. (Channel verification required for custom thumbnails.)`;
          console.warn("[upload] thumbnail set failed:", errMsg);
        }
      }
    } catch (thumbEx) {
      thumbWarning = `Thumbnail generation failed: ${thumbEx instanceof Error ? thumbEx.message : String(thumbEx)}`;
      console.warn("[upload] thumbnail error:", thumbWarning);
    }

    return NextResponse.json({
      videoId: vid.id,
      url: youtubeUrl,
      ...(thumbWarning ? { thumbWarning } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

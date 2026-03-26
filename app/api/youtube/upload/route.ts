import { NextRequest, NextResponse } from "next/server";

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
    const videoFile     = form.get("video")       as File | null;
    const thumbFile     = form.get("thumbnail")   as File | null;
    const title         = (form.get("title")         as string) || "QuizBytesDaily Quiz #Shorts";
    const description   = (form.get("description")   as string) || "";
    const tagsRaw       = (form.get("tags")           as string) || "";
    const privacyStatus = (form.get("privacyStatus")  as string) || "private";

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

    // ── 3. Set custom thumbnail (if provided) ────────────────────────────────
    if (thumbFile) {
      const thumbBuffer = Buffer.from(await thumbFile.arrayBuffer());
      await fetch(
        `https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${vid.id}&uploadType=media`,
        {
          method: "POST",
          headers: {
            Authorization:    `Bearer ${token}`,
            "Content-Type":   thumbFile.type || "image/jpeg",
            "Content-Length": String(thumbBuffer.byteLength),
          },
          body: thumbBuffer,
        }
      );
    }

    return NextResponse.json({
      videoId: vid.id,
      url: `https://www.youtube.com/shorts/${vid.id}`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

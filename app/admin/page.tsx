"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ALL_SERIES } from "@/lib/slides";
import { channelConfig } from "@/lib/config";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SeriesMeta {
  title: string;
  description: string;
  tags: string;
  privacyStatus: "public" | "private" | "unlisted";
}

// ── Default metadata per series ───────────────────────────────────────────────
const TAG_MAP: Record<string, string[]> = {
  rag:    ["RAG", "RetrievalAugmentedGeneration", "LLM", "VectorDatabase", "ChatGPT", "AI", "MachineLearning"],
  async:  ["Python", "AsyncPython", "Asyncio", "PythonTips", "Coding", "Programming"],
  tfm:    ["Transformers", "BERT", "GPT", "DeepLearning", "NLP", "AI", "MachineLearning"],
  docker: ["Docker", "DevOps", "Containers", "CloudComputing", "SoftwareEngineering"],
};
const COMMON_TAGS = ["QuizBytesDaily", "TechQuiz", "CodingQuiz", "LearnToCode", "Shorts", "ProgrammingQuiz"];

function defaultMeta(id: string, label: string): SeriesMeta {
  const specific = TAG_MAP[id] ?? [];
  return {
    title: `${label} Quiz — Can You Answer? #Shorts`,
    description: [
      `🧠 Daily Tech Quiz: ${label}`,
      "",
      "Think you know the answer? Watch till the end to find out! 👇",
      "",
      "✅ Subscribe for daily bite-sized tech quizzes",
      "📌 New quiz every day — Python, AI, Docker, Algorithms & more",
      "",
      `👉 Browse all quizzes: ${channelConfig.websiteUrl}`,
      "",
      `#QuizBytesDaily #TechQuiz #${specific[0] ?? "Coding"} #Shorts`,
    ].join("\n"),
    tags: [...specific, ...COMMON_TAGS].join(", "),
    privacyStatus: "private",
  };
}

// ── Thumbnail generator (client-side canvas, 1280×720) ────────────────────────
function generateThumbnail(label: string, title: string): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d")!;

    // Background
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, 1280, 720);

    // Gradient overlay
    const g = ctx.createLinearGradient(0, 0, 1280, 720);
    g.addColorStop(0, "rgba(168,85,247,0.18)");
    g.addColorStop(1, "rgba(34,211,238,0.10)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, 720);

    // Faint "?" watermark
    ctx.save();
    ctx.font = "bold 520px Arial";
    ctx.fillStyle = "rgba(168,85,247,0.07)";
    ctx.textAlign = "right";
    ctx.fillText("?", 1255, 650);
    ctx.restore();

    // Series label badge
    ctx.font = "bold 30px Arial";
    const lw = ctx.measureText(label).width;
    ctx.fillStyle = "rgba(168,85,247,0.22)";
    roundRect(ctx, 70, 128, lw + 52, 52, 26);
    ctx.fill();
    ctx.fillStyle = "#c084fc";
    ctx.textAlign = "left";
    ctx.fillText(label, 96, 165);

    // Title (word-wrapped)
    const clean = title.replace(/\s*#shorts$/i, "");
    ctx.font = "bold 66px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    const words = clean.split(" ");
    let line = "";
    let y = 278;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > 1120 && line) {
        ctx.fillText(line, 70, y);
        line = w;
        y += 85;
      } else { line = test; }
    }
    if (line) ctx.fillText(line, 70, y);

    // Accent bar
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(70, y + 28, 90, 4);

    // Channel branding
    ctx.font = "bold 34px Arial";
    ctx.fillStyle = "#22d3ee";
    ctx.textAlign = "left";
    ctx.fillText(channelConfig.handle, 70, 678);

    canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92);
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [selIdx, setSelIdx] = useState(0);
  const [meta, setMeta]     = useState<Record<string, SeriesMeta>>(() =>
    Object.fromEntries(ALL_SERIES.map((s) => [s.id, defaultMeta(s.id, s.label)]))
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbUrl, setThumbUrl]   = useState<string | null>(null);
  const [thumbBlob, setThumbBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]       = useState<{ url?: string; error?: string } | null>(null);

  const fileRef  = useRef<HTMLInputElement>(null);
  const metaRef  = useRef(meta);
  metaRef.current = meta;

  const series = ALL_SERIES[selIdx];
  const cur    = meta[series.id];

  // Restore saved metadata from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("qbd_meta");
    if (saved) {
      try { setMeta(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Regenerate thumbnail when series changes
  useEffect(() => {
    setThumbUrl(null);
    const s = ALL_SERIES[selIdx];
    const m = metaRef.current[s.id];
    generateThumbnail(s.label, m.title).then((blob) => {
      setThumbBlob(blob);
      setThumbUrl(URL.createObjectURL(blob));
    });
  }, [selIdx]);

  function update(field: keyof SeriesMeta, value: string) {
    const updated = { ...meta, [series.id]: { ...cur, [field]: value } };
    setMeta(updated);
    localStorage.setItem("qbd_meta", JSON.stringify(updated));
  }

  function refreshThumb() {
    setThumbUrl(null);
    generateThumbnail(series.label, cur.title).then((blob) => {
      setThumbBlob(blob);
      setThumbUrl(URL.createObjectURL(blob));
    });
  }

  async function handleUpload() {
    if (!videoFile) return;
    setUploading(true);
    setResult(null);

    const form = new FormData();
    form.append("video",         videoFile);
    form.append("title",         cur.title);
    form.append("description",   cur.description);
    form.append("tags",          cur.tags);
    form.append("privacyStatus", cur.privacyStatus);
    if (thumbBlob) form.append("thumbnail", thumbBlob, "thumbnail.jpg");

    const res  = await fetch("/api/youtube/upload", { method: "POST", body: form });
    const data = await res.json();
    setResult(data.url ? { url: data.url } : { error: data.error ?? "Upload failed" });
    setUploading(false);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#08080f", color: "#e2e8f0" }}>

      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
        style={{ borderColor: "#1e1e2e", background: "#09090f" }}>
        <Link href="/" className="text-sm text-slate-500 hover:text-white transition-colors">← Dashboard</Link>
        <span style={{ color: "#1e1e2e" }}>|</span>
        <span className="text-sm font-bold text-white">Upload to YouTube</span>
        <span className="ml-auto text-[11px] text-slate-600">
          Preview first at{" "}
          <Link href="/slides" className="text-purple-400 hover:underline underline-offset-2">Slide Preview →</Link>
        </span>
      </header>

      <div className="flex flex-1 min-h-0">

        {/* ── Left sidebar ── */}
        <aside className="w-56 shrink-0 border-r flex flex-col p-4 gap-1"
          style={{ borderColor: "#1e1e2e", background: "#090910" }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-2">Series</p>
          {ALL_SERIES.map((s, i) => (
            <button key={s.id}
              onClick={() => { setSelIdx(i); setVideoFile(null); setResult(null); }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border"
              style={selIdx === i
                ? { background: "#a855f718", borderColor: "#a855f755", color: "#c084fc" }
                : { background: "transparent", borderColor: "#1e1e2e", color: "#64748b" }}>
              {s.label}
              <span className="block text-[10px] font-mono mt-0.5 opacity-50">
                {s.slides.length} slides
              </span>
            </button>
          ))}

          <div className="mt-auto pt-4 border-t space-y-2" style={{ borderColor: "#1e1e2e" }}>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Metadata saved locally in your browser.
            </p>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Add YouTube credentials to <code className="text-purple-400">.env.local</code> to enable upload.
            </p>
          </div>
        </aside>

        {/* ── Right content ── */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">

            {/* ── Metadata ── */}
            <section className="rounded-xl border p-5 space-y-4"
              style={{ background: "#0f0f1a", borderColor: "#1e1e2e" }}>
              <h2 className="text-sm font-bold text-white">Video Metadata</h2>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Title</label>
                <input value={cur.title} onChange={(e) => update("title", e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "#111118", border: "1px solid #1e1e2e", color: "#e2e8f0" }} />
                <p className="text-[10px] text-slate-600">{cur.title.length}/100 chars</p>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                <textarea value={cur.description} onChange={(e) => update("description", e.target.value)}
                  rows={8} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                  style={{ background: "#111118", border: "1px solid #1e1e2e", color: "#e2e8f0", lineHeight: 1.6 }} />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tags (comma-separated)</label>
                <input value={cur.tags} onChange={(e) => update("tags", e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                  style={{ background: "#111118", border: "1px solid #1e1e2e", color: "#e2e8f0" }} />
                <p className="text-[10px] text-slate-600">
                  {cur.tags.split(",").filter(Boolean).length} tags · YouTube allows up to 500 chars total
                </p>
              </div>

              {/* Privacy */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Privacy</label>
                <div className="flex gap-2">
                  {(["private", "unlisted", "public"] as const).map((p) => (
                    <button key={p} onClick={() => update("privacyStatus", p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                      style={cur.privacyStatus === p
                        ? { background: "#a855f722", borderColor: "#a855f755", color: "#c084fc" }
                        : { background: "transparent", borderColor: "#1e1e2e", color: "#475569" }}>
                      {p === "private" ? "🔒 Private" : p === "unlisted" ? "🔗 Unlisted" : "🌐 Public"}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600">
                  Tip: upload as Private first, review on YouTube, then publish.
                </p>
              </div>
            </section>

            {/* ── Thumbnail ── */}
            <section className="rounded-xl border p-5 space-y-3"
              style={{ background: "#0f0f1a", borderColor: "#1e1e2e" }}>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Thumbnail</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500">1280 × 720 · auto-generated</span>
                  <button onClick={refreshThumb}
                    className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors">
                    ↺ Refresh
                  </button>
                </div>
              </div>
              {thumbUrl ? (
                <img src={thumbUrl} alt="thumbnail preview"
                  className="w-full rounded-lg border" style={{ borderColor: "#1e1e2e" }} />
              ) : (
                <div className="w-full rounded-lg flex items-center justify-center text-slate-600 text-sm"
                  style={{ height: 180, background: "#111118" }}>Generating…</div>
              )}
              <p className="text-[10px] text-slate-600">Thumbnail is auto-uploaded alongside the video.</p>
            </section>

            {/* ── Video file ── */}
            <section className="rounded-xl border p-5 space-y-3"
              style={{ background: "#0f0f1a", borderColor: "#1e1e2e" }}>
              <h2 className="text-sm font-bold text-white">Video File</h2>

              <div className="rounded-lg border border-dashed p-6 text-center cursor-pointer transition-colors"
                style={{ borderColor: videoFile ? "#a855f755" : "#1e1e2e", background: videoFile ? "#a855f708" : "transparent" }}
                onClick={() => fileRef.current?.click()}>
                {videoFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-purple-400">📹 {videoFile.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {(videoFile.size / 1024 / 1024).toFixed(1)} MB · {videoFile.type || "video"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-3xl">📹</p>
                    <p className="text-sm text-slate-400">Click to select your recorded video</p>
                    <p className="text-[11px] text-slate-600">MP4, MOV or WEBM</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="video/*" className="hidden"
                  onChange={(e) => { setVideoFile(e.target.files?.[0] ?? null); setResult(null); }} />
              </div>

              <div className="rounded-lg border p-3" style={{ background: "#111118", borderColor: "#1e1e2e" }}>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  <span className="text-amber-400 font-semibold">💡 How to record:</span>{" "}
                  Open{" "}
                  <Link href="/slides" className="text-purple-400 hover:underline underline-offset-2">Slide Preview</Link>,
                  press ▶ to auto-play, then screen-record while it plays.{" "}
                  Mac: <code className="text-slate-400">⌘ Shift 5</code> · Win: <code className="text-slate-400">Win + G</code>.
                  Save as MP4 and upload here.
                </p>
              </div>
            </section>

            {/* ── Upload ── */}
            <section className="rounded-xl border p-5 space-y-3"
              style={{ background: "#0f0f1a", borderColor: "#1e1e2e" }}>
              <button onClick={handleUpload} disabled={!videoFile || uploading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                style={!videoFile || uploading
                  ? { background: "#1e1e2e", color: "#475569" }
                  : { background: "#a855f7", color: "#fff", boxShadow: "0 0 24px rgba(168,85,247,0.4)" }}>
                {uploading
                  ? "Uploading to YouTube…"
                  : videoFile
                  ? `Upload to YouTube · ${cur.privacyStatus}`
                  : "Select a video file first"}
              </button>

              {result?.url && (
                <div className="rounded-lg border p-3 text-center"
                  style={{ background: "#4ade8010", borderColor: "#4ade8040" }}>
                  <p className="text-xs font-semibold text-green-400 mb-1">✅ Uploaded successfully!</p>
                  <a href={result.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:underline underline-offset-2 break-all">
                    {result.url}
                  </a>
                </div>
              )}

              {result?.error && (
                <div className="rounded-lg border p-3" style={{ background: "#f8717110", borderColor: "#f8717140" }}>
                  <p className="text-xs font-semibold text-red-400 mb-1">Upload failed</p>
                  <p className="text-[11px] text-red-300">{result.error}</p>
                </div>
              )}
            </section>

            {/* ── YouTube API setup guide ── */}
            <section className="rounded-xl border p-5 space-y-3"
              style={{ background: "#0f0f1a", borderColor: "#1e1e2e" }}>
              <h2 className="text-sm font-bold text-white">YouTube API Setup</h2>
              <div className="rounded-lg p-3 font-mono text-[11px] space-y-0.5 leading-relaxed"
                style={{ background: "#111118", color: "#94a3b8" }}>
                <p><span className="text-slate-600"># .env.local</span></p>
                <p><span className="text-cyan-400">YOUTUBE_CLIENT_ID</span>=your-client-id</p>
                <p><span className="text-cyan-400">YOUTUBE_CLIENT_SECRET</span>=your-client-secret</p>
                <p><span className="text-cyan-400">YOUTUBE_REFRESH_TOKEN</span>=your-refresh-token</p>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Go to{" "}
                <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer"
                  className="text-purple-400 hover:underline underline-offset-2">
                  Google Cloud Console
                </a>{" "}
                → APIs & Services → Credentials → OAuth 2.0 Client ID. Enable the YouTube Data API v3, then generate a refresh token using the OAuth Playground.
              </p>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

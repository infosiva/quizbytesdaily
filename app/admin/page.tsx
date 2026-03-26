"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { channelConfig, categories, difficulties } from "@/lib/config";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SlideData {
  template: string;
  data: Record<string, unknown>;
}

interface SeriesRecord {
  id: number;
  slug: string;
  title: string;
  topic: string;
  category: string;
  difficulty: string;
  status: string;
  youtube_id: string | null;
  youtube_url: string | null;
  created_at: string;
  slide_count?: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const difficultyColor = (d: string) =>
  d === "Beginner" ? "#4ade80" : d === "Intermediate" ? "#fbbf24" : "#f87171";

const statusColor = (s: string) =>
  s === "published" ? "#4ade80" : "#94a3b8";

// ── Slide mini-preview ────────────────────────────────────────────────────────

function SlidePreview({ slide }: { slide: SlideData }) {
  const { template, data } = slide;

  if (template === "title") {
    return (
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#111118)", border: "1px solid #312e81", borderRadius: 8, padding: "0.75rem", textAlign: "center" }}>
        <div style={{ fontSize: "0.6rem", color: "#a78bfa", marginBottom: 4, textTransform: "uppercase", letterSpacing: 2 }}>
          {String(data.topic ?? "")}
        </div>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>
          {String(data.title ?? "")}
        </div>
        <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 4 }}>
          {String(data.subtitle ?? "")}
        </div>
      </div>
    );
  }

  if (template === "quiz") {
    const options = (data.options as Array<{ label: string; text: string; correct: boolean }>) ?? [];
    return (
      <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: "0.75rem", fontSize: "0.7rem" }}>
        <div style={{ color: "#94a3b8", marginBottom: 6 }}>Q{String(data.questionNumber ?? "")}: {String(data.question ?? "")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {options.map((opt) => (
            <div key={opt.label} style={{ padding: "2px 6px", borderRadius: 4, background: opt.correct ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${opt.correct ? "#4ade80" : "#1e1e2e"}`, color: opt.correct ? "#4ade80" : "#94a3b8" }}>
              {opt.label}. {opt.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: "0.75rem", fontSize: "0.7rem", color: "#4a4a5a" }}>
      [{template}]
    </div>
  );
}

// ── Canvas thumbnail ──────────────────────────────────────────────────────────

function drawThumbnailToCanvas(canvas: HTMLCanvasElement, title: string, category: string, difficulty: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.width = 1280;
  canvas.height = 720;

  const bg = ctx.createLinearGradient(0, 0, 1280, 720);
  bg.addColorStop(0, "#0a0a1f");
  bg.addColorStop(1, "#1a0a2e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1280, 720);

  ctx.strokeStyle = "rgba(168,85,247,0.05)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1280; x += 80) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke(); }
  for (let y = 0; y < 720; y += 80) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke(); }

  ctx.font = "bold 480px Arial";
  ctx.fillStyle = "rgba(168,85,247,0.07)";
  ctx.textAlign = "center";
  ctx.fillText("?", 900, 580);

  // Category badge
  ctx.font = "bold 24px Arial";
  ctx.fillStyle = "#a855f7";
  ctx.textAlign = "left";
  const badgeW = ctx.measureText(category).width + 32;
  ctx.beginPath();
  ctx.roundRect(80, 80, badgeW, 44, 8);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.fillText(category.toUpperCase(), 96, 108);

  // Difficulty
  const dcolor = difficultyColor(difficulty);
  ctx.font = "bold 22px Arial";
  ctx.fillStyle = dcolor;
  ctx.fillText(difficulty, 80 + badgeW + 16, 108);

  // Title
  ctx.font = "bold 72px Arial";
  ctx.fillStyle = "#ffffff";
  const words = title.split(" ");
  let line = "";
  let y2 = 320;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > 900) { ctx.fillText(line, 80, y2); line = word; y2 += 88; }
    else { line = test; }
  }
  if (line) ctx.fillText(line, 80, y2);

  ctx.font = "30px Arial";
  ctx.fillStyle = "#a855f7";
  ctx.fillText(channelConfig.handle, 80, 660);
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<"generate" | "library" | "upload">("generate");

  // Generate
  const [topic, setTopic] = useState("");
  const [genCategory, setGenCategory] = useState("Python");
  const [genDifficulty, setGenDifficulty] = useState("Intermediate");
  const [catSuggestOpen, setCatSuggestOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [preview, setPreview] = useState<SlideData[] | null>(null);
  const [previewSeries, setPreviewSeries] = useState<SeriesRecord | null>(null);

  // Library
  const [library, setLibrary] = useState<SeriesRecord[]>([]);
  const [loadingLib, setLoadingLib] = useState(false);

  // Upload
  const [uploadSeries, setUploadSeries] = useState<SeriesRecord | null>(null);
  const [uploadSlides, setUploadSlides] = useState<SlideData[] | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadTags, setUploadTags] = useState("QuizBytesDaily,tech,coding,quiz");
  const [uploadPrivacy, setUploadPrivacy] = useState<"private" | "unlisted" | "public">("private");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ url: string } | null>(null);
  const [uploadError, setUploadError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render
  const [rendering, setRendering] = useState(false);
  const [renderFile, setRenderFile] = useState<string | null>(null);
  const [renderError, setRenderError] = useState("");
  const [renderStatus, setRenderStatus] = useState("");

  // Load library
  const loadLibrary = useCallback(async () => {
    setLoadingLib(true);
    try {
      const res = await fetch("/api/admin/series");
      const json = await res.json();
      setLibrary(json.series ?? []);
    } finally {
      setLoadingLib(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "library") loadLibrary();
  }, [tab, loadLibrary]);

  // Draw thumbnail when upload tab loads
  useEffect(() => {
    if (tab === "upload" && uploadSeries && canvasRef.current) {
      drawThumbnailToCanvas(canvasRef.current, uploadSeries.title, uploadSeries.category, uploadSeries.difficulty);
    }
  }, [tab, uploadSeries]);

  // Generate quiz
  async function handleGenerate() {
    if (!topic.trim()) { setGenError("Topic is required"); return; }
    setGenerating(true);
    setGenError("");
    setPreview(null);
    setPreviewSeries(null);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), category: genCategory, difficulty: genDifficulty }),
      });
      const json = await res.json();
      if (!res.ok) { setGenError(json.error ?? "Generation failed"); return; }
      setPreview(json.slides);
      setPreviewSeries(json.series);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Network error");
    } finally {
      setGenerating(false);
    }
  }

  // Go to upload with a series
  async function goToUpload(s: SeriesRecord) {
    setUploadSeries(s);
    setUploadTitle(s.title);
    setUploadDesc(
      `🧠 ${s.title}\n\n` +
      `Category: ${s.category} | Difficulty: ${s.difficulty}\n\n` +
      `Test your ${s.category} knowledge with this daily tech quiz!\n\n` +
      `📌 Subscribe → ${channelConfig.youtubeSubscribeUrl}\n` +
      `🌐 More quizzes → ${channelConfig.websiteUrl}\n\n` +
      `#QuizBytesDaily #${s.category.replace(/[^a-zA-Z0-9]/g, "")} #coding #quiz #${s.difficulty.toLowerCase()}`
    );
    setUploadTags(`QuizBytesDaily,${s.category},${s.difficulty},coding,quiz,tech`);
    setVideoFile(null);
    setUploadResult(null);
    setUploadError("");
    // Load slides
    const res = await fetch(`/api/admin/series/${s.id}`);
    const json = await res.json();
    setUploadSlides(json.slides ?? []);
    setTab("upload");
  }

  // Upload to YouTube
  async function handleUpload() {
    if (!videoFile) { setUploadError("Please select a video file"); return; }
    setUploading(true);
    setUploadError("");
    setUploadResult(null);
    try {
      let thumbBlob: Blob | null = null;
      if (canvasRef.current) {
        thumbBlob = await new Promise<Blob | null>((resolve) =>
          canvasRef.current!.toBlob(resolve, "image/jpeg", 0.9)
        );
      }
      const form = new FormData();
      form.append("video", videoFile);
      form.append("title", uploadTitle);
      form.append("description", uploadDesc);
      form.append("tags", uploadTags);
      form.append("privacy", uploadPrivacy);
      if (thumbBlob) form.append("thumbnail", thumbBlob, "thumbnail.jpg");
      const res = await fetch("/api/youtube/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { setUploadError(json.error ?? "Upload failed"); return; }
      setUploadResult({ url: json.url });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Network error");
    } finally {
      setUploading(false);
    }
  }

  // Render video via server-side FFmpeg
  async function handleRender() {
    if (!uploadSeries) return;
    setRendering(true);
    setRenderError("");
    setRenderFile(null);
    setRenderStatus("Starting render…");
    try {
      const res = await fetch("/api/admin/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId: uploadSeries.id }),
      });
      const json = await res.json();
      if (!res.ok) { setRenderError(json.error ?? "Render failed"); return; }
      setRenderFile(json.filename);
      setRenderStatus("Downloading rendered video…");
      // Auto-load as the video file for upload
      const vidRes = await fetch(`/api/admin/render/${encodeURIComponent(json.filename)}`);
      const blob = await vidRes.blob();
      const file = new File([blob], json.filename, { type: "video/mp4" });
      setVideoFile(file);
      setRenderStatus(`✓ Ready (${(blob.size / 1024 / 1024).toFixed(1)} MB)`);
    } catch (e) {
      setRenderError(e instanceof Error ? e.message : "Network error");
    } finally {
      setRendering(false);
    }
  }

  // ── Styles ────────────────────────────────────────────────────────────────

  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: "0.5rem 1.25rem", borderRadius: 8, border: "1px solid",
    borderColor: active ? "#a855f7" : "#1e1e2e",
    background: active ? "rgba(168,85,247,0.15)" : "transparent",
    color: active ? "#a855f7" : "#94a3b8", cursor: "pointer",
    fontWeight: active ? 700 : 400, fontSize: "0.875rem",
  });

  const inp: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.75rem", background: "#111118",
    border: "1px solid #1e1e2e", borderRadius: 8, color: "#e2e8f0",
    fontSize: "0.9rem", outline: "none",
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1e1e2e", padding: "1rem 2rem", display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#a855f7" }}>⚡ QuizBytesDaily</span>
        <span style={{ color: "#4a4a5a" }}>/</span>
        <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Admin</span>
        <span style={{ marginLeft: "auto" }} />
        <Link href="/" style={{ fontSize: "0.8rem", color: "#6366f1", textDecoration: "none" }}>← Public Site</Link>
        <Link href="/slides" style={{ fontSize: "0.8rem", color: "#6366f1", textDecoration: "none" }}>Slides</Link>
        <a
          href="/api/admin/auth?action=logout"
          style={{
            fontSize: "0.8rem", padding: "0.3rem 0.75rem",
            background: "#f8717118", border: "1px solid #f8717140",
            borderRadius: 6, color: "#f87171", textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Logout
        </a>
      </header>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem" }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
          <button style={tabBtn(tab === "generate")} onClick={() => setTab("generate")}>✨ Generate</button>
          <button style={tabBtn(tab === "library")} onClick={() => setTab("library")}>📚 Library</button>
          <button style={tabBtn(tab === "upload")} onClick={() => setTab("upload")}>🚀 Upload</button>
        </div>

        {/* ═══════════════════════ GENERATE ═══════════════════════════════ */}
        {tab === "generate" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>Generate Quiz with AI</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 6 }}>Topic *</label>
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Python decorators" onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  style={inp} />
              </div>
              <div style={{ position: "relative" }}>
                <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 6 }}>Category</label>
                <input
                  type="text"
                  value={genCategory}
                  onChange={(e) => { setGenCategory(e.target.value); setCatSuggestOpen(true); }}
                  onFocus={() => setCatSuggestOpen(true)}
                  onBlur={() => setTimeout(() => setCatSuggestOpen(false), 150)}
                  placeholder="Python, AI/ML, or custom…"
                  style={inp}
                  autoComplete="off"
                />
                {catSuggestOpen && (
                  <div style={{
                    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
                    background: "#111118", border: "1px solid #2a2a3e", borderRadius: 8,
                    marginTop: 4, overflow: "hidden", boxShadow: "0 8px 28px rgba(0,0,0,0.7)",
                  }}>
                    {categories
                      .filter((c) => c !== "All" && c.toLowerCase().includes(genCategory.toLowerCase()))
                      .map((c) => (
                        <button key={c}
                          onMouseDown={() => { setGenCategory(c); setCatSuggestOpen(false); }}
                          style={{
                            display: "block", width: "100%", padding: "0.5rem 0.85rem",
                            textAlign: "left", background: "transparent", border: "none",
                            borderBottom: "1px solid #1a1a28", color: "#e2e8f0", cursor: "pointer",
                            fontSize: "0.875rem",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,85,247,0.12)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {c}
                        </button>
                      ))}
                    {genCategory.trim() && !categories.filter((c) => c !== "All").some((c) => c.toLowerCase() === genCategory.toLowerCase().trim()) && (
                      <div style={{ padding: "0.45rem 0.85rem", color: "#64748b", fontSize: "0.75rem", fontStyle: "italic" }}>
                        Custom: &ldquo;{genCategory}&rdquo; ✓
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 6 }}>Difficulty</label>
                <select value={genDifficulty} onChange={(e) => setGenDifficulty(e.target.value)} style={inp}>
                  {difficulties.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={generating} style={{ padding: "0.65rem 1.5rem", background: generating ? "#333" : "#a855f7", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", fontSize: "0.9rem" }}>
              {generating ? "⏳ Generating with Claude…" : "✨ Generate Quiz"}
            </button>

            {genError && (
              <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", background: "rgba(248,113,113,0.1)", border: "1px solid #f87171", borderRadius: 8, color: "#f87171", fontSize: "0.875rem" }}>{genError}</div>
            )}

            {preview && previewSeries && (
              <div style={{ marginTop: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{previewSeries.title}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 4, background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>{previewSeries.category}</span>
                      <span style={{ fontSize: "0.72rem", padding: "2px 8px", borderRadius: 4, color: difficultyColor(previewSeries.difficulty), background: "rgba(255,255,255,0.05)" }}>{previewSeries.difficulty}</span>
                      <span style={{ fontSize: "0.72rem", color: "#4ade80" }}>✓ Saved to library</span>
                    </div>
                  </div>
                  <button onClick={() => goToUpload(previewSeries)} style={{ padding: "0.5rem 1.25rem", background: "#22d3ee", border: "none", borderRadius: 8, color: "#0a0a0f", fontWeight: 700, cursor: "pointer", fontSize: "0.875rem" }}>
                    🚀 Upload →
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
                  {preview.map((slide, i) => (
                    <div key={i}>
                      <div style={{ fontSize: "0.65rem", color: "#6366f1", marginBottom: 4 }}>Slide {i + 1} · {slide.template}</div>
                      <SlidePreview slide={slide} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════ LIBRARY ════════════════════════════════ */}
        {tab === "library" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Series Library</h2>
              <button onClick={loadLibrary} style={{ padding: "0.4rem 1rem", background: "transparent", border: "1px solid #1e1e2e", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}>↺ Refresh</button>
            </div>

            {loadingLib && <p style={{ color: "#94a3b8" }}>Loading…</p>}

            {!loadingLib && library.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "#4a4a5a" }}>
                <div style={{ fontSize: "3rem" }}>📭</div>
                <p style={{ marginTop: "0.75rem" }}>No series yet. Go to Generate to create one!</p>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {library.map((s) => (
                <div key={s.id} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.title}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 4, background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>{s.category}</span>
                      <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 4, color: difficultyColor(s.difficulty), background: "rgba(255,255,255,0.05)" }}>{s.difficulty}</span>
                      <span style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: 4, color: statusColor(s.status), background: "rgba(255,255,255,0.05)" }}>{s.status}</span>
                      <span style={{ fontSize: "0.7rem", color: "#4a4a5a" }}>{s.slide_count ?? 0} slides · {new Date(s.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {s.youtube_url && (
                      <a href={s.youtube_url} target="_blank" rel="noopener noreferrer" style={{ padding: "0.4rem 0.75rem", background: "rgba(74,222,128,0.1)", border: "1px solid #4ade80", borderRadius: 6, color: "#4ade80", textDecoration: "none", fontSize: "0.75rem" }}>▶ YouTube</a>
                    )}
                    <button onClick={() => goToUpload(s)} style={{ padding: "0.4rem 0.75rem", background: "rgba(34,211,238,0.1)", border: "1px solid #22d3ee", borderRadius: 6, color: "#22d3ee", cursor: "pointer", fontSize: "0.75rem" }}>🚀 Upload</button>
                    <button onClick={async () => { if (!confirm(`Delete "${s.title}"?`)) return; await fetch(`/api/admin/series/${s.id}`, { method: "DELETE" }); loadLibrary(); }} style={{ padding: "0.4rem 0.75rem", background: "rgba(248,113,113,0.1)", border: "1px solid #f87171", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: "0.75rem" }}>🗑 Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════ UPLOAD ══════════════════════════════════ */}
        {tab === "upload" && (
          <div>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem" }}>Upload to YouTube</h2>

            {!uploadSeries ? (
              <div style={{ padding: "2rem", background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, color: "#94a3b8", textAlign: "center" }}>
                No series selected. Go to <strong style={{ color: "#22d3ee", cursor: "pointer" }} onClick={() => setTab("library")}>Library</strong> and click Upload on a series.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }}>
                {/* Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ padding: "0.75rem 1rem", background: "rgba(168,85,247,0.08)", border: "1px solid #312e81", borderRadius: 8, fontSize: "0.875rem" }}>
                    Series: <strong>{uploadSeries.title}</strong> · {uploadSlides?.length ?? 0} slides
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 6 }}>Title</label>
                    <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} style={inp} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 6 }}>Description</label>
                    <textarea value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} rows={8}
                      style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 6 }}>Tags (comma separated)</label>
                    <input type="text" value={uploadTags} onChange={(e) => setUploadTags(e.target.value)} style={inp} />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 6 }}>Privacy</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {(["private", "unlisted", "public"] as const).map((p) => (
                        <button key={p} onClick={() => setUploadPrivacy(p)} style={{ padding: "0.4rem 1rem", borderRadius: 8, border: "1px solid", borderColor: uploadPrivacy === p ? "#a855f7" : "#1e1e2e", background: uploadPrivacy === p ? "rgba(168,85,247,0.15)" : "transparent", color: uploadPrivacy === p ? "#a855f7" : "#94a3b8", cursor: "pointer", textTransform: "capitalize", fontSize: "0.875rem" }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Render Video */}
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 8 }}>Video</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <button onClick={handleRender} disabled={rendering}
                        style={{ flex: 1, padding: "0.65rem 1rem", background: rendering ? "#1e1e2e" : "rgba(168,85,247,0.15)", border: "1px solid", borderColor: rendering ? "#374151" : "#a855f7", borderRadius: 8, color: rendering ? "#475569" : "#c084fc", fontWeight: 700, cursor: rendering ? "not-allowed" : "pointer", fontSize: "0.875rem" }}>
                        {rendering ? "⏳ Rendering…" : "🎬 Render Video"}
                      </button>
                      {renderFile && !rendering && (
                        <a href={`/api/admin/render/${encodeURIComponent(renderFile)}`} download
                          style={{ padding: "0.65rem 0.75rem", background: "rgba(34,211,238,0.1)", border: "1px solid #22d3ee", borderRadius: 8, color: "#22d3ee", textDecoration: "none", fontSize: "0.8rem" }}>
                          ⬇ Save
                        </a>
                      )}
                    </div>
                    {renderStatus && !rendering && (
                      <p style={{ fontSize: "0.75rem", color: "#4ade80", marginBottom: 6 }}>{renderStatus}</p>
                    )}
                    {rendering && (
                      <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: 6, fontFamily: "monospace" }}>
                        {renderStatus || "Running FFmpeg…"}
                      </p>
                    )}
                    {renderError && (
                      <div style={{ padding: "0.5rem 0.75rem", background: "rgba(248,113,113,0.08)", border: "1px solid #f8717150", borderRadius: 6, color: "#f87171", fontSize: "0.75rem", marginBottom: 6, whiteSpace: "pre-wrap", maxHeight: 100, overflow: "auto" }}>
                        {renderError}
                      </div>
                    )}

                    {/* Manual file pick fallback */}
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "0.875rem", border: "1px dashed", borderColor: videoFile && !rendering ? "#a855f7" : "#1e1e2e", borderRadius: 8, cursor: "pointer", color: videoFile ? "#c084fc" : "#4a4a5a", background: videoFile ? "rgba(168,85,247,0.05)" : "transparent", fontSize: "0.8rem" }}>
                      <input type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
                      {videoFile ? `✓ ${videoFile.name}` : "📁 Or select existing .mp4"}
                    </label>
                  </div>

                  {uploadError && <div style={{ padding: "0.75rem 1rem", background: "rgba(248,113,113,0.1)", border: "1px solid #f87171", borderRadius: 8, color: "#f87171", fontSize: "0.875rem" }}>{uploadError}</div>}
                  {uploadResult && (
                    <div style={{ padding: "0.75rem 1rem", background: "rgba(74,222,128,0.1)", border: "1px solid #4ade80", borderRadius: 8, fontSize: "0.875rem" }}>
                      <span style={{ color: "#4ade80" }}>✓ Uploaded!</span>{" "}
                      <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" style={{ color: "#22d3ee" }}>View on YouTube →</a>
                    </div>
                  )}

                  <button onClick={handleUpload} disabled={uploading || !videoFile} style={{ padding: "0.75rem 1.5rem", background: uploading ? "#333" : "#a855f7", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: uploading || !videoFile ? "not-allowed" : "pointer", fontSize: "0.95rem" }}>
                    {uploading ? "⏳ Uploading…" : "🚀 Upload to YouTube"}
                  </button>

                  {/* YouTube API setup */}
                  <div style={{ padding: "1rem", background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: "0.78rem", color: "#4a4a5a" }}>
                    <div style={{ color: "#94a3b8", fontWeight: 600, marginBottom: 8 }}>YouTube API Setup</div>
                    <div style={{ fontFamily: "monospace", lineHeight: 1.8 }}>
                      <span style={{ color: "#4a4a5a" }}># .env.local</span><br />
                      <span style={{ color: "#22d3ee" }}>YOUTUBE_CLIENT_ID</span>=your-client-id<br />
                      <span style={{ color: "#22d3ee" }}>YOUTUBE_CLIENT_SECRET</span>=your-client-secret<br />
                      <span style={{ color: "#22d3ee" }}>YOUTUBE_REFRESH_TOKEN</span>=your-refresh-token<br />
                      <span style={{ color: "#22d3ee" }}>ANTHROPIC_API_KEY</span>=your-api-key<br />
                      <span style={{ color: "#22d3ee" }}>ADMIN_PASSWORD</span>=your-password
                    </div>
                  </div>
                </div>

                {/* Thumbnail + slides */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 8 }}>Thumbnail (1280×720)</label>
                  <canvas ref={canvasRef} style={{ width: "100%", borderRadius: 8, border: "1px solid #1e1e2e" }} />
                  <button onClick={() => uploadSeries && drawThumbnailToCanvas(canvasRef.current!, uploadSeries.title, uploadSeries.category, uploadSeries.difficulty)}
                    style={{ marginTop: 8, width: "100%", padding: "0.4rem", background: "transparent", border: "1px solid #1e1e2e", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: "0.78rem" }}>
                    ↺ Refresh Thumbnail
                  </button>

                  {uploadSlides && uploadSlides.length > 0 && (
                    <div style={{ marginTop: "1.5rem" }}>
                      <label style={{ display: "block", fontSize: "0.78rem", color: "#94a3b8", marginBottom: 8 }}>Slides ({uploadSlides.length})</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {uploadSlides.map((slide, i) => (
                          <div key={i}>
                            <div style={{ fontSize: "0.62rem", color: "#6366f1", marginBottom: 3 }}>{i + 1}. {slide.template}</div>
                            <SlidePreview slide={slide} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

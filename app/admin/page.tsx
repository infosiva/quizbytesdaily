"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { channelConfig, categories, difficulties } from "@/lib/config";
import { LAYOUTS, TRENDING_TOPICS, type LayoutId } from "@/lib/quiz-generator";

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

const SLIDE_COLORS: Record<string, string> = {
  cyan: "#22d3ee", purple: "#a855f7", green: "#4ade80", pink: "#f472b6", amber: "#fbbf24",
};

interface CardItem { color: string; title: string; body?: string }
interface DefItem  { color: string; title: string; body: string }

function SlidePreview({ slide }: { slide: SlideData }) {
  const { template, data } = slide;

  if (template === "definition-steps") {
    const def   = data.definition as DefItem | undefined;
    const cards = (data.cards as CardItem[]) ?? [];
    return (
      <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: "0.6rem", fontSize: "0.62rem", overflow: "hidden" }}>
        {/* Slide number + heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
          {(data.slideNum as number) > 0 && (
            <span style={{ fontSize: "0.55rem", color: "#374151", fontFamily: "monospace", background: "#1e1e2e", padding: "1px 4px", borderRadius: 3 }}>
              {String(data.slideNum)}/{String(data.totalSlides)}
            </span>
          )}
          <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.67rem", lineHeight: 1.3, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {String(data.heading ?? "")}
          </span>
        </div>
        {/* Definition box */}
        {def && (
          <div style={{ padding: "4px 8px", borderRadius: 4, marginBottom: 4, background: `${SLIDE_COLORS[def.color] ?? "#a855f7"}18`, borderLeft: `2px solid ${SLIDE_COLORS[def.color] ?? "#a855f7"}`, overflow: "hidden" }}>
            <div style={{ color: SLIDE_COLORS[def.color] ?? "#a855f7", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.title}</div>
            {def.body && <div style={{ color: "#64748b", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.body}</div>}
          </div>
        )}
        {/* Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {cards.slice(0, 5).map((c, i) => {
            const col = SLIDE_COLORS[c.color] ?? "#94a3b8";
            const hasBody = c.body?.trim() && c.body.trim() !== " ";
            return (
              <div key={i} style={{ padding: "3px 6px", borderRadius: 4, background: `${col}0d`, borderLeft: `2px solid ${col}`, display: "flex", gap: 4, alignItems: "flex-start", overflow: "hidden" }}>
                <span style={{ color: col, fontWeight: 700, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: hasBody ? "45%" : "100%" }}>{c.title}</span>
                {hasBody && (
                  <span style={{ color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.body}</span>
                )}
              </div>
            );
          })}
          {cards.length > 5 && (
            <div style={{ color: "#374151", fontSize: "0.55rem", paddingLeft: 4 }}>+{cards.length - 5} more</div>
          )}
        </div>
      </div>
    );
  }

  if (template === "pipeline") {
    const cards = (data.cards as CardItem[]) ?? [];
    return (
      <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: "0.6rem", fontSize: "0.62rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 5 }}>
          {(data.slideNum as number) > 0 && (
            <span style={{ fontSize: "0.55rem", color: "#374151", fontFamily: "monospace", background: "#1e1e2e", padding: "1px 4px", borderRadius: 3 }}>
              {String(data.slideNum)}/{String(data.totalSlides)}
            </span>
          )}
          <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.67rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {String(data.heading ?? "")}
          </span>
        </div>
        {cards.map((c, i) => {
          const col = SLIDE_COLORS[c.color] ?? "#22d3ee";
          return (
            <div key={i}>
              <div style={{ padding: "3px 8px", borderRadius: 4, background: `${col}12`, border: `1px solid ${col}30`, color: col, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.title}
              </div>
              {i < cards.length - 1 && (
                <div style={{ textAlign: "center", color: "#374151", fontSize: "0.55rem", lineHeight: "14px" }}>▼</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (template === "cta") {
    return (
      <div style={{ background: "linear-gradient(135deg,#1a0a2e,#111118)", border: "1px solid #a855f7", borderRadius: 8, padding: "0.75rem", textAlign: "center" }}>
        <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>🎉</div>
        <div style={{ fontSize: "0.68rem", color: "#a855f7", fontWeight: 700 }}>{String(data.heading ?? "CTA")}</div>
        <div style={{ fontSize: "0.58rem", color: "#374151", marginTop: 3 }}>▶ Subscribe on YouTube</div>
      </div>
    );
  }

  // Legacy template: title
  if (template === "title") {
    return (
      <div style={{ background: "linear-gradient(135deg,#1e1b4b,#111118)", border: "1px solid #312e81", borderRadius: 8, padding: "0.75rem", textAlign: "center" }}>
        <div style={{ fontSize: "0.6rem", color: "#a78bfa", marginBottom: 4, textTransform: "uppercase", letterSpacing: 2 }}>{String(data.topic ?? "")}</div>
        <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#e2e8f0" }}>{String(data.title ?? "")}</div>
        <div style={{ fontSize: "0.6rem", color: "#94a3b8", marginTop: 4 }}>{String(data.subtitle ?? "")}</div>
      </div>
    );
  }

  // Legacy template: quiz
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

// ── Layout structure preview (static, shown when layout is selected) ──────────

const LAYOUT_STRUCTURE: Record<string, { label: string; color: string; bg: string }[]> = {
  "quiz-reveal": [
    { label: "What is it?",     color: "#22d3ee", bg: "#22d3ee18" },
    { label: "How It Works",    color: "#a855f7", bg: "#a855f718" },
    { label: "Why It Matters",  color: "#4ade80", bg: "#4ade8018" },
    { label: "Key Concepts",    color: "#fbbf24", bg: "#fbbf2418" },
    { label: "Pitfalls",        color: "#f472b6", bg: "#f472b618" },
    { label: "Advanced",        color: "#22d3ee", bg: "#22d3ee18" },
    { label: "📚 Resources",    color: "#22d3ee", bg: "#22d3ee25" },
    { label: "❓ Quiz",          color: "#fbbf24", bg: "#fbbf2425" },
    { label: "✅ Answer",        color: "#4ade80", bg: "#4ade8025" },
    { label: "🎉 CTA",           color: "#a855f7", bg: "#a855f725" },
  ],
  "explainer": [
    { label: "What is it?",     color: "#22d3ee", bg: "#22d3ee18" },
    { label: "How It Works",    color: "#a855f7", bg: "#a855f718" },
    { label: "Why It Matters",  color: "#4ade80", bg: "#4ade8018" },
    { label: "Architecture",    color: "#fbbf24", bg: "#fbbf2418" },
    { label: "Real Example",    color: "#22d3ee", bg: "#22d3ee18" },
    { label: "Adv. Patterns",   color: "#a855f7", bg: "#a855f718" },
    { label: "Pitfalls",        color: "#f472b6", bg: "#f472b618" },
    { label: "📚 Resources",    color: "#22d3ee", bg: "#22d3ee25" },
    { label: "🎉 CTA",           color: "#a855f7", bg: "#a855f725" },
  ],
  "code-example": [
    { label: "The Problem",     color: "#f472b6", bg: "#f472b618" },
    { label: "The Solution",    color: "#22d3ee", bg: "#22d3ee18" },
    { label: "Code Walkthrough",color: "#a855f7", bg: "#a855f718" },
    { label: "Adv. Pattern",    color: "#fbbf24", bg: "#fbbf2418" },
    { label: "Edge Cases",      color: "#f472b6", bg: "#f472b618" },
    { label: "Real Usage",      color: "#4ade80", bg: "#4ade8018" },
    { label: "Mistakes",        color: "#f472b6", bg: "#f472b618" },
    { label: "📚 Resources",    color: "#22d3ee", bg: "#22d3ee25" },
    { label: "🎉 CTA",           color: "#a855f7", bg: "#a855f725" },
  ],
  "quick-tips": [
    { label: "Tip #1",          color: "#22d3ee", bg: "#22d3ee18" },
    { label: "Tip #2",          color: "#a855f7", bg: "#a855f718" },
    { label: "Tip #3",          color: "#4ade80", bg: "#4ade8018" },
    { label: "Tip #4",          color: "#fbbf24", bg: "#fbbf2418" },
    { label: "Tip #5",          color: "#f472b6", bg: "#f472b618" },
    { label: "+ more",          color: "#374151", bg: "#1e1e2e" },
    { label: "📚 Resources",    color: "#22d3ee", bg: "#22d3ee25" },
    { label: "🎉 CTA",           color: "#a855f7", bg: "#a855f725" },
  ],
};

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

// ── Analytics types ───────────────────────────────────────────────────────────
interface AnalyticsData {
  dailyActivity:       { date: string; count: number }[];
  categoryBreakdown:   { category: string; total: number; published: number }[];
  difficultyBreakdown: { difficulty: string; count: number }[];
  statusSummary:       { status: string; count: number }[];
  totalSlides:         number;
}

export default function AdminPage() {
  const [tab, setTab] = useState<"generate" | "library" | "upload" | "analytics">("generate");

  // Generate
  const [topic, setTopic] = useState("");
  const [genCategory, setGenCategory] = useState("Python");
  const [genDifficulty, setGenDifficulty] = useState("Intermediate");
  const [genLayout, setGenLayout] = useState<LayoutId>("quiz-reveal");
  const [catSuggestOpen, setCatSuggestOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
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

  // Analytics
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Render
  const [rendering, setRendering] = useState(false);
  const [renderFile, setRenderFile] = useState<string | null>(null);
  const [renderError, setRenderError] = useState("");
  const [renderStatus, setRenderStatus] = useState("");

  // YouTube delete
  const [deletingYT, setDeletingYT] = useState(false);
  const [deleteYTResult, setDeleteYTResult] = useState("");

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
    if (tab === "analytics") {
      setLoadingAnalytics(true);
      fetch("/api/admin/analytics")
        .then((r) => r.json())
        .then(setAnalytics)
        .catch(() => {})
        .finally(() => setLoadingAnalytics(false));
    }
  }, [tab, loadLibrary]);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        const cats: string[] = (d.categories ?? []).map((c: { name: string }) => c.name);
        setDbCategories(cats);
      })
      .catch(() => {});
  }, []);

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
        body: JSON.stringify({ topic: topic.trim(), category: genCategory, difficulty: genDifficulty, layout: genLayout }),
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
    const CATEGORY_EMOJI: Record<string, string> = {
      "Python": "🐍", "AI/ML": "🤖", "Algorithms": "🔢",
      "System Design": "🏗️", "JavaScript": "⚡", "DevOps": "🔧",
      "Data Science": "📊", "Java": "☕", "Rust": "🦀", "Go": "🐹",
    };
    const catEmoji  = CATEGORY_EMOJI[s.category] ?? "💡";
    const diffEmoji = s.difficulty === "Beginner" ? "🟢" : s.difficulty === "Intermediate" ? "🟡" : "🔴";
    const catTag    = s.category.replace(/[^a-zA-Z0-9]/g, "");

    setUploadSeries(s);
    setUploadTitle(s.title);
    setUploadDesc(
      `${catEmoji} ${s.title}\n\n` +
      `${diffEmoji} ${s.difficulty} · ${s.category}\n\n` +
      `Drop your answer in the comments! 👇\n` +
      `New quiz every day — can you keep the streak? 🔥\n\n` +
      `🔔 Subscribe → ${channelConfig.youtubeSubscribeUrl}\n` +
      `🌐 More quizzes → ${channelConfig.websiteUrl}\n\n` +
      `#QuizBytesDaily #${catTag} #TechQuiz #CodingQuiz #${s.difficulty} #LearnToCode #Shorts`
    );
    setUploadTags(`QuizBytesDaily,${s.category},${s.difficulty},TechQuiz,CodingQuiz,LearnToCode,Shorts`);
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
      form.append("privacyStatus", uploadPrivacy);
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
      if (!res.ok) {
        const json = await res.json();
        setRenderError(json.error ?? "Render failed");
        return;
      }
      // Video bytes returned directly — no second round-trip needed
      const blob = await res.blob();
      const filename = res.headers.get("X-Filename") ?? `${uploadSeries.slug}.mp4`;
      const file = new File([blob], filename, { type: "video/mp4" });
      setVideoFile(file);
      setRenderFile(filename);
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
          <button style={tabBtn(tab === "analytics")} onClick={() => setTab("analytics")}>📊 Analytics</button>
        </div>

        {/* ═══════════════════════ GENERATE ═══════════════════════════════ */}
        {tab === "generate" && (
          <div>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Generate with AI</h2>
              <p style={{ fontSize: "0.82rem", color: "#64748b" }}>Pick a layout, choose a topic, and let the AI do the rest.</p>
            </div>

            {/* ── Layout picker ── */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
                Content Layout
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem" }}>
                {LAYOUTS.map((l) => {
                  const active = genLayout === l.id;
                  return (
                    <button
                      key={l.id}
                      onClick={() => setGenLayout(l.id as LayoutId)}
                      style={{
                        padding: "0.9rem 0.75rem",
                        borderRadius: 12,
                        border: `2px solid ${active ? l.color : "#1e1e2e"}`,
                        background: active ? `${l.color}15` : "#111118",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                        outline: "none",
                      }}
                    >
                      <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>{l.icon}</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: active ? l.color : "#e2e8f0", marginBottom: 3 }}>{l.name}</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", lineHeight: 1.4 }}>{l.desc}</div>
                      <div style={{ fontSize: "0.65rem", color: active ? l.color : "#374151", marginTop: 6, fontWeight: 600 }}>~{l.slides} slides</div>
                    </button>
                  );
                })}
              </div>

              {/* Layout structure preview — shows slide flow for selected layout */}
              {LAYOUT_STRUCTURE[genLayout] && (
                <div style={{ marginTop: 12, padding: "0.75rem 1rem", background: "#0d0d18", border: "1px solid #1e1e2e", borderRadius: 10 }}>
                  <div style={{ fontSize: "0.65rem", color: "#4a4a5a", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: 1, marginBottom: 8 }}>
                    Slide structure (dynamic — AI may add/remove based on topic depth)
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
                    {LAYOUT_STRUCTURE[genLayout].map((s, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{
                          fontSize: "0.67rem", fontWeight: 700,
                          padding: "3px 9px", borderRadius: 20,
                          background: s.bg, color: s.color,
                          border: `1px solid ${s.color}40`,
                          whiteSpace: "nowrap" as const,
                        }}>
                          {s.label}
                        </span>
                        {i < LAYOUT_STRUCTURE[genLayout].length - 1 && (
                          <span style={{ color: "#374151", fontSize: "0.65rem" }}>→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Trending topics for selected category ── */}
            {TRENDING_TOPICS[genCategory] && (
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8 }}>
                  Trending in {genCategory} — click to fill
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {TRENDING_TOPICS[genCategory].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      style={{
                        padding: "3px 10px", borderRadius: 999,
                        border: "1px solid #2a2a3e",
                        background: topic === t ? "#a855f720" : "#111118",
                        color: topic === t ? "#c084fc" : "#94a3b8",
                        fontSize: "0.75rem", cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a855f760"; e.currentTarget.style.color = "#c084fc"; }}
                      onMouseLeave={(e) => { if (topic !== t) { e.currentTarget.style.borderColor = "#2a2a3e"; e.currentTarget.style.color = "#94a3b8"; } }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Topic / Category / Difficulty ── */}
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
                    maxHeight: 220, overflowY: "auto",
                  }}>
                    {[...new Set([
                      ...categories.filter((c) => c !== "All"),
                      ...dbCategories,
                    ])]
                      .filter((c) => c.toLowerCase().includes(genCategory.toLowerCase()))
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
                    {genCategory.trim() && ![...new Set([...categories.filter((c) => c !== "All"), ...dbCategories])].some((c) => c.toLowerCase() === genCategory.toLowerCase().trim()) && (
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

            {/* ── Generate button ── */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button onClick={handleGenerate} disabled={generating} style={{ padding: "0.65rem 1.5rem", background: generating ? "#333" : "#a855f7", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: generating ? "not-allowed" : "pointer", fontSize: "0.9rem" }}>
                {generating ? "⏳ Generating…" : `✨ Generate ${LAYOUTS.find(l => l.id === genLayout)?.name ?? "Quiz"}`}
              </button>
              <span style={{ fontSize: "0.75rem", color: "#374151" }}>
                {LAYOUTS.find(l => l.id === genLayout)?.slides} slides · {genCategory} · {genDifficulty}
              </span>
            </div>

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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap" as const, gap: 8 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>Series Library</h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {library.some((s) => s.youtube_id) && (
                  <button
                    disabled={deletingYT}
                    onClick={async () => {
                      if (!confirm("Delete ALL uploaded YouTube videos? This cannot be undone.")) return;
                      setDeletingYT(true);
                      setDeleteYTResult("");
                      try {
                        const res  = await fetch("/api/youtube/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
                        const json = await res.json();
                        setDeleteYTResult(`Deleted ${json.deleted ?? 0} video(s) from YouTube.`);
                        loadLibrary();
                      } catch (e) {
                        setDeleteYTResult(`Error: ${e instanceof Error ? e.message : String(e)}`);
                      } finally {
                        setDeletingYT(false);
                      }
                    }}
                    style={{ padding: "0.4rem 1rem", background: deletingYT ? "#1e1e2e" : "rgba(248,113,113,0.1)", border: "1px solid #f87171", borderRadius: 8, color: "#f87171", cursor: deletingYT ? "not-allowed" : "pointer", fontSize: "0.8rem", fontWeight: 600 }}>
                    {deletingYT ? "⏳ Deleting…" : "🗑 Delete All from YouTube"}
                  </button>
                )}
                <button onClick={loadLibrary} style={{ padding: "0.4rem 1rem", background: "transparent", border: "1px solid #1e1e2e", borderRadius: 8, color: "#94a3b8", cursor: "pointer", fontSize: "0.8rem" }}>↺ Refresh</button>
              </div>
            </div>
            {deleteYTResult && (
              <p style={{ fontSize: "0.8rem", color: deleteYTResult.startsWith("Error") ? "#f87171" : "#4ade80", marginBottom: "1rem" }}>{deleteYTResult}</p>
            )}

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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                    {s.youtube_url && (
                      <a href={s.youtube_url} target="_blank" rel="noopener noreferrer" style={{ padding: "0.4rem 0.75rem", background: "rgba(74,222,128,0.1)", border: "1px solid #4ade80", borderRadius: 6, color: "#4ade80", textDecoration: "none", fontSize: "0.75rem" }}>▶ YouTube</a>
                    )}
                    {s.youtube_id && (
                      <button onClick={async () => {
                        if (!confirm(`Remove "${s.title}" from YouTube?`)) return;
                        await fetch("/api/youtube/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoId: s.youtube_id }) });
                        loadLibrary();
                      }} style={{ padding: "0.4rem 0.75rem", background: "rgba(251,191,36,0.1)", border: "1px solid #fbbf24", borderRadius: 6, color: "#fbbf24", cursor: "pointer", fontSize: "0.75rem" }}>
                        🗑 YT
                      </button>
                    )}
                    <button onClick={() => goToUpload(s)} style={{ padding: "0.4rem 0.75rem", background: "rgba(34,211,238,0.1)", border: "1px solid #22d3ee", borderRadius: 6, color: "#22d3ee", cursor: "pointer", fontSize: "0.75rem" }}>🚀 Upload</button>
                    <button onClick={async () => { if (!confirm(`Delete "${s.title}"?`)) return; await fetch(`/api/admin/series/${s.id}`, { method: "DELETE" }); loadLibrary(); }} style={{ padding: "0.4rem 0.75rem", background: "rgba(248,113,113,0.1)", border: "1px solid #f87171", borderRadius: 6, color: "#f87171", cursor: "pointer", fontSize: "0.75rem" }}>🗑 DB</button>
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
                      {renderFile && videoFile && !rendering && (
                        <a href={URL.createObjectURL(videoFile)} download={renderFile}
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

                  {uploadError && (
                    <div style={{ padding: "0.75rem 1rem", background: "rgba(248,113,113,0.1)", border: "1px solid #f87171", borderRadius: 8, color: "#f87171", fontSize: "0.875rem" }}>
                      {uploadError}
                      {/expired|revoked|invalid_grant/i.test(uploadError) && (
                        <div style={{ marginTop: "0.5rem" }}>
                          <a href="/api/youtube/auth" target="_blank" rel="noopener noreferrer"
                            style={{ display: "inline-block", padding: "0.35rem 0.85rem", background: "#a855f7", borderRadius: 6, color: "#fff", fontSize: "0.8rem", fontWeight: 700, textDecoration: "none" }}>
                            🔑 Re-authorize YouTube
                          </a>
                          <span style={{ marginLeft: "0.5rem", color: "#94a3b8", fontSize: "0.75rem" }}>
                            Opens in new tab — copy the refresh token and update .env.local
                          </span>
                        </div>
                      )}
                    </div>
                  )}
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
                  {/* Show the server-generated SVG thumbnail */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/thumbnail/${uploadSeries.slug}`}
                    alt="Thumbnail preview"
                    style={{ width: "100%", borderRadius: 8, border: "1px solid #1e1e2e", display: "block" }}
                  />
                  {/* Hidden canvas kept for download fallback */}
                  <canvas ref={canvasRef} style={{ display: "none" }} />

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
        {/* ═══════════════════════ ANALYTICS ══════════════════════════════ */}
        {tab === "analytics" && (
          <div>
            <div style={{ marginBottom: "1.75rem" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.25rem" }}>Content Analytics</h2>
              <p style={{ fontSize: "0.82rem", color: "#64748b" }}>Quiz generation activity, category breakdown, and content status.</p>
            </div>

            {loadingAnalytics && <p style={{ color: "#94a3b8" }}>Loading analytics…</p>}

            {!loadingAnalytics && analytics && (() => {
              const totalGenerated = analytics.statusSummary.reduce((a, s) => a + s.count, 0);
              const totalPublished = analytics.statusSummary.find((s) => s.status === "published")?.count ?? 0;
              const maxCat = Math.max(...analytics.categoryBreakdown.map((c) => c.total), 1);

              // Build last 30 days including zeros
              const today = new Date();
              const last30 = Array.from({ length: 30 }, (_, i) => {
                const d = new Date(today);
                d.setDate(d.getDate() - (29 - i));
                return d.toISOString().split("T")[0];
              });
              const activityMap = Object.fromEntries(analytics.dailyActivity.map((a) => [a.date, a.count]));
              const chartData = last30.map((date) => ({ date, count: activityMap[date] ?? 0 }));
              const chartMax = Math.max(...chartData.map((d) => d.count), 1);

              return (
                <>
                  {/* ── Summary cards ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem", marginBottom: "2rem" }}>
                    {[
                      { label: "Total Generated", value: totalGenerated,          icon: "✨", color: "#a855f7" },
                      { label: "Published",        value: totalPublished,           icon: "✅", color: "#4ade80" },
                      { label: "Total Slides",     value: analytics.totalSlides,   icon: "🃏", color: "#22d3ee" },
                      { label: "Categories",       value: analytics.categoryBreakdown.length, icon: "#", color: "#fbbf24" },
                    ].map((s) => (
                      <div key={s.label} style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: "1.25rem" }}>
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 1 }}>{s.icon} {s.label}</div>
                        <div style={{ fontSize: "2rem", fontWeight: 900, fontFamily: "monospace", color: s.color }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* ── Activity chart (last 30 days) ── */}
                  <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: "1.5rem", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>Daily Generation Activity</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Quizzes generated per day — last 30 days</div>
                      </div>
                      <span style={{ fontSize: "0.7rem", padding: "2px 10px", borderRadius: 20, background: "rgba(168,85,247,0.15)", color: "#a855f7", border: "1px solid rgba(168,85,247,0.3)" }}>30d</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
                      {chartData.map(({ date, count }) => {
                        const pct = count / chartMax;
                        const isToday = date === today.toISOString().split("T")[0];
                        return (
                          <div key={date} title={`${date}: ${count} quiz${count !== 1 ? "zes" : ""}`}
                            style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "flex-end", height: "100%", cursor: "default" }}>
                            <div style={{
                              width: "100%",
                              height: count === 0 ? 3 : `${Math.max(pct * 100, 8)}%`,
                              background: count === 0 ? "#1e1e2e" : isToday ? "#a855f7" : "rgba(168,85,247,0.5)",
                              borderRadius: "3px 3px 0 0",
                              transition: "height 0.3s ease",
                            }} />
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontSize: "0.62rem", color: "#475569" }}>{last30[0]}</span>
                      <span style={{ fontSize: "0.62rem", color: "#475569" }}>Today</span>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>

                    {/* ── Category breakdown ── */}
                    <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: "1.5rem" }}>
                      <div style={{ fontWeight: 700, marginBottom: "1rem" }}>Category Breakdown</div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.875rem" }}>
                        {analytics.categoryBreakdown.map(({ category, total, published }) => {
                          const pct = Math.round((total / maxCat) * 100);
                          const pubPct = total > 0 ? Math.round((published / total) * 100) : 0;
                          return (
                            <div key={category}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{category}</span>
                                <span style={{ fontSize: "0.75rem", color: "#64748b", fontFamily: "monospace" }}>
                                  {published}/{total} published
                                </span>
                              </div>
                              <div style={{ height: 8, background: "#1e1e2e", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#a855f7,#6366f1)", borderRadius: 4 }} />
                              </div>
                              <div style={{ fontSize: "0.62rem", color: "#475569", marginTop: 3 }}>
                                {pubPct}% published
                              </div>
                            </div>
                          );
                        })}
                        {analytics.categoryBreakdown.length === 0 && (
                          <p style={{ fontSize: "0.82rem", color: "#4a4a5a" }}>No data yet.</p>
                        )}
                      </div>
                    </div>

                    {/* ── Right column: status + difficulty ── */}
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: "1.5rem" }}>

                      {/* Status */}
                      <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: "1.25rem" }}>
                        <div style={{ fontWeight: 700, marginBottom: "0.875rem" }}>Status Distribution</div>
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.6rem" }}>
                          {analytics.statusSummary.map(({ status, count }) => {
                            const color = status === "published" ? "#4ade80" : "#94a3b8";
                            const pct = totalGenerated > 0 ? Math.round((count / totalGenerated) * 100) : 0;
                            return (
                              <div key={status} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: "0.82rem", textTransform: "capitalize" as const }}>{status}</span>
                                <span style={{ fontSize: "0.82rem", fontFamily: "monospace", color }}>{count}</span>
                                <div style={{ width: 80, height: 6, background: "#1e1e2e", borderRadius: 3, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3 }} />
                                </div>
                              </div>
                            );
                          })}
                          {analytics.statusSummary.length === 0 && (
                            <p style={{ fontSize: "0.82rem", color: "#4a4a5a" }}>No data yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Difficulty */}
                      <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 10, padding: "1.25rem" }}>
                        <div style={{ fontWeight: 700, marginBottom: "0.875rem" }}>Difficulty Split</div>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" as const }}>
                          {analytics.difficultyBreakdown.map(({ difficulty, count }) => {
                            const color = difficultyColor(difficulty);
                            return (
                              <div key={difficulty} style={{ flex: 1, minWidth: 80, textAlign: "center" as const, background: `${color}12`, border: `1px solid ${color}40`, borderRadius: 8, padding: "0.75rem 0.5rem" }}>
                                <div style={{ fontSize: "1.5rem", fontWeight: 900, fontFamily: "monospace", color }}>{count}</div>
                                <div style={{ fontSize: "0.68rem", color, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: 1 }}>{difficulty}</div>
                              </div>
                            );
                          })}
                          {analytics.difficultyBreakdown.length === 0 && (
                            <p style={{ fontSize: "0.82rem", color: "#4a4a5a" }}>No data yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

      </div>
    </div>
  );
}

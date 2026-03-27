"use client";

import Image from "next/image";
import { useState, useMemo, useEffect } from "react";
import { channelConfig } from "@/lib/config";
import {
  videos as allVideos,
  videoUrl,
  thumbnailUrl,
} from "@/lib/videos";
import type { QuizVideo } from "@/lib/videos";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "dashboard" | "library";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG    = "#0d0d16";
const SIDE  = "#0a0a14";
const CARD  = "#141420";
const BORD  = "#22223a";

// ── Dynamic category colors (extendable — unknown cats get a hash-picked color) ─
const KNOWN_CAT: Record<string, { text: string; badge: string }> = {
  "Python":          { text: "#60a5fa", badge: "#1d4ed8" },
  "Algorithms":      { text: "#c084fc", badge: "#6d28d9" },
  "JavaScript":      { text: "#fbbf24", badge: "#b45309" },
  "TypeScript":      { text: "#38bdf8", badge: "#0369a1" },
  "AI/ML":           { text: "#22d3ee", badge: "#0e7490" },
  "System Design":   { text: "#4ade80", badge: "#166534" },
  "React":           { text: "#22d3ee", badge: "#164e63" },
  "Docker":          { text: "#60a5fa", badge: "#1e3a8a" },
  "Database":        { text: "#fb923c", badge: "#9a3412" },
  "Machine Learning":{ text: "#a78bfa", badge: "#4c1d95" },
  "DevOps":          { text: "#34d399", badge: "#064e3b" },
  "All":             { text: "#a78bfa", badge: "#4c1d95" },
};
const _FALLBACK_COLORS = [
  { text: "#f472b6", badge: "#831843" },
  { text: "#fb923c", badge: "#7c2d12" },
  { text: "#a78bfa", badge: "#4c1d95" },
  { text: "#34d399", badge: "#064e3b" },
  { text: "#38bdf8", badge: "#0c4a6e" },
  { text: "#fde047", badge: "#713f12" },
];
function getCatColor(name: string) {
  if (name in KNOWN_CAT) return KNOWN_CAT[name];
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return _FALLBACK_COLORS[h % _FALLBACK_COLORS.length];
}

const DIFF: Record<QuizVideo["difficulty"], string> = {
  Beginner:     "EASY",
  Intermediate: "MED",
  Advanced:     "HARD",
};

// ── Inline icons ──────────────────────────────────────────────────────────────
const Ico = {
  Dashboard: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" strokeLinejoin="round" />
      <rect x="14" y="3" width="7" height="7" rx="1" strokeLinejoin="round" />
      <rect x="3" y="14" width="7" height="7" rx="1" strokeLinejoin="round" />
      <rect x="14" y="14" width="7" height="7" rx="1" strokeLinejoin="round" />
    </svg>
  ),
  Library: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M3 6v12M7 4v16M11 2v20M15 4v16M19 6v12" strokeLinecap="round" />
    </svg>
  ),
  Preview: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" />
    </svg>
  ),
  Analytics: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M3 17l5-5 4 4 9-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  ),
  Bell: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Help: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  ),
  Search: () => (
    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  ),
  Grid: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="0.5" /><rect x="14" y="3" width="7" height="7" rx="0.5" />
      <rect x="3" y="14" width="7" height="7" rx="0.5" /><rect x="14" y="14" width="7" height="7" rx="0.5" />
    </svg>
  ),
  List: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round" />
    </svg>
  ),
  More: () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
    </svg>
  ),
  Menu: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  ),
  YT: () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 0 0 .5 6.19C.12 8.07 0 10 0 12s.12 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.37-.38a3.02 3.02 0 0 0 2.13-2.14C23.88 15.93 24 14 24 12s-.12-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z" />
    </svg>
  ),
};

// ── Thumbnail (real or styled placeholder) ────────────────────────────────────
function Thumb({
  video, sizes, priority = false,
}: {
  video: QuizVideo; sizes: string; priority?: boolean;
}) {
  const src = thumbnailUrl(video);
  const col = getCatColor(video.category);
  if (src) {
    return (
      <Image src={src} alt={video.title} fill className="object-cover" sizes={sizes} priority={priority} />
    );
  }
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-1"
      style={{ background: `linear-gradient(135deg, #0e0e16 0%, ${col.badge}30 100%)` }}
    >
      <span className="text-3xl font-black opacity-50" style={{ color: col.text }}>?</span>
      <span
        className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
        style={{ background: `${col.badge}25`, color: col.text }}
      >
        {video.category}
      </span>
      <span className="text-[9px] text-slate-600 mt-0.5">Coming soon</span>
    </div>
  );
}

// ── Video card (grid mode) ────────────────────────────────────────────────────
function VideoCard({ video }: { video: QuizVideo }) {
  const url = videoUrl(video);
  const col = getCatColor(video.category);
  const isLive = Boolean(video.youtubeId);

  return (
    <div
      className="group rounded-xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: CARD,
        borderColor: BORD,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#a855f760")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORD)}
    >
      {/* Thumbnail */}
      <a href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video overflow-hidden bg-[#0e0e16]">
        <Thumb video={video} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />

        {/* Category badge — top left */}
        <div className="absolute top-2 left-2 z-10">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ background: `${col.badge}cc`, color: col.text }}
          >
            {video.category}
          </span>
        </div>

        {/* Difficulty — bottom right */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 text-white tracking-wider">
            {DIFF[video.difficulty]}
          </span>
        </div>

        {/* Play overlay */}
        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <svg className="w-4 h-4 text-gray-900 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </a>

      {/* Card body */}
      <div className="p-3">
        <h3 className="text-[13px] font-bold text-white leading-snug line-clamp-2 mb-1.5 group-hover:text-purple-200 transition-colors">
          {video.title}
        </h3>
        {video.description && (
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {video.description}
          </p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: BORD }}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <Ico.YT />
            </span>
            {isLive ? "Watch on YouTube" : "Coming soon"}
          </a>
          <button
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/5 transition-colors text-slate-600 hover:text-slate-400"
            title="More options"
          >
            <Ico.More />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Video list row ────────────────────────────────────────────────────────────
function VideoListRow({ video, rank }: { video: QuizVideo; rank: number }) {
  const url = videoUrl(video);
  const col = getCatColor(video.category);
  const isLive = Boolean(video.youtubeId);

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent transition-all"
      onMouseEnter={(e) => {
        e.currentTarget.style.background = CARD;
        e.currentTarget.style.borderColor = BORD;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.borderColor = "transparent";
      }}
    >
      <span className="w-5 shrink-0 text-center font-mono text-[11px] text-slate-600">{rank}</span>

      <a href={url} target="_blank" rel="noopener noreferrer"
        className="relative w-20 shrink-0 aspect-video overflow-hidden rounded-lg bg-[#0e0e16]">
        <Thumb video={video} sizes="80px" />
        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
            <svg className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        )}
      </a>

      <div className="flex-1 min-w-0">
        <p className="truncate text-[13px] font-semibold text-slate-200 group-hover:text-white transition-colors">
          {video.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: `${col.badge}25`, color: col.text }}>
            {video.category}
          </span>
          <span className="text-[10px] text-slate-600 font-mono">
            {DIFF[video.difficulty]}
          </span>
          <span className="text-[10px] text-slate-600 font-mono ml-auto">
            {new Date(video.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>

      {isLive ? (
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="shrink-0 text-[11px] font-bold text-purple-500 hover:text-purple-400 transition-colors">
          Watch →
        </a>
      ) : (
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full text-slate-500"
          style={{ background: "#1a1a2a" }}>Soon</span>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ background: "#a855f710", border: `1px solid #a855f730` }}
      >
        🎬
      </div>
      <p className="text-base font-bold text-white mb-1">No videos yet</p>
      <p className="text-sm text-slate-500 max-w-xs">{message}</p>
    </div>
  );
}

// ── Dashboard section ─────────────────────────────────────────────────────────
type ApiStats = { total: number; published: number; categories: { name: string; count: number }[] };

function DashboardView() {
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setApiStats).catch(() => {});
  }, []);

  const recent = allVideos.slice(0, 5);
  const total      = apiStats?.total     ?? allVideos.length;
  const published  = apiStats?.published ?? allVideos.filter((v) => v.youtubeId).length;
  const apiCats    = apiStats?.categories ?? [];
  const catCount   = apiCats.length || Object.keys(
    allVideos.reduce((m, v) => ({ ...m, [v.category]: true }), {} as Record<string, boolean>)
  ).length;
  const maxCat     = Math.max(...apiCats.map((c) => c.count), 1);

  return (
    <div className="p-6 space-y-6">

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Quizzes", value: String(total) || "0",    sub: `${published} on YouTube`, color: "#a855f7" },
          { label: "Categories",    value: String(catCount) || "0", sub: "topics covered",           color: "#22d3ee" },
          { label: "Cadence",       value: "Daily",                  sub: "new quiz every day",       color: "#4ade80" },
          { label: "Access",        value: "Free",                   sub: "always open",               color: "#fbbf24" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-4 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, #1a1a2e 0%, ${s.color}12 100%)`, border: `1px solid ${s.color}35` }}>
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${s.color}80, transparent)` }} />
            <p className="font-mono text-3xl font-black tracking-tight" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm font-bold text-slate-100 mt-1">{s.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Category breakdown ── */}
      {apiCats.length > 0 ? (
        <div>
          <p className="text-sm font-bold text-white mb-3">Quizzes by Category</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {apiCats.map(({ name, count }) => {
              const col = getCatColor(name);
              const pct = Math.round((count / maxCat) * 100);
              return (
                <div key={name} className="rounded-2xl p-4 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${CARD} 0%, ${col.badge}18 100%)`, border: `1px solid ${col.badge}40` }}>
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                    style={{ background: col.text }} />
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2"
                    style={{ background: `${col.badge}30`, color: col.text }}>
                    {name}
                  </span>
                  <p className="text-2xl font-black text-white">{count}</p>
                  <p className="text-[10px] text-slate-500 mb-2">quiz{count !== 1 ? "zes" : ""}</p>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: `${col.badge}30` }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: col.text }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Coming soon (no content yet — no admin links) ── */
        <div className="rounded-2xl border p-8 text-center" style={{ background: CARD, borderColor: BORD }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
            style={{ background: "#a855f715", border: "1px solid #a855f730" }}>
            ⚡
          </div>
          <p className="text-lg font-bold text-white mb-1">Channel launching soon!</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Daily bite-sized tech quiz Shorts on Python, Algorithms, AI, System Design, and more.
            Subscribe to get notified when we drop our first quiz.
          </p>
          <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)" }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 0 0 .5 6.19C.12 8.07 0 10 0 12s.12 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.37-.38a3.02 3.02 0 0 0 2.13-2.14C23.88 15.93 24 14 24 12s-.12-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z" />
            </svg>
            Subscribe on YouTube
          </a>
        </div>
      )}

      {/* ── Recent quizzes (when videos exist) ── */}
      {recent.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ background: CARD, borderColor: BORD }}>
          <p className="text-sm font-bold text-white mb-3">Recent Quizzes</p>
          <div className="space-y-0">
            {recent.map((v, i) => <VideoListRow key={v.id} video={v} rank={i + 1} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Library section ───────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

function LibraryView() {
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setApiStats).catch(() => {});
  }, []);

  const dynCategories = useMemo(
    () => ["All", ...(apiStats?.categories.map((c) => c.name) ?? [])],
    [apiStats]
  );

  const filtered = activeCategory === "All" ? allVideos : allVideos.filter((v) => v.category === activeCategory);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCat(cat: string) {
    setActiveCategory(cat);
    setPage(1);
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Quiz Library</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Browse your daily tech quiz Shorts. Each quiz is one focused question — short, sharp, and stackable.
          </p>
        </div>

        {/* Grid / List toggle */}
        <div className="flex items-center gap-1 shrink-0 rounded-lg border p-0.5" style={{ borderColor: BORD, background: SIDE }}>
          <button
            onClick={() => setViewMode("grid")}
            className="p-1.5 rounded-md transition-colors"
            style={viewMode === "grid" ? { background: "#a855f720", color: "#a855f7" } : { color: "#64748b" }}
          >
            <Ico.Grid />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="p-1.5 rounded-md transition-colors"
            style={viewMode === "list" ? { background: "#a855f720", color: "#a855f7" } : { color: "#64748b" }}
          >
            <Ico.List />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {dynCategories.map((cat) => {
          const col = getCatColor(cat);
          return (
            <button
              key={cat}
              onClick={() => handleCat(cat)}
              className="filter-tab transition-all"
              style={
                activeCategory === cat
                  ? { background: col.badge, borderColor: col.badge, color: col.text }
                  : {}
              }
            >
              {cat === "All" ? "All Videos" : cat}
            </button>
          );
        })}
      </div>

      {/* Grid or list */}
      {visible.length === 0 ? (
        <EmptyState message="No quizzes published yet. Add your first Short's YouTube ID to lib/videos.ts." />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((v) => <VideoCard key={v.id} video={v} />)}
        </div>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden" style={{ background: CARD, borderColor: BORD }}>
          {visible.map((v, i) => (
            <VideoListRow key={v.id} video={v} rank={(page - 1) * PAGE_SIZE + i + 1} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
            style={{ background: CARD, border: `1px solid ${BORD}` }}
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className="w-8 h-8 rounded-lg text-sm font-mono font-semibold transition-all"
              style={
                page === n
                  ? { background: "#a855f7", color: "#fff", border: "1px solid #a855f7" }
                  : { background: CARD, color: "#64748b", border: `1px solid ${BORD}` }
              }
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
            style={{ background: CARD, border: `1px solid ${BORD}` }}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}


// ── Analytics dashboard (kept for future use, not linked in nav) ─────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function AnalyticsView() {
  // 24-hour hourly engagement sample data
  const hourly = [8, 12, 18, 28, 42, 55, 48, 38, 30, 42, 58, 72, 65, 52, 44, 38, 50, 62, 70, 60, 48, 38, 28, 18];
  const maxH = Math.max(...hourly);
  const timeTicks = ["12 AM", "04 AM", "08 AM", "12 PM", "04 PM", "08 PM"];

  const topQuizzes = [
    { title: "Python List Comprehension",  cat: "PYTHON",      catColor: "#3b82f6", time: "45s", resp: "4.2k" },
    { title: "Big O Notation Basics",      cat: "ALGORITHMS",  catColor: "#a855f7", time: "52s", resp: "3.1k" },
    { title: "React Hooks Deep Dive",      cat: "JAVASCRIPT",  catColor: "#fbbf24", time: "48s", resp: "2.8k" },
  ];

  // Donut chart constants
  const R = 48;
  const CIRC = 2 * Math.PI * R;
  const retention = 0.64;

  return (
    <div className="p-5 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Performance Matrix</h1>
          <p className="text-sm text-slate-500 mt-0.5 max-w-md">
            A deep-dive into the engagement of your AI-generated quizzes across YouTube.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
            style={{ border: `1px solid ${BORD}`, background: CARD }}>
            Download Report
          </button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: "#22d3ee", color: "#0a0a0f" }}>
            Live Stream
          </button>
        </div>
      </div>

      {/* ── Chart + Completion row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Bar chart — 3 cols */}
        <div className="lg:col-span-3 rounded-2xl p-5 border" style={{ background: CARD, borderColor: BORD }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-white">Engagement Velocity</p>
              <p className="text-xs text-slate-500 mt-0.5">Real-time interactions per hour</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={{ background: "#22d3ee15", color: "#22d3ee", border: "1px solid #22d3ee30" }}>
              ● LIVE DATA
            </span>
          </div>

          <svg viewBox="0 0 480 150" className="w-full" style={{ overflow: "visible" }}>
            <defs>
              <linearGradient id="bgrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            {hourly.map((v, i) => {
              const bw = 12;
              const step = 480 / hourly.length;
              const x = i * step + (step - bw) / 2;
              const bh = Math.round((v / maxH) * 110);
              return <rect key={i} x={x} y={115 - bh} width={bw} height={bh} rx={3} fill="url(#bgrad)" />;
            })}
            {timeTicks.map((l, i) => (
              <text key={l} x={i * 96} y={140} fontSize="9" fill="#475569" textAnchor="middle">{l}</text>
            ))}
          </svg>
        </div>

        {/* Completion rate — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl p-5 border" style={{ background: CARD, borderColor: BORD }}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: "#22d3ee" }}>
              <svg className="w-4 h-4" fill="none" stroke="#22d3ee" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: "#4ade8015", color: "#4ade80" }}>+12.4%</span>
          </div>
          <p className="text-3xl font-bold text-white">88.2%</p>
          <p className="text-xs text-slate-500 mb-5">Avg. Completion Rate</p>
          <div className="space-y-3.5">
            {([
              { label: "Entertainment", pct: 94 },
              { label: "Educational",   pct: 76 },
            ] as const).map(({ label, pct }) => (
              <div key={label}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs text-slate-400">{pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1e2535" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#22d3ee" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: "TOTAL VIEWS",  value: "12.4K", icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )},
          { label: "QUIZ TAKERS",  value: "842", icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
            </svg>
          )},
          { label: "WATCH TIME",   value: "14.2h", icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" strokeLinecap="round" />
            </svg>
          )},
          { label: "ENGAGEMENT",   value: "72%", icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )},
        ] as const).map(({ label, value, icon }) => (
          <div key={label} className="rounded-xl p-4 flex items-center justify-between border"
            style={{ background: CARD, borderColor: BORD }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{label}</p>
              <p className="text-2xl font-bold text-white">{value}</p>
            </div>
            <span className="text-slate-600">{icon}</span>
          </div>
        ))}
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Top performing quizzes — 3 cols */}
        <div className="lg:col-span-3 rounded-2xl p-5 border" style={{ background: CARD, borderColor: BORD }}>
          <p className="font-bold text-white mb-4">Top Performing Quizzes</p>
          <div className="space-y-2.5">
            {topQuizzes.map((q, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: BG }}>
                <div className="w-14 h-10 rounded-lg flex items-center justify-center shrink-0 text-2xl font-black"
                  style={{ background: `${q.catColor}18`, color: q.catColor }}>
                  ?
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{q.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: `${q.catColor}20`, color: q.catColor }}>{q.cat}</span>
                    <span className="text-[10px] text-slate-600">⏱ {q.time} read</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold" style={{ color: "#22d3ee" }}>{q.resp}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600">responses</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Insight — 2 cols */}
        <div className="lg:col-span-2 rounded-2xl p-5 border relative" style={{ background: CARD, borderColor: BORD }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-white">Audience Insight</p>
            <button className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: "#22d3ee", color: "#0a0a0f" }}>+</button>
          </div>

          {/* Donut */}
          <div className="flex justify-center mb-4">
            <svg viewBox="0 0 120 120" className="w-28 h-28">
              <circle cx="60" cy="60" r={R} fill="none" stroke="#1e2535" strokeWidth="13" />
              <circle cx="60" cy="60" r={R} fill="none" stroke="#22d3ee" strokeWidth="13"
                strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - retention)}
                strokeLinecap="round" transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s ease" }} />
              <text x="60" y="56" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">64%</text>
              <text x="60" y="70" textAnchor="middle" fontSize="7.5" fill="#64748b">RETENTION</text>
            </svg>
          </div>

          <div className="space-y-2">
            {([
              { label: "New Users",  pct: 64.2, color: "#22d3ee" },
              { label: "Returning",  pct: 28.5, color: "#a855f7" },
              { label: "Anonymous",  pct: 7.3,  color: "#475569"  },
            ] as const).map(({ label, pct, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
                <span className="text-xs font-semibold text-slate-300">{pct}%</span>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-700 mt-4 italic leading-relaxed">
            * Your audience retention is 15% higher than channels of similar size.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Nav item config ───────────────────────────────────────────────────────────
const NAV: { id: Section; label: string; Icon: () => React.ReactElement }[] = [
  { id: "dashboard", label: "Dashboard", Icon: Ico.Dashboard },
  { id: "library",   label: "Library",   Icon: Ico.Library   },
];

// ── Root page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [section, setSection] = useState<Section>("library");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b shrink-0"
        style={{ borderColor: BORD }}>
        <Image src="/logo.svg" alt="QuizBytesDaily" width={140} height={36} priority />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button
              key={id}
              onClick={() => { setSection(id); setSidebarOpen(false); }}
              className="relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left"
              style={
                active
                  ? { background: "linear-gradient(90deg, #a855f720, #a855f708)", color: "#fff" }
                  : { color: "#64748b" }
              }
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#cbd5e1"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#64748b"; }}
            >
              {/* Left indicator bar */}
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                  style={{ background: "#a855f7" }}
                />
              )}
              <span style={active ? { color: "#a855f7" } : {}}>
                <Icon />
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {/* Subscribe CTA */}
      <div className="px-3 pb-3 shrink-0">
        <a
          href={channelConfig.youtubeSubscribeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)", boxShadow: "0 4px 16px rgba(147,51,234,0.35)" }}
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 0 0 .5 6.19C.12 8.07 0 10 0 12s.12 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.37-.38a3.02 3.02 0 0 0 2.13-2.14C23.88 15.93 24 14 24 12s-.12-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z" />
          </svg>
          Subscribe
        </a>
      </div>

      {/* Bottom: tagline */}
      <div className="border-t px-4 py-3 shrink-0" style={{ borderColor: BORD }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          One focused quiz every day.<br />
          Short, sharp, and stackable.
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-56 shrink-0 flex-col h-full border-r"
        style={{ background: "linear-gradient(180deg, #0f0f1e 0%, #0a0a14 60%, #0c0a18 100%)", borderColor: BORD }}
      >
        {sidebarContent}
      </aside>

      {/* ── Mobile sidebar drawer ────────────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 h-full z-50 flex flex-col w-56 border-r md:hidden"
            style={{ background: "linear-gradient(180deg, #0f0f1e 0%, #0a0a14 60%, #0c0a18 100%)", borderColor: BORD }}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header
          className="h-14 shrink-0 flex items-center gap-3 px-4 border-b"
          style={{ borderColor: BORD, background: `${SIDE}e0` }}
        >
          {/* Hamburger (mobile) */}
          <button
            className="md:hidden text-slate-500 hover:text-white transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}
          >
            <Ico.Menu />
          </button>

          {/* Search — centered, prominent */}
          <div className="flex-1 flex justify-center">
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 border w-full max-w-xl transition-colors"
              style={{ background: "#0f0f1c", borderColor: "#2a2a3e" }}
              onFocus={() => {}}
            >
              <span className="text-slate-500 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search quizzes by topic, category…"
                className="bg-transparent text-[15px] text-white placeholder-slate-500 outline-none flex-1 min-w-0"
              />
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-600 bg-white/5 rounded px-1.5 py-0.5 shrink-0">⌘K</kbd>
            </div>
          </div>

          {/* Right — subscribe CTA only */}
          <a
            href={channelConfig.youtubeSubscribeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: "#dc2626" }}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 0 0 .5 6.19C.12 8.07 0 10 0 12s.12 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.37-.38a3.02 3.02 0 0 0 2.13-2.14C23.88 15.93 24 14 24 12s-.12-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z" />
            </svg>
            Subscribe
          </a>
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto">
          {section === "dashboard" && <DashboardView />}
          {section === "library"   && <LibraryView />}
        </main>
      </div>
    </div>
  );
}

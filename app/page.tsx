"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { channelConfig, categories } from "@/lib/config";
import type { Category } from "@/lib/config";
import {
  videos as allVideos,
  getVideosByCategory,
  videoUrl,
  thumbnailUrl,
} from "@/lib/videos";
import type { QuizVideo } from "@/lib/videos";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "dashboard" | "library" | "preview" | "analytics";

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG    = "#0b0b12";
const SIDE  = "#08080f";
const CARD  = "#111119";
const BORD  = "#1c1c2e";

const CAT: Record<string, { text: string; badge: string }> = {
  Python:          { text: "#60a5fa", badge: "#1d4ed8" },
  Algorithms:      { text: "#c084fc", badge: "#7c3aed" },
  JavaScript:      { text: "#fbbf24", badge: "#b45309" },
  "AI/ML":         { text: "#22d3ee", badge: "#0891b2" },
  "System Design": { text: "#4ade80", badge: "#15803d" },
  All:             { text: "#c084fc", badge: "#7c3aed" },
};

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
  const col = CAT[video.category];
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
  const col = CAT[video.category];
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
  const col = CAT[video.category];
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
      <p className="mt-4 text-xs text-slate-600 font-mono">
        Add entries to <span className="text-purple-500">lib/videos.ts</span> once your Shorts are published.
      </p>
    </div>
  );
}

// ── Dashboard section ─────────────────────────────────────────────────────────
function DashboardView() {
  const [dbStats, setDbStats] = useState<{ total: number; published: number } | null>(null);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setDbStats).catch(() => {});
  }, []);

  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const v of allVideos) {
      map[v.category] = (map[v.category] ?? 0) + 1;
    }
    return map;
  }, []);
  const max = Math.max(...Object.values(catCounts), 1);
  const recent = allVideos.slice(0, 5);
  const isEmpty = allVideos.length === 0;

  const totalUploaded = dbStats?.total ?? allVideos.length;
  const totalPublished = dbStats?.published ?? allVideos.filter((v) => v.youtubeId).length;

  return (
    <div className="p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Quizzes",  value: String(totalUploaded) || "0",                    sub: `${totalPublished} published`,  color: "#a855f7" },
          { label: "Categories",     value: String(Object.keys(catCounts).length) || "0",   sub: "topics covered",               color: "#22d3ee" },
          { label: "Cadence",        value: "Daily",                                          sub: "new quiz / day",               color: "#4ade80" },
          { label: "Access",         value: "Free",                                           sub: "always open",                  color: "#fbbf24" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${CARD} 0%, ${s.color}08 100%)`,
              border: `1px solid ${s.color}28`,
            }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${s.color}70, transparent)` }} />
            <p className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-semibold text-white mt-0.5">{s.label}</p>
            <p className="text-[11px] text-slate-500">{s.sub}</p>
          </div>
        ))}
      </div>

      {isEmpty ? (
        <div className="rounded-xl border p-6" style={{ background: CARD, borderColor: BORD }}>
          <p className="text-sm font-bold text-white mb-4">🚀 How to publish your first quiz</p>
          <div className="space-y-3">
            {[
              { step: "1", color: "#a855f7", title: "Generate slides", desc: "Go to Admin → Generate tab. Enter a topic and click Generate Quiz. Claude builds 5 questions automatically." },
              { step: "2", color: "#22d3ee", title: "Screen-record the slides", desc: "Open Slide Preview (bottom-left). Press ▶ to auto-play. Record with ⌘⇧5 on Mac or Win+G on Windows. Save as MP4." },
              { step: "3", color: "#fbbf24", title: "Upload to YouTube", desc: "Go to Admin → Upload tab. Fill title/description, pick your MP4, set privacy to Private first, then click Upload." },
              { step: "4", color: "#4ade80", title: "Add to this library", desc: 'Copy the YouTube video ID from the URL (e.g. abc123xyz). Add an entry to lib/videos.ts. It will appear here instantly.' },
            ].map(({ step, color, title, desc }) => (
              <div key={step} className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5"
                  style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-3">
            <a href="/admin" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-80"
              style={{ background: "#a855f7" }}>
              ✨ Open Admin Panel
            </a>
            <a href="/slides" className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold border transition-colors hover:border-slate-500"
              style={{ borderColor: BORD, color: "#94a3b8" }}>
              ▶ Slide Preview
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category bars */}
          <div className="rounded-xl border p-4" style={{ background: CARD, borderColor: BORD }}>
            <p className="text-sm font-bold text-white mb-4">By Category</p>
            <div className="space-y-2.5">
              {Object.entries(catCounts).map(([cat, count]) => {
                const col = CAT[cat];
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={cat}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-slate-400">{cat}</span>
                      <span className="font-mono text-xs text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: BORD }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col.badge }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent quizzes */}
          <div className="rounded-xl border p-4" style={{ background: CARD, borderColor: BORD }}>
            <p className="text-sm font-bold text-white mb-3">Recent Quizzes</p>
            <div className="space-y-0">
              {recent.map((v, i) => <VideoListRow key={v.id} video={v} rank={i + 1} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Library section ───────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

function LibraryView() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  const filtered = getVideosByCategory(activeCategory);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCat(cat: Category) {
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
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCat(cat)}
            className="filter-tab transition-all"
            style={
              activeCategory === cat
                ? { background: "#a855f7", borderColor: "#a855f7", color: "#fff" }
                : {}
            }
          >
            {cat === "All" ? "All Videos" : cat}
          </button>
        ))}
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

// ── Preview section ───────────────────────────────────────────────────────────
function PreviewView() {
  const featured = allVideos.find((v) => v.featured) ?? allVideos[0];

  if (!featured) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 text-center">
        <div className="text-4xl mb-4">🎬</div>
        <p className="text-white font-semibold mb-1">No videos yet</p>
        <p className="text-sm text-slate-500">
          Generate a quiz in the{" "}
          <a href="/admin" className="text-purple-400 hover:underline">Admin panel</a>,
          record it, and upload to YouTube. It will appear here once added to{" "}
          <code className="text-slate-400">lib/videos.ts</code>.
        </p>
      </div>
    );
  }

  const rest = allVideos.filter((v) => v.id !== featured.id).slice(0, 4);
  const col = CAT[featured.category] ?? CAT["All"];
  const url = videoUrl(featured);
  const isLive = Boolean(featured.youtubeId);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-white mb-1">Latest Quiz</h1>
      <p className="text-sm text-slate-500 mb-5">The most recent daily quiz Short.</p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Big featured card */}
        <div className="lg:col-span-3">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="group block rounded-xl overflow-hidden border"
            style={{ background: CARD, borderColor: BORD }}>
            <div className="relative aspect-video bg-[#0e0e16]">
              <Thumb video={featured} sizes="(max-width: 1024px) 100vw, 60vw" priority />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors">
                {isLive && (
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                    <svg className="w-7 h-7 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="absolute top-3 left-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded"
                  style={{ background: `${col.badge}cc`, color: col.text }}>
                  {featured.category}
                </span>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                  ★ FEATURED
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ background: `${col.badge}20`, color: col.text }}>
                  {DIFF[featured.difficulty]}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">{featured.title}</h2>
              {featured.description && (
                <p className="text-sm text-slate-400 mb-4">{featured.description}</p>
              )}
              <div className="flex items-center gap-3">
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors">
                  <Ico.YT /> Watch on YouTube
                </a>
                <span className="font-mono text-xs text-slate-500">
                  {new Date(featured.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* Recent quizzes sidebar */}
        <div className="lg:col-span-2">
          <p className="text-sm font-bold text-white mb-3">Up Next</p>
          <div className="space-y-2">
            {rest.map((v, i) => <VideoListRow key={v.id} video={v} rank={i + 2} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analytics dashboard ───────────────────────────────────────────────────────
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
  { id: "preview",   label: "Preview",   Icon: Ico.Preview   },
  { id: "analytics", label: "Analytics", Icon: Ico.Analytics },
];

// ── Root page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [section, setSection] = useState<Section>("analytics");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b shrink-0"
        style={{ borderColor: BORD, background: "linear-gradient(180deg, #0e0e1c 0%, transparent 100%)" }}>
        <Image src="/logo.svg" alt="QuizBytesDaily" width={140} height={32} priority />
        <p className="text-[10px] text-slate-600 mt-1 ml-1">Daily Tech Quiz Shorts</p>
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

      {/* Bottom: settings + channel */}
      <div className="border-t px-2 py-3 space-y-0.5 shrink-0" style={{ borderColor: BORD }}>
        <Link href="/slides"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-all">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" strokeLinecap="round" />
          </svg>
          Slide Preview
        </Link>
        <Link href="/admin"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all">
          <Ico.Settings /> Admin
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
            QB
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">QuizBytesDaily</p>
            <p className="text-[10px] text-slate-600">Channel</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG }}>

      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex w-56 shrink-0 flex-col h-full border-r"
        style={{ background: `linear-gradient(180deg, #0d0d1a 0%, ${SIDE} 100%)`, borderColor: BORD }}
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
            style={{ background: `linear-gradient(180deg, #0d0d1a 0%, ${SIDE} 100%)`, borderColor: BORD }}
          >
            {sidebarContent}
          </aside>
        </>
      )}

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header
          className="h-12 shrink-0 flex items-center gap-3 px-4 border-b"
          style={{ borderColor: BORD, background: `${SIDE}cc` }}
        >
          {/* Hamburger (mobile) */}
          <button
            className="md:hidden text-slate-500 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Ico.Menu />
          </button>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 border"
              style={{ background: CARD, borderColor: BORD }}
            >
              <span className="text-slate-600"><Ico.Search /></span>
              <input
                type="text"
                placeholder="Search quiz library..."
                className="bg-transparent text-sm text-white placeholder-slate-600 outline-none flex-1 min-w-0"
              />
            </div>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1 ml-auto">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
              <Ico.Bell />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors">
              <Ico.Help />
            </button>
            <div className="h-5 w-px mx-1" style={{ background: BORD }} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400 hidden lg:block">{channelConfig.handle}</span>
              <div className="w-7 h-7 rounded-full bg-purple-700 flex items-center justify-center text-[11px] font-bold text-white">QB</div>
            </div>
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto">
          {section === "dashboard" && <DashboardView />}
          {section === "library"   && <LibraryView />}
          {section === "preview"   && <PreviewView />}
          {section === "analytics" && <AnalyticsView />}
        </main>
      </div>
    </div>
  );
}

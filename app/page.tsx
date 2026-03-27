"use client";

import Image from "next/image"; // used for logo only
import { useState, useMemo, useEffect } from "react";
import { channelConfig } from "@/lib/config";

// ── Types ─────────────────────────────────────────────────────────────────────
type Section = "dashboard" | "library";

interface SeriesItem {
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

type ApiStats = { total: number; published: number; categories: { name: string; count: number }[] };

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG   = "#0e0e18";
const SIDE = "#09090f";
const CARD = "#13131f";
const BORD = "#1e1e32";

// ── Dynamic category colors ───────────────────────────────────────────────────
const KNOWN_CAT: Record<string, { text: string; badge: string }> = {
  "Python":           { text: "#60a5fa", badge: "#1d4ed8" },
  "Algorithms":       { text: "#c084fc", badge: "#6d28d9" },
  "JavaScript":       { text: "#fbbf24", badge: "#b45309" },
  "TypeScript":       { text: "#38bdf8", badge: "#0369a1" },
  "AI/ML":            { text: "#22d3ee", badge: "#0e7490" },
  "System Design":    { text: "#4ade80", badge: "#166534" },
  "React":            { text: "#22d3ee", badge: "#164e63" },
  "Docker":           { text: "#60a5fa", badge: "#1e3a8a" },
  "Database":         { text: "#fb923c", badge: "#9a3412" },
  "Machine Learning": { text: "#a78bfa", badge: "#4c1d95" },
  "DevOps":           { text: "#34d399", badge: "#064e3b" },
  "All":              { text: "#a78bfa", badge: "#4c1d95" },
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

const DIFF_COLOR: Record<string, string> = {
  Beginner:     "#4ade80",
  Intermediate: "#fbbf24",
  Advanced:     "#f87171",
};
const DIFF_LABEL: Record<string, string> = {
  Beginner:     "EASY",
  Intermediate: "MED",
  Advanced:     "HARD",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function seriesUrl(s: SeriesItem): string {
  return s.youtube_url ?? "https://www.youtube.com/@QuizBytesDaily";
}

function seriesThumbnail(s: SeriesItem): string {
  if (s.youtube_id) return `https://i.ytimg.com/vi/${s.youtube_id}/mqdefault.jpg`;
  return `/api/thumbnail/${s.slug}`;
}

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

// ── Thumbnail component ───────────────────────────────────────────────────────
// Use a plain <img> — SVG API routes + YouTube thumbs don't need next/image optimisation
function Thumb({ series }: { series: SeriesItem }) {
  const src = seriesThumbnail(series);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={series.title}
      className="absolute inset-0 w-full h-full object-cover"
      loading="lazy"
    />
  );
}

// ── Video card (grid mode) ─────────────────────────────────────────────────────
function SeriesCard({ series }: { series: SeriesItem }) {
  const url = seriesUrl(series);
  const col = getCatColor(series.category);
  const isLive = Boolean(series.youtube_id);
  const diffColor = DIFF_COLOR[series.difficulty] ?? "#94a3b8";
  const diffLabel = DIFF_LABEL[series.difficulty] ?? series.difficulty.toUpperCase().slice(0, 4);

  return (
    <div
      className="group rounded-xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: CARD, borderColor: BORD }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#a855f760")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = BORD)}
    >
      {/* Thumbnail */}
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="block relative aspect-video overflow-hidden bg-[#08080f]">
        <Thumb series={series} />

        {/* Category badge — top left */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
            style={{ background: `${col.badge}cc`, color: col.text }}>
            {series.category}
          </span>
        </div>

        {/* Difficulty — bottom right */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/70 tracking-wider"
            style={{ color: diffColor }}>
            {diffLabel}
          </span>
        </div>

        {/* Play overlay (published only) */}
        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
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
          {series.title}
        </h3>
        {series.topic && series.topic !== series.title && (
          <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">{series.topic}</p>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: BORD }}>
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors">
            <span className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center shrink-0">
              <Ico.YT />
            </span>
            {isLive ? "Watch on YouTube" : "Coming soon"}
          </a>
          <span className="text-[10px] font-mono text-slate-600">
            {new Date(series.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Series list row ────────────────────────────────────────────────────────────
function SeriesListRow({ series, rank }: { series: SeriesItem; rank: number }) {
  const url = seriesUrl(series);
  const col = getCatColor(series.category);
  const isLive = Boolean(series.youtube_id);

  return (
    <div
      className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent transition-all"
      onMouseEnter={(e) => { e.currentTarget.style.background = CARD; e.currentTarget.style.borderColor = BORD; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}
    >
      <span className="w-5 shrink-0 text-center font-mono text-[11px] text-slate-600">{rank}</span>

      <a href={url} target="_blank" rel="noopener noreferrer"
        className="relative w-20 shrink-0 aspect-video overflow-hidden rounded-lg bg-[#08080f]">
        <Thumb series={series} />
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
          {series.title}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: `${col.badge}25`, color: col.text }}>
            {series.category}
          </span>
          <span className="text-[10px] font-mono ml-auto" style={{ color: "#475569" }}>
            {new Date(series.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ background: "#a855f710", border: "1px solid #a855f730" }}>
        🎬
      </div>
      <p className="text-base font-bold text-white mb-1">No quizzes yet</p>
      <p className="text-sm text-slate-500 max-w-xs">{message}</p>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
const TOPIC_PILLS = ["Python", "Algorithms", "AI/ML", "System Design", "TypeScript", "Docker", "React", "DevOps"];

function DashboardView() {
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [recent, setRecent] = useState<SeriesItem[]>([]);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setApiStats).catch(() => {});
    fetch("/api/series").then((r) => r.json()).then((data: SeriesItem[]) => setRecent(data.slice(0, 5))).catch(() => {});
  }, []);

  const total     = apiStats?.total     ?? 0;
  const published = apiStats?.published ?? 0;
  const apiCats   = apiStats?.categories ?? [];
  const catCount  = apiCats.length;
  const maxCat    = Math.max(...apiCats.map((c) => c.count), 1);

  return (
    <div className="space-y-0">

      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden px-8 py-12"
        style={{ background: "linear-gradient(135deg, #0f0f1e 0%, #130d24 50%, #0c1220 100%)" }}>

        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
        <div className="absolute -bottom-12 right-24 w-48 h-48 rounded-full opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }} />
        <div className="absolute top-8 right-8 w-32 h-32 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5 border"
            style={{ background: "#a855f715", borderColor: "#a855f730", color: "#c084fc" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Daily quiz channel
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-3">
            One quiz.<br />
            <span style={{ background: "linear-gradient(90deg, #a855f7, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Every day.
            </span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed mb-6 max-w-md">
            Bite-sized tech quiz Shorts. Python, Algorithms, AI, System Design — one focused question, every single day.
          </p>

          <div className="flex flex-wrap gap-2 mb-7">
            {TOPIC_PILLS.map((t) => {
              const col = getCatColor(t);
              return (
                <span key={t} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: `${col.badge}25`, color: col.text, border: `1px solid ${col.badge}40` }}>
                  {t}
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <a href={channelConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #a855f7, #7c3aed)", boxShadow: "0 0 20px rgba(168,85,247,0.4)" }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 0 0 .5 6.19C.12 8.07 0 10 0 12s.12 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.37-.38a3.02 3.02 0 0 0 2.13-2.14C23.88 15.93 24 14 24 12s-.12-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z" />
              </svg>
              Watch on YouTube
            </a>
            <span className="text-xs text-slate-600 font-mono">Free forever · No signup</span>
          </div>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b" style={{ borderColor: BORD }}>
        {[
          { label: "Quizzes Published", value: String(published), icon: "▶", color: "#a855f7" },
          { label: "Topics Covered",    value: String(catCount || "—"),  icon: "#", color: "#22d3ee" },
          { label: "Upload Cadence",    value: "Daily",           icon: "◈", color: "#4ade80" },
          { label: "Cost to Watch",     value: "Free",            icon: "✦", color: "#fbbf24" },
        ].map((s) => (
          <div key={s.label}
            className="px-6 py-4 flex items-center gap-4 border-r last:border-r-0"
            style={{ borderColor: BORD, borderTop: `1px solid ${BORD}` }}>
            <span className="text-xl font-black shrink-0 w-8 text-center" style={{ color: s.color }}>{s.icon}</span>
            <div>
              <p className="font-mono text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category breakdown ── */}
      {apiCats.length > 0 && (
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Quizzes by Category</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {apiCats.map(({ name, count }) => {
              const col = getCatColor(name);
              const pct = Math.round((count / maxCat) * 100);
              return (
                <div key={name}
                  className="rounded-xl p-4 relative overflow-hidden transition-all hover:-translate-y-0.5 cursor-default"
                  style={{ background: CARD, border: `1px solid ${BORD}`, borderLeft: `3px solid ${col.text}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${col.badge}25`, color: col.text }}>{name}</span>
                    <span className="text-2xl font-black" style={{ color: col.text }}>{count}</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: `${col.badge}20` }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col.text }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5">quiz{count !== 1 ? "zes" : ""}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent quizzes ── */}
      {total > 0 && recent.length > 0 && (
        <div className="p-6 pt-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Recent Quizzes</p>
          <div className="rounded-xl border overflow-hidden divide-y" style={{ background: CARD, borderColor: BORD }}>
            {recent.map((s, i) => <SeriesListRow key={s.id} series={s} rank={i + 1} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Library ────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

function LibraryView() {
  const [allSeries, setAllSeries]       = useState<SeriesItem[]>([]);
  const [apiStats, setApiStats]         = useState<ApiStats | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode]         = useState<"grid" | "list">("grid");
  const [page, setPage]                 = useState(1);

  useEffect(() => {
    fetch("/api/series").then((r) => r.json()).then(setAllSeries).catch(() => {});
    fetch("/api/stats").then((r) => r.json()).then(setApiStats).catch(() => {});
  }, []);

  const dynCategories = useMemo(
    () => ["All", ...(apiStats?.categories.map((c) => c.name) ?? [])],
    [apiStats]
  );

  const filtered = activeCategory === "All"
    ? allSeries
    : allSeries.filter((s) => s.category === activeCategory);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleCat(cat: string) { setActiveCategory(cat); setPage(1); }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Quiz Library</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Browse daily tech quiz Shorts. Each quiz is one focused question — short, sharp, and stackable.
          </p>
        </div>

        {/* Grid / List toggle */}
        <div className="flex items-center gap-1 shrink-0 rounded-lg border p-0.5" style={{ borderColor: BORD, background: SIDE }}>
          <button onClick={() => setViewMode("grid")} className="p-1.5 rounded-md transition-colors"
            style={viewMode === "grid" ? { background: "#a855f720", color: "#a855f7" } : { color: "#64748b" }}>
            <Ico.Grid />
          </button>
          <button onClick={() => setViewMode("list")} className="p-1.5 rounded-md transition-colors"
            style={viewMode === "list" ? { background: "#a855f720", color: "#a855f7" } : { color: "#64748b" }}>
            <Ico.List />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {dynCategories.map((cat) => {
          const col = getCatColor(cat);
          return (
            <button key={cat} onClick={() => handleCat(cat)} className="filter-tab transition-all"
              style={activeCategory === cat
                ? { background: col.badge, borderColor: col.badge, color: col.text }
                : {}}>
              {cat === "All" ? "All Videos" : cat}
            </button>
          );
        })}
      </div>

      {/* Grid or list */}
      {allSeries.length === 0 ? (
        <EmptyState message="No quizzes yet. Generate your first quiz from the Admin panel." />
      ) : visible.length === 0 ? (
        <EmptyState message={`No quizzes in "${activeCategory}" yet.`} />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((s) => <SeriesCard key={s.id} series={s} />)}
        </div>
      ) : (
        <div className="rounded-xl border divide-y overflow-hidden" style={{ background: CARD, borderColor: BORD }}>
          {visible.map((s, i) => (
            <SeriesListRow key={s.id} series={s} rank={(page - 1) * PAGE_SIZE + i + 1} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
            style={{ background: CARD, border: `1px solid ${BORD}` }}>←</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className="w-8 h-8 rounded-lg text-sm font-mono font-semibold transition-all"
              style={page === n
                ? { background: "#a855f7", color: "#fff", border: "1px solid #a855f7" }
                : { background: CARD, color: "#64748b", border: `1px solid ${BORD}` }}>
              {n}
            </button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-30"
            style={{ background: CARD, border: `1px solid ${BORD}` }}>→</button>
        </div>
      )}
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────
const NAV: { id: Section; label: string; Icon: () => React.ReactElement }[] = [
  { id: "dashboard", label: "Dashboard", Icon: Ico.Dashboard },
  { id: "library",   label: "Library",   Icon: Ico.Library   },
];

// ── Root page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [section, setSection]       = useState<Section>("library");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarContent = (
    <>
      <div className="px-4 pt-5 pb-4 border-b shrink-0" style={{ borderColor: BORD }}>
        <Image src="/logo.svg" alt="QuizBytesDaily" width={140} height={36} priority />
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button key={id} onClick={() => { setSection(id); setSidebarOpen(false); }}
              className="relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left"
              style={active ? { background: "linear-gradient(90deg, #a855f720, #a855f708)", color: "#fff" } : { color: "#64748b" }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#cbd5e1"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#64748b"; }}
            >
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ background: "#a855f7" }} />}
              <span style={active ? { color: "#a855f7" } : {}}><Icon /></span>
              {label}
            </button>
          );
        })}
      </nav>

      <div className="border-t px-4 py-3 shrink-0" style={{ borderColor: BORD }}>
        <p className="text-[10px] text-slate-600 leading-relaxed">
          One focused quiz every day.<br />Short, sharp, and stackable.
        </p>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: BG }}>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col h-full border-r"
        style={{ background: "linear-gradient(180deg, #0f0f1e 0%, #0a0a14 60%, #0c0a18 100%)", borderColor: BORD }}>
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full z-50 flex flex-col w-56 border-r md:hidden"
            style={{ background: "linear-gradient(180deg, #0f0f1e 0%, #0a0a14 60%, #0c0a18 100%)", borderColor: BORD }}>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b"
          style={{ borderColor: BORD, background: `${SIDE}e0` }}>

          <button className="md:hidden text-slate-500 hover:text-white transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}>
            <Ico.Menu />
          </button>

          {/* Search */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 border w-full max-w-xl transition-colors"
              style={{ background: "#0f0f1c", borderColor: "#2a2a3e" }}>
              <span className="text-slate-500 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                </svg>
              </span>
              <input type="text" placeholder="Search quizzes by topic, category…"
                className="bg-transparent text-[15px] text-white placeholder-slate-500 outline-none flex-1 min-w-0" />
              <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-600 bg-white/5 rounded px-1.5 py-0.5 shrink-0">⌘K</kbd>
            </div>
          </div>

          {/* Subscribe */}
          <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: "#dc2626" }}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 0 0 .5 6.19C.12 8.07 0 10 0 12s.12 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.37-.38a3.02 3.02 0 0 0 2.13-2.14C23.88 15.93 24 14 24 12s-.12-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z" />
            </svg>
            Subscribe
          </a>
        </header>

        <main className="flex-1 overflow-y-auto">
          {section === "dashboard" && <DashboardView />}
          {section === "library"   && <LibraryView />}
        </main>
      </div>
    </div>
  );
}

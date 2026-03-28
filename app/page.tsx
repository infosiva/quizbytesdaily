"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";
import { channelConfig } from "@/lib/config";

// ── Types ──────────────────────────────────────────────────────────────────────
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

interface ApiStats {
  total: number;
  published: number;
  categories: { name: string; count: number }[];
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG   = "#0b0b12";
const CARD = "#111118";
const BORD = "#1c1c2e";
const CYN  = "#22d3ee";

// ── Category colours ───────────────────────────────────────────────────────────
const KNOWN_CAT: Record<string, { text: string; badge: string }> = {
  "Python":           { text: "#60a5fa", badge: "#1d4ed8" },
  "Algorithms":       { text: "#c084fc", badge: "#6d28d9" },
  "JavaScript":       { text: "#fbbf24", badge: "#b45309" },
  "TypeScript":       { text: "#38bdf8", badge: "#0369a1" },
  "AI/ML":            { text: "#22d3ee", badge: "#0e7490" },
  "AI":               { text: "#22d3ee", badge: "#0e7490" },
  "System Design":    { text: "#4ade80", badge: "#166534" },
  "React":            { text: "#22d3ee", badge: "#164e63" },
  "Docker":           { text: "#60a5fa", badge: "#1e3a8a" },
  "Database":         { text: "#fb923c", badge: "#9a3412" },
  "Machine Learning": { text: "#a78bfa", badge: "#4c1d95" },
  "DevOps":           { text: "#34d399", badge: "#064e3b" },
  "Data Structures":  { text: "#f472b6", badge: "#831843" },
};
const _FALLBACK = [
  { text: "#f472b6", badge: "#831843" }, { text: "#fb923c", badge: "#7c2d12" },
  { text: "#a78bfa", badge: "#4c1d95" }, { text: "#34d399", badge: "#064e3b" },
  { text: "#38bdf8", badge: "#0c4a6e" }, { text: "#fde047", badge: "#713f12" },
];
function getCatColor(name: string) {
  if (name in KNOWN_CAT) return KNOWN_CAT[name];
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return _FALLBACK[h % _FALLBACK.length];
}

const DIFF_COLOR: Record<string, string> = {
  Beginner: "#4ade80", Intermediate: "#fbbf24", Advanced: "#f87171",
};
const DIFF_LABEL: Record<string, string> = {
  Beginner: "BEGINNER", Intermediate: "INTERMEDIATE", Advanced: "ADVANCED",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function seriesUrl(s: SeriesItem): string {
  return s.youtube_url ?? channelConfig.youtubeUrl;
}
function seriesThumbnail(s: SeriesItem): string {
  if (s.youtube_id) return `https://i.ytimg.com/vi/${s.youtube_id}/mqdefault.jpg`;
  return `/api/thumbnail/${s.slug}`;
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const Ico = {
  Grid: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  List: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round"/>
    </svg>
  ),
  YT: () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 0 0 .5 6.19C.12 8.07 0 10 0 12s.12 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.37-.38a3.02 3.02 0 0 0 2.13-2.14C23.88 15.93 24 14 24 12s-.12-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
    </svg>
  ),
  Play: () => (
    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
  ),
  Slides: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="14" rx="2"/><path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none"/>
    </svg>
  ),
  Cal: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4" strokeLinecap="round"/>
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
    </svg>
  ),
};

// ── Thumbnail ──────────────────────────────────────────────────────────────────
function Thumb({ series }: { series: SeriesItem }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={seriesThumbnail(series)} alt={series.title}
      className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
  );
}

// ── Series card (grid) ─────────────────────────────────────────────────────────
function SeriesCard({ series }: { series: SeriesItem }) {
  const url     = seriesUrl(series);
  const col     = getCatColor(series.category);
  const isLive  = Boolean(series.youtube_id);
  const diffCol = DIFF_COLOR[series.difficulty] ?? "#94a3b8";
  const diffLbl = DIFF_LABEL[series.difficulty] ?? series.difficulty.toUpperCase();
  const slides  = series.slide_count ?? 0;

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1"
      style={{ background: CARD, borderColor: BORD, boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${CYN}40`;
        e.currentTarget.style.boxShadow   = `0 8px 32px rgba(34,211,238,0.12)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = BORD;
        e.currentTarget.style.boxShadow   = "0 2px 12px rgba(0,0,0,0.4)";
      }}>

      {/* Thumbnail */}
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="block relative overflow-hidden bg-[#07070e]" style={{ aspectRatio: "16/9" }}>
        <Thumb series={series} />

        {/* Overlays only for YouTube thumbnails — SVG thumbnails have badges built in */}
        {isLive && (
          <>
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%)" }} />
            <div className="absolute top-2.5 left-2.5">
              <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md uppercase"
                style={{ background: `${col.badge}ee`, color: col.text }}>
                {series.category}
              </span>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md tracking-widest uppercase"
                style={{ background: "rgba(0,0,0,0.8)", color: diffCol, border: `1px solid ${diffCol}50` }}>
                {diffLbl}
              </span>
            </div>
            {slides > 0 && (
              <div className="absolute bottom-2.5 right-2.5">
                <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md"
                  style={{ background: "rgba(0,0,0,0.75)", color: "#e2e8f0" }}>
                  <Ico.Slides />{slides} slides
                </span>
              </div>
            )}
          </>
        )}

        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
              style={{ background: `${CYN}cc`, boxShadow: `0 0 24px ${CYN}66` }}>
              <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        )}
      </a>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-4">
        <a href={url} target="_blank" rel="noopener noreferrer" className="group/title">
          <h3 className="text-[17px] font-extrabold text-white leading-snug line-clamp-2 mb-2 transition-colors group-hover/title:text-cyan-300">
            {series.title}
          </h3>
        </a>

        {series.topic && (
          <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-3 flex-1">
            {series.topic}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-slate-600 mb-3">
          <span className="flex items-center gap-1">
            <Ico.Cal />{fmtDate(series.created_at)}
          </span>
          {slides > 0 && (
            <>
              <span className="text-slate-700">·</span>
              <span className="flex items-center gap-1">
                <Ico.Slides />{slides} slides
              </span>
            </>
          )}
        </div>

        {isLive ? (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-[12px] font-black tracking-widest uppercase transition-all hover:gap-3"
            style={{ color: CYN }}>
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${CYN}20`, border: `1px solid ${CYN}50` }}>
              <Ico.Play />
            </span>
            Watch on YouTube
          </a>
        ) : (
          <span className="flex items-center gap-2 text-[12px] font-black tracking-widest uppercase text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            Coming Soon
          </span>
        )}
      </div>
    </div>
  );
}

// ── Series list row ────────────────────────────────────────────────────────────
function SeriesListRow({ series, rank }: { series: SeriesItem; rank: number }) {
  const url     = seriesUrl(series);
  const col     = getCatColor(series.category);
  const isLive  = Boolean(series.youtube_id);
  const diffCol = DIFF_COLOR[series.difficulty] ?? "#94a3b8";
  const slides  = series.slide_count ?? 0;

  return (
    <div className="group flex items-center gap-3 px-4 py-3 transition-colors"
      onMouseEnter={(e) => (e.currentTarget.style.background = "#13131e")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
      <span className="w-6 shrink-0 text-center font-mono text-[12px] font-bold text-slate-700">{rank}</span>

      <a href={url} target="_blank" rel="noopener noreferrer"
        className="relative shrink-0 rounded-xl overflow-hidden bg-[#07070e]"
        style={{ width: 100, aspectRatio: "16/9" }}>
        <Thumb series={series} />
        {isLive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
            <svg className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        )}
      </a>

      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-slate-200 group-hover:text-white transition-colors truncate">
          {series.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: `${col.badge}25`, color: col.text }}>
            {series.category}
          </span>
          <span className="text-[10px] font-mono" style={{ color: diffCol }}>{series.difficulty}</span>
          {slides > 0 && <span className="text-[10px] text-slate-700 font-mono">{slides} slides</span>}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3">
        <span className="hidden sm:block text-[11px] font-mono text-slate-700">
          {new Date(series.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
        {isLive ? (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-[12px] font-black tracking-wider uppercase transition-colors hover:opacity-80 flex items-center gap-1"
            style={{ color: CYN }}>
            <Ico.Play />Watch
          </a>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-amber-400/70"
            style={{ background: "#451a0330" }}>Soon</span>
        )}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ background: `${CYN}12`, border: `1px solid ${CYN}30` }}>🎬</div>
      <p className="text-base font-bold text-white mb-1">No quizzes found</p>
      <p className="text-sm text-slate-500 max-w-xs">{message}</p>
    </div>
  );
}

// ── Root page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [allSeries,       setAllSeries]       = useState<SeriesItem[]>([]);
  const [apiStats,        setApiStats]        = useState<ApiStats | null>(null);
  const [activeCategory,  setActiveCategory]  = useState("All");
  const [searchQuery,     setSearchQuery]     = useState("");
  const [viewMode,        setViewMode]        = useState<"grid" | "list">("grid");
  const [page,            setPage]            = useState(1);
  const PAGE_SIZE = 12;

  useEffect(() => {
    fetch("/api/series").then((r) => r.json()).then(setAllSeries).catch(() => {});
    fetch("/api/stats").then((r) => r.json()).then(setApiStats).catch(() => {});
    fetch("/api/track", { method: "POST" }).catch(() => {});
  }, []);

  const dynCategories = useMemo(
    () => ["All", ...(apiStats?.categories.map((c) => c.name) ?? [])],
    [apiStats],
  );

  const filtered = useMemo(() => {
    let items = activeCategory === "All"
      ? allSeries
      : allSeries.filter((s) => s.category === activeCategory);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (s) => s.title.toLowerCase().includes(q)
          || s.topic.toLowerCase().includes(q)
          || s.category.toLowerCase().includes(q),
      );
    }
    return items;
  }, [allSeries, activeCategory, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCat = useCallback((cat: string) => { setActiveCategory(cat); setPage(1); }, []);
  useEffect(() => { setPage(1); }, [searchQuery]);

  const published = apiStats?.published ?? 0;
  const apiCats   = apiStats?.categories ?? [];

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#e2e8f0" }}>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b"
        style={{ borderColor: BORD, background: `${BG}f5`, backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-4 px-5" style={{ height: 60, maxWidth: 1400, margin: "0 auto" }}>

          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image src="/logo.svg" alt="QuizBytesDaily" width={130} height={34} priority />
          </Link>

          {/* Search bar */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 rounded-xl px-4 py-2 border w-full max-w-lg transition-colors"
              style={{ background: "#0d0d18", borderColor: searchQuery ? `${CYN}55` : BORD }}>
              <span className="text-slate-500 shrink-0"><Ico.Search /></span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quizzes by topic or category…"
                className="bg-transparent text-sm text-white placeholder-slate-600 outline-none flex-1 min-w-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}
                  className="text-slate-500 hover:text-white transition-colors shrink-0 text-xs leading-none">
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* YouTube subscribe */}
          <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: "#dc2626" }}>
            <Ico.YT /> Subscribe
          </a>
        </div>
      </header>

      {/* ── Stats strip ── */}
      {(published > 0 || apiCats.length > 0) && (
        <div className="border-b" style={{ borderColor: BORD, background: "#09091388" }}>
          <div className="flex items-center gap-6 px-5 py-2.5 overflow-x-auto"
            style={{ maxWidth: 1400, margin: "0 auto" }}>
            <span className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap" style={{ color: CYN }}>
              <span className="font-black text-sm">{published}</span> Videos
            </span>
            <span className="text-slate-800">|</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-slate-500">
              <span className="font-black text-sm text-green-400">{apiCats.length}</span> Categories
            </span>
            <span className="text-slate-800">|</span>
            <span className="text-xs text-slate-600 whitespace-nowrap">Daily tech quiz Shorts</span>
            <a href={channelConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="ml-auto shrink-0 text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-80"
              style={{ color: CYN }}>
              <Ico.YT /> Watch all on YouTube →
            </a>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "1.5rem 1.25rem" }}>

        {/* Category filters + view toggle */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
          <div className="flex flex-wrap gap-2">
            {dynCategories.map((cat) => {
              const active = activeCategory === cat;
              const col    = getCatColor(cat);
              return (
                <button key={cat} onClick={() => handleCat(cat)}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-xl border transition-all"
                  style={active
                    ? cat === "All"
                      ? { background: CYN, borderColor: CYN, color: "#000" }
                      : { background: col.badge, borderColor: col.badge, color: col.text }
                    : { background: "transparent", borderColor: BORD, color: "#64748b" }}>
                  {cat === "All" ? `All (${allSeries.length})` : cat}
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 shrink-0 rounded-xl border p-1"
            style={{ borderColor: BORD, background: "#080810" }}>
            <button onClick={() => setViewMode("grid")} className="p-2 rounded-lg transition-all"
              title="Grid view"
              style={viewMode === "grid" ? { background: `${CYN}20`, color: CYN } : { color: "#475569" }}>
              <Ico.Grid />
            </button>
            <button onClick={() => setViewMode("list")} className="p-2 rounded-lg transition-all"
              title="List view"
              style={viewMode === "list" ? { background: `${CYN}20`, color: CYN } : { color: "#475569" }}>
              <Ico.List />
            </button>
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || activeCategory !== "All") && (
          <p className="text-sm text-slate-500 mb-4">
            {filtered.length === 0
              ? "No results found"
              : `${filtered.length} quiz${filtered.length !== 1 ? "es" : ""}`}
            {searchQuery && ` matching "${searchQuery}"`}
            {activeCategory !== "All" && ` in ${activeCategory}`}
          </p>
        )}

        {/* Content */}
        {allSeries.length === 0 ? (
          <EmptyState message="No quizzes yet. Check back soon — new ones drop daily!" />
        ) : visible.length === 0 ? (
          <EmptyState message={
            searchQuery
              ? `No quizzes match "${searchQuery}". Try a different keyword.`
              : `No quizzes in "${activeCategory}" yet.`
          } />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visible.map((s) => <SeriesCard key={s.id} series={s} />)}
          </div>
        ) : (
          <div className="rounded-2xl border divide-y overflow-hidden" style={{ background: CARD, borderColor: BORD }}>
            {visible.map((s, i) => (
              <SeriesListRow key={s.id} series={s} rank={(page - 1) * PAGE_SIZE + i + 1} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              style={{ background: CARD, border: `1px solid ${BORD}` }}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className="w-9 h-9 rounded-xl text-sm font-bold font-mono transition-all"
                style={page === n
                  ? { background: CYN, color: "#000" }
                  : { background: CARD, color: "#64748b", border: `1px solid ${BORD}` }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              style={{ background: CARD, border: `1px solid ${BORD}` }}>→</button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t mt-12 py-8 text-center" style={{ borderColor: BORD }}>
        <p className="text-sm text-slate-600">
          <span className="font-bold" style={{ color: CYN }}>QuizBytesDaily</span>
          {" · "}
          <a href={channelConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
            className="hover:text-slate-400 transition-colors">YouTube</a>
          {" · "}
          One quiz every day
        </p>
      </footer>
    </div>
  );
}

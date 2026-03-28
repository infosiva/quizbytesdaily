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

interface SiteSettings {
  gridColumns: 2 | 3 | 4;
  defaultView: "grid" | "table";
  pageSize: number;
  sortDefault: "newest" | "oldest" | "az" | "za" | "category";
  showStats: boolean;
  accentColor: string;
}

type SortBy = "newest" | "oldest" | "az" | "za" | "category";

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG   = "#0b0b12";
const CARD = "#111118";
const BORD = "#1c1c2e";
const CYN  = "#22d3ee"; // module-level fallback used by sub-components

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
function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const Ico = {
  Grid: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Table: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 9h18M3 15h18M9 3v18" strokeLinecap="round"/>
    </svg>
  ),
  YT: () => (
    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.13-2.14C19.5 3.67 12 3.67 12 3.67s-7.5 0-9.37.38A3.02 3.02 0 0 0 .5 6.19C.12 8.07 0 10 0 12s.12 3.93.5 5.81a3.02 3.02 0 0 0 2.13 2.14C4.5 20.33 12 20.33 12 20.33s7.5 0 9.37-.38a3.02 3.02 0 0 0 2.13-2.14C23.88 15.93 24 14 24 12s-.12-3.93-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/>
    </svg>
  ),
  Play: () => (
    <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
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
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
    </svg>
  ),
  Sort: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round"/>
    </svg>
  ),
  External: () => (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ── Series card (grid) ─────────────────────────────────────────────────────────
function SeriesCard({ series }: { series: SeriesItem }) {
  const url     = seriesUrl(series);
  const col     = getCatColor(series.category);
  const isLive  = Boolean(series.youtube_id);
  const diffCol = DIFF_COLOR[series.difficulty] ?? "#94a3b8";
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={seriesThumbnail(series)} alt={series.title}
          className="absolute inset-0 w-full h-full object-cover" loading="lazy" />

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
                {series.difficulty.toUpperCase()}
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

// ── Table row ─────────────────────────────────────────────────────────────────
function TableRow({ series, rank, even }: { series: SeriesItem; rank: number; even: boolean }) {
  const url     = seriesUrl(series);
  const col     = getCatColor(series.category);
  const isLive  = Boolean(series.youtube_id);
  const diffCol = DIFF_COLOR[series.difficulty] ?? "#94a3b8";
  const slides  = series.slide_count ?? 0;

  return (
    <tr style={{ background: even ? "#0e0e18" : "#111118" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#14141f"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = even ? "#0e0e18" : "#111118"; }}>

      {/* Rank */}
      <td className="text-center font-mono text-[12px] font-bold text-slate-700 py-3 pl-4 pr-2" style={{ width: 36 }}>
        {rank}
      </td>

      {/* Thumbnail */}
      <td className="py-3 pr-3" style={{ width: 110 }}>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="group/thumb relative block overflow-hidden rounded-lg bg-[#07070e]"
          style={{ width: 104, aspectRatio: "16/9" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={seriesThumbnail(series)} alt={series.title}
            className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          {isLive && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/40 transition-colors">
              <svg className="w-4 h-4 opacity-0 group-hover/thumb:opacity-100 transition-opacity" fill="white" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          )}
        </a>
      </td>

      {/* Title + topic */}
      <td className="py-3 pr-4">
        <a href={url} target="_blank" rel="noopener noreferrer" className="group/title">
          <div className="text-[14px] font-bold text-slate-100 group-hover/title:text-cyan-300 transition-colors leading-snug line-clamp-1">
            {series.title}
          </div>
        </a>
        {series.topic && (
          <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{series.topic}</div>
        )}
      </td>

      {/* Category */}
      <td className="py-3 pr-4 hidden sm:table-cell" style={{ width: 130 }}>
        <span className="text-[11px] font-black uppercase tracking-wider px-2 py-1 rounded-lg"
          style={{ background: `${col.badge}30`, color: col.text, border: `1px solid ${col.badge}50` }}>
          {series.category}
        </span>
      </td>

      {/* Difficulty */}
      <td className="py-3 pr-4 hidden md:table-cell" style={{ width: 110 }}>
        <span className="text-[11px] font-bold px-2 py-1 rounded-lg font-mono"
          style={{ background: `${diffCol}15`, color: diffCol, border: `1px solid ${diffCol}30` }}>
          {series.difficulty}
        </span>
      </td>

      {/* Slides */}
      <td className="py-3 pr-4 hidden lg:table-cell text-center" style={{ width: 70 }}>
        {slides > 0 ? (
          <span className="text-[12px] font-mono font-bold text-slate-500">{slides}</span>
        ) : (
          <span className="text-[12px] text-slate-800">—</span>
        )}
      </td>

      {/* Date */}
      <td className="py-3 pr-4 hidden sm:table-cell whitespace-nowrap" style={{ width: 90 }}>
        <span className="text-[11px] font-mono text-slate-600">{fmtDateShort(series.created_at)}</span>
      </td>

      {/* Watch */}
      <td className="py-3 pr-4 text-right" style={{ width: 120 }}>
        {isLive ? (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase px-3 py-1.5 rounded-lg transition-all hover:opacity-85"
            style={{ background: `${CYN}15`, color: CYN, border: `1px solid ${CYN}35` }}>
            <Ico.Play />Watch
            <span className="hidden xl:inline"><Ico.External /></span>
          </a>
        ) : (
          <span className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg text-amber-400/60"
            style={{ background: "#451a0320", border: "1px solid #451a0340" }}>
            Soon
          </span>
        )}
      </td>
    </tr>
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
  const [allSeries,      setAllSeries]      = useState<SeriesItem[]>([]);
  const [apiStats,       setApiStats]       = useState<ApiStats | null>(null);
  const [siteSettings,   setSiteSettings]   = useState<SiteSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [viewMode,       setViewMode]       = useState<"grid" | "table">("table");
  const [sortBy,         setSortBy]         = useState<SortBy>("newest");
  const [page,           setPage]           = useState(1);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Derived from settings (with fallbacks)
  // Note: sub-components use module-level CYN; accent here applies to root-level chrome
  const accent    = siteSettings?.accentColor ?? CYN;
  const PAGE_SIZE = siteSettings?.pageSize ?? 20;
  const gridCols  = siteSettings?.gridColumns ?? 3;
  const showStats = siteSettings?.showStats ?? true;

  useEffect(() => {
    // Load settings first — they control view/sort defaults
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: SiteSettings) => {
        setSiteSettings(s);
        setViewMode(s.defaultView ?? "table");
        setSortBy(s.sortDefault ?? "newest");
        setSettingsLoaded(true);
      })
      .catch(() => setSettingsLoaded(true));

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
    // Sort
    const sorted = [...items];
    switch (sortBy) {
      case "oldest":   sorted.sort((a, b) => a.created_at.localeCompare(b.created_at)); break;
      case "az":       sorted.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "za":       sorted.sort((a, b) => b.title.localeCompare(a.title)); break;
      case "category": sorted.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)); break;
      default:         sorted.sort((a, b) => b.created_at.localeCompare(a.created_at)); break;
    }
    return sorted;
  }, [allSeries, activeCategory, searchQuery, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCat = useCallback((cat: string) => { setActiveCategory(cat); setPage(1); }, []);
  useEffect(() => { setPage(1); }, [searchQuery, sortBy]);

  const published = apiStats?.published ?? 0;
  const apiCats   = apiStats?.categories ?? [];

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#e2e8f0" }}>

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b"
        style={{ borderColor: BORD, background: `${BG}f5`, backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-5 px-6" style={{ height: 68, maxWidth: 1440, margin: "0 auto" }}>

          {/* Logo — full native SVG size */}
          <Link href="/" className="shrink-0">
            <Image src="/logo.svg" alt="QuizBytesDaily" width={200} height={44} priority />
          </Link>

          <div className="flex-1" />

          {/* YouTube subscribe */}
          <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 shrink-0 px-4 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: "#dc2626" }}>
            <Ico.YT /> Subscribe
          </a>
        </div>
      </header>

      {/* ── Hero search bar ── */}
      <div className="border-b" style={{ borderColor: BORD, background: "#09091380" }}>
        <div className="px-6 py-5" style={{ maxWidth: 1440, margin: "0 auto" }}>
          <div className="flex items-center gap-3 rounded-xl px-5 py-0 border transition-colors"
            style={{
              background: "#0d0d1a",
              borderColor: searchQuery ? `${accent}60` : "#22222e",
              boxShadow: searchQuery ? `0 0 0 3px ${accent}12` : "none",
              height: 56,
            }}>
            <span style={{ color: searchQuery ? accent : "#374151", transition: "color 0.15s" }}>
              <Ico.Search />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search quizzes — try 'Python', 'RAG', 'binary search'…"
              className="bg-transparent text-base text-white placeholder-slate-700 outline-none flex-1 min-w-0"
              style={{ fontSize: 15 }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full transition-colors hover:bg-white/10 text-slate-500 hover:text-white text-sm">
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      {showStats && (published > 0 || apiCats.length > 0) && (
        <div className="border-b" style={{ borderColor: BORD, background: "#07071088" }}>
          <div className="flex items-center gap-5 px-6 py-2 overflow-x-auto"
            style={{ maxWidth: 1440, margin: "0 auto" }}>
            <span className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap" style={{ color: accent }}>
              <span className="font-black text-sm">{published}</span> Videos
            </span>
            <span className="text-slate-800">·</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-slate-500">
              <span className="font-black text-sm text-green-400">{apiCats.length}</span> Categories
            </span>
            <span className="text-slate-800">·</span>
            <span className="text-xs text-slate-600 whitespace-nowrap">Daily tech quiz Shorts</span>
            <a href={channelConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="ml-auto shrink-0 text-xs font-bold flex items-center gap-1.5 transition-opacity hover:opacity-80"
              style={{ color: accent }}>
              <Ico.YT /> Watch all on YouTube →
            </a>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "1.5rem 1.5rem", opacity: settingsLoaded ? 1 : 0, transition: "opacity 0.15s" }}>

        {/* Controls row: category pills | sort | view toggle */}
        <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {dynCategories.map((cat) => {
              const active = activeCategory === cat;
              const col    = getCatColor(cat);
              return (
                <button key={cat} onClick={() => handleCat(cat)}
                  className="text-[12px] font-bold px-3 py-1.5 rounded-xl border transition-all"
                  style={active
                    ? cat === "All"
                      ? { background: accent, borderColor: accent, color: "#000" }
                      : { background: col.badge, borderColor: col.badge, color: col.text }
                    : { background: "transparent", borderColor: BORD, color: "#64748b" }}>
                  {cat === "All" ? `All (${allSeries.length})` : cat}
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5 text-slate-500">
              <Ico.Sort />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-[12px] font-semibold outline-none rounded-xl border px-2.5 py-1.5 appearance-none cursor-pointer transition-colors"
                style={{ background: CARD, borderColor: BORD, color: "#94a3b8", minWidth: 130 }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
                <option value="category">By Category</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-xl border p-1"
              style={{ borderColor: BORD, background: "#080810" }}>
              <button onClick={() => setViewMode("table")} className="p-2 rounded-lg transition-all"
                title="Table view"
                style={viewMode === "table" ? { background: `${accent}20`, color: accent } : { color: "#475569" }}>
                <Ico.Table />
              </button>
              <button onClick={() => setViewMode("grid")} className="p-2 rounded-lg transition-all"
                title="Grid view"
                style={viewMode === "grid" ? { background: `${accent}20`, color: accent } : { color: "#475569" }}>
                <Ico.Grid />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        {(searchQuery || activeCategory !== "All") && filtered.length > 0 && (
          <p className="text-sm text-slate-500 mb-4">
            {filtered.length} quiz{filtered.length !== 1 ? "zes" : ""}
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
          <div className="grid gap-5"
            style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
            {visible.map((s) => <SeriesCard key={s.id} series={s} />)}
          </div>
        ) : (
          /* Table view */
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BORD }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "#0d0d1a", borderBottom: `1px solid ${BORD}` }}>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-700 py-2.5 pl-4 pr-2" style={{ width: 36 }}>#</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-700 py-2.5 pr-3" style={{ width: 110 }}>Thumb</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-700 py-2.5 pr-4">Title</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-700 py-2.5 pr-4 hidden sm:table-cell" style={{ width: 130 }}>Category</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-700 py-2.5 pr-4 hidden md:table-cell" style={{ width: 110 }}>Difficulty</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-slate-700 py-2.5 pr-4 hidden lg:table-cell" style={{ width: 70 }}>Slides</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-700 py-2.5 pr-4 hidden sm:table-cell" style={{ width: 90 }}>Date</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-700 py-2.5 pr-4" style={{ width: 120 }}>Watch</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: `1px solid ${BORD}` }}>
                {visible.map((s, i) => (
                  <TableRow key={s.id} series={s} rank={(page - 1) * PAGE_SIZE + i + 1} even={i % 2 === 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors disabled:opacity-30"
              style={{ background: CARD, border: `1px solid ${BORD}` }}>←</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // Show pages around current page
              let n: number;
              if (totalPages <= 7) n = i + 1;
              else if (page <= 4) n = i + 1;
              else if (page >= totalPages - 3) n = totalPages - 6 + i;
              else n = page - 3 + i;
              return n;
            }).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className="w-9 h-9 rounded-xl text-sm font-bold font-mono transition-all"
                style={page === n
                  ? { background: accent, color: "#000" }
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
          <span className="font-bold" style={{ color: accent }}>QuizBytesDaily</span>
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

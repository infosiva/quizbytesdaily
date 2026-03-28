"use client";

import Image from "next/image";
import { useState, useMemo, useEffect, useCallback } from "react";
import { channelConfig } from "@/lib/config";

// ── Types ──────────────────────────────────────────────────────────────────────
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

interface ApiStats {
  total: number;
  published: number;
  categories: { name: string; count: number }[];
  pageViews?: { today: number; week: number; total: number; daily: { date: string; count: number }[] };
}

interface SiteSettings {
  gridColumns:   2 | 3 | 4;
  defaultView:   "grid" | "list";
  pageSize:      8 | 12 | 16 | 24;
  heroEnabled:   boolean;
  showDashboard: boolean;
}

interface VideoStat {
  id: number; slug: string; title: string; category: string;
  difficulty: string; youtube_id: string; youtube_url: string | null;
  views: number; likes: number; comments: number;
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG    = "#0b0b12";
const SIDE  = "#080810";
const CARD  = "#111118";
const BORD  = "#1c1c2e";
const CYN   = "#22d3ee";   // primary accent — cyan

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
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const Ico = {
  Dashboard: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  Library: () => (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M3 6v12M7 4v16M11 2v20M15 4v16M19 6v12" strokeLinecap="round"/>
    </svg>
  ),
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
  Menu: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
    </svg>
  ),
  Eye: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Thumb: () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
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
};

// ── Thumbnail img ──────────────────────────────────────────────────────────────
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
            {/* Bottom gradient for readability */}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />

            {/* Top gradient for badges */}
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 40%)" }} />

            {/* Category badge — top-left */}
            <div className="absolute top-2.5 left-2.5">
              <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md uppercase"
                style={{ background: `${col.badge}ee`, color: col.text }}>
                {series.category}
              </span>
            </div>

            {/* Difficulty badge — top-right */}
            <div className="absolute top-2.5 right-2.5">
              <span className="text-[9px] font-black px-2 py-0.5 rounded-md tracking-widest uppercase"
                style={{ background: "rgba(0,0,0,0.8)", color: diffCol, border: `1px solid ${diffCol}50` }}>
                {diffLbl}
              </span>
            </div>

            {/* Slide count — bottom-right (YouTube videos) */}
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

        {/* Play button on hover (published only) */}
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

        {/* Title */}
        <a href={url} target="_blank" rel="noopener noreferrer" className="group/title">
          <h3 className="text-[17px] font-extrabold text-white leading-snug line-clamp-2 mb-2 transition-colors group-hover/title:text-cyan-300">
            {series.title}
          </h3>
        </a>

        {/* Topic description */}
        {series.topic && (
          <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-2 mb-3 flex-1">
            {series.topic}
          </p>
        )}

        {/* Metadata row */}
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

        {/* Watch / Coming soon */}
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
  const url    = seriesUrl(series);
  const col    = getCatColor(series.category);
  const isLive = Boolean(series.youtube_id);
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
          <span className="text-[10px] font-mono" style={{ color: diffCol }}>
            {series.difficulty}
          </span>
          {slides > 0 && (
            <span className="text-[10px] text-slate-700 font-mono">{slides} slides</span>
          )}
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

// ── Dashboard ──────────────────────────────────────────────────────────────────
const TOPIC_PILLS = ["Python", "Algorithms", "AI/ML", "System Design", "TypeScript", "Docker", "React", "DevOps"];

function DashboardView({ heroEnabled }: { heroEnabled: boolean }) {
  const [apiStats, setApiStats]   = useState<ApiStats | null>(null);
  const [recent,   setRecent]     = useState<SeriesItem[]>([]);
  const [ytStats,  setYtStats]    = useState<{ stats: VideoStat[]; totalViews: number; totalLikes: number } | null>(null);
  const [ytLoading, setYtLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setApiStats).catch(() => {});
    fetch("/api/series").then((r) => r.json()).then((d: SeriesItem[]) => setRecent(d.slice(0, 5))).catch(() => {});
    fetch("/api/youtube/stats")
      .then((r) => r.json())
      .then(setYtStats)
      .catch(() => setYtStats(null))
      .finally(() => setYtLoading(false));
  }, []);

  const published  = apiStats?.published ?? 0;
  const apiCats    = apiStats?.categories ?? [];
  const maxCat     = Math.max(...apiCats.map((c) => c.count), 1);
  const totalViews = ytStats?.totalViews ?? 0;
  const totalLikes = ytStats?.totalLikes ?? 0;
  const topVideos  = ytStats?.stats.slice(0, 5) ?? [];
  const pageViews  = apiStats?.pageViews;
  const maxDay     = Math.max(...(pageViews?.daily.map((d) => d.count) ?? []), 1);

  return (
    <div>
      {/* ── Hero banner ── */}
      {heroEnabled && (
        <div className="relative overflow-hidden px-8 py-12"
          style={{ background: "linear-gradient(135deg, #080812 0%, #0a1020 50%, #061218 100%)" }}>
          <div className="absolute -top-20 right-0 w-80 h-80 rounded-full opacity-15 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${CYN} 0%, transparent 70%)` }} />
          <div className="absolute bottom-0 left-16 w-56 h-56 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-5 border"
              style={{ background: `${CYN}12`, borderColor: `${CYN}30`, color: CYN }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: CYN }} />
              Daily quiz channel
            </div>

            <h1 className="text-4xl font-black text-white leading-tight mb-3">
              One quiz.<br />
              <span style={{ background: `linear-gradient(90deg, ${CYN}, #a855f7)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
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

            <a href={channelConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black text-black transition-all hover:scale-105 tracking-wide"
              style={{ background: CYN, boxShadow: `0 0 24px ${CYN}55` }}>
              <Ico.YT /> Watch on YouTube
            </a>
          </div>
        </div>
      )}

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b" style={{ borderColor: BORD }}>
        {[
          { label: "Published",      value: String(published),                            color: CYN,       icon: "▶" },
          { label: "YT Views",       value: ytLoading ? "…" : fmtNum(totalViews),         color: "#4ade80",  icon: "◈" },
          { label: "YT Likes",       value: ytLoading ? "…" : fmtNum(totalLikes),         color: "#f472b6",  icon: "♥" },
          { label: "Today's Visits", value: pageViews ? fmtNum(pageViews.today) : "…",    color: "#fbbf24",  icon: "👁" },
          { label: "Total Visits",   value: pageViews ? fmtNum(pageViews.total) : "…",    color: "#a78bfa",  icon: "✦" },
        ].map((s) => (
          <div key={s.label} className="px-5 py-4 flex items-center gap-3 border-r last:border-r-0"
            style={{ borderColor: BORD, borderTop: `1px solid ${BORD}` }}>
            <span className="text-lg font-black shrink-0 w-7 text-center" style={{ color: s.color }}>{s.icon}</span>
            <div>
              <p className="font-mono text-xl font-black leading-none" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-slate-500 mt-1">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-0">
        {/* ── Top videos by views ── */}
        <div className="p-6 border-r" style={{ borderColor: BORD }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
            <Ico.Eye /> Top Videos by Views
          </p>
          {ytLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: `${CARD}80` }} />
              ))}
            </div>
          ) : topVideos.length === 0 ? (
            <p className="text-sm text-slate-600">No published videos yet.</p>
          ) : (
            <div className="space-y-2">
              {topVideos.map((v, i) => {
                const col = getCatColor(v.category);
                return (
                  <a key={v.id} href={v.youtube_url ?? channelConfig.youtubeUrl}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-xl transition-colors group"
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#13131e")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span className="w-5 text-center font-mono text-[12px] font-bold shrink-0"
                      style={{ color: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#c2864c" : "#374151" }}>
                      {i + 1}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://i.ytimg.com/vi/${v.youtube_id}/default.jpg`} alt={v.title}
                      className="w-16 rounded-lg shrink-0 object-cover" style={{ aspectRatio: "16/9" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-200 group-hover:text-white truncate">
                        {v.title}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: `${col.badge}25`, color: col.text }}>{v.category}</span>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="flex items-center gap-1 text-[12px] font-bold font-mono" style={{ color: CYN }}>
                        <Ico.Eye />{fmtNum(v.views)}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 justify-end">
                        <Ico.Thumb />{fmtNum(v.likes)}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Category breakdown ── */}
        <div className="p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Quizzes by Category</p>
          {apiCats.length === 0 ? (
            <p className="text-sm text-slate-600">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {apiCats.map(({ name, count }) => {
                const col = getCatColor(name);
                const pct = Math.round((count / maxCat) * 100);
                return (
                  <div key={name} className="flex items-center gap-3">
                    <span className="w-24 text-[11px] font-bold truncate shrink-0" style={{ color: col.text }}>
                      {name}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${col.badge}22` }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: col.text }} />
                    </div>
                    <span className="w-7 text-right text-[12px] font-bold font-mono shrink-0" style={{ color: col.text }}>
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Page visitors mini-chart ── */}
      {pageViews && pageViews.daily.length > 0 && (
        <div className="p-6 border-t" style={{ borderColor: BORD }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              👁 Page Visitors — Last 30 Days
            </p>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="text-slate-500">Today <span className="font-bold" style={{ color: CYN }}>{fmtNum(pageViews.today)}</span></span>
              <span className="text-slate-500">Week <span className="font-bold text-amber-400">{fmtNum(pageViews.week)}</span></span>
              <span className="text-slate-500">Total <span className="font-bold text-green-400">{fmtNum(pageViews.total)}</span></span>
            </div>
          </div>
          <div className="flex items-end gap-[3px] h-20">
            {pageViews.daily.map((d, i) => {
              const pct = Math.max(4, Math.round((d.count / maxDay) * 100));
              const isToday = d.date === new Date().toISOString().slice(0, 10);
              return (
                <div key={i} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                  <div className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${pct}%`,
                      background: isToday
                        ? `linear-gradient(to top, ${CYN}, #67e8f9)`
                        : "linear-gradient(to top, #1c1c2e, #252538)",
                      minHeight: 3,
                    }} />
                  <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 whitespace-nowrap">
                    <div className="text-[10px] font-bold px-2 py-1 rounded-md shadow-lg"
                      style={{ background: "#1c1c2e", color: "#e2e8f0", border: `1px solid ${BORD}` }}>
                      {d.date.slice(5)}: {d.count}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-slate-700 font-mono">{pageViews.daily[0]?.date.slice(5)}</span>
            <span className="text-[10px] text-slate-700 font-mono">Today</span>
          </div>
        </div>
      )}

      {/* ── Recent quizzes ── */}
      {recent.length > 0 && (
        <div className="p-6 pt-2 border-t" style={{ borderColor: BORD }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Recent Quizzes</p>
          <div className="rounded-2xl border divide-y overflow-hidden" style={{ background: CARD, borderColor: BORD, borderTopColor: BORD }}>
            {recent.map((s, i) => <SeriesListRow key={s.id} series={s} rank={i + 1} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Library ────────────────────────────────────────────────────────────────────
const GRID_COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

function LibraryView({
  searchQuery,
  settings,
}: {
  searchQuery: string;
  settings: SiteSettings;
}) {
  const [allSeries,      setAllSeries]      = useState<SeriesItem[]>([]);
  const [apiStats,       setApiStats]       = useState<ApiStats | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode,       setViewMode]       = useState<"grid" | "list">(settings.defaultView);
  const [page,           setPage]           = useState(1);

  useEffect(() => { setViewMode(settings.defaultView); }, [settings.defaultView]);

  useEffect(() => {
    fetch("/api/series").then((r) => r.json()).then(setAllSeries).catch(() => {});
    fetch("/api/stats").then((r) => r.json()).then(setApiStats).catch(() => {});
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

  const totalPages = Math.ceil(filtered.length / settings.pageSize);
  const visible    = filtered.slice((page - 1) * settings.pageSize, page * settings.pageSize);

  const handleCat = useCallback((cat: string) => { setActiveCategory(cat); setPage(1); }, []);
  useEffect(() => { setPage(1); }, [searchQuery]);

  const gridClass = GRID_COLS[settings.gridColumns] ?? GRID_COLS[3];

  return (
    <div className="p-6">
      {/* Header row */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Quiz Library</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {searchQuery
              ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchQuery}"`
              : "Browse daily tech quiz Shorts. Each quiz is one focused question — short, sharp, and stackable."}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 shrink-0 rounded-xl border p-1" style={{ borderColor: BORD, background: SIDE }}>
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

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {dynCategories.map((cat) => {
          const active = activeCategory === cat;
          const col = getCatColor(cat);
          return (
            <button key={cat} onClick={() => handleCat(cat)}
              className="text-[12px] font-bold px-3 py-1.5 rounded-xl border transition-all"
              style={active
                ? cat === "All"
                  ? { background: CYN, borderColor: CYN, color: "#000" }
                  : { background: col.badge, borderColor: col.badge, color: col.text }
                : { background: "transparent", borderColor: BORD, color: "#64748b" }}>
              {cat === "All" ? "All Videos" : cat}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {allSeries.length === 0 ? (
        <EmptyState message="No quizzes yet. Generate your first quiz from the Admin panel." />
      ) : visible.length === 0 ? (
        <EmptyState message={
          searchQuery
            ? `No quizzes match "${searchQuery}". Try a different keyword.`
            : `No quizzes in "${activeCategory}" yet.`
        } />
      ) : viewMode === "grid" ? (
        <div className={`grid ${gridClass} gap-5`}>
          {visible.map((s) => <SeriesCard key={s.id} series={s} />)}
        </div>
      ) : (
        <div className="rounded-2xl border divide-y overflow-hidden" style={{ background: CARD, borderColor: BORD }}>
          {visible.map((s, i) => (
            <SeriesListRow key={s.id} series={s} rank={(page - 1) * settings.pageSize + i + 1} />
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
    </div>
  );
}

// ── Sidebar nav items ──────────────────────────────────────────────────────────
const NAV_BASE: { id: Section; label: string; Icon: () => React.ReactElement }[] = [
  { id: "dashboard", label: "Dashboard", Icon: Ico.Dashboard },
  { id: "library",   label: "Library",   Icon: Ico.Library   },
];

// ── Root page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [section,     setSection]     = useState<Section>("library");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings,    setSettings]    = useState<SiteSettings>({
    gridColumns: 3, defaultView: "grid", pageSize: 12, heroEnabled: true, showDashboard: true,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s: SiteSettings) => setSettings(s))
      .catch(() => {});
    fetch("/api/track", { method: "POST" }).catch(() => {});
  }, []);

  const navItems = settings.showDashboard ? NAV_BASE : NAV_BASE.filter((n) => n.id !== "dashboard");

  const sidebarContent = (
    <>
      <div className="px-4 pt-5 pb-4 border-b shrink-0" style={{ borderColor: BORD }}>
        <Image src="/logo.svg" alt="QuizBytesDaily" width={140} height={36} priority />
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ id, label, Icon }) => {
          const active = section === id;
          return (
            <button key={id} onClick={() => { setSection(id); setSidebarOpen(false); }}
              className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left"
              style={active
                ? { background: `${CYN}15`, color: "#fff" }
                : { color: "#64748b" }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#cbd5e1"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#64748b"; }}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r" style={{ background: CYN }} />}
              <span style={active ? { color: CYN } : {}}><Icon /></span>
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
        style={{ background: `linear-gradient(180deg, #0b0b18 0%, #080810 60%, #08100e 100%)`, borderColor: BORD }}>
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full z-50 flex flex-col w-56 border-r md:hidden"
            style={{ background: `linear-gradient(180deg, #0b0b18 0%, #080810 60%, #08100e 100%)`, borderColor: BORD }}>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top bar */}
        <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b"
          style={{ borderColor: BORD, background: `${SIDE}e8` }}>

          <button className="md:hidden text-slate-500 hover:text-white transition-colors shrink-0"
            onClick={() => setSidebarOpen(true)}>
            <Ico.Menu />
          </button>

          {/* Search */}
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 rounded-xl px-3.5 py-2 border w-full max-w-xl transition-colors"
              style={{ background: "#0d0d18", borderColor: searchQuery ? `${CYN}55` : "#1e1e2e" }}>
              <span className="text-slate-500 shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSection("library"); }}
                placeholder="Search quizzes by topic, category…"
                className="bg-transparent text-[14px] text-white placeholder-slate-600 outline-none flex-1 min-w-0"
              />
              {searchQuery ? (
                <button onClick={() => setSearchQuery("")}
                  className="text-slate-500 hover:text-white transition-colors shrink-0 text-[13px] leading-none">
                  ✕
                </button>
              ) : (
                <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-700 bg-white/5 rounded px-1.5 py-0.5 shrink-0">⌘K</kbd>
              )}
            </div>
          </div>

          {/* Subscribe */}
          <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-85"
            style={{ background: "#dc2626" }}>
            <Ico.YT /> Subscribe
          </a>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {section === "dashboard" && settings.showDashboard && (
            <DashboardView heroEnabled={settings.heroEnabled} />
          )}
          {section === "library" && (
            <LibraryView searchQuery={searchQuery} settings={settings} />
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";
import { channelConfig, CAT_EMOJI } from "@/lib/config";

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
// Prompt map for Pollinations — maps categories to vivid dark-tech prompts
const POLL_PROMPTS: Record<string, string> = {
  "AI/ML":          "neural network artificial intelligence dark abstract glowing blue circuits minimal tech",
  "AI Evaluation":  "AI testing metrics charts dashboard dark neon glow precision accuracy minimal",
  "AI Engineering": "vector database embeddings geometric nodes dark purple cyan minimal tech art",
  "AI Productivity":"workflow automation tools dark minimal neon glowing productivity tech abstract",
  "Python":         "python programming code dark green terminal minimal abstract tech illustration",
  "Algorithms":     "algorithm graph nodes tree dark purple minimal geometric abstract tech",
  "JavaScript":     "javascript code browser dark yellow neon minimal tech abstract react",
  "TypeScript":     "typescript code dark blue neon minimal abstract tech illustration",
  "System Design":  "system architecture microservices cloud dark minimal geometric tech illustration",
  "DevOps":         "kubernetes docker containers cloud dark minimal neon tech abstract",
  "React":          "react components UI dark cyan neon minimal abstract tech",
  "Docker":         "docker containers whale dark blue minimal tech abstract",
  "Database":       "database tables SQL dark orange neon minimal tech abstract",
  "Data Structures":"linked list binary tree stack dark minimal geometric abstract tech",
  "Machine Learning":"machine learning model training dark minimal neon abstract tech",
};

function seriesThumbnail(s: SeriesItem): string {
  if (s.youtube_id) return `https://i.ytimg.com/vi/${s.youtube_id}/mqdefault.jpg`;
  // Use Pollinations.ai for AI-generated thumbnails — free, no API key, CDN-cached
  const base   = POLL_PROMPTS[s.category] ?? `${s.category} tech dark minimal abstract`;
  const prompt = encodeURIComponent(`${base}, quiz question, high quality`);
  // Seed from series ID makes it deterministic (same series = same image always)
  const seed   = s.id % 9999;
  return `https://image.pollinations.ai/prompt/${prompt}?width=640&height=360&nologo=true&seed=${seed}`;
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
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
          style={{ opacity: 0 }}
          loading="lazy"
          onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; }}
        />

        {/* Always show overlays + badges (for both live and AI-thumbnail cards) */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 55%)" }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 40%)" }} />
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
        {!isLive && (
          <div className="absolute bottom-2.5 left-2.5">
            <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: "#451a0388", color: "#fbbf24", border: "1px solid #451a0360" }}>
              ⏳ Coming Soon
            </span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: isLive ? `${CYN}cc` : `${col.badge}cc`, boxShadow: `0 0 24px ${isLive ? CYN : col.badge}66` }}>
            {isLive
              ? <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              : <span className="text-lg">🔔</span>
            }
          </div>
        </div>
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
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: 0 }}
            loading="lazy"
            onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = "1"; }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/40 transition-colors">
            {isLive
              ? <svg className="w-4 h-4 opacity-0 group-hover/thumb:opacity-100 transition-opacity" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              : <span className="text-xs opacity-0 group-hover/thumb:opacity-100 transition-opacity">🔔</span>
            }
          </div>
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

// ── Mini Quiz Widget ───────────────────────────────────────────────────────────

interface QuizQ {
  id?:       string;
  cat:       string;
  diff:      string;
  q:         string;
  opts:      string[];
  ans:       number;
  exp:       string;
  type?:     "text" | "code";
  code?:     string;
  language?: string;
  live?:     boolean;   // true = from DB (actual series), false/undefined = static fallback
}

const LABELS       = ["A", "B", "C", "D"];
const LABEL_COLORS = ["#22d3ee", "#a855f7", "#4ade80", "#f472b6"];
// CAT_EMOJI is imported from @/lib/config — shared source of truth across all pages

const QUIZ_DIFFS = [
  { id: "All",          label: "All",       dot: "#94a3b8" },
  { id: "Beginner",     label: "Beginner",  dot: "#4ade80" },
  { id: "Intermediate", label: "Mid",       dot: "#fbbf24" },
  { id: "Advanced",     label: "Adv",       dot: "#f87171" },
];

function filterAndShuffle(qs: QuizQ[], cat: string, diff: string): number[] {
  let idx = qs.map((_, i) => i);
  if (cat  !== "All") idx = idx.filter((i) => qs[i].cat  === cat);
  if (diff !== "All") idx = idx.filter((i) => qs[i].diff === diff);
  if (idx.length === 0) idx = qs.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}

// ── Quiz Section: filter pickers live OUTSIDE the card ─────────────────────────
function QuizWidget() {
  const [allQs,      setAllQs]      = useState<QuizQ[]>([]);
  const [activeCat,  setActiveCat]  = useState("All");
  const [activeDiff, setActiveDiff] = useState("All");
  const [deck,       setDeck]       = useState<number[]>([]);
  const [step,       setStep]       = useState(0);
  const [chosen,     setChosen]     = useState<number | null>(null);
  const [score,      setScore]      = useState(0);
  const [roundDone,  setRoundDone]  = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/quiz")
      .then((r) => r.json())
      .then((d: { questions?: QuizQ[]; dailyFocus?: string }) => {
        const qs = d.questions ?? [];
        setAllQs(qs);
        // Pre-select today's daily focus category so the quiz feels fresh each day
        const focus = d.dailyFocus && d.dailyFocus !== "All" ? d.dailyFocus : "All";
        setActiveCat(focus);
        setDeck(filterAndShuffle(qs, focus, "All"));
      })
      .catch(() => {
        // On network error keep loading spinner removed, show empty state
        setAllQs([]);
        setDeck([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setDeck(filterAndShuffle(allQs, activeCat, activeDiff));
    setStep(0); setChosen(null); setScore(0); setRoundDone(false);
  }, [allQs, activeCat, activeDiff]);

  const total  = deck.length;
  const qi     = deck[Math.min(step, total - 1)] ?? 0;
  const q      = allQs[qi] ?? allQs[0];
  const catCol = getCatColor(q?.cat ?? "AI/ML");
  const qNum   = step + 1;

  // Dynamic category list derived from full pool — no hardcoding
  // Categories with any DB (live) question are marked as live
  const availCats = useMemo(() => {
    const seen = new Map<string, boolean>(); // cat → hasLive
    for (const qv of allQs) {
      if (!seen.has(qv.cat)) seen.set(qv.cat, false);
      if (qv.live) seen.set(qv.cat, true);
    }
    const cats = [...seen.entries()].map(([id, hasLive]) => ({
      id, emoji: CAT_EMOJI[id] ?? "💡", hasLive,
    }));
    return [{ id: "All", emoji: "🌐", hasLive: false }, ...cats];
  }, [allQs]);

  const cCount = (catId: string) => allQs.filter((qv) =>
    (catId === "All" || qv.cat === catId) && (activeDiff === "All" || qv.diff === activeDiff)
  ).length;
  const dCount = (diffId: string) => allQs.filter((qv) =>
    (activeCat === "All" || qv.cat === activeCat) && (diffId === "All" || qv.diff === diffId)
  ).length;

  function pick(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
    if (idx === q.ans) setScore((s) => s + 1);
    // Record stat (fire-and-forget)
    fetch("/api/quiz/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: q.id ?? `${q.cat}-${q.q.slice(0,20)}`, correct: idx === q.ans, cat: q.cat, diff: q.diff }),
    }).catch(() => {});
  }
  function next() {
    const nxt = step + 1;
    setChosen(null);
    if (nxt >= total) setRoundDone(true); else setStep(nxt);
  }
  function startNewRound() {
    setDeck(filterAndShuffle(allQs, activeCat, activeDiff));
    setStep(0); setChosen(null); setScore(0); setRoundDone(false);
  }

  return (
    <div>
      {/* ── Pickers: topic scroll + level row ── */}
      <div className="mb-3 space-y-2">

        {/* Topic pills — single scrollable row, no wrap */}
        <div className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" } as React.CSSProperties}>
          {availCats.map((c) => {
            const cnt      = cCount(c.id);
            const isActive = activeCat === c.id;
            const col      = c.id === "All" ? { text: "#e2e8f0", badge: "#334155" } : getCatColor(c.id);
            if (cnt === 0 && c.id !== "All") return null;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)}
                className="inline-flex items-center gap-1 rounded-lg text-[11px] font-bold transition-all duration-150 shrink-0"
                style={{
                  padding: "5px 11px",
                  background: isActive ? col.badge : "#0e0e1c",
                  color: isActive ? col.text : "#4b5563",
                  border: `1.5px solid ${isActive ? col.badge : "#1c1c2e"}`,
                  boxShadow: isActive ? `0 0 10px ${col.badge}40` : "none",
                }}>
                <span className="text-xs leading-none">{c.emoji}</span>
                <span className="font-black">{c.id === "All" ? "All" : c.id}</span>
                {c.hasLive && (
                  <span className="text-[8px] font-black px-1 py-0.5 rounded"
                    style={{ background: isActive ? "rgba(255,255,255,0.2)" : "#22d3ee18", color: isActive ? col.text : "#22d3ee" }}>
                    LIVE
                  </span>
                )}
                <span className="font-mono text-[9px]" style={{ opacity: isActive ? 0.65 : 0.3 }}>{cnt}</span>
              </button>
            );
          })}
        </div>

        {/* Level pills — compact single row */}
        <div className="flex items-center gap-1.5">
          {QUIZ_DIFFS.map((d) => {
            const cnt      = dCount(d.id);
            const isActive = activeDiff === d.id;
            if (cnt === 0 && d.id !== "All") return null;
            return (
              <button key={d.id} onClick={() => setActiveDiff(d.id)}
                className="inline-flex items-center gap-1.5 rounded-lg text-[11px] font-bold transition-all duration-150"
                style={{
                  padding: "5px 11px",
                  background: isActive ? `${d.dot}22` : "#0e0e1c",
                  color: isActive ? d.dot : "#4b5563",
                  border: `1.5px solid ${isActive ? d.dot : "#1c1c2e"}`,
                  boxShadow: isActive ? `0 0 8px ${d.dot}30` : "none",
                }}>
                {d.id !== "All" && (
                  <span className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: isActive ? d.dot : "#374151" }}/>
                )}
                <span className="font-black">{d.label}</span>
                <span className="font-mono text-[9px]" style={{ opacity: isActive ? 0.65 : 0.3 }}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quiz card ── */}
      <div className="rounded-2xl border overflow-hidden flex flex-col"
        style={{ background: "#0d0d1a", borderColor: "#1e1e30", boxShadow: "0 4px 40px rgba(168,85,247,0.15)" }}>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"/>
            <p className="text-xs text-slate-600">Loading questions…</p>
          </div>
        ) : allQs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
            <p className="text-2xl">🧩</p>
            <p className="text-sm font-bold text-slate-400">Questions loading…</p>
            <p className="text-xs text-slate-700">Check back in a moment.</p>
          </div>
        ) : roundDone ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-2">
            <div className="text-5xl mb-2">{score === total ? "🏆" : score >= Math.ceil(total * 0.7) ? "🎉" : "💪"}</div>
            <p className="text-lg font-black text-white">Round Complete!</p>
            <p className="text-sm text-slate-300 font-bold">{score}/{total} correct
              <span className="ml-2 font-mono text-xs px-2 py-0.5 rounded" style={{ background: "#4ade8015", color: "#4ade80" }}>
                {Math.round((score / total) * 100)}%
              </span>
            </p>
            <p className="text-xs text-slate-600 mb-4">
              {activeCat === "All" ? "All topics" : activeCat}{activeDiff !== "All" ? ` · ${activeDiff}` : ""}
            </p>
            <button onClick={startNewRound}
              className="px-7 py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-85 hover:scale-105"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff",
                boxShadow: "0 4px 20px rgba(168,85,247,0.35)" }}>
              Play Again →
            </button>
            <p className="text-[11px] text-slate-700 mt-1">Change area or level above to explore more</p>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "#1a1a28", background: "#09091550" }}>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-wider uppercase px-2.5 py-1 rounded-lg"
                  style={{ background: `${catCol.badge}35`, color: catCol.text, border: `1px solid ${catCol.badge}55` }}>
                  {q.cat}
                </span>
                <span className="text-xs font-bold" style={{ color: DIFF_COLOR[q.diff] ?? "#94a3b8" }}>
                  {q.diff}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {score > 0 && (
                  <span className="text-xs font-black font-mono px-2 py-0.5 rounded-lg"
                    style={{ background: "#4ade8018", color: "#4ade80", border: "1px solid #4ade8035" }}>
                    {score} ✓
                  </span>
                )}
                <span className="text-xs font-black font-mono" style={{ color: "#475569" }}>
                  Q {qNum}/{total}
                </span>
                <button onClick={startNewRound} title="Restart" aria-label="Restart round"
                  className="text-slate-700 hover:text-slate-400 transition-colors text-sm px-1">↺</button>
              </div>
            </div>

            {/* Code block */}
            {q.type === "code" && q.code && (
              <div className="mx-4 mt-3 rounded-xl overflow-hidden border" style={{ borderColor: "#1e3a5f", background: "#060c14" }}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b" style={{ borderColor: "#0e2040", background: "#0a1020" }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/70"/>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70"/>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/70"/>
                  <span className="text-[10px] font-mono text-slate-500 ml-1.5">{q.language ?? "code"}</span>
                </div>
                <pre className="text-xs leading-5 p-3.5 overflow-x-auto text-slate-300 font-mono whitespace-pre">{q.code}</pre>
              </div>
            )}

            {/* Question */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-base font-black text-white leading-snug">{q.q}</p>
              {chosen === null && (
                <p className="text-[11px] text-slate-600 mt-1.5">Pick the best answer</p>
              )}
            </div>

            {/* Options */}
            <div className="px-3 pb-3 flex flex-col gap-2">
              {q.opts.map((opt, i) => {
                const isCorrect = i === q.ans;
                const isChosen  = i === chosen;
                const revealed  = chosen !== null;
                const lColor    = LABEL_COLORS[i];
                let bg = "#111120", bord = "#1e1e2e", txt = "#cbd5e1";
                if (!revealed) {
                  // nothing extra
                } else if (isCorrect) {
                  bg = "#4ade8014"; bord = "#4ade8055"; txt = "#4ade80";
                } else if (isChosen) {
                  bg = "#f8717114"; bord = "#f8717155"; txt = "#f87171";
                } else {
                  bg = "#0a0a16"; bord = "#13131f"; txt = "#334155";
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={revealed}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
                    style={{ background: bg, border: `1px solid ${bord}`, color: txt,
                      cursor: revealed ? "default" : "pointer",
                      boxShadow: !revealed ? "none" : isCorrect ? "0 0 12px #4ade8020" : isChosen ? "0 0 12px #f8717120" : "none" }}>
                    <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                      style={{
                        background: revealed ? "transparent" : `${lColor}18`,
                        border: `2px solid ${revealed ? (isCorrect ? "#4ade80" : isChosen ? "#f87171" : "#1e1e2e") : lColor}`,
                        color:   revealed ? (isCorrect ? "#4ade80" : isChosen ? "#f87171" : "#334155") : lColor,
                      }}>
                      {LABELS[i]}
                    </span>
                    <span className="text-sm font-semibold leading-snug flex-1">{opt}</span>
                    {revealed && isCorrect && <span className="text-base shrink-0">✓</span>}
                    {revealed && isChosen && !isCorrect && <span className="text-base shrink-0">✗</span>}
                  </button>
                );
              })}
            </div>

            {/* Explanation + Next */}
            {chosen !== null && (
              <div className="px-4 pb-4 pt-1 space-y-2.5">
                <div className="rounded-xl px-4 py-3 text-xs leading-relaxed"
                  style={{ background: "#071410", border: "1px solid #4ade8025", color: "#94a3b8" }}>
                  <span className="font-black text-green-400">Why: </span>{q.exp}
                </div>
                <button onClick={next}
                  className="w-full py-2.5 rounded-xl text-sm font-black tracking-wide transition-all hover:opacity-85"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff",
                    boxShadow: "0 4px 16px rgba(168,85,247,0.3)" }}>
                  Next Question →
                </button>
              </div>
            )}
          </>
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
  const [allSeries,      setAllSeries]      = useState<SeriesItem[]>([]);
  const [apiStats,       setApiStats]       = useState<ApiStats | null>(null);
  const [siteSettings,   setSiteSettings]   = useState<SiteSettings | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [viewMode,       setViewMode]       = useState<"grid" | "table">("table");
  const [sortBy,         setSortBy]         = useState<SortBy>("newest");
  const [page,           setPage]           = useState(1);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [heroCat,        setHeroCat]        = useState("AI/ML"); // driven by daily focus from quiz API

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
    // Read daily focus to theme the hero section
    fetch("/api/quiz")
      .then((r) => r.json())
      .then((d: { dailyFocus?: string }) => { if (d.dailyFocus && d.dailyFocus !== "All") setHeroCat(d.dailyFocus); })
      .catch(() => {});
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

      {/* ── Hero section — compact 2-column ── */}
      {/* heroCat drives ambient glow colour + tagline */}
      {(() => {
        const hCol   = getCatColor(heroCat);
        const hEmoji = CAT_EMOJI[heroCat] ?? "🤖";
        // Pick a category-aware tagline
        const TAGLINES: Record<string, string> = {
          "AI/ML":           "RAG, embeddings, transformers & more —",
          "AI Productivity": "MCP servers, Claude workflows & automation —",
          "AI Evaluation":   "Benchmarks, evals, and model metrics —",
          "AI Engineering":  "Vector DBs, LLM ops & production AI —",
          "Python":          "Decorators, async, dataclasses & more —",
          "Algorithms":      "Big-O, trees, graphs & dynamic programming —",
          "JavaScript":      "Closures, promises, React & Next.js —",
          "System Design":   "APIs, caching, load balancing & more —",
          "DevOps":          "Docker, Kubernetes, CI/CD & more —",
        };
        const tagline = TAGLINES[heroCat] ?? "Python, AI, Algorithms & more —";
        return (
      <div className="relative overflow-hidden border-b" style={{ borderColor: BORD }}>
        {/* Ambient glows — tinted by today's category */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 left-0 w-80 h-48 rounded-full opacity-20 transition-all duration-1000"
            style={{ background: `radial-gradient(ellipse, ${hCol.badge} 0%, transparent 70%)`, filter: "blur(55px)" }}/>
          <div className="absolute bottom-0 right-0 w-80 h-48 rounded-full opacity-12 transition-all duration-1000"
            style={{ background: `radial-gradient(ellipse, ${hCol.text}88 0%, transparent 70%)`, filter: "blur(55px)" }}/>
        </div>

        <div className="relative px-6 py-6" style={{ maxWidth: 1440, margin: "0 auto" }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">

            {/* Left: branding + CTAs */}
            <div>
              {/* Daily focus chip + live badge */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black tracking-widest uppercase"
                  style={{ borderColor: "#22d3ee30", background: "#22d3ee0e", color: "#22d3ee" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"/>
                  New quiz every day
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all duration-500"
                  style={{ borderColor: `${hCol.badge}60`, background: `${hCol.badge}15`, color: hCol.text }}>
                  {hEmoji} Today: {heroCat}
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none mb-2">
                <span style={{
                  background: `linear-gradient(135deg, ${hCol.text} 0%, #a855f7 50%, #f472b6 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  transition: "all 0.5s",
                }}>
                  Test Your Tech
                </span>
                {" "}
                <span className="text-white">Knowledge Daily</span>
              </h1>

              {/* Tagline — category-aware */}
              <p className="text-sm text-slate-400 mb-3 leading-relaxed max-w-sm">
                {tagline}
                <br />60 seconds to sharpen your edge.
              </p>

              {/* Stats strip */}
              <div className="flex items-center gap-x-3 gap-y-1 mb-3 flex-wrap text-xs">
                {published > 0 && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="font-black" style={{ color: "#22d3ee" }}>{published}</span>
                      <span className="text-slate-600">Quizzes</span>
                    </span>
                    <span className="text-slate-800">·</span>
                  </>
                )}
                {dynCategories.length > 1 && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="font-black text-white">{dynCategories.length - 1}</span>
                      <span className="text-slate-600">Topics</span>
                    </span>
                    <span className="text-slate-800">·</span>
                  </>
                )}
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                  Daily uploads
                </span>
                <span className="text-slate-800">·</span>
                <span className="text-slate-600">Free</span>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white shadow-lg transition-all hover:scale-105 hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", boxShadow: "0 4px 16px #dc262630" }}>
                  <Ico.YT />Subscribe
                </a>
                <button onClick={() => { document.getElementById("video-grid")?.scrollIntoView({ behavior: "smooth" }); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105"
                  style={{ borderColor: "#22d3ee40", color: "#22d3ee", background: "#22d3ee0e" }}>
                  Browse Quizzes ↓
                </button>
              </div>

              {/* Category tags — scrollable single row */}
              <div className="flex gap-1.5 overflow-x-auto pb-1"
                style={{ scrollbarWidth: "none" } as React.CSSProperties}>
                {dynCategories
                  .filter((cat) => cat !== "All")
                  .map((cat) => {
                    const col = getCatColor(cat);
                    const cnt = apiStats?.categories.find((c) => c.name === cat)?.count ?? 0;
                    return (
                      <button key={cat} onClick={() => { handleCat(cat); document.getElementById("video-grid")?.scrollIntoView({ behavior: "smooth" }); }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all hover:scale-105 shrink-0"
                        style={{ borderColor: `${col.badge}50`, background: `${col.badge}12`, color: col.text }}>
                        {CAT_EMOJI[cat] ?? "💡"} {cat}
                        {cnt > 0 && <span className="font-mono text-[9px] opacity-50">{cnt}</span>}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Right: interactive quiz widget (visible on lg+, pickers are above the card) */}
            <div className="hidden lg:block">
              <QuizWidget />
            </div>
          </div>
        </div>
      </div>
        );
      })()}

      {/* ── Stats + Search strip ── */}
      <div className="border-b" style={{ borderColor: BORD, background: "#07071088" }}>
        <div className="flex items-center gap-3 px-6 py-2.5 overflow-x-auto"
          style={{ maxWidth: 1440, margin: "0 auto" }}>
          {showStats && published > 0 && (
            <>
              <span className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0" style={{ color: accent }}>
                <span className="font-black">{published}</span> Videos
              </span>
              <span className="text-slate-800 shrink-0">·</span>
              <span className="text-xs text-slate-600 whitespace-nowrap shrink-0">Daily quiz Shorts</span>
              <span className="text-slate-800 shrink-0">·</span>
            </>
          )}
          {/* Inline search */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-0 border flex-1 min-w-0 transition-colors"
            style={{ background: "#0d0d1a", borderColor: searchQuery ? `${accent}60` : "#1c1c2e",
              boxShadow: searchQuery ? `0 0 0 2px ${accent}10` : "none", height: 36 }}>
            <span style={{ color: searchQuery ? accent : "#374151", transition: "color 0.15s", flexShrink: 0 }}>
              <Ico.Search />
            </span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search — Python, RAG, binary search…"
              className="bg-transparent text-sm text-white placeholder-slate-700 outline-none flex-1 min-w-0" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-500 hover:text-white text-xs">✕</button>
            )}
          </div>
          <a href={channelConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-80 whitespace-nowrap"
            style={{ color: accent }}>
            <Ico.YT /> YouTube →
          </a>
        </div>
      </div>

      {/* ── Main content ── */}
      <main id="video-grid" style={{ maxWidth: 1440, margin: "0 auto", padding: "1rem 1.5rem", opacity: settingsLoaded ? 1 : 0, transition: "opacity 0.15s" }}>

        {/* Controls row: category pills | sort | view toggle */}
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">

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

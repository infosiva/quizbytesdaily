"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
const BG   = "#FAF9F6";
const CARD = "#FFFFFF";
const BORD = "#E8E0D5";
const CYN  = "#D97757"; // primary accent (orange-coral)

// ── Category colours — light-mode badges (dark text on light badge) ─────────────
const KNOWN_CAT: Record<string, { text: string; badge: string }> = {
  "Python":           { text: "#1d4ed8", badge: "#dbeafe" },
  "Algorithms":       { text: "#6d28d9", badge: "#ede9fe" },
  "JavaScript":       { text: "#92400e", badge: "#fef3c7" },
  "TypeScript":       { text: "#0369a1", badge: "#e0f2fe" },
  "AI/ML":            { text: "#0e7490", badge: "#cffafe" },
  "AI":               { text: "#0e7490", badge: "#cffafe" },
  "System Design":    { text: "#166534", badge: "#dcfce7" },
  "React":            { text: "#164e63", badge: "#cffafe" },
  "Docker":           { text: "#1e3a8a", badge: "#dbeafe" },
  "Database":         { text: "#7c2d12", badge: "#ffedd5" },
  "Machine Learning": { text: "#4c1d95", badge: "#f5f3ff" },
  "DevOps":           { text: "#064e3b", badge: "#d1fae5" },
  "Data Structures":  { text: "#831843", badge: "#fce7f3" },
};
const _FALLBACK = [
  { text: "#831843", badge: "#fce7f3" }, { text: "#7c2d12", badge: "#ffedd5" },
  { text: "#4c1d95", badge: "#f5f3ff" }, { text: "#064e3b", badge: "#d1fae5" },
  { text: "#0c4a6e", badge: "#e0f2fe" }, { text: "#713f12", badge: "#fef9c3" },
];
function getCatColor(name: string) {
  if (name in KNOWN_CAT) return KNOWN_CAT[name];
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return _FALLBACK[h % _FALLBACK.length];
}

const DIFF_COLOR: Record<string, string> = {
  Beginner: "#059669", Intermediate: "#B45309", Advanced: "#DC2626",
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function seriesUrl(s: SeriesItem): string {
  return s.youtube_url ?? channelConfig.youtubeUrl;
}
function seriesThumbnail(s: SeriesItem): string {
  // Always use the locally-generated thumbnail (clean dark design with bold title + ? mark).
  // This is consistent across all series regardless of YouTube thumbnail upload status.
  return `/api/thumbnail/${s.slug}/jpeg`;
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
  // Mark as "NEW" if published in last 10 days
  const isNew   = (Date.now() - new Date(series.created_at).getTime()) < 10 * 86_400_000;

  function handleShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = isLive ? url : `https://quizbytes.dev`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    const btn = e.currentTarget as HTMLButtonElement;
    const prev = btn.textContent;
    btn.textContent = "✓";
    setTimeout(() => { btn.textContent = prev; }, 1200);
  }

  return (
    <div className="group flex flex-col rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-1"
      style={{ background: CARD, borderColor: BORD, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${col.badge}80`;
        e.currentTarget.style.boxShadow   = `0 8px 24px rgba(0,0,0,0.10)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = BORD;
        e.currentTarget.style.boxShadow   = "0 2px 8px rgba(0,0,0,0.06)";
      }}>

      {/* Thumbnail */}
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="block relative overflow-hidden bg-[#F4F0EB]" style={{ aspectRatio: "16/9" }}>
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
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md uppercase"
            style={{ background: `${col.badge}ee`, color: col.text }}>
            {CAT_EMOJI[series.category] ?? "💡"} {series.category}
          </span>
          {isNew && (
            <span className="text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded-md uppercase animate-pulse"
              style={{ background: "#dcfce7", color: "#059669", border: "1px solid #bbf7d0" }}>
              NEW
            </span>
          )}
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
          <h3 className="text-[17px] font-extrabold text-[#1A1A18] leading-snug line-clamp-2 mb-2 transition-colors group-hover/title:text-[#D97757]">
            {series.title}
          </h3>
        </a>

        {series.topic && (
          <p className="text-[12px] text-[#6B6460] leading-relaxed line-clamp-2 mb-3 flex-1">
            {series.topic}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-[#9B9490] mb-3">
          <span className="flex items-center gap-1">
            <Ico.Cal />{fmtDate(series.created_at)}
          </span>
          {slides > 0 && (
            <>
              <span className="text-[#C8C2BB]">·</span>
              <span className="flex items-center gap-1">
                <Ico.Slides />{slides} slides
              </span>
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          {isLive ? (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] font-black tracking-widest uppercase transition-all hover:gap-3"
              style={{ color: col.text }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${col.badge}25`, border: `1px solid ${col.badge}60` }}>
                <Ico.Play />
              </span>
              Watch Short
            </a>
          ) : (
            <span className="flex items-center gap-2 text-[12px] font-black tracking-widest uppercase text-[#6B6460]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              Coming Soon
            </span>
          )}
          {/* Share button */}
          <button onClick={handleShare} title="Copy link"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-110 shrink-0"
            style={{ background: "#F4F0EB", color: "#9B9490", border: "1px solid #E8E0D5" }}>
            ↗
          </button>
        </div>
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
    <tr style={{ background: even ? "#F8F7F5" : "#FFFFFF" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "#F4F0EB"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = even ? "#F8F7F5" : "#FFFFFF"; }}>

      {/* Rank */}
      <td className="text-center font-mono text-[12px] font-bold text-[#9B9490] py-3 pl-4 pr-2" style={{ width: 36 }}>
        {rank}
      </td>

      {/* Thumbnail */}
      <td className="py-3 pr-3" style={{ width: 110 }}>
        <a href={url} target="_blank" rel="noopener noreferrer"
          className="group/thumb relative block overflow-hidden rounded-lg bg-[#F4F0EB]"
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
          <div className="text-[14px] font-bold text-[#1A1A18] group-hover/title:text-[#D97757] transition-colors leading-snug line-clamp-1">
            {series.title}
          </div>
        </a>
        {series.topic && (
          <div className="text-[11px] text-[#9B9490] mt-0.5 line-clamp-1">{series.topic}</div>
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
          <span className="text-[12px] font-mono font-bold text-[#6B6460]">{slides}</span>
        ) : (
          <span className="text-[12px] text-[#C8C2BB]">—</span>
        )}
      </td>

      {/* Date */}
      <td className="py-3 pr-4 hidden sm:table-cell whitespace-nowrap" style={{ width: 90 }}>
        <span className="text-[11px] font-mono text-[#9B9490]">{fmtDateShort(series.created_at)}</span>
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
          <span className="text-[10px] font-semibold px-2.5 py-1.5 rounded-lg text-amber-600"
            style={{ background: "#fef3c7", border: "1px solid #fde68a" }}>
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
const LABEL_COLORS = ["#2563EB", "#7C3AED", "#059669", "#DB2777"];
// CAT_EMOJI is imported from @/lib/config — shared source of truth across all pages

const QUIZ_DIFFS = [
  { id: "All",          label: "All",       dot: "#9B9490" },
  { id: "Beginner",     label: "Beginner",  dot: "#059669" },
  { id: "Intermediate", label: "Mid",       dot: "#B45309" },
  { id: "Advanced",     label: "Adv",       dot: "#DC2626" },
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
// ── Streak helpers (localStorage) ─────────────────────────────────────────────
function todayIso(): string { return new Date().toISOString().slice(0, 10); }
function loadStreak(): number {
  try {
    const raw = localStorage.getItem("qb_streak");
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw) as { date: string; count: number };
    const today = todayIso();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (date === today) return count;
    if (date === yesterday) return count; // carry over until they play today
    return 0;
  } catch { return 0; }
}
function recordStreak(): void {
  try {
    const today = todayIso();
    const raw = localStorage.getItem("qb_streak");
    if (raw) {
      const { date, count } = JSON.parse(raw) as { date: string; count: number };
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (date === today) return; // already recorded today
      const newCount = date === yesterday ? count + 1 : 1;
      localStorage.setItem("qb_streak", JSON.stringify({ date: today, count: newCount }));
    } else {
      localStorage.setItem("qb_streak", JSON.stringify({ date: today, count: 1 }));
    }
  } catch { /* ignore */ }
}

function QuizWidget({ onStreak }: { onStreak: (n: number) => void }) {
  const [allQs,        setAllQs]        = useState<QuizQ[]>([]);
  const [activeCat,    setActiveCat]    = useState("All");
  const [activeDiff,   setActiveDiff]   = useState("All");
  const [deck,         setDeck]         = useState<number[]>([]);
  const [step,         setStep]         = useState(0);
  const [chosen,       setChosen]       = useState<number | null>(null);
  const [score,        setScore]        = useState(0);
  const [roundDone,    setRoundDone]    = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [codeCountdown, setCodeCountdown] = useState<number | null>(null); // seconds before auto-reveal
  const [advanceIn,    setAdvanceIn]    = useState<number | null>(null);   // seconds before auto-advance

  // Stable refs so effects can always read the latest values without adding to effect deps
  const qRef      = useRef<QuizQ | null>(null);
  const stepRef   = useRef(0);
  const totalRef  = useRef(0);
  const chosenRef = useRef<number | null>(null);

  // Report streak to parent on mount
  useEffect(() => { onStreak(loadStreak()); }, [onStreak]);

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

  // Keep refs in sync every render so effects can read latest values safely
  qRef.current      = q ?? null;
  stepRef.current   = step;
  totalRef.current  = total;
  chosenRef.current = chosen;

  // ── Auto-reveal for code questions (10-second countdown before showing answer) ──
  useEffect(() => {
    if (!q || q.type !== "code" || chosen !== null || roundDone) {
      setCodeCountdown(null);
      return;
    }
    const SECS = 10;
    setCodeCountdown(SECS);
    let remaining = SECS;
    const interval = setInterval(() => {
      remaining -= 1;
      setCodeCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        // Timeout: reveal correct answer without recording a stat (user didn't answer)
        if (chosenRef.current === null) setChosen(qRef.current?.ans ?? 0);
      }
    }, 1000);
    return () => { clearInterval(interval); setCodeCountdown(null); };
  }, [step, q, chosen, roundDone]); // restarts when question changes, user picks, or round ends

  // ── Auto-advance after picking (3-second countdown then move to next) ─────────
  useEffect(() => {
    if (chosen === null || roundDone) { setAdvanceIn(null); return; }
    const SECS = 3;
    setAdvanceIn(SECS);
    let remaining = SECS;
    const interval = setInterval(() => {
      remaining -= 1;
      setAdvanceIn(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setAdvanceIn(null);
        // Advance to next or finish round
        const nxt = stepRef.current + 1;
        setChosen(null);
        if (nxt >= totalRef.current) setRoundDone(true); else setStep(nxt);
      }
    }, 1000);
    return () => { clearInterval(interval); setAdvanceIn(null); };
  }, [chosen, roundDone]); // restarts each time an answer is picked

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
    // Record streak and report updated value
    recordStreak();
    onStreak(loadStreak());
    // Record stat (fire-and-forget)
    fetch("/api/quiz/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: q.id ?? `${q.cat}-${q.q.slice(0,20)}`, correct: idx === q.ans, cat: q.cat, diff: q.diff }),
    }).catch(() => {});
  }
  function next() {
    const nxt = step + 1;
    setChosen(null); setCodeCountdown(null); setAdvanceIn(null);
    if (nxt >= total) setRoundDone(true); else setStep(nxt);
  }
  function startNewRound() {
    setDeck(filterAndShuffle(allQs, activeCat, activeDiff));
    setStep(0); setChosen(null); setScore(0); setRoundDone(false);
    setCodeCountdown(null); setAdvanceIn(null);
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
            const col      = c.id === "All" ? { text: "#1A1A18", badge: "#E8E0D5" } : getCatColor(c.id);
            if (cnt === 0 && c.id !== "All") return null;
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)}
                className="inline-flex items-center gap-1 rounded-lg text-[11px] font-bold transition-all duration-150 shrink-0"
                style={{
                  padding: "5px 11px",
                  background: isActive ? col.badge : "#F4F0EB",
                  color: isActive ? col.text : "#6B6460",
                  border: `1.5px solid ${isActive ? col.badge : "#E8E0D5"}`,
                  boxShadow: "none",
                }}>
                <span className="text-xs leading-none">{c.emoji}</span>
                <span className="font-black">{c.id === "All" ? "All" : c.id}</span>
                {c.hasLive && (
                  <span className="text-[8px] font-black px-1 py-0.5 rounded"
                    style={{ background: isActive ? "rgba(255,255,255,0.5)" : "#dbeafe", color: isActive ? col.text : "#1d4ed8" }}>
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
                  background: isActive ? `${d.dot}18` : "#F4F0EB",
                  color: isActive ? d.dot : "#6B6460",
                  border: `1.5px solid ${isActive ? d.dot : "#E8E0D5"}`,
                  boxShadow: "none",
                }}>
                {d.id !== "All" && (
                  <span className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: isActive ? d.dot : "#D1CEC9" }}/>
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
        style={{ background: CARD, borderColor: BORD, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-6 h-6 border-2 border-[#D97757]/30 border-t-[#D97757] rounded-full animate-spin"/>
            <p className="text-xs text-[#9B9490]">Loading questions…</p>
          </div>
        ) : allQs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-6 text-center">
            <p className="text-2xl">🧩</p>
            <p className="text-sm font-bold text-[#6B6460]">Questions loading…</p>
            <p className="text-xs text-[#9B9490]">Check back in a moment.</p>
          </div>
        ) : roundDone ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-2">
            <div className="text-5xl mb-2">{score === total ? "🏆" : score >= Math.ceil(total * 0.7) ? "🎉" : "💪"}</div>
            <p className="text-lg font-black text-[#1A1A18]">Round Complete!</p>
            <p className="text-sm text-[#1A1A18] font-bold">{score}/{total} correct
              <span className="ml-2 font-mono text-xs px-2 py-0.5 rounded" style={{ background: "#dcfce7", color: "#059669" }}>
                {Math.round((score / total) * 100)}%
              </span>
            </p>
            <p className="text-xs text-[#9B9490] mb-4">
              {activeCat === "All" ? "All topics" : activeCat}{activeDiff !== "All" ? ` · ${activeDiff}` : ""}
            </p>
            <button onClick={startNewRound}
              className="px-7 py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-85 hover:scale-105"
              style={{ background: "linear-gradient(135deg,#D97757,#C5653F)", color: "#fff",
                boxShadow: "0 4px 20px rgba(217,119,87,0.30)" }}>
              Play Again →
            </button>
            <button onClick={() => document.getElementById("question-bank")?.scrollIntoView({ behavior: "smooth" })}
              className="text-[11px] font-bold transition-colors hover:text-[#1A1A18] mt-1"
              style={{ color: CYN }}>
              Browse all Q&amp;A ↓
            </button>
          </div>
        ) : (
          <>
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: BORD, background: "#F8F7F5" }}>
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
                    style={{ background: "#dcfce7", color: "#059669", border: "1px solid #bbf7d0" }}>
                    {score} ✓
                  </span>
                )}
                <span className="text-xs font-black font-mono" style={{ color: "#9B9490" }}>
                  Q {qNum}/{total}
                </span>
                <button onClick={startNewRound} title="Restart" aria-label="Restart round"
                  className="text-[#9B9490] hover:text-[#6B6460] transition-colors text-sm px-1">↺</button>
              </div>
            </div>

            {/* Code block */}
            {q.type === "code" && q.code && (
              <div className="mx-4 mt-3 rounded-xl overflow-hidden border" style={{ borderColor: "#E8E0D5", background: "#F4F0EB" }}>
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b" style={{ borderColor: "#E8E0D5", background: "#EEEBE6" }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400"/>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"/>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                  <span className="text-[10px] font-mono text-[#9B9490] ml-1.5">{q.language ?? "code"}</span>
                  {chosen === null && codeCountdown !== null && (
                    <span className="ml-auto text-[10px] font-mono" style={{ color: codeCountdown <= 3 ? "#DC2626" : "#9B9490" }}>
                      answer reveals in {codeCountdown}s
                    </span>
                  )}
                </div>
                <pre className="text-xs leading-5 p-3.5 overflow-x-auto text-[#1A1A18] font-mono whitespace-pre">{q.code}</pre>
                {/* Countdown bar — depletes as timer ticks down */}
                {chosen === null && codeCountdown !== null && (
                  <div style={{ height: 3, background: "#E8E0D5" }}>
                    <div style={{
                      height: "100%",
                      width: `${(codeCountdown / 10) * 100}%`,
                      background: codeCountdown <= 3 ? "#DC2626" : "#D97757",
                      transition: "width 1s linear, background 0.3s",
                    }}/>
                  </div>
                )}
              </div>
            )}

            {/* Question */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-base font-black text-[#1A1A18] leading-snug">{q.q}</p>
              {chosen === null && (
                <p className="text-[11px] text-[#9B9490] mt-1.5">Pick the best answer</p>
              )}
            </div>

            {/* Options */}
            <div className="px-3 pb-3 flex flex-col gap-2">
              {q.opts.map((opt, i) => {
                const isCorrect = i === q.ans;
                const isChosen  = i === chosen;
                const revealed  = chosen !== null;
                const lColor    = LABEL_COLORS[i];
                let bg = "#FAFAF8", bord = "#E8E0D5", txt = "#1A1A18";
                if (!revealed) {
                  // nothing extra
                } else if (isCorrect) {
                  bg = "#dcfce7"; bord = "#86efac"; txt = "#059669";
                } else if (isChosen) {
                  bg = "#fee2e2"; bord = "#fca5a5"; txt = "#DC2626";
                } else {
                  bg = "#F8F7F5"; bord = "#E8E0D5"; txt = "#9B9490";
                }
                return (
                  <button key={i} onClick={() => pick(i)} disabled={revealed}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all"
                    style={{ background: bg, border: `1px solid ${bord}`, color: txt,
                      cursor: revealed ? "default" : "pointer",
                      boxShadow: "none" }}>
                    <span className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[11px] font-black"
                      style={{
                        background: revealed ? "transparent" : `${lColor}12`,
                        border: `2px solid ${revealed ? (isCorrect ? "#059669" : isChosen ? "#DC2626" : "#E8E0D5") : lColor}`,
                        color:   revealed ? (isCorrect ? "#059669" : isChosen ? "#DC2626" : "#9B9490") : lColor,
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
                  style={{ background: "#F0FDF4", border: "1px solid #bbf7d0", color: "#6B6460" }}>
                  <span className="font-black text-[#059669]">Why: </span>{q.exp}
                </div>
                <button onClick={next}
                  className="w-full py-2.5 rounded-xl text-sm font-black tracking-wide transition-all hover:opacity-85 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg,#D97757,#C5653F)", color: "#fff",
                    boxShadow: "0 4px 16px rgba(217,119,87,0.25)" }}>
                  {advanceIn !== null ? `Next in ${advanceIn}s →` : "Next Question →"}
                  {/* Auto-advance progress bar */}
                  {advanceIn !== null && (
                    <span className="absolute bottom-0 left-0 h-0.5 bg-white/40"
                      style={{ width: `${((3 - advanceIn) / 3) * 100}%`, transition: "width 1s linear" }}/>
                  )}
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
      <p className="text-base font-bold text-[#1A1A18] mb-1">No quizzes found</p>
      <p className="text-sm text-[#6B6460] max-w-xs">{message}</p>
    </div>
  );
}

// ── Question Bank Browser ─────────────────────────────────────────────────────
// Shows ALL questions in a browseable grid. Clicking a card reveals the answer.
function QuestionBrowser() {
  const [allQs,     setAllQs]     = useState<QuizQ[]>([]);
  const [activeCat, setActiveCat] = useState("All");
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/quiz")
      .then((r) => r.json())
      .then((d: { questions?: QuizQ[] }) => setAllQs(d.questions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cats = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = ["All"];
    for (const q of allQs) {
      if (!seen.has(q.cat)) { seen.add(q.cat); result.push(q.cat); }
    }
    return result;
  }, [allQs]);

  const filtered = activeCat === "All" ? allQs : allQs.filter((q) => q.cat === activeCat);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10">
        <div className="w-4 h-4 border-2 border-[#D97757]/30 border-t-[#D97757] rounded-full animate-spin"/>
        <span className="text-xs text-[#9B9490]">Loading questions…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5"
        style={{ scrollbarWidth: "none" } as React.CSSProperties}>
        {cats.map((cat) => {
          const isActive = activeCat === cat;
          const col      = cat === "All" ? { text: "#1A1A18", badge: "#E8E0D5" } : getCatColor(cat);
          const count    = cat === "All" ? allQs.length : allQs.filter((q) => q.cat === cat).length;
          return (
            <button key={cat}
              onClick={() => { setActiveCat(cat); setExpanded(null); }}
              className="inline-flex items-center gap-1.5 rounded-lg text-[11px] font-bold transition-all duration-150 shrink-0"
              style={{
                padding: "5px 12px",
                background: isActive ? col.badge : "#F4F0EB",
                color: isActive ? col.text : "#6B6460",
                border: `1.5px solid ${isActive ? col.badge : "#E8E0D5"}`,
                boxShadow: "none",
              }}>
              <span>{cat === "All" ? "🌐" : (CAT_EMOJI[cat] ?? "💡")}</span>
              <span className="font-black">{cat === "All" ? "All Topics" : cat}</span>
              <span className="font-mono text-[9px]" style={{ opacity: 0.55 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Questions grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "10px" }}>
        {filtered.map((q, idx) => {
          const id      = q.id ?? `q-${idx}`;
          const isOpen  = expanded === id;
          const col     = getCatColor(q.cat);
          return (
            <div key={id} className="rounded-xl border transition-all overflow-hidden"
              style={{
                background: CARD,
                borderColor: isOpen ? `${col.badge}80` : BORD,
                boxShadow: isOpen ? `0 2px 12px rgba(0,0,0,0.08)` : "none",
              }}>

              {/* Question row — click to toggle */}
              <button className="w-full text-left px-4 py-3.5 flex items-start justify-between gap-3"
                onClick={() => setExpanded(isOpen ? null : id)}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded"
                      style={{ background: `${col.badge}30`, color: col.text }}>
                      {CAT_EMOJI[q.cat] ?? "💡"} {q.cat}
                    </span>
                    <span className="text-[10px] font-bold"
                      style={{ color: DIFF_COLOR[q.diff] ?? "#94a3b8" }}>
                      {q.diff}
                    </span>
                    {q.live && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: "#dbeafe", color: "#1d4ed8" }}>LIVE</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#1A1A18] leading-snug">{q.q}</p>
                </div>
                <span className="shrink-0 text-xs mt-1 transition-colors"
                  style={{ color: isOpen ? col.text : "#9B9490" }}>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {/* Answer reveal */}
              {isOpen && (
                <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: BORD }}>
                  {q.type === "code" && q.code && (
                    <pre className="text-xs leading-5 px-3 py-2.5 mb-3 rounded-lg overflow-x-auto text-[#1A1A18] font-mono whitespace-pre"
                      style={{ background: "#F4F0EB", border: "1px solid #E8E0D5" }}>
                      {q.code}
                    </pre>
                  )}
                  <div className="flex flex-col gap-1.5 mb-3">
                    {q.opts.map((opt, i) => {
                      const isCorrect = i === q.ans;
                      return (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm"
                          style={{
                            background: isCorrect ? "#dcfce7" : "#F8F7F5",
                            border: `1px solid ${isCorrect ? "#86efac" : "#E8E0D5"}`,
                            color: isCorrect ? "#059669" : "#6B6460",
                          }}>
                          <span className="w-5 h-5 flex items-center justify-center rounded-full shrink-0 text-[10px] font-black"
                            style={{
                              border: `2px solid ${isCorrect ? "#059669" : "#E8E0D5"}`,
                              color: isCorrect ? "#059669" : "#9B9490",
                            }}>
                            {LABELS[i]}
                          </span>
                          <span className="flex-1 leading-snug">{opt}</span>
                          {isCorrect && <span className="text-xs shrink-0">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.exp && (
                    <div className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
                      style={{ background: "#F0FDF4", border: "1px solid #bbf7d0", color: "#6B6460" }}>
                      <span className="font-black text-[#059669]">Why: </span>{q.exp}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-10 text-xs text-[#9B9490]">No questions in this category yet — check back soon!</p>
      )}
    </div>
  );
}

// ── AdSense Ad Unit ───────────────────────────────────────────────────────────
// Slot IDs are set via NEXT_PUBLIC_ADSENSE_SLOT_1 / NEXT_PUBLIC_ADSENSE_SLOT_2 env vars.
// Without a slot ID the component renders nothing (Auto Ads still runs from layout.tsx).
function AdUnit({ slot }: { slot?: string }) {
  useEffect(() => {
    if (!slot) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch { /* noop */ }
  }, [slot]);
  if (!slot) return null;
  return (
    <div style={{ textAlign: "center", overflow: "hidden" }}>
      <ins className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-4237294630161176"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true" />
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
  const [streak,         setStreak]         = useState(0);

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
    <div className="min-h-screen" style={{ background: BG, color: "#1A1A18" }}>

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
                  style={{ borderColor: `${CYN}40`, background: `${CYN}10`, color: CYN }}>
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
                  background: `linear-gradient(135deg, ${CYN} 0%, ${hCol.text} 100%)`,
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  transition: "all 0.5s",
                }}>
                  Test Your Tech
                </span>
                {" "}
                <span className="text-[#1A1A18]">Knowledge Daily</span>
              </h1>

              {/* Tagline — category-aware */}
              <p className="text-sm text-[#6B6460] mb-3 leading-relaxed max-w-sm">
                {tagline}
                <br />60 seconds to sharpen your edge.
              </p>

              {/* Stats strip */}
              <div className="flex items-center gap-x-3 gap-y-1 mb-3 flex-wrap text-xs">
                {published > 0 && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="font-black" style={{ color: CYN }}>{published}</span>
                      <span className="text-[#9B9490]">Quizzes</span>
                    </span>
                    <span className="text-[#C8C2BB]">·</span>
                  </>
                )}
                {dynCategories.length > 1 && (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="font-black text-[#1A1A18]">{dynCategories.length - 1}</span>
                      <span className="text-[#9B9490]">Topic{dynCategories.length - 1 !== 1 ? "s" : ""}</span>
                    </span>
                    <span className="text-[#C8C2BB]">·</span>
                  </>
                )}
                <span className="flex items-center gap-1.5 text-[#9B9490]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shrink-0" />
                  Daily uploads
                </span>
                <span className="text-[#C8C2BB]">·</span>
                <span className="text-[#9B9490]">Free</span>
                {streak > 0 && (
                  <>
                    <span className="text-[#C8C2BB]">·</span>
                    <span className="flex items-center gap-1 font-bold" style={{ color: "#f97316" }}>
                      🔥 {streak} day{streak !== 1 ? "s" : ""} streak
                    </span>
                  </>
                )}
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
                  style={{ borderColor: `${CYN}50`, color: CYN, background: `${CYN}10` }}>
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

              {/* Feature highlight cards */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {([
                  { icon: "🎯", title: "Quiz + Answer", desc: "Instant explanations for every question", color: "#a855f7" },
                  { icon: "🔥", title: "Streak Mode",   desc: "Answer daily — build your winning streak", color: "#f97316" },
                  { icon: "📹", title: "Shorts Daily",  desc: "YouTube Short every day on @QuizBytesDaily", color: "#dc2626" },
                ] as const).map(({ icon, title, desc, color }) => (
                  <div key={title} className="rounded-xl p-3 border transition-all hover:border-opacity-60"
                    style={{ background: "#FAFAF8", borderColor: `${color}30` }}>
                    <div className="text-lg mb-1.5 leading-none">{icon}</div>
                    <div className="text-[11px] font-black leading-none mb-1" style={{ color }}>{title}</div>
                    <div className="text-[10px] leading-snug" style={{ color: "#6B6460" }}>{desc}</div>
                  </div>
                ))}
              </div>

              {/* Mobile quiz CTA — only below md (quiz is hidden on mobile in right col) */}
              <button onClick={() => { document.getElementById("mobile-quiz")?.scrollIntoView({ behavior: "smooth" }); }}
                className="lg:hidden mt-4 w-full py-2.5 rounded-xl text-sm font-black border transition-all hover:scale-105"
                style={{ borderColor: `${CYN}40`, color: CYN, background: `${CYN}10` }}>
                🧩 Play Quiz Now ↓
              </button>
            </div>

            {/* Right: interactive quiz widget (visible on lg+, pickers are above the card) */}
            <div className="hidden lg:block">
              <QuizWidget onStreak={setStreak} />
            </div>
          </div>
        </div>
      </div>
        );
      })()}

      {/* ── Mobile quiz (replaces right-column widget on small screens) ── */}
      <div id="mobile-quiz" className="lg:hidden border-b px-6 py-6"
        style={{ borderColor: BORD, background: CARD }}>
        <p className="text-sm font-black text-[#1A1A18] mb-3">🧩 Play the Quiz</p>
        <QuizWidget onStreak={setStreak} />
      </div>

      {/* ── Question Bank browser ── */}
      <div id="question-bank" className="border-b py-8 px-6"
        style={{ borderColor: BORD, background: BG }}>
        <div style={{ maxWidth: 1440, margin: "0 auto" }}>
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-[#1A1A18]">🧩 Question Bank</h2>
              <p className="text-xs mt-0.5" style={{ color: "#6B6460" }}>
                Browse all questions — click any card to reveal the answer &amp; explanation
              </p>
            </div>
          </div>
          <QuestionBrowser />
        </div>
      </div>

      {/* ── Ad unit: between hero and content ── */}
      {process.env.NEXT_PUBLIC_ADSENSE_SLOT_1 && (
        <div className="border-b py-3 px-6" style={{ borderColor: BORD, background: BG }}>
          <div style={{ maxWidth: 1440, margin: "0 auto" }}>
            <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_1} />
          </div>
        </div>
      )}

      {/* ── Stats + Search strip ── */}
      <div className="border-b" style={{ borderColor: BORD, background: "#F4F0EB" }}>
        <div className="flex items-center gap-3 px-6 py-2.5 overflow-x-auto"
          style={{ maxWidth: 1440, margin: "0 auto" }}>
          {showStats && published > 0 && (
            <>
              <span className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap shrink-0" style={{ color: accent }}>
                <span className="font-black">{published}</span> Videos
              </span>
              <span className="text-[#C8C2BB] shrink-0">·</span>
              <span className="text-xs text-[#9B9490] whitespace-nowrap shrink-0">Daily quiz Shorts</span>
              <span className="text-[#C8C2BB] shrink-0">·</span>
            </>
          )}
          {/* Inline search */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-0 border flex-1 min-w-0 transition-colors"
            style={{ background: CARD, borderColor: searchQuery ? `${accent}60` : BORD,
              boxShadow: searchQuery ? `0 0 0 2px ${accent}10` : "none", height: 36 }}>
            <span style={{ color: searchQuery ? accent : "#9B9490", transition: "color 0.15s", flexShrink: 0 }}>
              <Ico.Search />
            </span>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search — Python, RAG, binary search…"
              className="bg-transparent text-sm text-[#1A1A18] placeholder-[#C8C2BB] outline-none flex-1 min-w-0" />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}
                className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/5 text-[#9B9490] hover:text-[#1A1A18] text-xs">✕</button>
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
              const cnt    = cat === "All" ? allSeries.length : (apiStats?.categories.find(c => c.name === cat)?.count ?? 0);
              return (
                <button key={cat} onClick={() => handleCat(cat)}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-xl border transition-all"
                  style={active
                    ? cat === "All"
                      ? { background: accent, borderColor: accent, color: "#000" }
                      : { background: col.badge, borderColor: col.badge, color: col.text, boxShadow: `0 0 12px ${col.badge}40` }
                    : { background: "transparent", borderColor: BORD, color: "#9B9490" }}>
                  {cat !== "All" && <span>{CAT_EMOJI[cat] ?? "💡"}</span>}
                  {cat === "All" ? "All" : cat}
                  <span className="font-mono text-[10px] opacity-60">{cnt}</span>
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Sort dropdown */}
            <div className="flex items-center gap-1.5 text-[#9B9490]">
              <Ico.Sort />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="text-[12px] font-semibold outline-none rounded-xl border px-2.5 py-1.5 appearance-none cursor-pointer transition-colors"
                style={{ background: CARD, borderColor: BORD, color: "#9B9490", minWidth: 130 }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
                <option value="category">By Category</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 rounded-xl border p-1"
              style={{ borderColor: BORD, background: "#F4F0EB" }}>
              <button onClick={() => setViewMode("table")} className="p-2 rounded-lg transition-all"
                title="Table view"
                style={viewMode === "table" ? { background: `${accent}20`, color: accent } : { color: "#9B9490" }}>
                <Ico.Table />
              </button>
              <button onClick={() => setViewMode("grid")} className="p-2 rounded-lg transition-all"
                title="Grid view"
                style={viewMode === "grid" ? { background: `${accent}20`, color: accent } : { color: "#9B9490" }}>
                <Ico.Grid />
              </button>
            </div>
          </div>
        </div>

        {/* Ad unit: above content grid */}
        <AdUnit slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_2} />

        {/* Results count */}
        {(searchQuery || activeCategory !== "All") && filtered.length > 0 && (
          <p className="text-sm text-[#6B6460] mb-4">
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
                <tr style={{ background: "#F4F0EB", borderBottom: `1px solid ${BORD}` }}>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-[#6B6460] py-2.5 pl-4 pr-2" style={{ width: 36 }}>#</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-[#6B6460] py-2.5 pr-3" style={{ width: 110 }}>Thumb</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-[#6B6460] py-2.5 pr-4">Title</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-[#6B6460] py-2.5 pr-4 hidden sm:table-cell" style={{ width: 130 }}>Category</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-[#6B6460] py-2.5 pr-4 hidden md:table-cell" style={{ width: 110 }}>Difficulty</th>
                  <th className="text-center text-[10px] font-black uppercase tracking-widest text-[#6B6460] py-2.5 pr-4 hidden lg:table-cell" style={{ width: 70 }}>Slides</th>
                  <th className="text-left text-[10px] font-black uppercase tracking-widest text-[#6B6460] py-2.5 pr-4 hidden sm:table-cell" style={{ width: 90 }}>Date</th>
                  <th className="text-right text-[10px] font-black uppercase tracking-widest text-[#6B6460] py-2.5 pr-4" style={{ width: 120 }}>Watch</th>
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
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#9B9490] hover:text-[#1A1A18] transition-colors disabled:opacity-30"
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
                  : { background: CARD, color: "#9B9490", border: `1px solid ${BORD}` }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#9B9490] hover:text-[#1A1A18] transition-colors disabled:opacity-30"
              style={{ background: CARD, border: `1px solid ${BORD}` }}>→</button>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t mt-16" style={{ borderColor: BORD, background: "#F4F0EB" }}>
        <div className="px-6 py-10" style={{ maxWidth: 1440, margin: "0 auto" }}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">

            {/* Brand column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg font-black" style={{ color: accent }}>QuizBytes Daily</span>
              </div>
              <p className="text-xs leading-relaxed mb-4" style={{ color: "#6B6460" }}>
                Bite-sized tech quiz Shorts every day. Python, AI/ML, Algorithms, System Design — sharpen your edge in 60 seconds.
              </p>
              <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-85"
                style={{ background: "#dc2626" }}>
                <Ico.YT /> Subscribe on YouTube
              </a>
            </div>

            {/* Topics column */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: "#9B9490" }}>Topics</p>
              <div className="flex flex-wrap gap-1.5">
                {(apiStats?.categories ?? []).slice(0, 10).map((c) => {
                  const col = getCatColor(c.name);
                  return (
                    <button key={c.name}
                      onClick={() => { handleCat(c.name); document.getElementById("video-grid")?.scrollIntoView({ behavior: "smooth" }); }}
                      className="text-[11px] px-2 py-0.5 rounded-md transition-colors hover:opacity-80"
                      style={{ background: `${col.badge}20`, color: col.text, border: `1px solid ${col.badge}30` }}>
                      {CAT_EMOJI[c.name] ?? "💡"} {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats column */}
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest mb-3" style={{ color: "#9B9490" }}>Stats</p>
              <div className="space-y-1.5">
                {published > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-[#1A1A18]">{published}</span>
                    <span style={{ color: "#6B6460" }}>quizzes published</span>
                  </div>
                )}
                {(dynCategories.length - 1) > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-black text-[#1A1A18]">{dynCategories.length - 1}</span>
                    <span style={{ color: "#6B6460" }}>topic categories</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block shrink-0" />
                  <span style={{ color: "#6B6460" }}>New quiz every day</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-black text-[#1A1A18]">Free</span>
                  <span style={{ color: "#6B6460" }}>forever — no signup needed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pt-6"
            style={{ borderTop: `1px solid ${BORD}` }}>
            <p className="text-[11px]" style={{ color: "#9B9490" }}>
              © {new Date().getFullYear()} QuizBytes Daily · quizbytes.dev
            </p>
            <div className="flex items-center gap-4 text-[11px]" style={{ color: "#9B9490" }}>
              <a href={channelConfig.youtubeUrl} target="_blank" rel="noopener noreferrer"
                className="hover:text-[#1A1A18] transition-colors flex items-center gap-1">
                <Ico.YT /> YouTube
              </a>
              <a href="/about" className="hover:text-[#1A1A18] transition-colors">About</a>
              <a href="/privacy" className="hover:text-[#1A1A18] transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-[#1A1A18] transition-colors">Terms</a>
              <a href="https://quizbytes.dev" className="hover:text-[#1A1A18] transition-colors">quizbytes.dev</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

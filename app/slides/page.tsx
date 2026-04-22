"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ALL_SERIES, COLORS } from "@/lib/slides";
import type { QuizSlide, SlideCard, CardColor } from "@/lib/slides";
import { channelConfig } from "@/lib/config";

// ── DB series metadata ────────────────────────────────────────────────────────
interface DbSeriesMeta {
  id: number; slug: string; title: string; category: string; difficulty: string; slide_count?: number;
}

// ── Unified series — both static and AI-generated use QuizSlide[] ─────────────
interface UnifiedSeries {
  id: string; label: string; isDb: boolean; dbId?: number;
  slides: QuizSlide[];
}

// ── Convert raw API slide row to QuizSlide ────────────────────────────────────
function rawToQuizSlide(
  raw: { template: string; data: Record<string, unknown>; position?: number },
  slug: string,
  idx: number,
  total: number
): QuizSlide {
  const d = raw.data;
  const newTemplates = ["definition-steps", "pipeline", "cta"] as const;
  const template = newTemplates.includes(raw.template as typeof newTemplates[number])
    ? (raw.template as QuizSlide["template"])
    : "definition-steps";

  return {
    id: `${slug}-${idx}`,
    handle: "@QuizBytesDaily",
    template,
    heading: (d.heading as string) ?? raw.template,
    subtitle: d.subtitle as string | undefined,
    slideNum: (d.slideNum as number) ?? idx + 1,
    totalSlides: (d.totalSlides as number) ?? total,
    definition: d.definition as QuizSlide["definition"] | undefined,
    cards: (d.cards as SlideCard[]) ?? [],
  };
}

// ── Slide canvas ──────────────────────────────────────────────────────────────
const W = 360;
const H = 640;

// ── SVG icon library ──────────────────────────────────────────────────────────
function SlideIcon({ name, color, size = 38 }: { name: string; color: string; size?: number }) {
  const s = { width: size, height: size, flexShrink: 0 } as React.CSSProperties;
  switch (name) {
    case "search": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
      </svg>
    );
    case "gear": return (
      <svg style={s} viewBox="0 0 24 24" fill={color}>
        <path d="M12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zm7.43-1.47c.04-.32.07-.64.07-.97s-.03-.66-.07-1l2.11-1.64a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1a7.37 7.37 0 0 0-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.65a7.37 7.37 0 0 0-1.69.98l-2.49-1a.5.5 0 0 0-.61.22L2.37 8.73a.49.49 0 0 0 .12.64L4.57 11c-.04.33-.07.66-.07 1s.03.65.07.97l-2.11 1.66a.49.49 0 0 0-.12.64l2 3.46c.12.22.38.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65a7.37 7.37 0 0 0 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46a.49.49 0 0 0-.12-.64l-2.11-1.66z" />
      </svg>
    );
    case "database": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" />
        <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" />
      </svg>
    );
    case "book": return (
      <svg style={s} fill={color} viewBox="0 0 24 24">
        <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
      </svg>
    );
    case "brain": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M9.5 2a2.5 2.5 0 0 0-2.45 2H6a3 3 0 0 0-3 3 3 3 0 0 0 1.5 2.6A3 3 0 0 0 6 14h.05A2.5 2.5 0 0 0 9.5 16h5a2.5 2.5 0 0 0 3.45-1H18a3 3 0 0 0 1.5-5.6A3 3 0 0 0 18 4h-1.05A2.5 2.5 0 0 0 14.5 2h-5z" />
        <path d="M12 2v14M8 7h1M15 7h1M8 11h1M15 11h1" />
      </svg>
    );
    case "robot": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="7" y="8" width="10" height="10" rx="2" />
        <path d="M12 8V6" /><circle cx="12" cy="5.5" r="1.5" />
        <circle cx="9.5" cy="12.5" r="1" fill={color} stroke="none" />
        <circle cx="14.5" cy="12.5" r="1" fill={color} stroke="none" />
        <path d="M9.5 17h5M5 11h2M17 11h2" />
      </svg>
    );
    case "plus": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12h14" />
      </svg>
    );
    case "book2":
    case "gift": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M21 8H3V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2z" />
        <path d="M12 21V8M12 8H7.5a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8zM12 8h4.5a2.5 2.5 0 0 0 0-5C13 3 12 8 12 8z" />
      </svg>
    );
    case "lock": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 1 1 8 0v4" />
        <circle cx="12" cy="16" r="1" fill={color} stroke="none" />
      </svg>
    );
    case "lightning": return (
      <svg style={s} fill={color} viewBox="0 0 24 24">
        <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
      </svg>
    );
    case "check": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    );
    case "warning": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="17" r="0.5" fill={color} />
      </svg>
    );
    case "trend_down": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" />
      </svg>
    );
    case "trend_up": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
      </svg>
    );
    case "bar_chart": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" viewBox="0 0 24 24">
        <rect x="3" y="12" width="4" height="9" fill={color} stroke="none" opacity={0.7} />
        <rect x="10" y="7"  width="4" height="14" fill={color} stroke="none" />
        <rect x="17" y="3"  width="4" height="18" fill={color} stroke="none" opacity={0.5} />
      </svg>
    );
    /* ── New icons ── */
    case "clock": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 15.5" />
      </svg>
    );
    case "code": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    );
    case "layers": return (
      <svg style={s} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    );
    /* ── Quiz option circles (A B C D) ── */
    case "opt_a": return (
      <svg style={s} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={1.8} />
        <text x="12" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily="system-ui,sans-serif">A</text>
      </svg>
    );
    case "opt_b": return (
      <svg style={s} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={1.8} />
        <text x="12" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily="system-ui,sans-serif">B</text>
      </svg>
    );
    case "opt_c": return (
      <svg style={s} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={1.8} />
        <text x="12" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily="system-ui,sans-serif">C</text>
      </svg>
    );
    case "opt_d": return (
      <svg style={s} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth={1.8} />
        <text x="12" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill={color} fontFamily="system-ui,sans-serif">D</text>
      </svg>
    );
    default:
      return <span style={{ fontSize: size * 0.72, lineHeight: "1", display: "block" }}>{name}</span>;
  }
}

// ── Gradient text helper (heading only) ───────────────────────────────────────
const HEADING_GRAD: React.CSSProperties = {
  background: "linear-gradient(135deg, #22d3ee 0%, #60a5fa 65%, #a5f3fc 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

// ── Definition box ────────────────────────────────────────────────────────────
function DefinitionBox({ title, body, color }: { title: string; body: string; color: CardColor }) {
  const c = COLORS[color];
  return (
    <div style={{ border: `1px solid ${c.border}`, background: c.bg, borderRadius: 12, padding: "14px 18px", textAlign: "center" }}>
      <p style={{ color: c.text, fontSize: 15, fontWeight: 700, marginBottom: 7, lineHeight: 1.35 }}>{title}</p>
      <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

// ── Step / flow card ──────────────────────────────────────────────────────────
function StepCard({ card, compact }: { card: SlideCard; compact: boolean }) {
  const c = COLORS[card.color];
  const iconSize = compact ? 30 : 36;
  return (
    <div style={{
      border: `1px solid ${c.border}`, background: c.bg, borderRadius: 11,
      padding: compact ? "9px 13px" : "11px 15px",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <SlideIcon name={card.icon} color={c.text} size={iconSize} />
      <div style={{ minWidth: 0 }}>
        <p style={{ color: c.text, fontSize: compact ? 13 : 14.5, fontWeight: 700, lineHeight: 1.25 }}>{card.title}</p>
        {card.body.trim() && (
          <p style={{ fontSize: compact ? 11 : 12, color: "#94a3b8", marginTop: 2, lineHeight: 1.35 }}>{card.body}</p>
        )}
      </div>
    </div>
  );
}

// ── Arrow between flow cards ──────────────────────────────────────────────────
function Arrow({ color }: { color: CardColor }) {
  return (
    <div style={{ textAlign: "center", height: 16, lineHeight: "16px", color: COLORS[color].text, fontSize: 12, opacity: 0.8 }}>▼</div>
  );
}

// ── CTA slide ─────────────────────────────────────────────────────────────────
function CtaSlide({ slide }: { slide: QuizSlide }) {
  return (
    <div style={{
      width: W, height: H,
      background: "linear-gradient(160deg, #0d0d20 0%, #09091a 100%)",
      borderRadius: 20, padding: "36px 28px 28px",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      overflow: "hidden", boxSizing: "border-box", position: "relative", textAlign: "center",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "absolute", top: -60, left: -60, width: 240, height: 240, background: "#a855f718", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -60, right: -60, width: 240, height: 240, background: "#22d3ee10", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

      {/* Big emoji */}
      <div style={{ fontSize: 64, marginBottom: 18, position: "relative" }}>🎉</div>

      {/* Heading */}
      <h1 style={{ ...HEADING_GRAD, fontSize: 30, fontWeight: 900, lineHeight: 1.2, margin: 0, position: "relative" }}>
        {slide.heading}
      </h1>
      <p style={{ fontSize: 13, color: "#64748b", marginTop: 8, marginBottom: 32, position: "relative" }}>
        New quiz every day — subscribe so you never miss one
      </p>

      {/* Subscribe CTA */}
      <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
        style={{
          display: "block", width: "100%", padding: "14px 0", borderRadius: 14,
          background: "#a855f7", color: "#fff", fontWeight: 800, fontSize: 15,
          textDecoration: "none", position: "relative",
          boxShadow: "0 0 28px rgba(168,85,247,0.45)",
        }}>
        ▶ Subscribe on YouTube
      </a>

      {/* Divider */}
      <div style={{ height: 1, width: "60%", background: "#1e1e2e", margin: "22px 0", position: "relative" }} />

      {/* Website link */}
      <p style={{ fontSize: 11.5, color: "#475569", marginBottom: 6, position: "relative" }}>
        Browse all quizzes at
      </p>
      <p style={{
        fontSize: 16, fontWeight: 700, color: "#22d3ee",
        fontFamily: "monospace", letterSpacing: "0.01em", position: "relative",
      }}>
        {channelConfig.websiteUrl.replace("https://", "")}
      </p>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 20px" }}>
        <span style={{ fontSize: 11.5, color: "#374151", fontWeight: 500 }}>{slide.handle ?? channelConfig.handle}</span>
        <span style={{ fontSize: 19, fontWeight: 700, color: "#374151", fontFamily: "monospace" }}>
          {slide.slideNum}/{slide.totalSlides}
        </span>
      </div>
    </div>
  );
}

// ── Full slide renderer ───────────────────────────────────────────────────────
function SlideRenderer({ slide }: { slide: QuizSlide }) {
  if (slide.template === "cta") return <CtaSlide slide={slide} />;

  const isPipeline = slide.template === "pipeline";
  const compact = isPipeline && slide.cards.length >= 5;

  return (
    <div style={{
      width: W, height: H,
      background: "linear-gradient(160deg, #0d0d20 0%, #09091a 100%)",
      borderRadius: 20, padding: "26px 20px 18px",
      display: "flex", flexDirection: "column",
      overflow: "hidden", boxSizing: "border-box", position: "relative",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "absolute", top: -50, left: -50, width: 200, height: 200, background: "#a855f712", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -50, right: -50, width: 200, height: 200, background: "#22d3ee0e", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />

      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: compact ? 9 : 13, position: "relative" }}>
        <h1 style={{ ...HEADING_GRAD, fontSize: compact ? 24 : 28, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.4px", margin: 0 }}>
          {slide.heading}
        </h1>
        {slide.subtitle && (
          <p style={{ fontSize: 11.5, color: "#475569", marginTop: 4 }}>{slide.subtitle}</p>
        )}
      </div>

      {/* Cards area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: compact ? 0 : 7, position: "relative" }}>
        {/* Definition box (definition-steps only) */}
        {!isPipeline && slide.definition && (
          <div style={{ marginBottom: 7 }}>
            <DefinitionBox title={slide.definition.title} body={slide.definition.body} color={slide.definition.color} />
          </div>
        )}

        {/* Cards */}
        {slide.cards.map((card, i) => (
          <div key={i}>
            {isPipeline && i > 0 && <Arrow color={slide.cards[i - 1].color} />}
            <StepCard card={card} compact={compact} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginTop: 12, paddingTop: 10, borderTop: "1px solid #1e1e2e", position: "relative",
      }}>
        <span style={{ fontSize: 11.5, color: "#374151", fontWeight: 500 }}>{slide.handle ?? "@QuizBytesDaily"}</span>
        <span style={{ fontSize: 19, fontWeight: 700, color: "#374151", fontFamily: "monospace" }}>
          {slide.slideNum}/{slide.totalSlides}
        </span>
      </div>
    </div>
  );
}

// ── Auto-play interval (ms per slide) ─────────────────────────────────────────
const INTERVAL = 8000;

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SlidesPage() {
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [slideIdx, setSlideIdx]   = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [dbSeriesList, setDbSeriesList] = useState<DbSeriesMeta[]>([]);
  const [dbSlidesCache, setDbSlidesCache] = useState<Record<number, QuizSlide[]>>({});
  const [slideScale, setSlideScale] = useState(1);

  // Static series
  const staticUnified: UnifiedSeries[] = ALL_SERIES.map((s) => ({
    id: s.id, label: s.label, isDb: false, slides: s.slides,
  }));

  // DB series — AI-generated, converted to QuizSlide[] for uniform rendering
  const dbUnified: UnifiedSeries[] = dbSeriesList.map((s) => ({
    id: `db-${s.id}`, label: s.title, isDb: true, dbId: s.id,
    slides: dbSlidesCache[s.id] ?? [],
  }));

  const allSeries: UnifiedSeries[] = [...staticUnified, ...dbUnified];
  const series  = allSeries[seriesIdx] ?? allSeries[0];
  const total   = series.slides.length;
  const isLast  = slideIdx === total - 1;

  // Fetch DB series list on mount
  useEffect(() => {
    fetch("/api/admin/series")
      .then((r) => r.json())
      .then((j) => setDbSeriesList(j.series ?? []))
      .catch(() => {/* silently ignore if DB not available */});
  }, []);

  // Responsive slide scaling — shrink the 360×640 slide preview on small screens
  useEffect(() => {
    const update = () => {
      const available = window.innerWidth - 80; // subtract nav/padding
      setSlideScale(Math.min(1, available / W));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Fetch + convert DB slides when a DB series is selected
  const fetchDbSlides = useCallback(async (dbId: number, slug: string) => {
    if (dbSlidesCache[dbId]) return;
    try {
      const res  = await fetch(`/api/admin/series/${dbId}`);
      const json = await res.json();
      const rawSlides: Array<{ template: string; data: Record<string, unknown>; position: number }> =
        json.slides ?? [];
      const converted = rawSlides.map((s, i) =>
        rawToQuizSlide(s, slug, i, rawSlides.length)
      );
      setDbSlidesCache((c) => ({ ...c, [dbId]: converted }));
    } catch { /* ignore */ }
  }, [dbSlidesCache]);

  function changeSeries(idx: number) {
    setSeriesIdx(idx);
    setSlideIdx(0);
    setIsPlaying(false);
    const s = allSeries[idx];
    if (s?.isDb && s.dbId) {
      const meta = dbSeriesList.find((m) => m.id === s.dbId);
      fetchDbSlides(s.dbId, meta?.slug ?? `db-${s.dbId}`);
    }
  }

  function prev() { setSlideIdx((i) => Math.max(0, i - 1)); }
  function next() { setSlideIdx((i) => Math.min(total - 1, i + 1)); }
  function togglePlay() { setIsPlaying((p) => !p); }

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setSlideIdx((i) => {
        if (i >= total - 1) { setIsPlaying(false); return i; }
        return i + 1;
      });
    }, INTERVAL);
    return () => clearInterval(id);
  }, [isPlaying, slideIdx, total]);

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft")  prev();
    if (e.key === "ArrowRight") next();
    if (e.key === " ") { e.preventDefault(); togglePlay(); }
  }

  // All series now use the unified QuizSlide[]
  const currentSlide = series.slides[slideIdx] ?? null;

  const isQuiz   = currentSlide?.heading.includes("Quiz") ?? false;
  const isAnswer = currentSlide?.heading.includes("Answer") ?? false;
  const isCta    = currentSlide?.template === "cta";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#08080f", color: "#e2e8f0" }}
      onKeyDown={onKey} tabIndex={-1}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b shrink-0"
        style={{ borderColor: "#1e1e2e", background: "#09090f" }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-slate-500 hover:text-white transition-colors">← Dashboard</Link>
          <span style={{ color: "#1e1e2e" }}>|</span>
          <span className="text-sm font-bold text-white">Slide Preview</span>
        </div>
        <p className="text-xs text-slate-600 hidden sm:block">
          Edit <code className="text-purple-400 bg-purple-500/10 px-1 rounded">lib/slides.ts</code> to add your own content
        </p>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-8 px-6 py-8">

        {/* Left panel — series + slide selector */}
        <div className="lg:w-52 shrink-0 space-y-4">
          {/* Series tabs */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-2">
              Series <span className="text-purple-600 normal-case font-normal">({allSeries.length})</span>
            </p>
            <div className="flex flex-col gap-1">
              {allSeries.map((s, i) => (
                <button key={s.id} onClick={() => changeSeries(i)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-all border"
                  style={seriesIdx === i
                    ? { background: "#a855f718", borderColor: "#a855f755", color: "#c084fc" }
                    : { background: "transparent", borderColor: "#1e1e2e", color: "#64748b" }}>
                  {s.label}
                  <span className="ml-1.5 text-[9px] font-mono opacity-60">
                    {s.slides.length || (s.isDb ? "…" : "0")} slides
                  </span>
                  {s.isDb && (
                    <span className="ml-1 text-[8px] font-bold px-1 rounded" style={{ background: "#22d3ee18", color: "#22d3ee" }}>AI</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Slide list */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600 mb-2">Slides</p>
            <div className="flex flex-col gap-1">
              {series.slides.length === 0 && series.isDb && (
                <p className="text-[10px] text-slate-600 px-3 py-2">Loading…</p>
              )}
              {series.slides.map((s, i) => {
                const isQ = s.heading.includes("Quiz");
                const isA = s.heading.includes("Answer");
                const icon = s.template === "cta" ? "🎉 "
                           : isQ ? "🎯 "
                           : isA ? "✅ "
                           : s.template === "pipeline" ? "⬇ "
                           : "📋 ";
                return (
                  <button key={s.id} onClick={() => setSlideIdx(i)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all border"
                    style={slideIdx === i
                      ? { background: "#a855f718", borderColor: "#a855f755", color: "#e2e8f0" }
                      : { background: "transparent", borderColor: "#1e1e2e", color: "#475569" }}>
                    <span className="font-mono mr-1.5" style={{ color: slideIdx === i ? "#a855f7" : "#374151" }}>{i + 1}.</span>
                    {icon}{s.template === "cta" ? "Subscribe CTA" : s.heading}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Centre — slide preview */}
        <div className="flex flex-col items-center gap-5">
          {/* Slide type label */}
          <div className="flex items-center gap-2">
            {isQuiz && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{ background: "#fbbf2415", borderColor: "#fbbf2440", color: "#fbbf24" }}>
                🎯 Quiz Question
              </span>
            )}
            {isAnswer && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{ background: "#4ade8015", borderColor: "#4ade8040", color: "#4ade80" }}>
                ✅ Answer Reveal
              </span>
            )}
            {isCta && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{ background: "#22d3ee15", borderColor: "#22d3ee40", color: "#22d3ee" }}>
                🎉 Subscribe CTA
              </span>
            )}
            {!isQuiz && !isAnswer && !isCta && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border"
                style={{ background: "#a855f715", borderColor: "#a855f740", color: "#c084fc" }}>
                {currentSlide?.template === "pipeline" ? "⬇ Pipeline" : "📋 Concept"}
              </span>
            )}
          </div>

          {/* Slide canvas — scales down on small screens */}
          <div style={{ width: W * slideScale, height: H * slideScale, position: "relative", flexShrink: 0 }}>
            <div style={{
              width: W, height: H, borderRadius: 20, overflow: "hidden",
              position: "absolute", top: 0, left: 0,
              transform: `scale(${slideScale})`, transformOrigin: "top left",
              boxShadow: isQuiz
                ? "0 0 50px rgba(251,191,36,0.2), 0 0 0 1px #1e1e2e"
                : isAnswer
                ? "0 0 50px rgba(74,222,128,0.2), 0 0 0 1px #1e1e2e"
                : isCta
                ? "0 0 50px rgba(34,211,238,0.2), 0 0 0 1px #1e1e2e"
                : "0 0 50px rgba(168,85,247,0.15), 0 0 0 1px #1e1e2e",
            }}>
              {currentSlide
                ? <SlideRenderer slide={currentSlide} />
                : <div style={{ width: W, height: H, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0d20", color: "#374151", fontSize: 13 }}>
                    {series.isDb ? "Loading…" : "No slides"}
                  </div>
              }
            </div>
          </div>

          {/* Progress bar — only visible while playing */}
          <div style={{ width: W * slideScale, height: 3, background: "#1e1e2e", borderRadius: 99, overflow: "hidden" }}>
            {isPlaying && (
              <div
                key={`${seriesIdx}-${slideIdx}`}
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: isQuiz ? "#fbbf24" : isAnswer ? "#4ade80" : isCta ? "#22d3ee" : "#a855f7",
                  animation: `progressFill ${INTERVAL}ms linear forwards`,
                }}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button onClick={prev} disabled={slideIdx === 0}
              className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all border disabled:opacity-25"
              style={{ background: "#111118", borderColor: "#1e1e2e", color: "#94a3b8" }}>←</button>

            {/* Play / Pause */}
            <button onClick={togglePlay} disabled={isLast && !isPlaying}
              title={isPlaying ? "Pause (Space)" : "Auto-play (Space)"}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all border disabled:opacity-25"
              style={isPlaying
                ? { background: "#a855f722", borderColor: "#a855f755", color: "#c084fc" }
                : { background: "#111118",   borderColor: "#1e1e2e",   color: "#64748b" }}>
              {isPlaying ? "⏸" : "▶"}
            </button>

            <div className="flex gap-1.5 items-center flex-wrap justify-center" style={{ maxWidth: 200 }}>
              {Array.from({ length: total }).map((_, i) => (
                <button key={i} onClick={() => setSlideIdx(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === slideIdx ? 18 : 7,
                    height: 7,
                    background: i === slideIdx ? "#a855f7" : "#1e1e2e",
                  }} />
              ))}
            </div>

            <button onClick={next} disabled={isLast}
              className="w-9 h-9 rounded-full flex items-center justify-center text-base font-bold transition-all border disabled:opacity-25"
              style={{ background: "#111118", borderColor: "#1e1e2e", color: "#94a3b8" }}>→</button>
          </div>

          <p className="font-mono text-xs text-slate-600">
            slide {slideIdx + 1} / {total} · {series.label} · ← → or space to play
          </p>
        </div>

        {/* Right panel — slide info */}
        <div className="lg:w-52 shrink-0 space-y-4">
          <div className="rounded-xl border p-4 space-y-2" style={{ background: "#0f0f1a", borderColor: "#1e1e2e" }}>
            <p className="text-xs font-bold text-white">Current slide</p>
            {currentSlide && (
              <>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {currentSlide.template === "cta" ? "Subscribe CTA" : currentSlide.heading}
                </p>
                <p className="text-[10px] font-mono text-slate-600">
                  Template: <span className={series.isDb ? "text-cyan-400" : "text-purple-400"}>
                    {currentSlide.template}
                  </span>
                  {series.isDb && <span className="ml-1.5" style={{ color: "#22d3ee" }}>AI</span>}
                </p>
              </>
            )}
            <p className="text-[10px] font-mono text-slate-600">
              Slide: <span className="text-amber-400">{slideIdx + 1} / {total || "…"}</span>
            </p>
          </div>

          <div className="rounded-xl border p-4" style={{ background: "#0f0f1a", borderColor: "#1e1e2e" }}>
            <p className="text-xs font-bold text-white mb-2">{allSeries.length} series ready</p>
            {allSeries.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between py-0.5">
                <span className="text-[11px] text-slate-500 truncate max-w-[110px]">{s.label}</span>
                <div className="flex items-center gap-1.5">
                  {s.isDb && <span className="text-[8px] font-bold px-1 rounded" style={{ background: "#22d3ee15", color: "#22d3ee" }}>AI</span>}
                  <span className="font-mono text-[10px] text-slate-600" onClick={() => changeSeries(i)} style={{ cursor: "pointer" }}>
                    {s.slides.length || (s.isDb ? "…" : "0")} slides
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border p-4 space-y-2" style={{ background: "#0f0f1a", borderColor: "#1e1e2e" }}>
            <p className="text-xs font-bold text-white">Generate more</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Go to <Link href="/admin" className="text-purple-400 hover:underline">Admin → Generate</Link> to create AI quiz series. They appear here automatically with an <span style={{ color: "#22d3ee" }}>AI</span> badge.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

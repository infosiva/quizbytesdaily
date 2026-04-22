"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { channelConfig } from "@/lib/config";

// ── Types ──────────────────────────────────────────────────────────────────────
interface QuizQ {
  id: string;
  cat: string;
  diff: "Beginner" | "Intermediate" | "Advanced";
  q: string;
  opts: string[];
  ans: number;
  exp: string;
}

// ── Full question bank (expanded) ──────────────────────────────────────────────
const ALL_QS: QuizQ[] = [
  // ── Python ──────────────────────────────────────────────────────────────────
  { id:"py1", cat:"Python", diff:"Beginner",     q:"What does list(range(3)) return?",
    opts:["[1,2,3]","[0,1,2]","[0,1,2,3]","[1,2]"], ans:1,
    exp:"range(3) starts at 0 and stops before 3 — giving 0, 1, 2." },
  { id:"py2", cat:"Python", diff:"Intermediate", q:"Which keyword turns a Python function into a generator?",
    opts:["return","async","yield","lambda"], ans:2,
    exp:"yield suspends execution and returns a value each iteration — generators are memory-efficient for large sequences." },
  { id:"py3", cat:"Python", diff:"Beginner",     q:"What does the @staticmethod decorator do?",
    opts:["Caches the result","Runs once at startup","Defines a method with no self/cls","Creates a singleton"], ans:2,
    exp:"A static method is a plain function namespaced inside a class — it receives neither self nor cls." },
  { id:"py4", cat:"Python", diff:"Intermediate", q:"What is a Python context manager used for?",
    opts:["Type checking","Managing resources with setup/teardown","Async loops","Memoization"], ans:1,
    exp:"Context managers (with statement) guarantee cleanup code runs — e.g. closing files or releasing locks." },
  { id:"py5", cat:"Python", diff:"Advanced",     q:"What does __slots__ do in a Python class?",
    opts:["Enables multiple inheritance","Restricts attributes to save memory","Makes class abstract","Adds type hints"], ans:1,
    exp:"__slots__ replaces the per-instance __dict__ with a fixed array — reducing memory by ~40% for many instances." },
  { id:"py6", cat:"Python", diff:"Intermediate", q:"What does itertools.chain() do?",
    opts:["Merges dicts","Flattens one level of iterables into a single iterator","Sorts lazily","Zips multiple iterables"], ans:1,
    exp:"chain(*iterables) produces items from each iterable one after another, without loading all into memory." },
  { id:"py7", cat:"Python", diff:"Beginner",     q:"What is a Python dictionary comprehension?",
    opts:["{k: v for k,v in items}","[k for k in d]","dict(map(...))","set({k: v})"], ans:0,
    exp:"Dict comprehensions use {key: value for ...} syntax — concise and fast for transforming key-value pairs." },
  { id:"py8", cat:"Python", diff:"Advanced",     q:"What does functools.lru_cache do?",
    opts:["Lazy imports","Memoizes function results using a bounded LRU cache","Prefetches modules","Thread-safe caching"], ans:1,
    exp:"@lru_cache(maxsize=N) memoizes the last N calls by their arguments — O(1) lookup using an internal dict + doubly-linked list." },

  // ── AI/ML ────────────────────────────────────────────────────────────────────
  { id:"ai1", cat:"AI/ML", diff:"Beginner",     q:"What does RAG stand for in AI?",
    opts:["Rapid AI Generation","Retrieval-Augmented Generation","Random Attention Graph","Recursive Auto-regressor"], ans:1,
    exp:"RAG retrieves relevant documents and feeds them into an LLM for grounded, context-aware answers." },
  { id:"ai2", cat:"AI/ML", diff:"Intermediate", q:"What is the purpose of softmax in neural networks?",
    opts:["Prevent vanishing gradients","Convert logits to probabilities summing to 1","Normalize weights to −1..1","Add non-linearity"], ans:1,
    exp:"Softmax squashes raw logits into a probability distribution (all 0–1, sum = 1) — used in multi-class classification output." },
  { id:"ai3", cat:"AI/ML", diff:"Intermediate", q:"Which technique lets LLMs use external tools like search or APIs?",
    opts:["Fine-tuning","Prompt caching","Function calling / Tool use","Quantization"], ans:2,
    exp:"Function calling (tool use) lets the LLM output structured JSON to call external functions — the backbone of AI agents." },
  { id:"ai4", cat:"AI/ML", diff:"Beginner",     q:"What is a vector embedding in AI?",
    opts:["A compressed image","A numerical representation of text/data in high-dimensional space","A database index","A quantized model"], ans:1,
    exp:"Embeddings map text (or images) to float vectors so that semantically similar items cluster nearby in vector space." },
  { id:"ai5", cat:"AI/ML", diff:"Advanced",     q:"What is the attention mechanism in transformers?",
    opts:["A dropout layer","A way to weight the relevance of each token to every other token","A positional encoding","A normalization layer"], ans:1,
    exp:"Self-attention computes dot-product similarity between query/key pairs (scaled by √d_k) to produce context-aware representations." },
  { id:"ai6", cat:"AI/ML", diff:"Intermediate", q:"What does 'temperature' control in an LLM?",
    opts:["Model speed","Randomness of token sampling — lower = more deterministic","Memory usage","Context window size"], ans:1,
    exp:"Temperature scales logits before softmax. temperature=0 → greedy (most likely token always); temperature=1 → standard sampling." },
  { id:"ai7", cat:"AI/ML", diff:"Beginner",     q:"What is prompt engineering?",
    opts:["Compiling LLM weights","Crafting inputs to steer LLM output quality","Fine-tuning on new data","Model quantization"], ans:1,
    exp:"Prompt engineering is the practice of designing inputs (instructions, examples, context) to get better LLM outputs without training." },
  { id:"ai8", cat:"AI/ML", diff:"Advanced",     q:"What is LoRA in LLM fine-tuning?",
    opts:["A new attention architecture","Low-Rank Adaptation — fine-tune small rank-decomposition matrices instead of full weights","A data augmentation method","A RLHF variant"], ans:1,
    exp:"LoRA freezes pre-trained weights and adds pairs of low-rank matrices (A and B) — reducing trainable params by ~10,000× vs full fine-tuning." },

  // ── Algorithms ───────────────────────────────────────────────────────────────
  { id:"alg1", cat:"Algorithms", diff:"Beginner",     q:"What is the time complexity of binary search?",
    opts:["O(n)","O(n log n)","O(log n)","O(1)"], ans:2,
    exp:"Binary search halves the search space each step — O(log n), very efficient on sorted arrays." },
  { id:"alg2", cat:"Algorithms", diff:"Intermediate", q:"Which data structure gives O(1) average-case lookup?",
    opts:["Linked list","Binary search tree","Hash table","Sorted array"], ans:2,
    exp:"Hash tables use a hash function to map keys to buckets — O(1) average for get/set, O(n) worst-case on collisions." },
  { id:"alg3", cat:"Algorithms", diff:"Intermediate", q:"What is the worst-case time of quicksort?",
    opts:["O(n log n)","O(n²)","O(n)","O(log n)"], ans:1,
    exp:"Quicksort degrades to O(n²) when the pivot is always the min or max (already-sorted input) — mitigated by random pivot selection." },
  { id:"alg4", cat:"Algorithms", diff:"Beginner",     q:"What data structure does BFS use?",
    opts:["Stack","Queue","Heap","Priority queue"], ans:1,
    exp:"BFS uses a queue (FIFO) to process nodes level by level — guaranteeing shortest path in unweighted graphs." },
  { id:"alg5", cat:"Algorithms", diff:"Advanced",     q:"What is the time complexity of Dijkstra's algorithm with a min-heap?",
    opts:["O(V²)","O(E log V)","O(V + E)","O(E²)"], ans:1,
    exp:"With a binary min-heap, each edge relaxation is O(log V) and we process E edges — giving O(E log V) overall." },
  { id:"alg6", cat:"Algorithms", diff:"Intermediate", q:"What is memoization in dynamic programming?",
    opts:["In-place array sorting","Caching subproblem results to avoid recomputation","Bottom-up DP","Greedy selection"], ans:1,
    exp:"Memoization (top-down DP) stores the result of each subproblem in a map — turning exponential recursion into polynomial time." },

  // ── JavaScript ───────────────────────────────────────────────────────────────
  { id:"js1", cat:"JavaScript", diff:"Beginner",     q:"What does === check vs == in JavaScript?",
    opts:["Nothing different","Type AND value (no coercion)","Only value, not type","Deep equality"], ans:1,
    exp:"=== is strict equality — no type coercion. 5 == '5' is true, but 5 === '5' is false." },
  { id:"js2", cat:"JavaScript", diff:"Intermediate", q:"What is a JavaScript Promise?",
    opts:["A cached value","A synchronous callback","An object representing a future async value","A type annotation"], ans:2,
    exp:"A Promise represents an eventual result (or error) of an async operation — consumed with .then()/.catch() or await." },
  { id:"js3", cat:"JavaScript", diff:"Intermediate", q:"What does the spread operator (...) do?",
    opts:["Declares a rest param","Expands iterable elements into individual args/array slots","Clones deeply","Merges async streams"], ans:1,
    exp:"Spread (...arr) expands an iterable into individual elements — useful for array concat, function calls, and object merging." },
  { id:"js4", cat:"JavaScript", diff:"Advanced",     q:"What is a JavaScript closure?",
    opts:["A module pattern","A function that remembers its lexical scope even after the outer function returns","A prototype chain","An IIFE"], ans:1,
    exp:"Closures let inner functions access outer variables after the outer function has returned — the basis of data encapsulation in JS." },
  { id:"js5", cat:"JavaScript", diff:"Beginner",     q:"What does Array.map() return?",
    opts:["The original array","undefined","A new array with each element transformed","The first truthy element"], ans:2,
    exp:".map(fn) returns a new array with fn applied to each element — the original array is not mutated." },

  // ── System Design ────────────────────────────────────────────────────────────
  { id:"sd1", cat:"System Design", diff:"Intermediate", q:"What problem does a CDN primarily solve?",
    opts:["Database replication","Reducing latency by serving content from edge servers near users","Encrypting data in transit","Load balancing microservices"], ans:1,
    exp:"CDNs cache static assets at edge locations worldwide — users download from the nearest node, cutting latency dramatically." },
  { id:"sd2", cat:"System Design", diff:"Intermediate", q:"What is eventual consistency in distributed systems?",
    opts:["All nodes always agree instantly","Data is always up-to-date everywhere","Replicas converge to the same value given no new writes","A consensus algorithm"], ans:2,
    exp:"Eventual consistency means replicas will agree if no new writes arrive — used in high-availability systems like DynamoDB." },
  { id:"sd3", cat:"System Design", diff:"Intermediate", q:"What is the CAP theorem?",
    opts:["A caching strategy","A distributed system can only guarantee 2 of: Consistency, Availability, Partition tolerance","A microservice pattern","A SQL constraint"], ans:1,
    exp:"CAP says a distributed DB must sacrifice one property when a network partition occurs — e.g. MongoDB sacrifices availability, Cassandra sacrifices consistency." },
  { id:"sd4", cat:"System Design", diff:"Advanced",     q:"What is a consistent hash ring used for?",
    opts:["Encrypting data","Distributing keys across nodes so only ~1/n keys remapped when a node joins/leaves","Sorting logs","CDN routing"], ans:1,
    exp:"Consistent hashing minimises data movement when nodes are added/removed — crucial for distributed caches and sharded DBs." },
  { id:"sd5", cat:"System Design", diff:"Beginner",     q:"What is horizontal scaling?",
    opts:["Adding more CPU/RAM to one machine","Adding more machines to share load","Compressing data","Load balancing algorithms"], ans:1,
    exp:"Horizontal scaling (scale out) adds more machines to distribute load — preferred over vertical scaling for high availability." },

  // ── TypeScript ───────────────────────────────────────────────────────────────
  { id:"ts1", cat:"TypeScript", diff:"Beginner",     q:"What is a TypeScript interface?",
    opts:["A JS runtime feature","A contract defining the shape of an object","A class decorator","A module system"], ans:1,
    exp:"An interface defines the structure (property names + types) an object must conform to — it's erased at runtime." },
  { id:"ts2", cat:"TypeScript", diff:"Intermediate", q:"What does the 'as const' assertion do?",
    opts:["Casts to any","Makes all values readonly and infers literal types","Converts to const enum","Disables type checking"], ans:1,
    exp:"'as const' narrows inferred types to their literal values (e.g. 'hello' instead of string) and makes arrays/objects deeply readonly." },
  { id:"ts3", cat:"TypeScript", diff:"Intermediate", q:"What is a TypeScript union type?",
    opts:["A merged class","A type that can be one of several types: A | B","A type intersection","An enum"], ans:1,
    exp:"Union types (A | B) let a variable hold any of the listed types — TypeScript narrows the type in conditional checks." },

  // ── DevOps ───────────────────────────────────────────────────────────────────
  { id:"do1", cat:"DevOps", diff:"Beginner",     q:"What does docker run -d do?",
    opts:["Delete container after exit","Run in detached (background) mode","Run with debug output","Dry-run mode"], ans:1,
    exp:"-d (detached) runs the container in the background — the terminal is freed while the container keeps running." },
  { id:"do2", cat:"DevOps", diff:"Intermediate", q:"What is the purpose of a Dockerfile?",
    opts:["Deploy to Kubernetes","Define how to build a container image step by step","Monitor container health","Store environment variables"], ans:1,
    exp:"A Dockerfile is a script of instructions (FROM, RUN, COPY, CMD…) that Docker executes to build a repeatable image." },
  { id:"do3", cat:"DevOps", diff:"Intermediate", q:"What does 'immutable infrastructure' mean in DevOps?",
    opts:["Servers are never patched in place — they are replaced entirely with new images","Containers share state","VMs are never deleted","CD pipelines are read-only"], ans:0,
    exp:"Immutable infra means servers are never modified after deployment — roll out changes by replacing instances with new images, eliminating config drift." },
];

// ── Constants ──────────────────────────────────────────────────────────────────
const CATS = ["All", ...Array.from(new Set(ALL_QS.map((q) => q.cat))).sort()];
const DIFFS: Array<"All" | "Beginner" | "Intermediate" | "Advanced"> = ["All", "Beginner", "Intermediate", "Advanced"];
const LABELS      = ["A", "B", "C", "D"];
const LABEL_COLS  = ["#22d3ee", "#a855f7", "#4ade80", "#f472b6"];
const DIFF_COLOR: Record<string, string> = { Beginner: "#4ade80", Intermediate: "#fbbf24", Advanced: "#f87171" };
const CAT_COLORS: Record<string, { text: string; badge: string }> = {
  "Python":       { text: "#60a5fa", badge: "#1d4ed8" },
  "AI/ML":        { text: "#22d3ee", badge: "#0e7490" },
  "Algorithms":   { text: "#c084fc", badge: "#6d28d9" },
  "JavaScript":   { text: "#fbbf24", badge: "#b45309" },
  "System Design":{ text: "#4ade80", badge: "#166534" },
  "TypeScript":   { text: "#38bdf8", badge: "#0369a1" },
  "DevOps":       { text: "#fb923c", badge: "#9a3412" },
};
function catCol(c: string) { return CAT_COLORS[c] ?? { text: "#94a3b8", badge: "#334155" }; }

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PlayPage() {
  const [cat,    setCat]    = useState<string>("All");
  const [diff,   setDiff]   = useState<string>("All");
  const [started, setStart] = useState(false);

  // Quiz state
  const [deck,    setDeck]    = useState<QuizQ[]>([]);
  const [qi,      setQi]      = useState(0);
  const [chosen,  setChosen]  = useState<number | null>(null);
  const [score,   setScore]   = useState(0);
  const [done,    setDone]    = useState(false);

  const filtered = useMemo(() => {
    let qs = ALL_QS;
    if (cat  !== "All") qs = qs.filter((q) => q.cat  === cat);
    if (diff !== "All") qs = qs.filter((q) => q.diff === diff);
    return qs;
  }, [cat, diff]);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    let base = ALL_QS;
    if (diff !== "All") base = base.filter((q) => q.diff === diff);
    for (const q of base) m[q.cat] = (m[q.cat] ?? 0) + 1;
    return m;
  }, [diff]);

  function start() {
    const d = shuffle(filtered);
    setDeck(d); setQi(0); setChosen(null); setScore(0); setDone(false);
    setStart(true);
  }

  function pick(idx: number) {
    if (chosen !== null) return;
    setChosen(idx);
    if (idx === deck[qi].ans) setScore((s) => s + 1);
  }

  function next() {
    if (qi + 1 >= deck.length) { setDone(true); return; }
    setQi((i) => i + 1);
    setChosen(null);
  }

  function restart() {
    setStart(false); setDone(false); setChosen(null);
  }

  const BG   = "#0b0b12";
  const CARD = "#111118";
  const BORD = "#1c1c2e";

  // ── Done screen ────────────────────────────────────────────────────────────
  if (done) {
    const pct = Math.round((score / deck.length) * 100);
    const grade = pct >= 80 ? "🏆 Expert" : pct >= 60 ? "⭐ Good" : pct >= 40 ? "📚 Learning" : "🔁 Keep Practising";
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: BG }}>
        <div className="w-full max-w-md text-center">
          <div className="text-5xl mb-4">{pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚"}</div>
          <h2 className="text-2xl font-black text-white mb-1">Round Complete!</h2>
          <p className="text-slate-400 mb-6">{grade}</p>
          <div className="text-6xl font-black font-mono mb-2" style={{ color: pct >= 60 ? "#4ade80" : "#fbbf24" }}>
            {score}/{deck.length}
          </div>
          <p className="text-slate-500 text-sm mb-8">{pct}% correct</p>
          <div className="flex gap-3 justify-center">
            <button onClick={start}
              className="px-6 py-2.5 rounded-xl text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)" }}>
              Play Again
            </button>
            <button onClick={restart}
              className="px-6 py-2.5 rounded-xl text-sm font-bold border"
              style={{ borderColor: "#22d3ee40", color: "#22d3ee", background: "#22d3ee0e" }}>
              Change Topic
            </button>
          </div>
          <Link href="/" className="block mt-6 text-xs text-slate-600 hover:text-slate-400 transition-colors">
            ← Back to videos
          </Link>
        </div>
      </div>
    );
  }

  // ── Active quiz ────────────────────────────────────────────────────────────
  if (started && deck.length > 0) {
    const q    = deck[qi];
    const col  = catCol(q.cat);
    const total = deck.length;

    return (
      <div className="min-h-screen" style={{ background: BG, color: "#e2e8f0" }}>
        {/* Header */}
        <header className="sticky top-0 z-10 border-b px-4 py-3 flex items-center gap-3"
          style={{ borderColor: BORD, background: `${BG}f0`, backdropFilter: "blur(12px)" }}>
          <Link href="/" className="text-slate-500 hover:text-white text-sm transition-colors">←</Link>
          <span className="text-sm font-black text-white">Quiz Playground</span>
          <div className="flex-1" />
          <span className="text-xs font-bold font-mono px-2 py-1 rounded-lg"
            style={{ background: CARD, border: `1px solid ${BORD}`, color: "#94a3b8" }}>
            Q {qi + 1}/{total}
          </span>
          {score > 0 && (
            <span className="text-xs font-black px-2 py-1 rounded-lg"
              style={{ background: "#4ade8015", border: "1px solid #4ade8030", color: "#4ade80" }}>
              {score} ✓
            </span>
          )}
        </header>

        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: BORD }}>
          <div className="h-full transition-all duration-300" style={{
            width: `${((qi + (chosen !== null ? 1 : 0)) / total) * 100}%`,
            background: "linear-gradient(90deg,#7c3aed,#22d3ee)",
          }} />
        </div>

        <div className="max-w-lg mx-auto px-4 py-6">
          {/* Category + difficulty */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
              style={{ background: `${col.badge}25`, color: col.text, border: `1px solid ${col.badge}50` }}>
              {q.cat}
            </span>
            <span className="text-[11px] font-bold" style={{ color: DIFF_COLOR[q.diff] }}>
              {q.diff}
            </span>
          </div>

          {/* Question */}
          <div className="rounded-2xl px-5 py-4 mb-4 border"
            style={{ background: "#0a0a16", borderColor: "#1a1a28" }}>
            <p className="text-[17px] font-bold text-white leading-snug mb-1">{q.q}</p>
            {chosen === null && <p className="text-[11px] text-slate-600">Pick the best answer</p>}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2.5 mb-4">
            {q.opts.map((opt, i) => {
              const isCorrect = i === q.ans;
              const isChosen  = i === chosen;
              const revealed  = chosen !== null;
              const lc        = LABEL_COLS[i];
              let bg   = CARD;
              let bord = BORD;
              let txt  = "#94a3b8";
              if (revealed) {
                if (isCorrect)     { bg = "#4ade8012"; bord = "#4ade8060"; txt = "#4ade80"; }
                else if (isChosen) { bg = "#f8717112"; bord = "#f8717160"; txt = "#f87171"; }
                else               { bg = "#09090f";   bord = "#13131e";   txt = "#374151"; }
              }
              return (
                <button key={i} onClick={() => pick(i)} disabled={revealed}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                  style={{ background: bg, border: `1px solid ${bord}`, color: txt, cursor: revealed ? "default" : "pointer" }}>
                  <span className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-black"
                    style={{
                      background: revealed ? "transparent" : `${lc}20`,
                      border: `1.5px solid ${revealed ? (isCorrect ? "#4ade80" : isChosen ? "#f87171" : "#1e1e2e") : lc}`,
                      color: revealed ? (isCorrect ? "#4ade80" : isChosen ? "#f87171" : "#374151") : lc,
                    }}>
                    {LABELS[i]}
                  </span>
                  <span className="text-[14px] font-semibold leading-snug flex-1">{opt}</span>
                  {revealed && isCorrect && <span className="text-lg">✓</span>}
                  {revealed && isChosen && !isCorrect && <span className="text-lg">✗</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation + Next */}
          {chosen !== null && (
            <>
              <div className="rounded-xl px-4 py-3 text-[13px] leading-relaxed mb-4"
                style={{ background: "#091510", border: "1px solid #4ade8025", color: "#94a3b8" }}>
                <span className="font-bold text-green-400">Explanation: </span>{q.exp}
              </div>
              <button onClick={next}
                className="w-full py-3 rounded-xl text-[14px] font-black tracking-wide transition-all hover:opacity-85"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff" }}>
                {qi + 1 < total ? "Next Question →" : "See Results →"}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Topic / difficulty picker ───────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: BG, color: "#e2e8f0" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 border-b px-6 py-4 flex items-center gap-4"
        style={{ borderColor: BORD, background: `${BG}f0`, backdropFilter: "blur(12px)" }}>
        <Link href="/" className="text-slate-500 hover:text-white transition-colors text-sm">← Videos</Link>
        <span className="font-black text-white text-lg">🎮 Quiz Playground</span>
        <div className="flex-1" />
        <a href={channelConfig.youtubeSubscribeUrl} target="_blank" rel="noopener noreferrer"
          className="text-xs font-black px-3 py-1.5 rounded-lg text-white"
          style={{ background: "#dc2626" }}>
          Subscribe
        </a>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🧠</div>
          <h1 className="text-3xl font-black text-white mb-2">Test Your Tech Knowledge</h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Pick a topic and difficulty, then answer questions one by one. See how many you get right!
          </p>
        </div>

        {/* Difficulty picker */}
        <div className="mb-8">
          <p className="text-[11px] font-black tracking-widest uppercase text-slate-600 mb-3">Difficulty</p>
          <div className="flex gap-2 flex-wrap">
            {DIFFS.map((d) => (
              <button key={d} onClick={() => setDiff(d)}
                className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                style={diff === d
                  ? { background: d === "All" ? "#a855f7" : DIFF_COLOR[d] ?? "#a855f7",
                      borderColor: d === "All" ? "#a855f7" : DIFF_COLOR[d] ?? "#a855f7",
                      color: "#000" }
                  : { background: "transparent", borderColor: BORD, color: "#64748b" }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Category picker */}
        <div className="mb-8">
          <p className="text-[11px] font-black tracking-widest uppercase text-slate-600 mb-3">Topic</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATS.map((c) => {
              const col    = catCol(c);
              const count  = c === "All" ? filtered.length : (catCounts[c] ?? 0);
              const active = cat === c;
              return (
                <button key={c} onClick={() => setCat(c)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left"
                  style={active
                    ? { background: c === "All" ? "#22d3ee15" : `${col.badge}25`,
                        borderColor: c === "All" ? "#22d3ee60" : `${col.badge}70`,
                        color: c === "All" ? "#22d3ee" : col.text }
                    : { background: CARD, borderColor: BORD, color: "#64748b" }}>
                  <span className="text-sm font-bold">{c}</span>
                  <span className="text-[11px] font-mono font-black opacity-60">{count}q</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <div className="text-center">
          {filtered.length === 0 ? (
            <p className="text-slate-600 text-sm">No questions match this filter. Try a different combination.</p>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-4">
                {filtered.length} question{filtered.length !== 1 ? "s" : ""} ready
                {cat !== "All" && ` · ${cat}`}
                {diff !== "All" && ` · ${diff}`}
              </p>
              <button onClick={start}
                className="px-10 py-4 rounded-2xl text-base font-black text-white transition-all hover:scale-105 hover:opacity-90"
                style={{ background: "linear-gradient(135deg,#7c3aed,#a855f7)", boxShadow: "0 4px 24px rgba(168,85,247,0.3)" }}>
                Start Quiz →
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 flex items-center justify-between flex-wrap gap-3" style={{ borderTop: "1px solid #1a1a28" }}>
          <p className="text-[11px] text-slate-700">
            © {new Date().getFullYear()} QuizBytes Daily · quizbytes.dev
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-700">
            <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

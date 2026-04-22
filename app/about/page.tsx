import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About QuizBytesDaily",
  description:
    "QuizBytesDaily is a free daily tech quiz platform publishing bite-sized programming questions on Python, JavaScript, TypeScript, AI/ML, Algorithms, and System Design. No signup needed.",
  alternates: { canonical: "https://quizbytes.dev/about" },
  openGraph: {
    title: "About QuizBytesDaily",
    description:
      "Learn about QuizBytesDaily — a free daily tech quiz platform covering Python, AI/ML, Algorithms, JavaScript, TypeScript, and System Design.",
    url: "https://quizbytes.dev/about",
    siteName: "QuizBytesDaily",
    type: "website",
  },
};

const BORD = "#E8E0D5";
const PRIMARY = "#D97757";
const TEXT = "#1A1A18";
const MUTED = "#9B9490";
const BG = "#FAF9F6";

export default function AboutPage() {
  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${BORD}`, background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "1.15rem", fontWeight: 800, color: TEXT, letterSpacing: "-0.02em" }}>
              Quiz<span style={{ color: PRIMARY }}>Bytes</span>Daily
            </span>
          </Link>
          <Link href="/" style={{ fontSize: "0.82rem", color: MUTED, textDecoration: "none", fontWeight: 500 }}>
            ← Back to quizzes
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" }}>
        {/* Page title */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: TEXT, lineHeight: 1.15, marginBottom: 12, letterSpacing: "-0.03em" }}>
            About QuizBytesDaily
          </h1>
          <p style={{ fontSize: "1.05rem", color: MUTED, lineHeight: 1.65 }}>
            Free daily tech quizzes for developers who want to stay sharp.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: BORD, marginBottom: 40 }} />

        {/* Mission */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: TEXT, marginBottom: 14, letterSpacing: "-0.02em" }}>
            Our Mission
          </h2>
          <p style={{ fontSize: "0.97rem", color: "#444", lineHeight: 1.75, marginBottom: 14 }}>
            QuizBytesDaily exists to make continuous learning effortless for software engineers and CS students. We believe the best way to retain programming concepts is through regular, low-stakes practice — one question at a time.
          </p>
          <p style={{ fontSize: "0.97rem", color: "#444", lineHeight: 1.75, marginBottom: 14 }}>
            Every day we publish a new bite-sized quiz question covering a specific technical topic. Each question comes with four answer choices, an explanation of the correct answer, and a code example where applicable. Questions are crafted to be challenging enough to teach you something new, yet approachable enough that you can attempt them in under two minutes.
          </p>
          <p style={{ fontSize: "0.97rem", color: "#444", lineHeight: 1.75 }}>
            We also publish companion YouTube Shorts — short-form videos (under 60 seconds) that walk through the same question visually. This dual-format approach lets you learn whether you&apos;re browsing on your laptop or watching on your phone.
          </p>
        </section>

        {/* Topics */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: TEXT, marginBottom: 14, letterSpacing: "-0.02em" }}>
            Topics We Cover
          </h2>
          <p style={{ fontSize: "0.97rem", color: "#444", lineHeight: 1.75, marginBottom: 20 }}>
            QuizBytesDaily covers the core areas that matter most to working software engineers:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { emoji: "🐍", name: "Python", desc: "Syntax, idioms, stdlib, decorators, generators, async" },
              { emoji: "🤖", name: "AI & Machine Learning", desc: "LLMs, RAG, embeddings, model evaluation, PyTorch" },
              { emoji: "🧮", name: "Algorithms", desc: "Sorting, searching, dynamic programming, graphs, complexity" },
              { emoji: "⚡", name: "JavaScript", desc: "Closures, prototypes, event loop, ES6+, async/await" },
              { emoji: "📘", name: "TypeScript", desc: "Types, generics, interfaces, utility types, strict mode" },
              { emoji: "🏗️", name: "System Design", desc: "Distributed systems, caching, databases, microservices" },
            ].map(({ emoji, name, desc }) => (
              <div key={name} style={{ background: "#fff", border: `1px solid ${BORD}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: 6 }}>{emoji}</div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: TEXT, marginBottom: 4 }}>{name}</div>
                <div style={{ fontSize: "0.78rem", color: MUTED, lineHeight: 1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: TEXT, marginBottom: 14, letterSpacing: "-0.02em" }}>
            How It Works
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { step: "1", title: "Visit the homepage", body: "Browse today\u2019s quiz or explore our full archive of 50+ questions across six topic categories. No account needed." },
              { step: "2", title: "Take a quiz", body: "Select an answer from four options. You\u2019ll get instant feedback, an explanation of the correct answer, and a code snippet where relevant." },
              { step: "3", title: "Build your streak", body: "Answer a question every day to build your streak. Streaks are tracked locally in your browser — no server, no login, no data collection." },
              { step: "4", title: "Watch the Short", body: "Each quiz has a companion YouTube Short you can watch to reinforce your understanding visually in under 60 seconds." },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: PRIMARY, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem", flexShrink: 0 }}>
                  {step}
                </div>
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: TEXT, marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: "0.9rem", color: "#555", lineHeight: 1.65 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Free forever */}
        <section style={{ marginBottom: 48, background: "#fff", border: `1px solid ${BORD}`, borderRadius: 12, padding: "24px 28px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: TEXT, marginBottom: 10, letterSpacing: "-0.02em" }}>
            Free Forever
          </h2>
          <p style={{ fontSize: "0.92rem", color: "#555", lineHeight: 1.7, margin: 0 }}>
            QuizBytesDaily is and will always be free to use. We rely on non-intrusive display advertising (Google AdSense) to cover infrastructure costs. You never need to create an account, provide an email address, or pay anything to access any quiz on the platform.
          </p>
        </section>

        {/* CTA */}
        <div style={{ textAlign: "center" }}>
          <Link href="/" style={{ display: "inline-block", background: PRIMARY, color: "#fff", textDecoration: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, fontSize: "0.95rem" }}>
            Start Quizzing →
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${BORD}`, background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <p style={{ fontSize: "0.72rem", color: MUTED, margin: 0 }}>
            © {new Date().getFullYear()} QuizBytes Daily · quizbytes.dev
          </p>
          <div style={{ display: "flex", gap: 16, fontSize: "0.72rem" }}>
            <Link href="/about" style={{ color: PRIMARY, textDecoration: "none", fontWeight: 600 }}>About</Link>
            <Link href="/privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ color: MUTED, textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

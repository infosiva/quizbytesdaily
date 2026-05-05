import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, getCategoryBySlug } from "./categoryData";

const BORD = "#E8E0D5";
const PRIMARY = "#D97757";
const TEXT = "#1A1A18";
const MUTED = "#9B9490";
const BG = "#FAF9F6";

// Pre-render all known category slugs at build time
export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const data = getCategoryBySlug(category);
  if (!data) return { title: "Not Found" };

  return {
    title: data.metaTitle,
    description: data.metaDescription,
    alternates: { canonical: `https://quizbytes.dev/quiz/${data.slug}` },
    openGraph: {
      title: data.metaTitle,
      description: data.metaDescription,
      url: `https://quizbytes.dev/quiz/${data.slug}`,
      siteName: "QuizBytesDaily",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: data.metaTitle,
      description: data.metaDescription,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const data = getCategoryBySlug(category);
  if (!data) notFound();

  const homeUrl = `/?category=${encodeURIComponent(data.homeFilter)}`;

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "var(--font-inter, Inter, sans-serif)" }}>
      {/* Header */}
      <header style={{ borderBottom: `1px solid ${BORD}`, background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "1.15rem", fontWeight: 800, color: TEXT, letterSpacing: "-0.02em" }}>
              Quiz<span style={{ color: PRIMARY }}>Bytes</span>Daily
            </span>
          </Link>
          <Link href="/" style={{ fontSize: "0.82rem", color: MUTED, textDecoration: "none", fontWeight: 500 }}>
            ← All quizzes
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${BORD}`, padding: "48px 24px 40px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: "0.78rem", color: MUTED, marginBottom: 16, display: "flex", gap: 6, alignItems: "center" }}>
            <Link href="/" style={{ color: MUTED, textDecoration: "none" }}>Home</Link>
            <span>›</span>
            <span>Quiz</span>
            <span>›</span>
            <span style={{ color: TEXT, fontWeight: 600 }}>{data.name}</span>
          </div>

          <div style={{ fontSize: "3rem", marginBottom: 12 }}>{data.emoji}</div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: TEXT, lineHeight: 1.15, marginBottom: 12, letterSpacing: "-0.03em" }}>
            {data.name} Quiz Questions
          </h1>
          <p style={{ fontSize: "1.05rem", color: MUTED, lineHeight: 1.6, marginBottom: 28 }}>
            {data.tagline}
          </p>

          <Link
            href={homeUrl}
            style={{
              display: "inline-block",
              background: PRIMARY,
              color: "#fff",
              textDecoration: "none",
              padding: "12px 24px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.92rem",
            }}
          >
            Take {data.name} Quizzes →
          </Link>
        </div>
      </div>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Intro */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: TEXT, marginBottom: 16, letterSpacing: "-0.02em" }}>
            About {data.name} Quizzes
          </h2>
          {data.intro.map((para, i) => (
            <p key={i} style={{ fontSize: "0.97rem", color: "#444", lineHeight: 1.75, marginBottom: 16 }}>
              {para}
            </p>
          ))}
        </section>

        {/* Why Learn */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: TEXT, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Why Learn {data.name}?
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {data.whyLearn.map(({ heading, body }) => (
              <div key={heading} style={{ background: "#fff", border: `1px solid ${BORD}`, borderRadius: 10, padding: "18px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIMARY, flexShrink: 0, marginTop: 6 }} />
                <div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 700, color: TEXT, marginBottom: 4 }}>{heading}</div>
                  <div style={{ fontSize: "0.9rem", color: "#555", lineHeight: 1.65 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* What You'll Find */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: TEXT, marginBottom: 16, letterSpacing: "-0.02em" }}>
            What You&apos;ll Find in Our {data.name} Quizzes
          </h2>
          <div style={{ background: "#fff", border: `1px solid ${BORD}`, borderRadius: 12, padding: "20px 24px" }}>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {data.whatYouFind.map((item) => (
                <li key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "0.92rem", color: "#444", lineHeight: 1.6 }}>
                  <span style={{ color: PRIMARY, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ad — between sections */}
        <div style={{ margin: "0 0 32px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Sponsored</div>
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-4237294630161176"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* All categories */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: TEXT, marginBottom: 14, letterSpacing: "-0.02em" }}>
            Other Quiz Categories
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {CATEGORIES.filter((c) => c.slug !== data.slug).map((c) => (
              <Link
                key={c.slug}
                href={`/quiz/${c.slug}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: "#fff",
                  border: `1px solid ${BORD}`,
                  borderRadius: 999,
                  textDecoration: "none",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: TEXT,
                }}
              >
                {c.emoji} {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Sample Questions */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: TEXT, marginBottom: 8, letterSpacing: "-0.02em" }}>
            Sample {data.name} Quiz Questions
          </h2>
          <p style={{ fontSize: "0.9rem", color: MUTED, marginBottom: 20 }}>
            A taste of what you&apos;ll find in the {data.name} quiz series.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {data.sampleQuestions.map((q, qi) => (
              <div key={qi} style={{ background: "#fff", border: `1px solid ${BORD}`, borderRadius: 12, padding: "22px 24px" }}>
                {/* Question number + text */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <span style={{ width: 26, height: 26, borderRadius: "50%", background: PRIMARY, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.78rem", flexShrink: 0 }}>
                    {qi + 1}
                  </span>
                  <p style={{ fontSize: "0.95rem", fontWeight: 600, color: TEXT, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>
                    {q.question}
                  </p>
                </div>
                {/* Options */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16, paddingLeft: 38 }}>
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === q.correctIndex;
                    return (
                      <div
                        key={oi}
                        style={{
                          display: "flex", gap: 10, alignItems: "flex-start",
                          padding: "8px 12px", borderRadius: 8,
                          background: isCorrect ? "#dcfce7" : "#f9f7f5",
                          border: `1px solid ${isCorrect ? "#86efac" : BORD}`,
                          fontSize: "0.88rem", color: isCorrect ? "#166534" : "#444",
                          fontWeight: isCorrect ? 700 : 400,
                        }}
                      >
                        <span style={{ fontWeight: 700, flexShrink: 0, color: isCorrect ? "#16a34a" : MUTED }}>
                          {String.fromCharCode(65 + oi)}.
                        </span>
                        {opt}
                        {isCorrect && (
                          <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: "0.78rem", background: "#16a34a", color: "#fff", padding: "1px 7px", borderRadius: 999, fontWeight: 700 }}>
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Explanation */}
                <div style={{ paddingLeft: 38 }}>
                  <p style={{ fontSize: "0.88rem", color: "#555", lineHeight: 1.7, margin: 0, background: "#f3f4f6", borderRadius: 8, padding: "10px 14px", borderLeft: `3px solid ${PRIMARY}` }}>
                    <strong style={{ color: TEXT }}>Explanation: </strong>{q.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ad — between quiz preview and CTA */}
        <div style={{ margin: "0 0 32px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Sponsored</div>
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client="ca-pub-4237294630161176"
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", background: "#fff", border: `1px solid ${BORD}`, borderRadius: 12, padding: "32px 24px" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 700, color: TEXT, marginBottom: 8 }}>
            Ready to test your {data.name} knowledge?
          </p>
          <p style={{ fontSize: "0.9rem", color: MUTED, marginBottom: 20 }}>
            Free daily quizzes — no signup, no account, no cost.
          </p>
          <Link
            href={homeUrl}
            style={{
              display: "inline-block",
              background: PRIMARY,
              color: "#fff",
              textDecoration: "none",
              padding: "12px 28px",
              borderRadius: 8,
              fontWeight: 700,
              fontSize: "0.95rem",
            }}
          >
            Start {data.name} Quizzes →
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
            <Link href="/about" style={{ color: MUTED, textDecoration: "none" }}>About</Link>
            <Link href="/privacy" style={{ color: MUTED, textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms" style={{ color: MUTED, textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

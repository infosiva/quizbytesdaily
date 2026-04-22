import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "QuizBytesDaily Terms of Service — rules for using the Site, content ownership, disclaimer, and limitation of liability.",
  alternates: { canonical: "https://quizbytes.dev/terms" },
  openGraph: {
    title: "Terms of Service | QuizBytesDaily",
    description: "Read the QuizBytesDaily Terms of Service covering acceptable use, content ownership, and disclaimers.",
    url: "https://quizbytes.dev/terms",
    siteName: "QuizBytesDaily",
    type: "website",
  },
};

const BORD = "#E8E0D5";
const PRIMARY = "#D97757";
const TEXT = "#1A1A18";
const MUTED = "#9B9490";
const BG = "#FAF9F6";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: TEXT, marginBottom: 12, letterSpacing: "-0.02em" }}>
        {title}
      </h2>
      <div style={{ fontSize: "0.93rem", color: "#444", lineHeight: 1.75 }}>{children}</div>
    </section>
  );
}

export default function TermsPage() {
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
            ← Back to quizzes
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: TEXT, lineHeight: 1.15, marginBottom: 12, letterSpacing: "-0.03em" }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: "0.9rem", color: MUTED }}>
            Last updated: April 22, 2026
          </p>
        </div>

        <div style={{ height: 1, background: BORD, marginBottom: 40 }} />

        <p style={{ fontSize: "0.95rem", color: "#444", lineHeight: 1.75, marginBottom: 40 }}>
          Welcome to QuizBytesDaily. By accessing or using{" "}
          <a href="https://quizbytes.dev" style={{ color: PRIMARY }}>quizbytes.dev</a>{" "}
          (the &ldquo;Site&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree, please do not use the Site.
        </p>

        <Section title="1. Use of the Site">
          <p style={{ marginBottom: 12 }}>
            The Site is provided for personal, non-commercial, educational use. You may browse, take quizzes, and share quiz links freely. You agree not to:
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Scrape, crawl, or harvest content from the Site in bulk without prior written permission</li>
            <li>Attempt to interfere with or disrupt the Site&apos;s infrastructure or servers</li>
            <li>Use automated bots to artificially inflate quiz statistics or analytics</li>
            <li>Reverse-engineer, decompile, or reproduce quiz content for commercial purposes</li>
            <li>Misrepresent your affiliation with QuizBytesDaily</li>
          </ul>
        </Section>

        <Section title="2. Intellectual Property">
          <p style={{ marginBottom: 12 }}>
            All quiz questions, explanations, code snippets, illustrations, and accompanying text on the Site are owned by or licensed to QuizBytesDaily and are protected by copyright and other intellectual property laws.
          </p>
          <p style={{ marginBottom: 12 }}>
            You may share individual quiz questions for educational purposes (e.g., in a blog post or study group) provided you include clear attribution to QuizBytesDaily and a link back to{" "}
            <a href="https://quizbytes.dev" style={{ color: PRIMARY }}>quizbytes.dev</a>.
          </p>
          <p>
            The &ldquo;QuizBytesDaily&rdquo; name, logo, and branding are proprietary. You may not use them without prior written consent.
          </p>
        </Section>

        <Section title="3. Content Accuracy">
          <p style={{ marginBottom: 12 }}>
            Quiz content is intended for educational purposes and is reviewed for accuracy. However, technology evolves rapidly and some answers may become outdated. We make no warranty that all content is current, complete, or error-free.
          </p>
          <p>
            If you believe a quiz answer is incorrect or misleading, please let us know via our{" "}
            <a href="https://www.youtube.com/@QuizBytesDaily" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>YouTube channel</a>{" "}
            community tab and we will review it promptly.
          </p>
        </Section>

        <Section title="4. Advertising">
          <p>
            The Site displays non-intrusive advertisements served by Google AdSense. By using the Site you acknowledge that ads may be shown. We do not endorse any advertised products or services. Ad interactions are subject to Google&apos;s own terms and privacy policy. You can opt out of personalised ads at{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>google.com/settings/ads</a>.
          </p>
        </Section>

        <Section title="5. External Links">
          <p>
            The Site may link to third-party websites (e.g., YouTube, GitHub, documentation pages). We have no control over the content or privacy practices of those sites and are not responsible for any harm or loss arising from your use of them.
          </p>
        </Section>

        <Section title="6. Disclaimer of Warranties">
          <p>
            The Site and its content are provided <strong>&ldquo;as is&rdquo;</strong> and <strong>&ldquo;as available&rdquo;</strong> without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee uninterrupted or error-free access to the Site.
          </p>
        </Section>

        <Section title="7. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, QuizBytesDaily and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Site, even if we have been advised of the possibility of such damages.
          </p>
        </Section>

        <Section title="8. Privacy">
          <p>
            Your use of the Site is also governed by our{" "}
            <Link href="/privacy" style={{ color: PRIMARY }}>Privacy Policy</Link>,
            {" "}which is incorporated into these Terms by reference. Please read it to understand how we collect and use data.
          </p>
        </Section>

        <Section title="9. Modifications">
          <p>
            We reserve the right to update these Terms at any time. Updated Terms will be posted on this page with a revised &ldquo;Last updated&rdquo; date. Continued use of the Site after changes are posted constitutes your acceptance of the new Terms.
          </p>
        </Section>

        <Section title="10. Governing Law">
          <p>
            These Terms are governed by and construed in accordance with applicable law. Any dispute arising from these Terms or your use of the Site shall be resolved through good-faith negotiation before any formal proceedings.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For questions about these Terms, please contact us via the{" "}
            <a href="https://www.youtube.com/@QuizBytesDaily" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>QuizBytesDaily YouTube channel</a>.
          </p>
        </Section>
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
            <Link href="/terms" style={{ color: PRIMARY, textDecoration: "none", fontWeight: 600 }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

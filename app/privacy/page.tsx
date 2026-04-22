import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "QuizBytesDaily privacy policy — how we handle data, cookies, Google AdSense, and YouTube embeds. We collect no personal data without consent.",
  alternates: { canonical: "https://quizbytes.dev/privacy" },
  openGraph: {
    title: "Privacy Policy | QuizBytesDaily",
    description: "Read the QuizBytesDaily privacy policy covering data collection, cookies, and third-party services.",
    url: "https://quizbytes.dev/privacy",
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

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p style={{ fontSize: "0.9rem", color: MUTED }}>
            Last updated: April 22, 2026
          </p>
        </div>

        <div style={{ height: 1, background: BORD, marginBottom: 40 }} />

        <p style={{ fontSize: "0.95rem", color: "#444", lineHeight: 1.75, marginBottom: 40 }}>
          QuizBytesDaily (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates{" "}
          <a href="https://quizbytes.dev" style={{ color: PRIMARY }}>quizbytes.dev</a>{" "}
          (the &ldquo;Site&rdquo;). This Privacy Policy explains how we collect, use, and protect information when you visit the Site. By using the Site you agree to the practices described here.
        </p>

        <Section title="1. Information We Collect">
          <p style={{ marginBottom: 12 }}>
            <strong>Usage data.</strong> We use aggregated, anonymised analytics to understand which pages are visited and how long users stay. This data contains no personally identifiable information.
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Streak data.</strong> Your daily quiz streak counter is stored exclusively in your browser&apos;s{" "}
            <code style={{ background: "#F4F0EB", padding: "1px 5px", borderRadius: 4 }}>localStorage</code>.
            {" "}This data never leaves your device and is never sent to our servers.
          </p>
          <p>
            <strong>No account required.</strong> We do not collect names, email addresses, passwords, or any other personal data because no registration is required to use the Site.
          </p>
        </Section>

        <Section title="2. Cookies">
          <p style={{ marginBottom: 12 }}>
            We use two types of cookies:
          </p>
          <p style={{ marginBottom: 12 }}>
            <strong>Strictly necessary cookies</strong> — session and security cookies required for the Site to function. These cannot be disabled.
          </p>
          <p>
            <strong>Advertising cookies</strong> — Google AdSense sets cookies to serve personalised ads. You can opt out of personalised advertising at{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>google.com/settings/ads</a>{" "}
            or by enabling &ldquo;Do Not Track&rdquo; in your browser.
          </p>
        </Section>

        <Section title="3. Google AdSense">
          <p style={{ marginBottom: 12 }}>
            We display ads served by Google AdSense (publisher ID:{" "}
            <code style={{ background: "#F4F0EB", padding: "1px 5px", borderRadius: 4 }}>ca-pub-4237294630161176</code>).
            {" "}Google AdSense uses cookies and web beacons to serve ads based on your prior visits to this and other websites.
          </p>
          <p>
            Google&apos;s use of advertising cookies enables it and its partners to serve ads based on your visit to our Site and/or other sites on the internet. You may opt out of personalised advertising by visiting{" "}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>Google Ads Settings</a>.
            {" "}For more information on how Google uses data when you use our Site, see{" "}
            <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>policies.google.com/technologies/partner-sites</a>.
          </p>
        </Section>

        <Section title="4. YouTube Embeds">
          <p style={{ marginBottom: 12 }}>
            Some pages embed YouTube videos via the YouTube iframe API. When you interact with a YouTube embed, YouTube may set cookies and collect usage data subject to{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>Google&apos;s Privacy Policy</a>.
          </p>
          <p>
            We use{" "}
            <code style={{ background: "#F4F0EB", padding: "1px 5px", borderRadius: 4 }}>youtube-nocookie.com</code>{" "}
            where possible to minimise data collection before you interact with a video.
          </p>
        </Section>

        <Section title="5. Third-Party Services">
          <p style={{ marginBottom: 12 }}>The Site may use the following third-party services, each with their own privacy policy:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li><strong>Google AdSense</strong> — advertising (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>policy</a>)</li>
            <li><strong>YouTube</strong> — video embeds (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>policy</a>)</li>
            <li><strong>Vercel</strong> — hosting and CDN (<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>policy</a>)</li>
          </ul>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We do not store personal data on our servers. Aggregated analytics data is retained for up to 26 months and then deleted. Locally-stored streak data persists until you clear your browser&apos;s localStorage or use a new device.
          </p>
        </Section>

        <Section title="7. Your Rights (GDPR / CCPA)">
          <p style={{ marginBottom: 12 }}>
            If you are located in the European Economic Area, UK, or California, you have certain rights including:
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>The right to know what personal data we hold about you</li>
            <li>The right to request deletion of your personal data</li>
            <li>The right to opt out of personalised advertising</li>
            <li>The right to withdraw consent at any time</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            Because we collect no personal data beyond what is strictly necessary (and advertising cookies handled by Google), there is typically no data for us to delete. To exercise rights related to advertising cookies, use the opt-out links in Section 3.
          </p>
        </Section>

        <Section title="8. Children&apos;s Privacy">
          <p>
            The Site is not directed to children under 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes take effect when posted on this page. The &ldquo;Last updated&rdquo; date at the top of this page indicates when this policy was last revised. Continued use of the Site after changes constitutes acceptance of the revised policy.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            If you have questions about this Privacy Policy, please reach out via the{" "}
            <a href="https://www.youtube.com/@QuizBytesDaily" target="_blank" rel="noopener noreferrer" style={{ color: PRIMARY }}>QuizBytesDaily YouTube channel</a>{" "}
            community tab.
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
            <Link href="/privacy" style={{ color: PRIMARY, textDecoration: "none", fontWeight: 600 }}>Privacy</Link>
            <Link href="/terms" style={{ color: MUTED, textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

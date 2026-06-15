import Script from 'next/script'
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from "../components/CookieConsent";
import Footer from "../components/Footer";
import FloatingChatWrapper from "@/components/FloatingChatWrapper";
import FeedbackWidget from "@/components/FeedbackWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL  = "https://quizbytes.dev";
const SITE_NAME = "QuizBytesDaily";
const TITLE     = "QuizBytesDaily — Daily Tech Quiz Shorts";
const DESC      = "Daily 60-second tech quizzes in Python, AI, Algorithms & more. Learn something new every day with QuizBytesDaily!";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESC,
  keywords: [
    "tech quiz", "coding quiz", "python quiz", "algorithms quiz", "AI quiz",
    "machine learning quiz", "javascript quiz", "system design quiz",
    "YouTube Shorts quiz", "daily programming challenge", "computer science quiz",
    "software engineering quiz", "RAG quiz", "LLM quiz", "data structures quiz",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Technology",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "en_US",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "QuizBytesDaily — Daily Tech Quiz Shorts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Daily tech quiz Shorts. Test yourself, learn something new.",
    images: [`${SITE_URL}/og-image.png`],
    creator: "@QuizBytesDaily",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification token here when ready:
    google: "YOUR_VERIFICATION_TOKEN", // Replace with actual token
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      "url": SITE_URL,
      "name": SITE_NAME,
      "description": DESC,
      "publisher": { "@id": `${SITE_URL}/#organization` },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${SITE_URL}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": SITE_NAME,
      "url": SITE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/logo.svg`,
        "width": 200,
        "height": 44,
      },
      "sameAs": [
        "https://www.youtube.com/@QuizBytesDaily",
      ],
    },
    {
      "@type": "VideoObject",
      "name": "QuizBytesDaily — Tech Quiz Shorts",
      "description": "Daily 60-second quiz Shorts covering Python, AI, Algorithms, System Design & more.",
      "thumbnailUrl": `${SITE_URL}/og-image.png`,
      "uploadDate": new Date().toISOString().slice(0, 10),
      "publisher": { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is QuizBytesDaily?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "QuizBytesDaily posts bite-sized tech quiz Shorts every day on YouTube. Each video is under 60 seconds and covers Python, AI, Algorithms, System Design, or JavaScript."
          }
        },
        {
          "@type": "Question",
          "name": "How can I test my tech knowledge?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Visit quizbytes.dev to play interactive tech quizzes for free, or subscribe on YouTube to get a new quiz Short every day."
          }
        },
        {
          "@type": "Question",
          "name": "What topics are covered?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Python, AI/ML, Algorithms, Data Structures, JavaScript, TypeScript, System Design, DevOps, and more."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="theme-color" content="#0b0b12" />
        <meta name="color-scheme" content="dark" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --qb-bg: #0b0b12;
            --qb-surface: #111118;
            --qb-surface-2: #18181f;
            --qb-border: #1c1c2e;
            --qb-cyan: #22d3ee;
            --qb-yellow: #fbbf24;
            --qb-green: #4ade80;
            --qb-red: #f87171;
            --qb-text: #f0f0f5;
            --qb-text-2: rgba(200,200,220,0.6);
          }
          /* Wordle-style correct/wrong colours */
          .cell-correct { background: #4ade80 !important; color: #0b1a0b !important; }
          .cell-wrong   { background: #6b7280 !important; }
          .cell-close   { background: #fbbf24 !important; color: #1a1200 !important; }
          /* Streak counter badge */
          .streak-badge { background: linear-gradient(135deg,#fbbf24,#f59e0b); color: #1a1200; font-weight: 800; border-radius: 99px; padding: 3px 10px; font-size: 11px; }
          /* Category badges sharper */
          .cat-badge { border-radius: 6px !important; font-weight: 700 !important; font-size: 10px !important; letter-spacing: 0.04em !important; }
          /* NYT-style card border */
          .quiz-card { border: 2px solid #1c1c2e !important; }
          .quiz-card:hover { border-color: #22d3ee !important; }
        `}} />
      </head>
      <body className="antialiased" style={{ backgroundColor: "#0b0b12", color: "#f0f0f5", fontFamily: "var(--font-inter, system-ui)" }}>
        {children}
        <FloatingChatWrapper />
        <FeedbackWidget siteName="QuizBytesDaily" />
        {/* AdSense auto-ads — activates once approved */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4237294630161176"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Script src="http://31.97.56.148:3098/t.js" data-site="quizbytes.dev" strategy="lazyOnload" />
        <Footer siteName="QuizBytesDaily" />
      <CookieConsent />
            <Script async src="http://31.97.56.148:3100/script.js" data-website-id="cd172af6-136f-4b9f-ae09-26051589a730" strategy="afterInteractive" />
      </body>
    </html>
  );
}

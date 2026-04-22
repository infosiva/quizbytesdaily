import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

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
const DESC      = "Bite-sized tech quiz Shorts posted every day. Test your Python, AI, Algorithms, System Design & JavaScript knowledge. Free interactive quizzes + YouTube Shorts.";

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
        <meta name="theme-color" content="#FAF9F6" />
        <meta name="color-scheme" content="light" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased" style={{ backgroundColor: "#FAF9F6", color: "#1A1A18" }}>
        {children}
        {/* Google AdSense — afterInteractive ensures the script runs after hydration */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4237294630161176"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

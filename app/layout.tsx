import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://quizbytes.dev"),
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  title: "QuizBytesDaily — Daily Tech Quiz Shorts",
  description:
    "Bite-sized tech quiz Shorts posted daily. Test your knowledge on Python, Algorithms, AI, System Design, and JavaScript. Subscribe on YouTube.",
  keywords: [
    "tech quiz",
    "coding quiz",
    "python quiz",
    "algorithms quiz",
    "AI quiz",
    "YouTube Shorts",
    "daily quiz",
    "programming challenge",
  ],
  openGraph: {
    title: "QuizBytesDaily — Daily Tech Quiz Shorts",
    description:
      "Test your tech knowledge daily. Bite-sized quiz Shorts on Python, Algorithms, AI & more.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuizBytesDaily",
    description: "Daily tech quiz Shorts. Test yourself, learn something new.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}

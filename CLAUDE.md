# QuizBytes Daily — Agent Context

## What This Project Is
A daily tech quiz platform that posts bite-sized quiz YouTube Shorts every day.
Covers Python, AI/ML, Algorithms, System Design, JavaScript. Has an interactive
quiz widget on the site and links to YouTube for video versions.

## Production URL
**https://quizbytes.dev**

## Hosting & Deployment
- Platform: **Vercel** (auto-deploys from `main` branch on GitHub)
- Repo: `https://github.com/infosiva/quizbytesdaily`
- Push to `main` → Vercel builds and deploys automatically

## Tech Stack
- **Framework**: Next.js 14 (App Router), all client-side rendering (`"use client"`)
- **Styling**: Inline styles (custom dark theme, no Tailwind)
- **Database**: Supabase (quiz series stored in `series` table, questions in `quiz_questions`)
- **Font**: Inter + JetBrains Mono

## YouTube Channel
- Handle: **@QuizBytesDaily**
- Subscribe URL: from `lib/config.ts` → `channelConfig.youtubeSubscribeUrl`

## Key Files
| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout, metadata, AdSense |
| `app/page.tsx` | Main page — quiz widget + series grid (1100+ lines) |
| `app/api/quiz/route.ts` | Quiz questions API |
| `app/api/series/route.ts` | Series list API |
| `app/api/stats/route.ts` | Stats API |
| `app/api/settings/route.ts` | Site settings API |
| `lib/config.ts` | Channel config (YouTube URLs, site name) |
| `public/ads.txt` | AdSense ads.txt ✅ (just added) |
| `public/logo.svg` | Site logo |

## Design System (Inline Styles)
- Background: `#0b0b12`
- Card: `#111118`
- Border: `#1c1c2e`
- Accent: `#22d3ee` (cyan)
- Category colours in `KNOWN_CAT` map in `app/page.tsx`

## AdSense
- Publisher ID: `ca-pub-4237294630161176`
- ads.txt: ✅ Added to `public/ads.txt`
- AdSense script in `app/layout.tsx`

## Focus Areas for Improvement
1. **SEO** — Category landing pages, question pages with individual URLs
2. **Viral Sharing** — Share button on each quiz question, Twitter/X card
3. **User Retention** — Streak tracking, leaderboard, daily reminder email
4. **Monetisation** — AdSense units within quiz content

## What NOT to Change
- The quiz widget is all in `app/page.tsx` — be careful, it's 1100+ lines
- `channelConfig` in `lib/config.ts` is the single source of truth for YouTube URLs
- Keep `CAT_EMOJI` import from `lib/config.ts` — shared with other pages
- The Pollinations.ai thumbnail generation is intentional (free, no API key)

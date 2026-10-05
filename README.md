# quizbytesdaily

Daily tech quiz Shorts channel website — slide preview, YouTube upload, and SEO-ready landing page for quizbytes.dev 

**Live:** https://quizbytesdaily-vercel.vercel.app

## Tech stack
Next.js, React, TypeScript, Tailwind CSS

## Run locally
```bash
git clone https://github.com/infosiva/quizbytesdaily.git && cd quizbytesdaily
npm install
cp .env.example .env.local   # names only, fill in your own values
npm run dev                    # http://localhost:3000
```

## Scripts
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

## Environment variables
Names only; never commit real values. Everything is optional unless the feature needs it.

**AI providers (free-first chain; any one is enough):** `GEMINI_API_KEY`, `GROQ_API_KEY`

- `ADMIN_PASSWORD`
- `CATEGORY`
- `CATEGORY1`
- `CATEGORY2`
- `CRON_SECRET`
- `DIFFICULTY`
- `DIFFICULTY1`
- `DIFFICULTY2`
- `FORCE_TOPIC`
- `GNEWS_API_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NVIDIA_API_KEY`
- `OPENAI_API_KEY`
- `OPENROUTER_API_KEY`
- `POLL_INTERVAL_HOURS`
- `PROMO_CODES`
- `QUEUE_THRESHOLD`
- `QUIZBYTES_URL`
- `REVIEW_MIN_SCORE`
- `SERIES_ID`
- `SERIES_ID1`
- `SERIES_ID2`
- `TOPIC`
- `TOPIC1`
- `TOPIC2`
- `TRENDING_YOUTUBE_REFRESH_TOKEN`
- `TURSO_AUTH_TOKEN`
- `TURSO_DATABASE_URL`
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REFRESH_TOKEN`

## Deploy
Vercel (`vercel --prod`). Set the variables above in the project settings.

## Status & open items
See `HANDOFF.md` if present; otherwise open an issue.

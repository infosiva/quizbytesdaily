# HANDOFF — design apply (quizbytesdaily)
**Date:** 2026-10-06  **Status:** COMPLETE (files only, uncommitted)
**Goal:** Apply design system; hub can switch palette, layout archetype, bg animation at runtime.

## DESIGN LOCK
archetype: travel-magazine (full-bleed, masonry cards) | bg #14091c | accent #d946ef (free) | logo: quiz card glyph, 'Quiz' accent | bgAnimation default: aurora

## Steps
- [x] design-lock  - [x] palette-registry  - [x] logo (icon.svg, apple-icon.tsx, components/Logo.tsx)  - [x] icon.tsx -> icon.tsx.bak
- [x] theme-loader wired in layout (loadSiteTheme, buildThemeStyleTag, buildGa4Snippet, data-layout, AnimatedBg)
- [x] globals.css -> CSS vars; remove insecure http trackers / fake data
- [x] build + 375/1280 screenshots

## AI platform pillars
Chat route only (no new AI feature): free chain Groq -> Gemini -> Cerebras, graceful fallback. Other pillars exempt (no new AI scope).


## OWASP LLM Top 10 dispositions (gate item 45, 2026-10-07; list recalled from memory, unverified)
- LLM01 prompt injection: lib/guard.ts present, NOT yet wired into routes; no output filtering or tool sandbox review done. PARTIAL.
- LLM02 sensitive info disclosure: `redact()` helper available; not applied to every log. PARTIAL.
- LLM04/10 DoS / unbounded consumption: per-IP rate limit where present; token budgets not enforced. PARTIAL.
- LLM05 improper output handling: model output rendered as text; not audited for HTML sinks. UNVERIFIED.
- LLM06 excessive agency: no tool-calling agents audited. UNVERIFIED.
- Others (supply chain, poisoning, embeddings, misinformation): not assessed.


## ANIMATED SCOPE (gate items 19/21, derived from code 2026-10-07)
- Moves: AnimatedBg (ambient hero/background); CSS keyframes: blink-cursor, ds-float, ds-shift, fadeInUp, floatBurst, gateSlideUp, glowPulse, progress-indeterminate; transitions on interactive elements.
- Trigger: page load (ambient) and hover/press (interactive). Reduced motion: honoured via prefers-reduced-motion block.
- STATUS: scope documented from existing code only. Skill-stack passes (ui-ux-pro-max, emil-design-eng, impeccable critique, review-animations) and 375/1280 screenshot review are NOT yet run for this app. Item 21 stays OPEN until they are.

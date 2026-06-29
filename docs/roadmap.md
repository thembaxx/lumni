# Lumni — Full Product Roadmap

**Last updated:** 2026-06-29

---

## ✅ Phase 1: Core Learning Loop (Completed)

| #   | Feature                                                                             | Status  |
| --- | ----------------------------------------------------------------------------------- | ------- |
| 1.1 | Gamification Runtime — XP, levels, streaks, achievements, daily challenges          | ✅ Done |
| 1.2 | Quiz → Competency — `CompetencyService.update()` on quiz completion                 | ✅ Done |
| 1.3 | Quiz → Gamification — XP, streak, achievements on quiz finish                       | ✅ Done |
| 1.4 | Flashcards → Competency + XP — "I Know This" updates competency                     | ✅ Done |
| 1.5 | `/exam/[id]` Session Player — Two-mode past paper player with timer, hints, results | ✅ Done |
| 1.6 | Competency/Mastery Dashboard UI — Subject mastery %, topic heatmap, weak area cards | ✅ Done |

## ✅ Phase 2: Content & Discovery (Completed)

| #   | Feature                                                                          | Status  |
| --- | -------------------------------------------------------------------------------- | ------- |
| 2.1 | `/past-papers` Browse Page — Filter by subject/year/session/language             | ✅ Done |
| 2.2 | `/study-plan` Route — Algorithmic planner with competency-driven recommendations | ✅ Done |
| 2.3 | Exam → All Systems — XP multiplier, competency update, study plan suggestions    | ✅ Done |

## ✅ Phase 3: Engagement & Polish (Completed)

| #   | Feature                                                                              | Status  |
| --- | ------------------------------------------------------------------------------------ | ------- |
| 3.1 | Marketing Landing Page (`/`) — Hero, features, how-it-works, CTA                     | ✅ Done |
| 3.2 | Gamification UI Everywhere — Level badge, streak flame, achievement toasts, confetti | ✅ Done |
| 3.3 | Push Notifications — Web Push API, onboarding subscribe, reminders                   | ✅ Done |
| 3.4 | Text-to-Speech — "Listen" button on questions/explanations/flashcards                | ✅ Done |
| 3.5 | Onboarding → Settings Flow — Choices pre-populate settings                           | ✅ Done |
| 3.6 | Dashboard Enhancements — Weak topic quick action, study plan, achievements           | ✅ Done |

## ✅ Phase 4: Production Readiness (Completed)

| #   | Feature                                                                               | Status  |
| --- | ------------------------------------------------------------------------------------- | ------- |
| 4.1 | Observability — Sentry error tracking (client + server + edge)                        | ✅ Done |
| 4.2 | Progress Export — PDF/JSON report                                                     | ✅ Done |
| 4.3 | Offline UX — Service worker, offline fallback, pending sync badge, offline quiz packs | ✅ Done |
| 4.4 | Wrong Answer Journal — Auto-collect, review flow, flashcard feedback                  | ✅ Done |
| 4.5 | Bookmarking + Notes — Save questions, add personal notes                              | ✅ Done |

## ✅ Phase 5: Architecture Consolidation (Completed)

| #   | Feature                                                                                          | Status  |
| --- | ------------------------------------------------------------------------------------------------ | ------- |
| 5.1 | Flashcard engine consolidation — `src/lib/flashcard-engine/`                                     | ✅ Done |
| 5.2 | Generic route handler factory — `createRouteHandler()` with auth/validation/error wrap           | ✅ Done |
| 5.3 | Services barrel — All 10 services + `ServiceResult<T>`                                           | ✅ Done |
| 5.4 | Tools directory reorganization — Domain subdirs (core, math, science, scheduling, communication) | ✅ Done |
| 5.5 | Design system enforcement — No arbitrary values, `PageContainer`, `gap-*`, `--z-*` tokens        | ✅ Done |

## ✅ Phase 6: P1 Features (Completed)

| #   | Feature                                                                      | Status  |
| --- | ---------------------------------------------------------------------------- | ------- |
| 6.1 | Exam_dates Appwrite write path — Background job sync                         | ✅ Done |
| 6.2 | E2E tests — Playwright smoke tests (homepage, quiz, exam-dates)              | ✅ Done |
| 6.3 | Offline AI Quiz Packs — Downloadable for load-shedding resilience            | ✅ Done |
| 6.4 | Storybook — Component library documentation                                  | ✅ Done |
| 6.5 | Swipeable flashcard deck — Tinder-style interaction, SM-2 quality picker     | ✅ Done |
| 6.6 | Full-screen immersive mode — Distraction-free quiz/exam with auto-nav-hiding | ✅ Done |

## ✅ Phase 7: Hardening & Polish (Completed)

| #    | Feature                                                                                          | Status  |
| ---- | ------------------------------------------------------------------------------------------------ | ------- |
| 7.1  | Mock Exam Mode — Timed past-paper simulation with exam hall conditions                           | ✅ Done |
| 7.2  | Redis-backed RateLimiter — Lua-atomic rate limiting with Upstash Redis                           | ✅ Done |
| 7.3  | Effect TS adoption — Bounded at AI client + rate-limiter; provider chain via Context.Tag + Layer | ✅ Done |
| 7.4  | Knowledge graph + study guides — AI-generated topic dependency maps and structured guides        | ✅ Done |
| 7.5  | Ably real-time live sessions — Replaced Appwrite 15s-polling with real-time presence             | ✅ Done |
| 7.6  | Design system enforcement — No arbitrary values, PageContainer, gap-_, --z-_ tokens              | ✅ Done |
| 7.7  | TinyFish RAG engine — Web-grounded AI for solve + quiz generation                                | ✅ Done |
| 7.8  | WCAG a11y sweep — Focus rings, ARIA labels/tabs, aria-disabled, fieldset+legend, aria-live       | ✅ Done |
| 7.9  | Premium gating removal — All features free; login banners on auth-required pages                 | ✅ Done |
| 7.10 | Gamification for quality — 6 new achievements (mistake review, flashcard focus, etc.)            | ✅ Done |
| 7.11 | Codebase hardening — logError sweep, RedisStore atomicity, CI branch fix, quiz tests             | ✅ Done |

---

## 🔜 Next Up

| #   | Feature                                   | Priority | Description                                                |
| --- | ----------------------------------------- | -------- | ---------------------------------------------------------- |
| 8.1 | Shared subject color/abbreviation maps    | P2       | Extract from exam-calendar + exam-dates to shared location |
| 8.2 | Custom domain + production deployment     | P3       | Current: Vercel preview; needs custom domain               |
| 8.3 | OCR-based PDF scraping for DBE timetables | P3       | Automated exam date extraction                             |
| 8.4 | Live leaderboard (Appwrite Realtime)      | P3       | Social proof during study sessions                         |
| 8.5 | Cross-device sync layer                   | P2       | Design exploration underway (see decisions/)               |
| 8.6 | Unified STT engine                        | P2       | Provider abstraction over Deepgram + Whisper + Browser     |

---

## Synergies Map

```
                Quiz ◄─────── Past Papers
                 │  ▲              │
         ┌───────┤  │              │
         ▼       │  │              ▼
    Competency ──┤  │          Exam Session
    Engine       │  │           │       │
         │       │  │           │       │
         ▼       │  │           ▼       ▼
    Study Plan ──┘  │     Gamification ◄─┘
         │          │     (XP/Achievements)
         ▼          │           │
    Flashcards ─────┘           │
    (Swipeable)                  │
         │                      ▼
         ├── Offline Quiz ──── TTS
         │     Packs
         │
         └── Immersive Mode (Quiz/Exam)

    Onboarding ──► Settings ──► Dashboard (Hub) ◄── Push Notifications
                                          │
                                          ▼
                                    Offline Pack Manager
```

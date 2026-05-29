# Lumni — Full Product Roadmap

**Last updated:** 2026-05-29

---

## ✅ Phase 1: Core Learning Loop (Completed)

| # | Feature | Status |
|---|---------|--------|
| 1.1 | Gamification Runtime — XP, levels, streaks, achievements, daily challenges | ✅ Done |
| 1.2 | Quiz → Competency — `CompetencyService.update()` on quiz completion | ✅ Done |
| 1.3 | Quiz → Gamification — XP, streak, achievements on quiz finish | ✅ Done |
| 1.4 | Flashcards → Competency + XP — "I Know This" updates competency | ✅ Done |
| 1.5 | `/exam/[id]` Session Player — Two-mode past paper player with timer, hints, results | ✅ Done |
| 1.6 | Competency/Mastery Dashboard UI — Subject mastery %, topic heatmap, weak area cards | ✅ Done |

## ✅ Phase 2: Content & Discovery (Completed)

| # | Feature | Status |
|---|---------|--------|
| 2.1 | `/past-papers` Browse Page — Filter by subject/year/session/language | ✅ Done |
| 2.2 | `/study-plan` Route — Algorithmic planner with competency-driven recommendations | ✅ Done |
| 2.3 | Exam → All Systems — XP multiplier, competency update, study plan suggestions | ✅ Done |

## ✅ Phase 3: Engagement & Polish (Completed)

| # | Feature | Status |
|---|---------|--------|
| 3.1 | Marketing Landing Page (`/`) — Hero, features, how-it-works, CTA | ✅ Done |
| 3.2 | Gamification UI Everywhere — Level badge, streak flame, achievement toasts, confetti | ✅ Done |
| 3.3 | Push Notifications — Web Push API, onboarding subscribe, reminders | ✅ Done |
| 3.4 | Text-to-Speech — "Listen" button on questions/explanations/flashcards | ✅ Done |
| 3.5 | Onboarding → Settings Flow — Choices pre-populate settings | ✅ Done |
| 3.6 | Dashboard Enhancements — Weak topic quick action, study plan, achievements | ✅ Done |

## ✅ Phase 4: Production Readiness (Completed)

| # | Feature | Status |
|---|---------|--------|
| 4.1 | Observability — Sentry error tracking (client + server + edge) | ✅ Done |
| 4.2 | Progress Export — PDF/JSON report | ✅ Done |
| 4.3 | Offline UX — Service worker, offline fallback, pending sync badge, offline quiz packs | ✅ Done |
| 4.4 | Wrong Answer Journal — Auto-collect, review flow, flashcard feedback | ✅ Done |
| 4.5 | Bookmarking + Notes — Save questions, add personal notes | ✅ Done |

## ✅ Phase 5: Architecture Consolidation (Completed)

| # | Feature | Status |
|---|---------|--------|
| 5.1 | Flashcard engine consolidation — `src/lib/flashcard-engine/` | ✅ Done |
| 5.2 | Generic route handler factory — `createRouteHandler()` with auth/validation/error wrap | ✅ Done |
| 5.3 | Services barrel — All 10 services + `ServiceResult<T>` | ✅ Done |
| 5.4 | Tools directory reorganization — Domain subdirs (core, math, science, scheduling, communication) | ✅ Done |
| 5.5 | Design system enforcement — No arbitrary values, `PageContainer`, `gap-*`, `--z-*` tokens | ✅ Done |

## ✅ Phase 6: P1 Features (Completed)

| # | Feature | Status |
|---|---------|--------|
| 6.1 | Exam_dates Appwrite write path — Background job sync | ✅ Done |
| 6.2 | E2E tests — Playwright smoke tests (homepage, quiz, exam-dates) | ✅ Done |
| 6.3 | Offline AI Quiz Packs — Downloadable for load-shedding resilience | ✅ Done |
| 6.4 | Storybook — Component library documentation | ✅ Done |
| 6.5 | Swipeable flashcard deck — Tinder-style interaction, SM-2 quality picker | ✅ Done |
| 6.6 | Full-screen immersive mode — Distraction-free quiz/exam with auto-nav-hiding | ✅ Done |

---

## 🔜 Next Up

| # | Feature | Priority | Description |
|---|---------|----------|-------------|
| 7.1 | Mock Exam Mode | P2 | Timed past-paper simulation with exam hall conditions |
| 7.2 | Redis-backed RateLimiter + TokenTracker | P2 | Survives server restarts, multi-instance support |
| 7.3 | Shared subject color/abbreviation maps | P2 | Extract from exam-calendar + exam-dates to shared location |
| 7.4 | Custom domain + production deployment | P3 | Current: Vercel preview; needs custom domain |
| 7.5 | OCR-based PDF scraping for DBE timetables | P3 | Automated exam date extraction |
| 7.6 | Live leaderboard (Appwrite Realtime) | P3 | Social proof during study sessions |

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

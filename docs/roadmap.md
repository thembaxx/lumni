# Lumni — Full Product Roadmap

## Phase 1: Core Learning Loop

| # | Feature | Description | Depends On |
|---|---------|-------------|-----------|
| 1.1 | Gamification Runtime | Zustand store + `useGamification` hook. XP, levels, streaks, achievements, daily challenges. Dexie persistence + Appwrite sync. | — |
| 1.2 | Quiz → Competency | Call `CompetencyService.update()` on quiz completion per subject/topic/bloom | Competency Engine (built) |
| 1.3 | Quiz → Gamification | Award XP, check streak, check achievements when quiz finishes | 1.1 |
| 1.4 | Flashcards → Competency + XP | "I Know This" updates competency. Session complete awards XP | 1.1, 1.2 |
| 1.5 | `/exam/[id]` Session Player | Two-mode past paper player. Timer (timed mode), hints (practice mode). MCQ + written. Auto-grade MCQs, flag open-ended. Results view (score/time/breakdown). Connect to competency + XP on completion. | Exam parser (built) |
| 1.6 | Competency/Mastery Dashboard UI | Subject mastery % + level cards. Topic-level heatmap. Weak area cards. New dashboard tab or enhanced AI tab. | 1.2, 1.5 |

## Phase 2: Content & Discovery

| # | Feature | Description | Depends On |
|---|---------|-------------|-----------|
| 2.1 | `/past-papers` Browse Page | Filter by subject/year/session/language. Search. Grid cards → launch exam session. Reuse `useExams`, `ExamCard`. | 1.5 |
| 2.2 | `/study-plan` Route | Route for existing `StudyPlanner`. Hook into `PathEngine` for competency-driven recommendations. Default schedule from onboarding. | 1.2 |
| 2.3 | Exam → All Systems | Exam completion updates competency + awards XP (higher multiplier). Weak areas → study plan suggestions. | 1.1, 1.2, 1.5 |

## Phase 3: Engagement & Polish

| # | Feature | Description | Depends On |
|---|---------|-------------|-----------|
| 3.1 | Marketing Landing Page (`/`) | Hero, features grid, how-it-works steps, CTA, footer. Replace current 2s-splash. | — |
| 3.2 | Gamification UI Everywhere | Level badge + XP bar in Top Nav. Streak flame on Dashboard. Daily challenges card. Achievement unlock toasts. Level-up confetti. | 1.1 |
| 3.3 | Push Notifications | Web Push API. Subscribe on onboarding. Streak reminders, study plan alerts, daily challenge. | 1.1 |
| 3.4 | Text-to-Speech | "Listen" button on questions/explanations/flashcards. Language selector. Reuse `/api/tts`. | — |
| 3.5 | Onboarding → Settings Flow | Onboarding choices (subjects, APS, schedule) pre-populate Settings. Changing subjects propagates everywhere. | — |
| 3.6 | Dashboard Enhancements | Weak topic quick action. Today's study plan. Achievement showcase. | 1.6, 2.2 |

## Phase 4: Production Readiness

| # | Feature | Description |
|---|---------|-------------|
| 4.1 | Observability | Error tracking (Sentry), AI latency monitoring, usage analytics |
| 4.2 | Progress Export | PDF/JSON report: subjects, questions, correct rate, streak, level, achievements |
| 4.3 | Offline UX | Smarter service worker caching, offline fallback UI, pending sync badge |
| 4.4 | Wrong Answer Journal | Auto-collect mistakes → dedicated review flow → flashcards feedback |
| 4.5 | Bookmarking + Notes | Save questions, add personal notes |

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
         │                      ▼
         └────────── TTS ──────┘

    Onboarding ──► Settings ──► Dashboard (Hub) ◄── Push Notifications
```

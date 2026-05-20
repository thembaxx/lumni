# TODO

## Done (May 2026)

### Phase 1: Core Learning Loop
- [x] **1.1 Gamification Runtime** — hook-based XP/levels/streaks/achievements/daily challenges with localStorage persistence
- [x] **1.2 Quiz → Competency** — `trackQuestionResult()` → `CompetencyService.update()` → Dexie + Appwrite sync
- [x] **1.3 Quiz → Gamification** — XP/streak/achievements awarded on quiz finish (dashboard, exam, flashcards)
- [x] **1.4 Flashcards → Competency + XP** — SM-2 + AI sources, competency tracking, gamification, wrong answer journal
- [x] **1.5 `/exam/[id]` Session Player** — Two-mode (timed/practice) with timer, hints, MCQ/written, flagging, navigator palette, results view, all downstream systems wired
- [x] **1.6 Competency Dashboard UI** — Radial charts, per-subject/topic mastery breakdown, auto-hides when empty

### Phase 2: Content & Discovery
- [x] **2.1 `/past-papers` Browse Page** — Full filter UI exists at `/dashboard/exams` (search, subject, year, session). `/past-papers` currently redirects.
- [x] **2.2 `/study-plan` Route** — Algorithmic planner, manual CRUD, calendar export, dashboard integration, competency-driven recommendations
- [x] **2.3 Exam → All Systems** — Competency + XP + wrong answers + flashcards + study plan on exam submit

### Phase 3: Engagement & Polish
- [x] **3.1 Marketing Landing Page** — Hero, features grid, how-it-works steps, CTA, footer. Full production page at `/`
- [x] **3.3 Push Notifications** — Full service worker, API, notification service, dashboard nudge, settings tab
- [x] **3.4 Text-to-Speech** — Browser + server TTS, wired into questions and flashcards
- [x] **3.5 Onboarding → Settings Flow** — Onboarding selections (study time, notifications) pre-populate Settings
- [x] **3.6 Dashboard Enhancements** — Weak topic focus card, study plan overview, achievement showcase

### Phase 4: Production Readiness
- [x] **4.3 Offline UX** — Service worker, offline fallback UI, offline badge, pending sync badge, IndexedDB persistence
- [x] **4.4 Wrong Answer Journal** — Full journal with 6 error types, dedicated review page, flashcard feedback
- [x] **4.5 Bookmarking + Notes** — Dedicated pages, in-quiz bookmarking, note attachment

### Previous Sessions (Sessions 1-6)
- [x] Exam scoring: `isCorrect` type fix, exam parser fixed
- [x] Exam sessions: `exam_sessions` collection (not `exam_papers`)
- [x] Achievements: migrated to `StoredAchievement[]` with auto-migration
- [x] Upload page text leak fixed
- [x] Auth: `DEFAULT_USER_ID` removed, `stats-row.tsx` wired to `useAuth()`
- [x] Loading screen timeout leak fixed
- [x] Rate limiting: `withRateLimit` wrapper, 16 routes secured
- [x] Backoff consolidated into `src/lib/shared/backoff.ts`
- [x] Exam wrong answers captured, flashcard auto-generation, Review Mistakes mode
- [x] Exam answer review with expand/collapse, user vs correct answer
- [x] Unified competency tracking across exam/flashcards/dashboard
- [x] Dashboard orchestration: analytics-sync background job
- [x] Flashcard merge: SM-2 due cards before AI fallback
- [x] Content quality feedback: `QuestionRating` Dexie table, `StarRating`, admin dashboard
- [x] Unified search across Dexie questions + wrong answers + flashcards + notes
- [x] Social leaderboard service + component
- [x] Premium gating: `PremiumProvider`, `usePremium()`, `/premium` page
- [x] Competency → quiz pipe with personalized prompts
- [x] Wrong-answer → targeted quiz button
- [x] Study planner activation with algorithm
- [x] SW registration + PWA components
- [x] AI budget bypass for `/api/chat/image`
- [x] Admin routes auth on all 8 admin routes
- [x] User-scoped data auth (exam-sessions, analytics, referral)
- [x] Error-swallowing routes fixed
- [x] `engine/budget` error handling
- [x] Search01Icon text leak fix
- [x] `tsconfig.json` int-test exclusion
- [x] PWA cleanup: unused SVGs, worker-src, icon sizes, apple-touch-icon
- [x] Flashcard legacy localStorage → SM-2 Dexie migration
- [x] `/flashcards/browse` page with search/filter/pagination
- [x] CSV import/export for flashcards
- [x] Study planner: plan-aware reminders, iCal export, recurring sessions, Appwrite sync
- [x] Content moderation: question flagging API, admin review queue, auto-regen
- [x] Real leaderboard from Appwrite aggregation
- [x] Activity feed service
- [x] Admin panels: users, content, notifications, analytics
- [x] Code quality: dead code removed, unused vars/imports, "use client" fixes, empty handlers
- [x] Accessibility: bottom-nav, progress-dots, animated-tabs, segmented-control, profile-tab, study-planner
- [x] Performance: named imports, Image sizes, Suspense skeletons, memory leak fixes
- [x] Architecture: empty-state merge, study-set-creator split, quiz-view split, TabSwitcher, AppErrorBoundary, lazy-loaded nav, streaming SSR, API error standardization, constraint-based planner

---

## Remaining

### P0 — Phase 2 Cleanup
- [ ] **2.1 `/past-papers` direct route** — Make `/past-papers` host the browse UI directly instead of redirecting to `/dashboard/exams`. Add language filter (PaperListing type already has `language` field).

### P0 — Gamification UI Polish (3.2)
- [ ] **Wire LevelUp modal** — `level-up.tsx` modal exists but is never triggered. Wire it into `useGamification` hook when `addXp()` causes a level change.
- [ ] **Wire AchievementUnlock modal** — `achievement-unlock.tsx` modal exists but is never triggered. Wire it when `checkAndUnlockAchievements()` unlocks a new achievement.
- [ ] **Wire level-up confetti** — Confetti component used in quiz/exam/flashcard results but not auto-triggered on level-up events.

### P1 — Observability (4.1)
- [ ] **Error tracking (Sentry)** — No Sentry integration exists. Add `@sentry/nextjs` and wire error reporting.
- [ ] **AI latency monitoring** — `engine-analytics.ts` has `duration` field but never populates it. Add timing instrumentation around AI calls.
- [ ] **Usage analytics dashboard** — Analytics are collected but there's no admin-facing dashboard to view them.

### P1 — Progress Export (4.2)
- [ ] **PDF export** — JSON export exists; add PDF generation (e.g., `@react-pdf/renderer` or server-side) for progress reports.

### P1 — Architectural Weak Points
- [ ] **Persist daily AI call token budget** — Migrate `dailyCallTracker` from in-memory Maps to shared KV-store or Appwrite collection (serverless container recycles reset counters).
- [ ] **Secure auth rate limiting** — Move auth rate limiting from client-side in-memory Map to server-side (Appwrite/Redis).
- [ ] **Validate regenerated questions** — Strengthen `"question-regen"` job processor to validate structural consistency (option IDs, acceptable answers, diagrams).
- [ ] **Transactional synced flags** — Prevent eager deletion of local IndexedDB progress data in `flushOfflineData`. Keep local data intact, mark as synced, delete only after background sync succeeds.

### P2 — Anonymous User Migration (complete on sign-up)
- [ ] **Sync competency history** — Migrate offline Bloom competency records to Appwrite on sign-up.
- [ ] **Sync spaced repetition cards** — Sync offline SM-2 flashcard profiles to Appwrite on sign-up.
- [ ] **Sync wrong answer journal** — Synchronize wrong answers and content ratings to Appwrite on sign-up.
- [ ] **Sync chat history** — Migrate AI tutor chat messages to Appwrite on sign-up.

### P2 — Subject Sync Logic
- [ ] **Implement syncSubject Actions** — Replace mock methods in `src/lib/server/sync-actions.ts` with real offline-sync logic for subjects metadata and question banks.

### P2 — Offline PWA Enhancements
- [ ] **Offline past paper PDF downloader** — Allow caching past exam papers locally for offline viewing.
- [ ] **Exam session recovery** — Auto-save timed exam sessions to IndexedDB for crash/reload recovery.

### P3 — System Unifications
- [ ] **Consolidate spaced repetition** — Merge overlapping SM-2 logic between `spaced-rep-service.ts` and `spaced-repetition.ts`.
- [ ] **Standardize difficulty types** — Unify capitalized and lowercase difficulty types into shared normalized enum.
- [ ] **Shared rate-limit provider** — Combine RateLimiter cores for token-tracker, APIs, and auth routes.

### P3 — AI Personalization & Retention
- [ ] **Bloom's Taxonomy recommendations** — Dashboard widget recommending learning formats based on topic Bloom competency.
- [ ] **Spaced repetition due notifications** — Push reminders when SM-2 cards become due for review.

### P3 — Custom Domain
- [ ] **Replace Vercel domain** — Change `https://lumni-psi.vercel.app` to custom domain in referral links.

### Test Coverage
- [ ] `src/lib/db/` (15 files) — persistence layer
- [ ] `src/lib/sync/` — offline/online sync handler
- [ ] `src/lib/exams/` — marker client, exam paper sync
- [ ] `src/lib/referral/` — client, service, types
- [ ] `src/lib/server/` (7 files) — server actions
- [ ] `src/lib/ai/` — index.ts, types.ts, with-budget.ts, providers
- [ ] `src/lib/visual-engine/` — prompts, resolvers, renderers
- [ ] Integration tests (orchestrator ↔ engine pipelines)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Component tests (`src/components/`)

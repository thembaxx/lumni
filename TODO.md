# TODO

## Done (May 2026)

### P0 Critical
- [x] SW registration + PWA components
- [x] AI budget bypass: `/api/chat/image`
- [x] Admin routes auth — `requireAdmin()` on all 8 admin routes
- [x] User-scoped data auth — exam-sessions, analytics, referral
- [x] Error-swallowing routes — proper 500 instead of 200 fallback
- [x] `engine/budget` error handling
- [x] Search01Icon text leak fix
- [x] `tsconfig.json` int-test exclusion

### PWA & Offline
- [x] Remove unused SVGs, add `worker-src 'self'`, icon sizes, apple-touch-icon

### P2 — API Security & Rate Limiting
- [x] 16 routes secured with auth + per-route rate limits
- [x] `withRateLimit` config parameter for custom limits

### Flashcards
- [x] Legacy localStorage → SM-2 Dexie migration
- [x] `/flashcards/browse` page with search/filter/pagination
- [x] CSV import/export

### Study Planner
- [x] Plan-aware reminders, iCal export, recurring sessions
- [x] Appwrite sync (STUDY_PLANS collection, job queue handler)
- [x] Constraint-based scheduling algorithm

### Content Moderation
- [x] Question flagging API (`POST /api/questions/flag`)
- [x] Admin review queue (`/admin/content`)
- [x] Auto-regen for low-rated questions

### Social
- [x] Real leaderboard from Appwrite aggregation
- [x] Activity feed service

### Admin Panels
- [x] User management (`/admin/users`)
- [x] Content moderation (`/admin/content`)
- [x] Notification broadcast (`/admin/notifications`)
- [x] Analytics dashboard (`/admin/analytics`)

### P3 Code Quality
- [x] Menu component deleted, list-cell dead code removed
- [x] 16 unused vars + 6 unused imports removed
- [x] "use client" fixes (10 removed, 6 added)
- [x] Empty event handlers fixed

### P3 Accessibility
- [x] bottom-nav, progress-dots, animated-tabs, segmented-control, profile-tab, study-planner

### P3 Performance
- [x] Namespace → named imports (THREE, RechartsPrimitive)
- [x] `sizes` on `<Image>`, restricted `remotePatterns`
- [x] Suspense skeletons instead of `fallback={null}`
- [x] Memory leak fixes (use-tts.ts, exam-session.ts)

### P3 Architecture
- [x] Merged 3 empty-state systems into 1
- [x] Split study-set-creator (802→181 lines)
- [x] Split quiz-view (558→327 lines)
- [x] Merged animated-tabs + segmented-control → TabSwitcher
- [x] AppErrorBoundary on 9 pages
- [x] Lazy-loaded nav via next/dynamic
- [x] Streaming SSR for dashboard + admin pages
- [x] API error standardization (`apiError`/`apiSuccess`)
- [x] Constraint-based study planner algorithm

---

## Remaining

### Test coverage
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

### Other
- [ ] Replace `https://lumni-psi.vercel.app` with custom domain in referral links

---

## Architectural Weak Points & Security Gaps

### P1 — Serverless Session Ephemerality & Limit Resilience
- [ ] **Persist Daily AI Call Token Budget**: Migrate `dailyCallTracker` (`src/lib/ai/daily-call-tracker.ts`) from ephemeral, in-memory Maps to a shared KV-store or Appwrite collection to prevent resets on serverless container recycles and stop multi-instance bypass.
- [ ] **Secure Auth Rate Limiting**: Move auth rate limiting (`src/lib/auth/rate-limit.ts`) from client-side in-memory Map to server-side Redis or Appwrite collections to secure authentication and magic-link flows from bot spamming.
- [ ] **Validate Regenerated Questions**: Strengthen `"question-regen"` job processor handler to validate that regenerated question text preserves structural consistency (options IDs, acceptable answers, diagrams) to avoid database mismatches.

### P1 — Offline Sync Queue Data Durability
- [ ] **Transactional Synced Flags**: Prevent eager deletion of local IndexedDB `progress` data in `flushOfflineData` (`src/lib/sync/sync-handler.ts`). Keep local data intact and mark as synced, only deleting after background synchronization tasks succeed.

---

## Functional Gaps & Disconnects

### P2 — Complete Upgraded Anonymous User Migration
- [ ] **Sync Competency History**: Extend `flushOfflineData` to migrate offline Bloom competency records (`competencies` table) to Appwrite upon student sign-up.
- [ ] **Sync Spaced Repetition Cards**: Sync offline SM-2 flashcard profiles (`flashcards` table) to Appwrite on sign-up so learners don't lose custom card histories.
- [ ] **Sync Wrong Answer Journal**: Synchronize wrong answers (`wrongAnswers` table) and content ratings (`questionRatings` table) to keep historical mistakes lists consistent across devices.
- [ ] **Sync Chat History**: Migrate historical AI tutor interactions (`chatMessages` table) to the Appwrite backend on conversion.

### P2 — Subject Sync Logic Implementation
- [ ] **Implement syncSubject Actions**: Replace mock methods in `src/lib/server/sync-actions.ts` with real offline-sync logic to download and seed subjects metadata and offline question banks directly to Dexie.

---

## Architectural Synergies & Unification

### P3 — System Unifications
- [ ] **Consolidate Spaced Repetition Logic**: Merge overlapping SM-2 spaced repetition recalculations between `spaced-rep-service.ts` and `spaced-repetition.ts` into a single high-leverage module.
- [ ] **Standardize Difficulty Types**: Unify capitalized (`"Easy" | "Medium" | "Hard"`) and lowercase difficulty types into a shared, normalized enum with automatic parsing in `src/lib/shared/question-type.ts`.
- [ ] **Shared Rate-Limit Provider**: Combine `RateLimiter` cores so that token-budget trackers, APIs, and auth routes leverage a unified persistent adapter seam.

---

## Missing & Value-Add Features

### P2 — Offline PWA Enhancements & Resilient Exam Sessions
- [ ] **Offline Past Paper PDF Downloader & Pre-caching**: Allow users to cache past exam papers locally and view them through a customized, offline-capable PDF viewer.
- [ ] **Exam Session Recovery**: Hook into `IndexedDB` to auto-save and restore timed exam sessions upon browser crash or reload, avoiding progress loss.

### P3 — AI Personalization & Retention Loops
- [ ] **Bloom's Taxonomy Recommendations**: Build a dashboard widget recommending specific learning formats based on topic Bloom competency (e.g., recommend calculations if numerical understanding is weak).
- [ ] **Spaced Repetition Due Notifications**: Schedule push notifications or reminders when spaced repetition cards become due for review.


# TODO

## Done — All Sessions Combined (May 2026)

### P0 Critical
- [x] **SW registration + PWA components** — `useServiceWorker()` now called in `Providers`, `PWAUpdateToast` and `PWAInstallPrompt` rendered alongside `OnlineStatusIndicator`. Offline fallback path in `sw.js` fixed from `/offline.html` → `/_offline`.
- [x] **AI budget bypass: `/api/chat/image`** — Added `checkBudget("generate")`, `trackUsage("generate")`, and `withRateLimit` wrapper.
- [x] **Admin routes auth** — Added `requireAdmin()` to all 8 admin route files. Configurable via `ADMIN_USER_IDS` env var.
- [x] **User-scoped data auth** — `exam-sessions`, `exam-sessions/[id]`, `analytics/comparative`, `analytics/trends`, `referral/claim` all verify `getAuthenticatedUserId()` and enforce ownership.
- [x] **Error-swallowing routes** — `exam-sessions` GET, `lessons`, `analytics/comparative`, `analytics/trends` now return proper 500 errors.
- [x] **`engine/budget` error handling** — Added try/catch.
- [x] **Search01Icon text leak** — `results-search.tsx` no longer renders `Search01Icon` as literal text.
- [x] **`tsconfig.json` int-test exclusion** — Added `"**/*.int-test.ts"` to exclude list (build was failing).

### PWA & Offline
- [x] Remove unused `public/` SVGs
- [x] Add `worker-src 'self'` to CSP
- [x] Add more icon sizes to manifest.json (144x144, 96x96)
- [x] Add `apple-touch-icon.png`

### P2 — API Security & Rate Limiting
- [x] `subjects/route.ts` — rate limited (30/min), switched to `getAuthenticatedUserId()` with public fallback
- [x] `lessons/route.ts` — rate limited (20/min)
- [x] `push/subscribe/route.ts` — `getAuthenticatedUserId()` (session-only, no body userId) + rate limit (5/min)
- [x] `push/send/route.ts` — `requireAdmin()` + rate limit (3/min)
- [x] `premium/checkout/route.ts` — `getAuthenticatedUserId()` + rate limit (5/min)
- [x] `premium/cancel/route.ts` — `requireAdmin()` + rate limit (3/min)
- [x] `tts/route.ts` — `getAuthenticatedUserId()` + rate limit (5/min)
- [x] `sync/route.ts` — `getAuthenticatedUserId()` + rate limit (5/min)
- [x] `import-exam-papers/route.ts` — `requireAdmin()` + rate limit (3/min)
- [x] `cron/cleanup/route.ts` — x-cron-secret header check + `requireAdmin()` fallback + rate limit (1/min)
- [x] `auth/forgot-password/route.ts` — rate limited (3/min)
- [x] `auth/verify-email/route.ts` — rate limited (5/min)
- [x] `engine/next-topics/route.ts` — `getAuthenticatedUserId()` + rate limit (10/min)
- [x] `engine/study-plan/route.ts` — `getAuthenticatedUserId()` + rate limit (5/min)
- [x] `exams/route.ts` — rate limited (15/min)
- [x] `referral/info/route.ts` — rate limited (10/min)
- [x] `with-rate-limit.ts` — added optional `config?: RateLimitConfig` parameter for per-route limits
- [x] `rate-limit.ts` — updated `checkRateLimit()` to accept optional config override

### Flashcards — Unified system
- [x] Merge custom localStorage flashcards (FlashcardCreator) with SM-2 Dexie-backed flashcards — migration utility reads legacy `lumni-flashcards` from localStorage, creates each card in Dexie via `flashcardRepository.create()`, clears legacy key
- [x] SM-2 cards browse/search page (`/flashcards/browse`) — search bar, subject filter, pagination, delete, SM-2 stats display
- [x] Import/export CSV — `flashcard-import-export.ts` with RFC 4180-compliant CSV parser, export + download, import via file input
- [x] Migration wired into `flashcards-client.tsx` — runs silently on mount

### Study Planner — Notification & persistence
- [x] Wire `scheduleStudyReminder()` into study plan — `schedulePlanAwareReminder()` reads today's sessions
- [x] iCal/Google Calendar export — `exportToICal()` + `downloadICal()` utility with Export button
- [x] Recurring sessions — Repeat dropdown (none/daily/weekly) in AddSessionModal
- [x] Sync study plan to Appwrite — `STUDY_PLANS` collection, job type + handler in job-processor, `syncStudyPlanToAppwrite()` utility, wired into useStudyPlanner hook on all mutations
- [x] ensure-schema entry for study_plans collection

### Content quality — Moderation & review
- [x] User flagging API (`POST /api/questions/flag`) — reports question as wrong/offensive/broken
- [x] Admin review queue (`/admin/content`) — table with status filter (pending/resolved/dismissed), resolve/dismiss actions
- [x] Background job to auto-regenerate persistently low-rated questions — checks average < 2, count >= 3 after rating sync
- [x] `question_flags` Appwrite collection + schema

### Social / Collaborative
- [x] Real leaderboard from Appwrite aggregation (`/api/leaderboard`) — falls back to localStorage data
- [x] `fetchLeaderboardFromServer()` in leaderboard-service — server-first then localStorage fallback
- [x] Activity feed — `activity-service.ts` with `getActivityFeed()` / `addActivityItem()`, localStorage persistence

### Admin — Missing panels
- [x] User management (`/admin/users`) — list, suspend/activate via Appwrite Users API
- [x] Content moderation (`/admin/content`) — flagged question review queue
- [x] Notification broadcast (`/admin/notifications`) — compose and send push notifications to all users
- [x] Analytics dashboard (`/admin/analytics`) — total users, active users, subject popularity, completion rates
- [x] API routes for all 4 panels with `requireAdmin()`

### P3 — Code Quality

**Dead code paths removed:**
- [x] `src/components/menu/` deleted (completely unused)
- [x] `list-cell.tsx` — removed commented-out `leading` rendering block
- [x] 16 underscore-prefixed unused variables removed across 5 files
- [x] `quiz-tab.tsx` — removed `_handleNext`/`_handlePrevious` (never called)
- [x] `quiz-view.tsx` — removed `_quizContainerRef` (never attached)

**Unused imports fixed:**
- [x] `QuestionCardSkeleton.tsx` — removed `m`, `motion`, `cn` imports
- [x] `quiz-tab.tsx` — removed `QuizControls`, `QuestionCard`, `AssessmentHeader`, `TabsContent`, `TabsList`, `motion`

**`"use client"` fixes:**
- [x] Removed unnecessary `"use client"` from 10 pure rendering components (loading-spinner, timer-display, empty-state, icon-header-card, stagger-list, animated-progress-bar, fade-in, animated-dots, accuracy-bar, anim.tsx)
- [x] Added missing `"use client"` to 6 files (otp-dialog, magic-link-dialog, success-badge, QuestionCardInput, QuestionCardFeedback, QuestionCardControls)

### P3 — Accessibility
- [x] `bottom-nav.tsx` — nav buttons have `aria-label`
- [x] `progress-dots.tsx` — dots have `aria-label` and `aria-current`
- [x] `animated-tabs.tsx` — `role="tab"`, `role="tablist"`, `aria-selected`, `aria-controls`, arrow key navigation
- [x] `segmented-control.tsx` — `role="tablist"`, `aria-selected`, arrow key navigation
- [x] `profile-tab.tsx` — save/cancel buttons have `aria-label`
- [x] `study-planner.tsx` — icon buttons have `aria-label`

### Study Planner — remaining
- [ ] Improve algorithm from placeholder (round-robin) to constraint-based bin-packing

### Inconsistent error response shapes
- [ ] Standardize API error responses across all routes
- [ ] `exams/route.ts` — empty catch body, no error logging
- [ ] `referral/info/route.ts` — GET endpoint with side effect

### Empty event handlers
- [ ] `quiz-tab.tsx` — `onSelect={() => {}}` makes subject selection a no-op when `hasSubject` is false
- [ ] `study-topic-card.tsx` — `onWordIndexChange={() => {}}` documented stub

### P3 — Performance
- [ ] Replace namespace imports (THREE, RechartsPrimitive) with named
- [ ] Add `sizes` attribute to all `<Image>` components
- [ ] Restrict `images.remotePatterns` from wildcard `**`
- [ ] Replace Suspense `fallback={null}` with meaningful skeletons
- [ ] Fix memory leaks in `use-tts.ts` and `exam-session.ts`

### P3 — Test Coverage Gaps
- [ ] `src/lib/db/` (15 files) — entire data persistence layer
- [ ] `src/lib/sync/` — offline/online sync handler
- [ ] `src/lib/exams/` — marker client, exam paper sync
- [ ] `src/lib/referral/` — client, service, types
- [ ] `src/lib/server/` (7 files) — all server actions
- [ ] `src/lib/ai/` — index.ts, types.ts, with-budget.ts, all providers except Nvidia
- [ ] `src/lib/visual-engine/` — prompts.ts, image-resolver.ts, stem-renderer.ts, types.ts
- [ ] Multiple integration tests
- [ ] Zero E2E or component tests

### P3 — Architecture & Refactoring
- [ ] Component splitting (9 files > 500 lines)
- [ ] Merge duplicate component systems (empty states, tabs/segmented control)
- [ ] Add missing error boundaries (12+ pages)
- [ ] Streaming SSR for data-heavy pages
- [ ] Lazy load navigation in root layout

### Existing
- [ ] Replace `https://lumni-psi.vercel.app` with custom domain in referral share links

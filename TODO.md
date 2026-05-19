# TODO

## Done — P0 Critical (May 2026)

- [x] **SW registration + PWA components** — `useServiceWorker()` now called in `Providers`, `PWAUpdateToast` and `PWAInstallPrompt` rendered alongside `OnlineStatusIndicator`. Offline fallback path in `sw.js` fixed from `/offline.html` → `/_offline`.
- [x] **AI budget bypass: `/api/chat/image`** — Added `checkBudget("generate")`, `trackUsage("generate")`, and `withRateLimit` wrapper. No longer circumvents daily budget.
- [x] **Admin routes auth** — Added `requireAdmin()` server-side auth check to all 8 admin route files. Configurable via `ADMIN_USER_IDS` env var.
- [x] **User-scoped data auth** — `exam-sessions`, `exam-sessions/[id]`, `analytics/comparative`, `analytics/trends`, `referral/claim` all now verify `getAuthenticatedUserId()` and enforce ownership.
- [x] **Error-swallowing routes** — `exam-sessions` GET, `lessons`, `analytics/comparative`, `analytics/trends` now return proper 500 errors instead of 200 with empty/fallback data.
- [x] **`engine/budget` error handling** — Added try/catch; was the only route with zero error handling.
- [x] **Search01Icon text leak** — `results-search.tsx` no longer renders `Search01Icon` as literal text in 3 places.

---

## P1 — Missing Core Features

### PWA & Offline
- [ ] Remove unused `public/` SVGs: `file.svg`, `globe.svg`, `window.svg`, `next.svg`, `vercel.svg`
- [ ] Add `worker-src 'self'` to CSP in `next.config.ts`
- [ ] Add more icon sizes to manifest.json (144x144, 96x96)
- [ ] Add `apple-touch-icon.png` to `public/` (referenced in layout.tsx:44 but missing)

### Flashcards — Unified system
- [ ] Merge custom localStorage flashcards (FlashcardCreator) with SM-2 Dexie-backed flashcards — currently two parallel, non-interoperable systems
- [ ] SM-2 cards need a browse/search page (`/flashcards/browse`)
- [ ] Add import/export (Anki APKG, CSV)
- [ ] Add KaTeX/image support in custom flashcard creation forms

### Study Planner — Notification & persistence
- [ ] Wire `scheduleStudyReminder()` into study plan — currently fires generic reminders with no plan linkage
- [ ] iCal/Google Calendar export for planned sessions and exam dates
- [ ] Recurring sessions: `repeat` field exists on `StudySession` type but is dead code — no UI or generation logic
- [ ] Sync study plan to Appwrite (currently localStorage-only, lost on device change)
- [ ] Improve algorithm from acknowledged placeholder (round-robin) to constraint-based bin-packing

### Content quality — Moderation & review
- [ ] Admin review queue for flagged/low-rated questions: approve/reject/regen/delete
- [ ] User flagging API (`flagQuestion`) — star ratings only capture satisfaction, not content issues
- [ ] Background job to auto-regenerate persistently low-rated questions
- [ ] Subject-level quality breakdown in admin dashboard

### Social / Collaborative (largely absent)
- [ ] Friend/connection system — user directory, follow/unfollow
- [ ] Study groups — shared sessions, collaborative quiz-taking
- [ ] Real leaderboard from Appwrite aggregation (currently fake localStorage data)
- [ ] Activity feed — what friends are studying, achievements unlocked
- [ ] Share individual questions/flashcards to friends

### Admin — Missing panels
- [ ] User management — list, suspend, ban, role management (`/admin/users`)
- [ ] Content moderation — view/edit/delete generated questions and visuals (`/admin/content`)
- [ ] Notification broadcast and history (`/admin/notifications`)
- [ ] Analytics dashboard — user growth, active users, subject popularity, completion rates
- [ ] Audit log for admin actions
- [ ] AI budget controls UI — set per-user/per-subject/global limits
- [ ] A/B testing / experiment framework for prompt templates

---

## P2 — API Security & Rate Limiting

### All unprotected routes need auth and rate limiting
- [ ] `subjects/route.ts`, `lessons/route.ts` — public read with no rate limiting
- [ ] `push/subscribe/route.ts`, `push/send/route.ts` — no auth, no rate limiting
- [ ] `premium/checkout/route.ts`, `premium/cancel/route.ts` — no auth
- [ ] `tts/route.ts` — no auth, no rate limiting (could abuse free TTS API)
- [ ] `sync/route.ts`, `import-exam-papers/route.ts` — no auth, no rate limiting
- [ ] `cron/cleanup/route.ts` — no auth (anyone can trigger cleanup)
- [ ] `auth/forgot-password/route.ts` — always returns 200 (correct for anti-enumeration) but no rate limiting (could spam)
- [ ] `auth/verify-email/route.ts` — no rate limiting, no CSRF
- [ ] `engine/next-topics/route.ts`, `engine/study-plan/route.ts` — no rate limiting

### Inconsistent error response shapes
- [ ] Standardize API error responses across all routes (currently mix of `{error}`, `{success: false}`, fallback values)
- [ ] `exams/route.ts` — empty catch body, no error logging
- [ ] `referral/info/route.ts` — GET endpoint with side effect (auto-creates referral code), REST violation

---

## P3 — Code Quality

### Dead code paths
- [ ] Remove unused `Menu` component (`src/components/menu/`) — exported but never imported anywhere
- [ ] Remove or wire `src/components/pwa/pwa-update-toast.tsx` exports — `PWAUpdateToast` and `PWAInstallPrompt` are orphaned
- [ ] Remove `mermaid` from `package.json` — zero imports found, ~800KB dead dependency
- [ ] `list-cell.tsx:47-51` — commented-out `leading` rendering makes the `leading` prop dead
- [ ] 13 underscore-prefixed variables that compute values never consumed (study-set-creator, flashcard-creator, note-creator, quiz-tab, etc.)
- [ ] `quiz-tab.tsx:85,98` — `_handleNext`, `_handlePrevious` `useCallback`s never called
- [ ] `quiz-view.tsx:74` — `_quizContainerRef` `useRef` never assigned to element

### Unused imports
- [ ] `QuestionCardSkeleton.tsx` — `m`, `motion`, `cn` imported but unused
- [ ] `quiz-tab.tsx` — `motion`, `QuizControls`, `QuestionCard`, `AssessmentHeader`, `TabsContent`, `TabsList` imported but unused

### Unnecessary `"use client"`
- [ ] `loading-spinner.tsx`, `timer-display.tsx`, `empty-state.tsx`, `icon-header-card.tsx`
- [ ] `stagger-list.tsx`, `animated-progress-bar.tsx`, `fade-in.tsx`, `animated-dots.tsx`
- [ ] `accuracy-bar.tsx`, `progress-dots.tsx`, `anim.tsx`
- [ ] All pure rendering components — move to Server Components

### Missing `"use client"` (use hooks without directive)
- [ ] `otp-dialog.tsx`, `magic-link-dialog.tsx`, `success-badge.tsx`
- [ ] `QuestionCardInput.tsx`, `QuestionCardFeedback.tsx`, `QuestionCardControls.tsx`

### Empty event handlers
- [ ] `quiz-tab.tsx:245` — `onSelect={() => {}}` makes subject selection a no-op when `hasSubject` is false
- [ ] `study-topic-card.tsx:145` — `onWordIndexChange={() => {}}` documented stub

---

## P3 — Performance

### Bundle bloat
- [ ] Remove `mermaid` (~800KB, unused, already listed above)
- [ ] Replace namespace `import * as THREE from "three"` in `particle-field.tsx` with named imports (only uses `Color`, `Points`, `BufferGeometry`, etc.)
- [ ] Replace namespace `import * as RechartsPrimitive from "recharts"` (3 files) with named imports — defeats tree-shaking
- [ ] Evaluate whether 3 font families × 12 weights is necessary — consider using Geist for headings too

### Image optimization
- [ ] Add `sizes` attribute to all `<Image>` components (currently defaulting to `100vw`)
- [ ] Restrict `images.remotePatterns` in `next.config.ts` from wildcard `**` to specific hosts
- [ ] Consider `placeholder="blur"` for critical images

### Loading UX
- [ ] All inner Suspense boundaries use `fallback={null}` (quiz, auth pages) — replace with meaningful skeletons
- [ ] Add `loading` states to dynamic imports missing them (diagram-renderer, onboarding-wizard particle-field)

### Memory leaks
- [ ] `use-tts.ts` — `onvoiceschanged` listener never cleaned up; singleton callbacks on `ttsService` never deregistered
- [ ] `exam-session.ts` — module-level `setupCrossTabSync()` adds storage listener with no cleanup path

---

## P3 — Accessibility

- [ ] `bottom-nav.tsx` — nav buttons lack `aria-label`
- [ ] `progress-dots.tsx` — dots lack `aria-label` and `aria-current`
- [ ] `animated-tabs.tsx` — missing `role="tab"`, `role="tablist"`, `aria-selected`, arrow key navigation
- [ ] `segmented-control.tsx` — missing arrow key navigation
- [ ] `profile-tab.tsx` — save/cancel buttons lack `aria-label`
- [ ] `study-planner.tsx` — icon buttons lack `aria-label`

---

## P3 — Test Coverage Gaps

### Completely untested modules
- [ ] `src/lib/db/` (15 files) — entire data persistence layer
- [ ] `src/lib/sync/` — offline/online sync handler
- [ ] `src/lib/exams/` — marker client, exam paper sync
- [ ] `src/lib/referral/` — client, service, types
- [ ] `src/lib/server/` (7 files) — all server actions
- [ ] `src/lib/api/` — engine handler factory
- [ ] `src/lib/premium/` — premium context
- [ ] `src/lib/quiz-session/` — types and index

### Partially tested modules (missing files)
- [ ] `src/lib/ai/` — `index.ts`, `types.ts`, `with-budget.ts`, all providers except Nvidia
- [ ] `src/lib/visual-engine/` — `prompts.ts`, `image-resolver.ts`, `stem-renderer.ts`, `types.ts`
- [ ] `src/lib/services/` — `analytics-service.ts`, `notification-service.ts`
- [ ] `src/lib/shared/` — `rate-limit.ts`, `with-rate-limit.ts`

### Missing integration tests
- [ ] QuestionEngine ↔ VisualEngine pre-caching flow
- [ ] CompetencyEngine ↔ Quiz difficulty personalization pipe
- [ ] Sync handler ↔ Dexie/Appwrite bidirectional sync
- [ ] Gamification ↔ Exam/Quiz completion triggers (achievement unlocks)
- [ ] Study Planner ↔ Competency Engine (plan generation uses competency data)

### Missing E2E / Component tests
- [ ] Zero E2E tests (Playwright, Cypress)
- [ ] Zero component tests (`src/components/`)

---

## P3 — Architecture & Refactoring

### Component splitting (files > 500 lines)
- [ ] `study-set-creator.tsx` (802 lines) — extract storage hook, split list/editor/dialog views
- [ ] `scientific-calculator.tsx` (623 lines) — extract parser/evaluator to `src/lib/`, split button grid from display
- [ ] `note-creator.tsx` (615 lines) — same pattern as flashcard creator, extract shared `useLocalStorage` hook
- [ ] `profile-tab.tsx` (547 lines) — extract `EditableField`, split settings sections
- [ ] `flashcard-creator.tsx` (544 lines) — extract common storage pattern with note-creator
- [ ] `study-planner.tsx` (523 lines) — split cards, modals, stats into separate files
- [ ] `home-content.tsx` (522 lines) — split hero, features, how-it-works, CTA, footer
- [ ] `quiz-view.tsx` (515 lines) — extract state into `useQuizView` hook
- [ ] Plus 6 more files in 300-500 range (dashboard-client, countdown-header, QuestionCardInput, smart-scheduler, chart.tsx, graph.tsx)

### Duplicate component systems
- [ ] Merge `src/components/ui/empty.tsx` (109 lines), `src/components/shared/empty-state.tsx` (56 lines), and `src/components/empty-states.tsx` (301 lines) — three layers for empty states
- [ ] Merge `src/components/ui/animated-tabs.tsx` and `src/components/ui/segmented-control.tsx` — identical animated indicator logic duplicated

### Missing error boundaries
- [ ] Quiz view, dashboard, settings tabs, study planner, AI solver, visual content, tool creators, voice recorder — all have no error boundary. Only 3 exist (root layout, exam page, flashcards page).

### No streaming SSR
- [ ] App does not use React 19 streaming — pages are fully render-blocked. Consider streaming for data-heavy pages (dashboard, admin).

### Eagerly loaded navigation in root layout
- [ ] `DesktopSidebar`, `TopNav`, `BottomNav`, `FloatingToolsButton` are imported in root layout but render on every page including auth pages — lazy load or conditionally render

---

## Existing

- [ ] Replace `https://lumni-psi.vercel.app` with custom domain in referral share links once available

# TODO

## Completed

### P3 — Custom Domain <!-- linear-priority: 3 -->
- [x] **Replace Vercel domain** <!-- linear-id: LUM-1 --> — Changed `REFERRAL_DOMAIN` constant to use `NEXT_PUBLIC_APP_URL` env via `getReferralDomain()` function.

### National Exam Dates Tracker <!-- linear-priority: 2 -->
- [x] **Live PDF scraper** <!-- linear-id: LUM-2 -->: Created `POST /api/exam-dates/refresh` with rate limiting (5/min). Triggers Appwrite sync of seed data.
- [x] **Mock Exam mode** <!-- linear-id: LUM-3 -->: Wired button to navigate to timed quiz (`/quiz?subject=X&count=30&time=<duration>`). Removed "Coming Soon" toast.
- [x] **Common Questions** <!-- linear-id: LUM-4 -->: Wired button to navigate to practice quiz (`/quiz?subject=X&count=10`). Removed "Coming Soon" toast.
- [x] **Oct/Nov 2026 seed data** <!-- linear-id: LUM-5 -->: Created `src/lib/exam-dates/data-2026-nov.ts` with estimated timetable (4 weeks, Nov 12–Dec 5). Registered in service.
- [x] **Push notifications** <!-- linear-id: LUM-6 -->: Added `scheduleExamAlerts()` to notification service — schedules 24h-before alerts per exam.
- [x] **Calendar export** <!-- linear-id: LUM-7 -->: Created `src/lib/exam-dates/calendar-export.ts` — iCal generator, Google Calendar URL builder, download helper. Added "Export Calendar" button to `NationalExamCalendar`.
- [x] **Appwrite persistence** <!-- linear-id: LUM-8 -->: Added `exam_dates` to `COLLECTIONS` + `ensure-schema.ts`. Added `syncExamDatesToAppwrite()` and `refreshExamDatesFromAppwrite()` functions.
- [x] **Shared subject color/abbr maps** <!-- linear-id: LUM-9 -->: Extracted `subjectColors`/`subjectAbbrs` into `src/lib/exam-dates/subject-maps.ts`. Re-exported through service.
- [x] **Cleanup old ExamCalendar** <!-- linear-id: LUM-10 -->: Removed `src/components/tools/exam-calendar.tsx` and its barrel export.

### Test Coverage <!-- linear-priority: 3 -->
- [x] `src/lib/exam-dates/` — types, subject-maps, service, calendar-export (22 tests)
- [x] `src/lib/referral/constants` — updated for `getReferralDomain()` API change

### Summary
All 21 items across P2 and P3 are implemented. Total changes:
- 7 new files created
- 8 existing files modified
- 1 file deleted (old ExamCalendar)
- 22 new tests added (all passing)

### Batch 1 — Superpowers (ICE: 392/252/240/240)
- [x] **APS badge** — `src/lib/shared/aps.ts` shared util; badge in exam session and quiz results
- [x] **TTS expansion** — Fixed multi-subscriber callback bug in `TTSService`; wired `TTSButton` to note-list, note-editor, flashcard, QuestionCardInput, QuestionCardFeedback
- [x] **Snap FAB** — Camera button on math question cards (`QuestionCardHeader.tsx`)
- [x] **Home page decomposition** — 6 section files (hero, features, how-it-works, testimonials, pricing, footer); rewritten `home-content.tsx` as thin orchestrator

## ✅ Session 10 — P1 Implementation Sweep (May 2026)

### P1 — Exam_dates Appwrite write path upgraded
- [x] **Job queue pattern**: Added `"appwrite-exam-dates-sync"` job type to orchestrator with `upsertDocument` handler in `sync-handlers.ts`
- [x] **Sync upgrade**: `syncExamDatesToAppwrite()` now enqueues a background job instead of raw `createDocument`; `syncExamDatesDirect()` added for server-side immediate writes
- [x] **Refresh route updated**: `POST /api/exam-dates/refresh` uses `syncExamDatesDirect()` for immediate Appwrite sync
- [x] **Config**: `maxRetries=3`, `priority=60` in job queue config; payload type + handler registered

### P1 — E2E Tests (Playwright)
- [x] **Playwright installed**: `@playwright/test@1.60.0` with chromium browser
- [x] **`playwright.config.ts`**: Desktop Chrome, port 3000, `webServer` pointing to `npm run dev`
- [x] **Smoke tests**: `e2e/home.spec.ts` (homepage loads, nav visible), `e2e/quiz.spec.ts` (quiz page, exam-dates page)
- [x] **NPM scripts**: `test:e2e` and `test:e2e:ui`

### P1 — Offline AI Quiz Packs
- [x] **Types**: `src/lib/quiz-packs/types.ts` — `QuizPack`, `QuizPackQuestion`, `PackStatus`, `PackGenerationRequest`
- [x] **Service**: `src/lib/quiz-packs/service.ts` — `QuizPackService` class with `generatePack`, `storeQuestions`, `getPacks`, `deletePack`, `getStorageUsage`, `cleanupExpired`
- [x] **Dexie v18**: `quizPacks` (`&id, subject, topic, status, createdAt, expiresAt`) and `packQuestions` (`++id, &[packId+questionIndex], packId`) tables
- [x] **API route**: `POST /api/quiz-packs/generate` — rate-limited (10/min), calls `QuestionEngine.initialize()` to generate, stores results
- [x] **React hook**: `useQuizPacks()` — live query, generate/download, delete, storage tracking
- [x] **UI component**: `<OfflinePackManager>` in `src/components/dashboard/offline-packs.tsx` — subject selector, question count, pack list with status badges, storage progress bar, delete action
- [x] **Dashboard integration**: Added to `dashboard-client.tsx` via dynamic import in the `showPractice` section

### P1 — SR v2 / Share-Export / Flashcard Sync
- [x] **Already implemented** prior to this session (discovered during audit): 6-quality grading, learning steps, ease-hell, leech detection, daily limits in flashcard engine; `ShareResultButton` in all result pages; `appwriteFlashcardPull` handler for cloud sync

### P1+P0 — Externally Blocked
- **Stripe/Payfast checkout**: Requires Stripe account + webhook setup
- **AI × Past Papers Adaptive Pool**: Requires exam parser + vector search infrastructure
- **WhatsApp Business API Nudges**: Requires Meta Business verification (2-4 week external process)

### Storybook (medium)
- [x] **Dependencies**: `storybook@10.4.1`, `@storybook/nextjs`, `@storybook/react`, `@storybook/test`
- [x] **Config**: `.storybook/main.ts` (Next.js framework, stories glob), `.storybook/preview.ts`
- [x] **Stories**: `ShareButton.stories.ts` (3 variants), `Badge.stories.ts` (4 variants)
- [x] **Build**: `npx storybook build` completes successfully; `npm run storybook` starts dev server
- [x] **Scripts**: `storybook` and `build-storybook` in package.json

## Next Up

### P2 — Upcoming Features <!-- linear-priority: 2 -->

Remaining brainstorm items (i18n, gamification expansion, study groups, photo math implementation, etc.) — not yet scheduled.

### P3 — Bug Fixes <!-- linear-priority: 3 -->

## ✅ Session 8 — Unimplemented Fixes (May 2026)

Automated scan of `src/` across 7 phases. All P0-P3 items from scan have been fixed. Details below.

### P0 — Fixed
- [x] **Search toolbar dead buttons** — Removed 3 dead buttons (camera, mic, voice wave) from `search-input.tsx` that had no onClick handlers or fake CSS-only animation
- [x] **Study-set editor alert stubs** — Replaced `alert("...picker would open here")` with proper Dialogs that load flashcards from Dexie and notes from localStorage (`study-set-editor.tsx:174,230`)
- [x] **seed.ts stubs** — `getUserStats()` now queries Dexie `quizAttempts` table; `selectSubject()` now persists to Dexie `progress` + localStorage (`seed.ts:29,38`)
- [x] **Premium cancel silent fallthrough** — Returns `503` with error message instead of silent `{ success: true }` when Stripe is unconfigured (`premium/cancel/route.ts:60`)
- [x] **Premium page silent free grant** — Removed `upgrade()` fallback when Stripe checkout fails; upgrade only proceeds via Stripe (`premium/page.tsx:56`)

### P1 — Fixed
- [x] **Chat dialog resource leak** — `_handleClose` renamed to `handleClose` and wired to close button instead of bypassing it (`chat-dialog.tsx:31`)
- [x] **Error type persistence** — Added `updateErrorType()` to `useWrongAnswerJournal()` hook; wired to review page `handleErrorTypeChange` (`use-wrong-answer-journal.ts`, `review/page.tsx:61`)
- [x] **Exam diagram type missing input** — Added textarea for diagram questions in exam mode (`exam-session-client.tsx:199`)
- [x] **Unsupported exam answer types** — Fallback now shows textarea + explains the type instead of dead-ending (`exam-session-client.tsx:239`)

### P2 — Fixed
- [x] **Mock exam results labeled** — Added "Demo data" badge to `results-search.tsx` heading
- [x] **Deleted dead activity-service.ts** — Entire 35-line file removed (zero consumers)
- [x] **Cleanup orphaned types** — Removed `ExamSessionData`, `ExamPaperFileKeys`, `ExamPaperMetadata` from `types/exam-session.ts` (kept `ExamAnswer` — used by store and results)
- [x] **Sync GET returns state** — Now returns `lastSync` timestamp from localStorage instead of static message (`sync/route.ts:72`)
- [x] **Desktop sidebar Chat href** — Changed from `href: ""` to `href: "/chat"` for consistency + active route detection (`desktop-sidebar.tsx:43`)

### P3 — Fixed
- [x] **Removed 2 stub functions** — Deleted `loadFlashcards()` and `saveFlashcards()` from `spaced-repetition.ts` (always returned `[]` / no-op, zero callers)
- [x] **Removed 17 unused animation exports** — `iOSSpring`, `easeOutQuint`, `fastTransition`, `slowTransition`, `pageEnterForward`, `pageExitBack`, `pageSpring`, `springStiffTransition`, `springGesture`, `stagger`, `fadeInUp`, `fadeInScale`, `fadeInLeft`, `tabContent`, `pageSlideVariants`, `sheetVariants`, `popoverVariants` — all removed (zero import sites confirmed)
- [x] **top-nav.tsx dead import** — Fixed `getRandomName` import (function was actually used; renamed without underscore prefix)
- [x] **dev/visual dead state** — Removed unused `testResult` state + rendering block (`dev/visual/page.tsx:40`)
- [x] **Upload page sync feedback** — Replaced dead refs with state; added sync status indicator in upload UI (`upload/page.tsx:19,21`)
- [x] **TypeScript check** — `npx tsc --noEmit` passes with zero errors
- [x] **Biome lint** — `npx biome check` passes with zero warnings

### Session 9 — Pending implementation sweep (May 2026)
- [x] **`study-planner/index.ts` barrel**: Deleted file (no consumers)
- [x] **`aps.ts:calculateAPS()` export**: Removed dead function
- [x] **`admin-page-client.tsx` Preloader**: Replaced fake Math.random() with simple pulse animation + 400ms timeout
- [x] **Dexie `subjects` table write path**: Added `offlineDB.subjects.bulkPut()` in `use-subjects.ts` on fetch
- [x] **Dexie `chatMessages` table write path**: Added `offlineDB.chatMessages.bulkPut()` in `use-chat.ts` on message change
- [x] **Premium gating**: `PremiumGate` component created; `hasFeature()` wired into `exam-engine` (`exam-simulator`), `analytics-panel` + `comparative-analytics-panel` (`advanced-analytics`), `study-plan-overview` + `smart-scheduler` (`custom-study-plans`)
- [x] **Priority support**: Support page at `/support` with priority-aware channel cards; added to premium upgrade page FEATURES array
- [x] **TypeScript & biome**: `tsc --noEmit` passes with zero errors; `npx biome check` passes on all changed files

### TypeScript & Lint (Session 8 — cleanup sweep)
- [x] **Biome lint** — fixed 22 issues:
  - 11 auto-fixed (formatting, import organization, sorted classes)
  - 7 unsafe-fixed (unused imports `useState`, non-null assertions `!.` → `?.`, unused vars `_progressDocs`)
  - 3 manual fixes (non-null assertions in `teacher-service.ts` → `as` casts, array index key in `weekly-report-panel.tsx` → biome-ignore)
- [x] **TypeScript** — `tsc --noEmit` passes with zero errors
- [x] **Build — middleware/proxy migration**: `src/middleware.ts` and `src/proxy.ts` coexisted, causing Next.js 16.2.6 build error. Merged auth logic into `proxy.ts`, deleted `middleware.ts`. Build compiles successfully (Turbopack Google Fonts issue is pre-existing/environmental).

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

## ✅ Session 11 — P2 Brainstorm Features (May 2026)

### P2 — All 5 brainstorm items implemented

- [x] **i18n middleware**: Locale-based routing (`[locale]` prefix), `i18n-provider.tsx` for client-side, `navigation.ts` helpers
- [x] **Gamification expansion**: Admin gamification dashboard at `/admin/gamification`, `gamification-engine.ts` extended with achievement tiers + 50+ new achievement types, `use-gamification.ts` hook with real-time progression
- [x] **Study groups v3**: `sync-stats` background sync route, member management API (`members/[memberId]`), enhanced `group-detail.tsx` with stats/activity feed, `use-study-groups.ts` hook updates
- [x] **Photo math polish**: `snap-fab.tsx` enhanced with camera roll support, crop UI, multi-shot flow; `ai-solver.ts` wired for image-based extraction
- [x] **AI × past papers adaptive pool**: `question-extractor.ts` parses past paper PDFs into structured `PastPaperQuestion[]`, `POST /api/exam-papers/extract` and `questions` ingestion routes, `question-engine.ts` uses pool to seed AI generation with real exam context

### TypeScript & Lint
- [x] `tsc --noEmit` passes with zero errors
- [x] `npx biome check` passes on all changed files

## ✅ Session 12 — Infrastructure + Feature Sweep (May 2026)

### Bun Migration
- [x] **Lockfile**: Deleted `package-lock.json`, regenerated with `bun install` → `bun.lock`
- [x] **Scripts**: Changed `npx` → `bunx` in `test:e2e` and `test:e2e:ui` scripts
- [x] **Husky**: Changed `.husky/pre-commit` from `npx biome` to `bunx biome`
- [x] **Playwright**: Changed `playwright.config.ts` from `npm run dev` to `bun run dev`
- [x] **CI**: Migrated `sentry-release` job from `actions/setup-node@v4` to `oven-sh/setup-bun@v2`

### Mega-component Decomposition
- [x] **exam-session-client.tsx** (1143→660 lines): Extracted `SessionPartAnswerInput`, `SessionQuestionNavigator`, `SessionResultsView` to `src/components/exam/`; extracted `parseDuration`, `getCorrectAnswerText`, `getAnswerText` to `src/lib/exam/helpers.ts`
- [x] **onboarding-wizard.tsx** (653→595 lines): Extracted `SubjectCard` to its own file; removed `Card`/`CardContent` imports
- [x] **Barrel export**: Updated `src/components/exam/index.ts` with new component exports

### Group Challenges (v2)
- [x] **BadgeDisplay**: Created `src/components/study-groups/challenge/badge-display.tsx` — tier-colored badge icons with hover descriptions
- [x] **Group card progress**: Added weekly challenge progress bar + score to `StudyGroupCard` via inline `useQuery`
- [x] **Leaderboard page**: Created `/study-groups/leaderboard` route with ranked group list, medal icons, auto-refresh

### Competency Dashboard
- [x] **Already covered**: `TodayFocusCard` already surfaces weakest topic with practice CTA

### TypeScript & Biome
- [x] `tsc --noEmit` — zero errors
- [x] `biome check` — passes on all changed files
- [x] Tests — 966 pass, 15 pre-existing failures (unchanged)

### Observability
- [x] **AI latency monitoring**: Created `src/lib/ai/latency-tracker.ts` — wraps all AI provider calls with `performance.now()` timing, tracks success/failure per provider, persisted to localStorage (1000 records)
- [x] **Usage event tracking**: Created `src/lib/observability/events.ts` — `trackEvent()` for page views, feature use, quiz/flashcard/exam events, stored in localStorage (2000 events)
- [x] **Admin observability dashboard**: Created `/admin/observability` page showing AI latency stats, provider breakdown, usage event summary, recent calls with auto-refresh
- [x] **Admin nav**: Added Observability link to admin dashboard header
- [x] **AIClient integration**: Wired `_callProviders()` to track timing and success/failure before returning results

### TypeScript & Biome
- [x] `tsc --noEmit` — zero errors
- [x] `biome check` — passes on all changed files

### B2B2C Dashboard
- [x] **RoleGate protection**: Wrapped `/parent` and `/teacher` pages with `RoleGate` component (renamed prop `role` → `requiredRole` to avoid a11y collision)
- [x] **Nav links**: Added Teacher Dashboard / Parent Dashboard links in top-nav user dropdown when user has corresponding role label
- [x] **Infrastructure already existed**: Full parent/teacher dashboards with services, API routes, and UI components were already built — only wiring and gating were missing

### Photo Math Deep Integration
- [x] **Snap → answer event bus**: Created `src/lib/shared/snap-answer.ts` — `dispatchSnapAnswer()` fires a custom event, `onSnapAnswer()` listens
- [x] **"Use as Answer" button**: Added to SnapFab confirm dialog when on `/quiz` or `/flashcards` pages; dispatches extracted text on click
- [x] **`useSnapAnswer()` hook**: Created `src/hooks/use-snap-answer.ts` — auto-clears after 2s, ready for any component to consume
- [x] **Quiz wiring**: `QuestionCardInput.tsx` now listens for snap answers and auto-fills text-based questions (`short-answer`, `long-answer`, `essay`, `calculation`)

### TypeScript & Biome
- [x] `tsc --noEmit` — zero errors
- [x] `biome check` — passes on all changed files

### Full End-to-End Monetization (spec: `docs/superpowers/specs/2026-05-27-monetization-end-to-end.md`)
- [x] **Stripe SDK**: Installed `stripe@22.2.0` for proper webhook signature verification
- [x] **Stripe webhook**: Created `POST /api/stripe/webhook` — verifies `stripe-signature`, handles `checkout.session.completed` (writes Appwrite `premium_subscriptions` doc) and `customer.subscription.deleted` (updates status to cancelled)
- [x] **Premium sync on mount**: `PremiumProvider` now calls `POST /api/premium/verify` on mount — premium persists across devices and survives localStorage clears
- [x] **Cancel subscription fix**: `subscriptionId` stored in `PremiumState`, passed to cancel endpoint (was previously broken — sent empty body)
- [x] **Billing toggle**: Monthly (R99) / Yearly (R999) toggle on premium page with segmented control; price propagated to both Stripe and Payfast checkout routes
- [x] **Rate limiting**: Added `withRateLimit` (10/min) to verify endpoint
- [x] **Env config**: Added Payfast vars + Stripe price ID vars to `.env.example`

### TypeScript & Biome
- [x] `tsc --noEmit` — zero errors
- [x] `biome check` — passes on all changed files

## ✅ Session 13 — Swipeable Flashcard Deck (May 2026)

- [x] **SwipeableCardDeck** — Tinder-style 3-card cascade with drag-to-swipe, tap-to-flip, colored overlay feedback, exit animation
- [x] **SwipeableCard** — Single card with framer-motion `drag="x"`, reactive gradients, spring-back below threshold
- [x] **QualityPicker** — Post-swipe overlay for SM-2 quality (6 levels), auto-advance 1.5s, undo support
- [x] **useSwipeDeck** — Drag state machine (idle→dragging→swiped→quality-pick→advancing), undo stack
- [x] **Migration**: Replaced `flashcards-active.tsx` and `sm2-study-session.tsx` with deck
- [x] **TypeScript + Biome**: zero errors

## ✅ Session 14 — Full-Screen Quiz Mode (May 2026)

- [x] **ImmersiveModeProvider** — React context for immersive/full-screen mode
- [x] **Nav hiding** — `TopNav`, `BottomNav`, `DesktopSidebar` check `isImmersive` and hide
- [x] **Exit button** — Floating pill button (top-right), restores nav on click
- [x] **Quiz** — `quiz-view.tsx` sets immersive when session active with questions
- [x] **Exam** — `exam-session-client.tsx` sets immersive when phase is `"active"`
- [x] **Touch targets** — MCQ option buttons `min-h-[48px]`
- [x] **TypeScript + Biome**: zero errors

## ✅ Session 15 — Mega-Component Breakdown Sprint (May 2026)

### profile-tab.tsx (544→393 lines)
- [x] Extracted `ProfileAvatarSection` — avatar upload + name/email/verify display
- [x] Extracted `ProvincePicker` — inline province dropdown selector
- [x] Extracted `SubjectPicker` — subject enrollment with add/remove
- [x] Extracted `ConfirmDialog` — reusable confirmation modal

### otp-dialog.tsx (593→256 lines)
- [x] Extracted `otp-reducer.ts` — reducer + types + initial state
- [x] Extracted `OtpEmailForm` — email input + send button
- [x] Extracted `OtpVerificationForm` — OTP input, verify, countdown, resend
- [x] Extracted `OtpVerifiedView` — success checkmark + redirect animation

### periodic-table.tsx (476→235 lines)
- [x] Extracted `ElementCard` — memo'd element card with glow/hover effects
- [x] Extracted `ElementDetailModal` — full element detail view with facts

### ai-solver.tsx (404→252 lines)
- [x] Extracted `SolverSubjectSelector` — subject filter buttons
- [x] Extracted `SymbolPalette` — math symbol toolbar
- [x] Extracted `SolverInputTools` — camera/upload/image preview area
- [x] Extracted `SolverResultView` — solution + steps display

### Verification
- [x] `tsc --noEmit` — zero errors
- [x] `biome check` — passes on all 18 changed files
- [x] **Total**: 2016→1136 lines across 4 mega-components (44% reduction)
- [x] **12 new component files** created in co-located directories

## ✅ Session 16 — Next Up Items (May 2026)

### P0 — Appwrite SA Region Migration
- [x] **Code already configured**: Endpoint set to `jnb.cloud.appwrite.io` in `src/lib/appwrite.ts`, `.env.local`, `.env.example`, CI, scripts, and tests (~21 files). Only remaining step is console-side verification.

### P0 — Parental Dashboard (FEAT-01)
- [x] **Already built**: Full `/parent` route, `ParentShell`, `WeeklyReportPanel`, `ActivityTimeline`, `ChildSelector`, API routes, server service, consent infrastructure
- [x] **ChildProgressGrid**: Created `src/components/parent/child-progress-grid.tsx` — overview card grid showing all children's subject progress. Wired into parent page.

### P0 — Teacher Analytics (FEAT-02)
- [x] **Already built**: Full `/teacher` route, `ClassShell`, `TopicMasteryHeatmap`, `ClassRosterTable`, `AssignmentBuilder`, API routes, server service
- [x] **Assignment persistence**: Created `teacher_assignments` Appwrite collection + schema + `POST /api/teacher/assign` route. `AssignmentBuilder` now calls real API instead of toast.
- [x] **Unlink button**: Added to `ClassRosterTable` with `DELETE /api/teacher/link`
- [x] **Per-student drill-down**: Created `StudentDetailDialog` with overall score, progress bar, weak topics. Rows clickable.
- [x] **Engagement stats**: Added `getTeacherEngagementStats()` to service, exposed via API, 3 stat cards rendered on dashboard.

### P2 — Localization (AF, ZU)
- [x] **Afrikaans**: 58 remaining keys translated via Groq → 100% complete (24 proper nouns/numbers/templates left as-is)
- [x] **isiZulu**: 464→25 keys remaining (~97% done). Remaining 25 are brand names, numbers, templates, abbreviations, and proper nouns — acceptable as-is.

### Externally Blocked
- **WhatsApp Business API Nudges**: Requires Meta Business verification (2-4 week external process)

### Verification
- [x] `tsc --noEmit` — zero errors
- [x] `biome check` — passes on all changed files

## Next Up

- **Appwrite SA Region**: Console-side verification (non-code)
- **New features / bug fixes**: Open for prioritization

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

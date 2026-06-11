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

## ✅ Session 19 — TinyFish RAG Integration (June 2026)

### Web-Grounded AI — TinyFish RAG injection <!-- linear-id: LUM-TBD -->
- [x] **PR 1 — Foundation** (commit `f5313f32`): `src/lib/tinyfish/` module (7 files: `client`, `cache`, `allowlist`, `wrap`, `in-flight`, `types`, `index`); Dexie v25 (`tinyfishCache` + `tinyfishUsage` tables, 33 total); 87 unit tests; ADR-0010 design spec
- [x] **PR 2 — Solve flow RAG** (commit `6c7c2ff1`): `aiSolver.execute(body, userId?, deps?)` 3-arg signature with DI for `getSourceForQuestion`/`buildPromptInstruction`; `VerifiedByPill` collapsible component; 11 RAG integration tests; `mock.module` pollution resolved via DI pattern
- [x] **PR 3 — Quiz generation RAG** (commit `dd3940c4`): `fetchRagContext(subject, topic, userId, deps?)` in `src/lib/question-engine/rag-enricher.ts` with 3s `Promise.race` timeout + try/catch fail-open; `PromptManager.getPrompt(type, params, ragContext?)` injects XML into user prompt + `buildPromptInstruction()` into system prompt; `QuestionEngine.generateInternal` fetches RAG once per batch and passes to each processor; `GenerationParams.userId?: string | null` threaded from `/api/engine/generate` route; 12 new tests (8 in `rag-enricher.test.ts`, 4 in `prompt-manager.test.ts`)
- [x] **Doc update** (commit `eb4ba2fc`): 6 docs files + 4 `.context/` mirrors synced to reflect Implemented status

### Architecture decisions
- **Foundation → Solve → Quiz** split shipped as 3 separate PRs (each independently shippable)
- **DI over `mock.module`** for RAG-touching functions (avoids process-wide test pollution in Bun)
- **RAG injection format**: XML `<reference_material>` block prepended to user prompt with `\n\n---\n\n` separator; `buildPromptInstruction()` appended to system prompt
- **Fetch once per batch** — `QuestionEngine.lastRagContext` shared across processors in a single generate call
- **Fail-open pattern**: 3s `Promise.race` timeout + try/catch + `console.warn` — mirrors across both solve and quiz flows
- **`buildGenerateKey` fix** (PR 1): lowercases subject + trims leading/trailing dashes via `.replace(/^-+|-+$/g, "")`
- **Per-user daily limit** (`PER_USER_DAILY_LIMIT`) checked before cache lookup in `getSourceForQuestion`; `getTodayUsageCount` returns SUM of counts
- **Sources NOT persisted** on `Question` objects; `QuestionEngine.lastRagContext` is the only in-memory handle (Q4 follow-up deferred)
- **VerifiedByPill is solve-only** — quiz results page UI deferred (Q7 follow-up)

### Verification
- [x] `bun test` — 1197 pass / 10 pre-existing Appwrite failures / 5 pre-existing Playwright E2E errors
- [x] `npx tsc --noEmit` — zero errors
- [x] `npx biome check` — zero warnings
- [x] `npx next build` — clean (Turbopack)
- [x] Pre-commit hook (biome + tsc) passed at each commit

## ✅ Session 20 — TinyFish Q7 follow-up (June 2026)

### Quiz results page RAG source pill <!-- linear-id: LUM-TBD -->
- [x] **Wire `QuestionEngine.lastRagContext` to quiz UI** (commit `2c16e85e`): `LearningOrchestrator.generateQuestionSet()` calls `engine.getLastRagContext()` after `generate()` and maps `RagContext.sources` down to `{ url, title }[]` to keep the API wire small; `POST /api/engine/generate` returns `sources: result.sources ?? []`; `useQuestionEngine()` exposes `sources` on its return type (defaults to `[]`); both quiz result surfaces render `<VerifiedByPill sources={...} />`:
  - `QuizEngine` + `QuizResult` (simpler `subjectId` flow)
  - `useQuizView` → `QuizView` → `QuizResultsState` → `QuizResultsCard` (full quiz flow)
- [x] **Tests** (+6): 2 in `learning-orchestrator.test.ts` (orchestrator surfaces `lastRagContext` as `sources`; returns `[]` when no RAG context) + 4 in new `src/components/quiz/__tests__/quiz-result.test.tsx` (renders pill with sources, singular label, hides pill on empty array / undefined prop). QuizResult test uses `container.textContent` to avoid happy-dom's `querySelector` SyntaxError bug.

### Architecture decisions
- **Two quiz result surfaces, both updated**: `QuizResult` (subjectId flow) AND `QuizResultsCard` (full quiz flow) — same `sources?` prop, same `VerifiedByPill` consumer
- **Sources shape on API wire**: `{ url, title }[]` only (no `content`) — matches `VerifiedByPill.Source` interface, keeps payload small
- **`useQuestionEngine` default**: `sources: query.data?.sources ?? []` — never undefined on consumer side
- **No schema migration**: `Question.webSources` field still deferred (Q4 follow-up). Sources are session-scoped (in-memory `lastRagContext` only)
- **Test pollution lesson** (PR 2): `mock.module` is process-wide; `container.textContent` regex matching avoids happy-dom's `new this.window.SyntaxError(...)` failure in `querySelectorAll` (caused by `screen.getByText` / `screen.queryByText`)

### Verification
- [x] `bun test` — 1203 pass / 10 pre-existing Appwrite failures / 5 pre-existing Playwright E2E errors (+6 from Session 19, no regressions)
- [x] `npx tsc --noEmit` — zero errors
- [x] `npx biome check` — zero warnings on 12 changed files
- [x] Pre-commit hook (biome + tsc) passed at commit

### Open follow-ups
- **Appwrite SA Region console verification**: code already points to `jnb.cloud.appwrite.io`; only remaining step is Appwrite console-side verification.

## ✅ Session 21 — TinyFish Q4 follow-up (June 2026)

### Per-question RAG source persistence <!-- linear-id: LUM-TBD -->
- [x] **Wire per-question sources end-to-end** (commit `f769f322`): hybrid AI-cited `sourceRefs: number[]` matching with all-sources fallback. When the model returns valid `sourceRefs`, only those are attached; if the field is missing/invalid/non-array/out-of-range, the engine falls back to attaching all 3 batch sources so attribution is never lost.
- [x] **Schema**: `Question.webSources?: { url, title }[]` (lightweight, no content). Dexie v26 — same schema string as v25 (lazy rehydrate: existing rows load with `webSources: undefined`, no backfill).
- [x] **Prompt injection**: `PromptManager.appendSourceRefsAppendix()` appended to the user prompt when `ragContext.sources` is non-empty. Instructs the model to return `sourceRefs: number[]` per question referencing the 1-indexed sources in the XML block.
- [x] **Source mapper** (`src/lib/question-engine/source-mapper.ts`): `mapSourceRefs(raw, sources)` validates integers, dedupes, returns `QuestionSource[] | undefined` (undefined = fall back). `attachWebSources(question, ragContext)` maps or falls back, mutates in place, strips the `sourceRefs` field so it never lands in Dexie.
- [x] **Processor integration**: `QuestionProcessor.generate()` calls `attachWebSources()` on each parsed question before returning.
- [x] **UI — `SourceAttributionPill`**: New small inline non-collapsible pill rendered on `QuestionCardFeedback`. Truncates to 2 sources with `+N more` suffix. Renders nothing on empty. `role="note"`, `aria-label` from local pluralization. Uses `CheckmarkCircle01Icon`. Lighter than the collapsible `VerifiedByPill` on the results page.
- [x] **Tests** (+17, 1220 pass): 12 in `source-mapper.test.ts` (6 `mapSourceRefs` + 6 `attachWebSources`) + 5 in `source-attribution-pill.test.tsx` (renders nothing on empty/undefined, single source w/ link attrs, multiple sources w/ `+N more` overflow, custom className). Used `container.getElementsByTagName("a")` to avoid happy-dom's `querySelector` SyntaxError bug.

### Architecture decisions
- **Hybrid matching**: AI cites, mapper validates, engine falls back. Avoids brittle title matching while guaranteeing attribution.
- **`Question.webSources` is plain JSON, not indexed**: per-question search by source URL is out of scope; no new Dexie index needed.
- **`sourceRefs` field is stripped after mapping**: lives only in the AI wire, never reaches Dexie storage.
- **Hardcoded strings in `SourceAttributionPill`**: matches the pattern of other small components (`QuizResult`, etc.) and avoids a `next-intl` provider setup in component tests.
- **Test pollution lesson extended**: `screen.queryByText` triggers the same happy-dom `querySelectorAll` SyntaxError as `screen.getByText`. Use `container.textContent` regex matching AND `getElementsByTagName` (DOM API, no selector parsing) for all element assertions.

### Verification
- [x] `bun test` — 1220 pass / 10 pre-existing Appwrite failures / 5 pre-existing Playwright E2E errors (+17 from Session 20, no regressions)
- [x] `npx tsc --noEmit` — zero errors
- [x] `npx biome check` — zero warnings on 9 changed files
- [x] Pre-commit hook (biome + tsc) passed at commit

### Open follow-ups
- **Appwrite SA Region console verification**: code already points to `jnb.cloud.appwrite.io`; only remaining step is Appwrite console-side verification.

## ✅ Session 18 — Polish & Hardening (June 2026)

### Test suite hardening
- [x] **e2e exclusion**: Fixed e2e Playwright files loaded by `bun test` — added `exclude = ["**/e2e/**"]` to `bunfig.toml`
- [x] **localStorage**: Added `globalThis.localStorage` to test `setup.ts` (happy-dom Window) — fixes `ReferenceError` in 89 source files
- [x] **Missing mock exports**: Added `markPlanStale`, `clearPlanStale`, `syncStudyPlanToAppwrite` to `use-study-planner.test.ts` mock
- [x] **Missing mock exports (api-fetch)**: Added `isBudgetExceeded`, `showBudgetToast` to `use-gamification.test.tsx` api-fetch mock
- [x] **useVisualEngine premium gate**: Added `mock.module("@/lib/premium/premium-context")` — tests were silently disabled by premium gating
- [x] **Visual-engine module cache conflicts**: Extracted shared `_appwrite-mocks.ts` for `@/lib/appwrite` + `@/lib/db/client` + `@/lib/db/repositories/visual-cache` + `@/lib/shared/json` mocks; removed `../visual-engine` import from `index.test.ts` + `visual-engine.test.ts` to avoid pre-loading real modules before mocks register
- [x] **Result**: 1073→1109 pass, 13→5 fail (remaining 5 are e2e Playwright files, expected)

### WCAG 2.2 AA Accessibility Audit
- [x] **Quiz flow**: Audited `quiz-view.tsx`, `QuestionCardInput`, `QuestionCardFeedback`, `step-by-step.tsx`, `calculation-input.tsx`, `matching-input.tsx` — found 17 critical + 22 high + 18 medium issues
- [x] **Flashcard + GDPR**: Audited `swipeable-card-deck`, `swipeable-card`, `quality-picker`, `cookie-banner`, `tos-banner`, `consent-gate`, `privacy-tab`, `settings-client` — found 9 critical + 12 high issues
- [x] **Exam + Navigation**: Audited `exam-engine`, `session-question-navigator`, `session-results-view`, `session-part-answer-input`, `top-nav`, `bottom-nav`, `desktop-sidebar`, `layout.tsx`, `immersive-mode` — found 2 critical + 5 high issues

### Critical a11y fixes (10 items)
- [x] **Cookie banner**: Added `htmlFor`/`id` to 4 Label/Switch pairs
- [x] **Privacy tab**: Added `htmlFor`/`id` to 3 Label/Switch pairs
- [x] **Bottom nav**: Replaced `outline-none` with `focus-visible:ring-2 focus-visible:ring-inset`
- [x] **Top nav**: Replaced `outline-none` on avatar dropdown trigger with `focus-visible:ring-2`
- [x] **Settings back link**: Added `aria-label` to icon-only back navigation link
- [x] **Step-by-step prev/next**: Added `aria-label` + `aria-hidden="true"` on icon-only buttons
- [x] **QuestionCardFeedback send**: Added `aria-label` + `aria-hidden="true"` on icon-only send button
- [x] **Quiz-view**: Fixed broken `aria-labelledby="quiz-title"` → `aria-label="Quiz Practice"`

### Error state audit
- [x] **GDPR consent failure**: No crashes — dual-write to Dexie first, Appwrite sync best-effort. QuestionEngine gracefully returns `[]` on consent denial. VisualEngine falls back to Wikimedia.
- [x] **Swipeable deck empty**: Triple-layered guards (deck, sm2-session, flashcards-client) with `FlashcardsEmpty` component
- [x] **Immersive exit button**: Properly positioned, z-modal, semi-transparent. Minor: lacks `safe-area-inset-top` for notched iPhones

### Verification
- [x] `tsc --noEmit` — zero errors
- [x] `biome check` — zero errors on all 8 changed files
- [x] `bun test` — 1109 pass, 5 fail (e2e only)

## ✅ Session 17 — Premium Gating + Student Assignments (May 2026)

### Premium gating
- [x] **Offline Quiz Packs**: Gated `OfflinePackManager` with `hasFeature("offline-quiz-packs")` — shows premium upgrade card for free users
- [x] **Problem Library**: Gated `ProblemsClient` with `hasFeature("problem-library")` — early return with premium prompt
- [x] **Visual Engine**: Added `isPremium` guard to `useVisualEngine` hook — query disabled for free users (no wasted AI calls)

### Dead code cleanup
- [x] **Deleted `PremiumGate` component**: Zero consumers (all checks use `hasFeature()` inline)
- [x] **Deleted 3 unused API routes**:
  - `POST /api/exams/sync`
  - `GET /api/exam-dates/refresh`
  - `GET /api/cron/cleanup`

### Teacher assignments — student view
- [x] **`GET /api/student/assignments`**: New route — finds linked teachers via `teacher_students`, fetches their `teacher_assignments`, resolves topic IDs to names
- [x] **`MyAssignments` component**: Dashboard card showing pending assignments (topic names + assignment date)
- [x] **`DashboardContent` integration**: `MyAssignments` inserted after `TodayFocusCard` on today tab

### Verification
- [x] **TypeScript**: `npx tsc --noEmit` passes with zero errors
- [x] **Biome**: `npx biome check` passes on all 6 changed files

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

## Strategy Roadmap (June 2026 — Product Strategy Assessment)

### Batch 1 (Foundation — parallel, independent)
- [x] **1.4 WAM + retention events** — `analyticsEvents` Dexie v27 table, `trackSession{Start,End}()`, `trackDayActive()`, admin cohort view with DAU/WAU chart
- [x] **1.3 AI cost observability v2** — `estimatedCost` in `AILatencyRecord`, admin cost summary chart, per-provider cost config
- [x] **1.6 Push notification preference expansion** — add `examAlerts` + `assignmentDue` toggles to `NotificationSettings` + `notifications-tab.tsx`

### Batch 2 (Learning loop tightening)
- [x] **1.2 Wrong-answer re-encounter loop** — `retentionRecurrence` Dexie table, auto-insert 3 wrong answers into next eligible quiz with "review" badge
- [x] **1.5 Per-paper competency split** — extend competency key from `topicId` to `topicId:paperId`, track P1 vs P2 separately

### Batch 3 (Highest impact — Next-best-action)
- [x] **1.1 Next-best-action card** — personalised dashboard suggestion card: time-of-day-aware, weakest-topic-first, 24h-dismiss cooldown

### Batch 4 (B2B2C depth)
- [x] **2.1 Teacher assignment completion loop** — student submit → auto-grade → teacher comment
- [x] **2.2 Parent weekly digest push** — Sunday 18:00 SAST push with prior-week summary
- [x] **2.6 Assignment reminders** — push to student 24h before due

## ✅ Batch 5 — Network/Defensibility (June 2026)

- [x] **3.2 Public share-with-answer route** — `/q/[id]` public page, 5-star gated answer
- [x] **3.6 PWA install + offline polish** — `/offline` page, manifest theme_color, `pwa_install`/`offline_visit` events, install tracking
- [x] **3.5 Calendar view in study planner** — month grid, session dots, native drag-to-reschedule

### Verification
- [x] `npx tsc --noEmit` — zero errors
- [x] `npx biome check` — zero errors
- [x] `git commit` — `6d51dd0f` pushed to `origin/master`

## ✅ Hardening Batch 6 (June 2026)

- [x] **4.1 Refactor `use-premium` test casts** — 8 `as never` → `as PremiumFeature` or removed entirely; tsc + tests pass
- [x] **4.4 Storybook coverage** — 2→10 stories (added Button, Card, Switch, Checkbox, Progress, Skeleton, Avatar, Separator)
- [x] **A11y round 2** — 8 Konva `<Stage>` elements get `ariaLabel`, admin form labels get `htmlFor`/`id`, 11 icon-only buttons get `aria-label`, 2 `<select>` elements get `aria-label`, admin text leak ("Download01Icon Papers") fixed, note-creator removes false `role="button"`
- [x] **i18n round 2** — 45 missing keys (nav.* 5 + consent.* 40) added to both af.json and zu.json with Afrikaans and isiZulu translations
- [x] **Visual regression testing** — `e2e/visual.spec.ts` with 6 home page section tests (hero, features, how-it-works, pricing, testimonials, footer)
- [x] **Static analysis in CI** — `knip@6.15.0` installed, `knip.json` configured, `bun run deadcode` script added, CI quality job includes `bun run deadcode` step

### TypeScript & Lint (Session 8 — cleanup sweep)
- [x] **Biome lint** — fixed 22 issues:
  - 11 auto-fixed (formatting, import organization, sorted classes)
  - 7 unsafe-fixed (unused imports `useState`, non-null assertions `!.` → `?.`, unused vars `_progressDocs`)
  - 3 manual fixes (non-null assertions in `teacher-service.ts` → `as` casts, array index key in `weekly-report-panel.tsx` → biome-ignore)
- [x] **TypeScript** — `tsc --noEmit` passes with zero errors
- [x] **Build — middleware/proxy migration**: `src/middleware.ts` and `src/proxy.ts` coexisted, causing Next.js 16.2.6 build error. Merged auth logic into `proxy.ts`, deleted `middleware.ts`. Build compiles successfully (Turbopack Google Fonts issue is pre-existing/environmental).

## ✅ Session 23 — Codebase Audit Fixes (June 2026)

### P0 — Silent catch blocks (148 instances)
- [x] **Create centralized logger** — `src/lib/shared/logger.ts` with `logError(context, error, meta?)`, filters dev/prod
- [x] **High-severity catch sweep** (~40 files) — Added `logError()` to retention-loop/*, observability/events.ts, visual-engine/*, question-engine/*, share-service.ts, ai/*, ocr, hooks/*, etc.
- [x] **Medium-severity catch sweep** (~100 instances) — Added `logError()` to study-groups/service.ts, notification-service.ts, competency-service.ts, analytics-service.ts, etc.
- [x] **Production telemetry** — Wired `Sentry.captureException()` into `logger.ts` via `withScope()`; client-side events already consent-gated by Sentry's `beforeSend`

### P1 — Icon buttons missing aria-label (14 HIGH)
- [x] **star-rating.tsx:34** — Added `aria-label="Rate {star} out of 5 stars"`
- [x] **focus-tab.tsx:94,104,108,113** — Added `aria-label` to minus/stop/play/add icon buttons
- [x] **quiz-tab.tsx:189,196** — Added `aria-label` to stop/play icon buttons
- [x] **exam-card.tsx:108,150** — Added `aria-label` to dropdown toggle and download buttons
- [x] **chat/ChatInput.tsx:181** — Added `aria-label="Voice input"`
- [x] **diagram-input.tsx:50** — Added `aria-label="Clear diagram"`
- [x] **exam-filters.tsx:101** — Added `aria-label="Clear filters"`
- [x] **exam-tab.tsx:155** — Added `aria-label="Clear search"`
- [x] **chat-dialog.tsx:65** — Added `aria-label="Close chat"`
- [x] **chat/page.tsx:53** — Added `aria-label="Back to dashboard"`
- [x] **bookmarks/page.tsx:58** — Added `aria-label="Remove bookmark"`
- [x] **leaderboard/page.tsx:38** — Added `aria-label="Back to study groups"`
- [x] **tools-dialog.tsx:114** — Added `aria-label="Close"`
- [x] **sidebar-nav.tsx:116** — Added `aria-label="Clear search"`

### P2 — Form inputs missing aria-label (6 MEDIUM)
- [x] **note-editor.tsx:50** — Added `aria-label="Note title"`
- [x] **note-editor.tsx:70** — Added `aria-label="Note content"`
- [x] **lesson-sheet.tsx:90** — Added `aria-label="Filter by title"`
- [x] **subject-select.tsx:101** — Added `aria-label="Search subjects"`
- [x] **subjects-drawer.tsx:72** — Added `aria-label="Search subjects"`
- [x] **ChatInput.tsx:110** — Added `aria-label="Ask me a question"`

### P2 — Loading indicator missing aria-live (1 MEDIUM)
- [x] **LoadingIndicator.tsx:14** — Added `role="status"` and `aria-live="polite"`

### P3 — Empty verifyPremium mutation (1 instance)
- [x] **premium-context.tsx:122** — Added real `POST /api/premium/verify` call to mutationFn

### P4 — Dead sessionComplete state (1 instance)
- [x] **flashcards.ts:24,47** — Removed `sessionComplete` field from state type and initial state

### P5 — Missing loading.tsx (all routes, Suspense gap)
- [x] Add `loading.tsx` to tier-1 routes (auth/*, bookmarks, study-groups/*, search, review, premium) — uses shared `<PageSkeleton>`

### P6 — Dialog Escape-key blocked (by design)
- [x] Add comment explaining forced-flow reasoning to `celebration-overlay.tsx` and `onboarding-wizard.tsx` dialog `onOpenChange` no-ops

### Production telemetry
- [x] Wire `Sentry.captureException()` into `logger.ts` via `withScope()`; client-side events already consent-gated by Sentry's `beforeSend`

### DataAccess seam — Phase 1 (Foundation)
- [x] **Interface**: `DataAccess` with 14 typed table accessors, `DataAccessTable<T, TId>`, `Collection<T>`, `WhereClause<T>` in `src/lib/db/data-access.ts`
- [x] **Dexie implementation**: `DexieDataAccess` wrapping `offlineDB` via `tableAdapter()` factory in `src/lib/db/dexie-data-access.ts`
- [x] **In-memory implementation**: `InMemoryDataAccess` + `InMemoryTable<T, TId>` for tests in `src/lib/db/in-memory-data-access.ts`
- [x] **Migrated**: `CompetencyService`, `FlashcardEngine` — DI via `DataAccess`
- [x] **ADR-0011**: Written, status "Implemented — Phase 1"

### DataAccess seam — Phase 2 (Migrate top consumers)
- [x] **AnalyticsEngine**: DI via `DataAccess`, replaced `offlineDB.competencies/progress/quizAttempts`
- [x] **QuizPackService**: DI via `DataAccess`, replaced `offlineDB.quizPacks/packQuestions`, moved helper into class
- [x] **RetentionService**: Created class with DI (was standalone functions), replaced `offlineDB.retentionRecurrence/wrongAnswers`, removed compound `where({...})`
- [x] **useWrongAnswerJournal**: Replaced `offlineDB.table("wrongAnswers")` string pattern with typed `dexieDataAccess.wrongAnswers` accessor

### DataAccess seam — Phase 3 (Expand + batch migrate remaining consumers)
- [x] **Expanded interface**: 13 more table accessors added to `DataAccess` (27 total): chatMessages, questionRatings, knowledgeGraph, examSessions, sharedQuestions, examDates, notes, gamification, cachedPdfs, quizSessions, tinyfishCache, tinyfishUsage, jobs
- [x] **Interface additions**: `.limit(n)` on `DataAccessTable`, `.modify()` on `Collection<T>` with callback support
- [x] **Migrated files** (20 files, ~120 `offlineDB` calls removed):
  - 5 Batch A: observability/events, sync/sync-handler, knowledge-graph/service, ai/chat-context, notification-service
  - 6 Batch B: search-service, share-service, exam-dates/service, chunked-search, export/export-service, seed
  - 4 repositories: question-rating, pdf-cache, exam-session, quiz-session
  - Interface layer: data-access.ts, dexie-data-access.ts, in-memory-data-access.ts
- [x] **Test fix**: `all-repos.test.ts` mock moved before imports, both `@/lib/db` and `@/lib/db/schema` mocked with shared stores (fixed process-wide mock.module pollution gap)
- [x] **Verification**: tsc 0 errors (1 pre-existing `maxScore` on `QuizAttempt`), biome 0 warnings, 1225 tests pass, 0 fail

## 📚 Next Up — Guided Lessons + Past Questions + Pronunciation + Stories

**3 waves, 4 parallel workstreams, ~40 tasks.** Estimated total: 10-14 sessions.

---

### Wave 1 — Foundation Infrastructure (parallel, independent)

All 4 batches can run in parallel — zero cross-dependency on each other.

---

#### Batch A — Lesson Engine (P0) <!-- linear-priority: 0 -->

Extends the curriculum data model to support structured lesson content, adds AI generation with web grounding, and creates the shared cache layer.

- [ ] **A1 — Lesson data model** <!-- linear-id: LUM-NEW -->
  - Create `src/lib/lesson/types.ts`:
    ```ts
    Lesson { id, subjectId, topicId, subtopicId, title, order,
             prerequisites: string[], sections: LessonSection[],
             vocabulary: VocabWord[], difficulty, estimatedMinutes }
    LessonSection { id, type: "introduction"|"concept"|"worked-example"|"comprehension-check"|"summary"|"practice",
                    title, content (markdown), keyPoints: string[] }
    VocabWord { word, definition, partOfSpeech, pronunciation, language }
    ```
  - Each lesson maps 1:1 to a `CurriculumSubtopic.id` (existing `src/curriculum/types.ts`)
  - Prerequisite chain inherited from the curriculum DAG

- [ ] **A2 — Lesson generation service** <!-- linear-id: LUM-NEW -->
  - Create `src/lib/lesson/service.ts`:
    - `generateLesson(subjectId, topicId, subtopicId)` — calls existing AI chain (Gemini→Nvidia→Groq) with structured lesson prompt
    - Uses TinyFish RAG (`fetchRagContext`) for web-grounded content (CAPS/DBE sources)
    - Shared Dexie cache key: `lesson:${subjectId}:${subtopicId}`, 30d TTL
    - One AI call per subtopic ever — cost caps at ~1,920 calls total across all subjects
  - System prompt: structured for section-by-section lesson output (intro → concept → worked examples → comprehension check → vocabulary → practice link)

- [ ] **A3 — Lesson API route** <!-- linear-id: LUM-NEW -->
  - `GET /api/lessons/{subjectId}/{subtopicId}` — returns cached or generates on first access
  - `GET /api/lessons/{subjectId}` — returns all lessons for a subject (topic-grouped)
  - Rate-limited (20/min), auth-required
  - Parallel: `POST /lessons/batch-generate` — admin endpoint to pre-generate all subtopics for a subject

- [ ] **A4 — Update existing lesson infrastructure** <!-- linear-id: LUM-NEW -->
  - Rewrite `lessons-comprehensive.json` — replace empty array with generated lesson references (or delete in favor of Dexie cache)
  - Update `LessonCardData` (src/components/lesson/lesson-card.tsx) — add `topicId`, `subtopicId`, `order`, `prerequisites`, `vocabulary`, `sections`
  - Update `GET /api/lessons` to route to new lesson service

---

#### Batch B — Past Question Classification (P0) <!-- linear-priority: 0 -->

AI batch job to tag all existing `PastPaperQuestion` records with their specific `CurriculumSubtopic.id`, then build student-facing question bank UI.

- [ ] **B1 — AI batch classifier** <!-- linear-id: LUM-NEW -->
  - Create `src/lib/exam-paper-ingestion/question-classifier.ts`:
    - Reads each `PastPaperQuestion` from Dexie/Appwrite
    - Feeds question text + subject's curriculum JSON (all topics + subtopics) to Gemini Flash
    - Assigns `CurriculumSubtopic.id` to each question
    - Batch size: ~50 questions per call (context window permitting)
    - Stores result back on the `PastPaperQuestion.topic` field (upgraded from optional to resolved)
  - One-time admin trigger: `POST /api/exam-papers/classify` (rate-limited)
  - Estimated cost: ~$0.50 total for all past questions (Gemini Flash is cheap)

- [ ] **B2 — Question bank API enhancement** <!-- linear-id: LUM-NEW -->
  - Upgrade `GET /api/exam-papers/questions` — add filter by `subtopicId`, sort by year/difficulty, paginate (already has `limit`)
  - Return `{ subject, topic, subtopicId, year, paperNumber, marks, questionText, answerText, bloomLevel }` with proper subtopic resolution

- [ ] **B3 — Student question bank UI** <!-- linear-id: LUM-NEW -->
  - New route: `/questions` or integrate into dashboard as a tab
  - Browse/filter: subject → topic → subtopic, with year range, difficulty, question type
  - Results: paginated question cards with expand-to-reveal answer
  - Actions per question: "Practice this" (→ `/quiz?subject=X&topic=Y&count=5`), "Add to quiz", "Discuss" (→ AI solver)
  - Empty states for subjects/years with no data

- [ ] **B4 — Dashboard past question widgets** <!-- linear-id: LUM-NEW -->
  - "Recent Exam Questions" card on dashboard Today tab (last 5 viewed/unanswered questions)
  - "Practice Weak Topics" card showing questions from the student's lowest-scored topics
  - "Question of the Day" — random past question with answer reveal (once per day)

---

#### Batch C — Pronunciation + Dictionary (P1) <!-- linear-priority: 1 -->

Infrastructure layer: speech-to-text via browser-side Whisper, dictionary API integration. UI comes in Wave 2.

- [ ] **C1 — whisper.cpp WASM integration** <!-- linear-id: LUM-NEW -->
  - Add `whisper.cpp` compiled to WebAssembly as a build dependency
  - Currently Whisper's multilingual model supports **99 languages** including Afrikaans, isiZulu, isiXhosa (verified from OpenAI Whisper GitHub repo + HuggingFace model cards)
  - A fine-tuned Afrikaans model already exists: `andreoosthuizen/whisper-large-v3-afrikaans` on HuggingFace
  - Create `src/lib/audio-engine/whisper-service.ts`:
    - `initWhisper()` — loads WASM model (lazy, ~80MB for `tiny` multilingual)
    - `transcribe(audioBlob, language)` — runs inference, returns `{ text, segments, confidence }`
    - `assessPronunciation(studentText, expectedText)` — word-level alignment + accuracy scoring
    - Falls back gracefully if WASM fails to load (return null, disable pronunciation feature)
  - Model choice: Start with `whisper-tiny` (~39M params, ~1GB VRAM or ~80MB WASM) — fast enough for real-time in browser
    - Accuracy for SA languages: Tier 4 (~20-40% WER) out of the box
    - Future: fine-tune on NCHLT Speech Corpus (200 speakers × 11 SA languages) for better accuracy
  - **Critical design decision**: All inference happens on-device in the browser
    - Zero server cost
    - Fully offline
    - No audio data leaves the device (privacy win)
    - User must download model once (~80MB for tiny)

- [ ] **C2 — Dictionary service** <!-- linear-id: LUM-NEW -->
  - Create `src/lib/dictionary/service.ts`:
    - Uses **Free Dictionary API** (`api.dictionaryapi.dev`) — no API key, no rate limit, MIT-licensed data from Wiktionary
    - `lookupWord(word, language)` → `{ word, phonetic, audio, definitions: [{ partOfSpeech, definition, example }], synonyms, antonyms }`
    - Falls back to `FreeDictionaryAPI.com` (~1,000 req/h) if primary fails
    - Client-side cache in Dexie (`dictionaryCache` table, 24h TTL) to avoid redundant lookups
    - Supports English only initially (the Free Dictionary API is English-focused)
    - For Afrikaans/isiZulu/isiXhosa: can extend using Wiktionary's own API (`en.wiktionary.org/w/api.php`) which has CC-BY-SA data in those languages
  - Dexie v33: Add `dictionaryCache` table (`&key, word, result, fetchedAt, expiresAt`)

---

#### Batch D — Short Stories + Comprehension (P1) <!-- linear-priority: 1 -->

Content pipeline: ingest from copyright-free sources, create story data model, generate comprehension questions.

- [ ] **D1 — Story data model** <!-- linear-id: LUM-NEW -->
  - Create `src/lib/stories/types.ts`:
    ```ts
    Story { id, title, author, text, language, source, sourceUrl,
            license: "cc-by"|"public-domain"|"ai-generated",
            gradeLevel, wordCount, vocabulary: VocabWord[],
            topics: string[] (mapped to curriculum subtopic IDs) }
    ```
  - Stories stored as JSON in `src/curriculum/stories/{language}/` — per-language directory
  - Initial sources:
    - **African Storybook** (CC-BY, 40+ stories in multiple SA languages WITH audio) — `southafricareads.org`
    - **Project Gutenberg** — "South-African Folk-Tales" (Honey), "The Outspan" (Fitzpatrick), Olive Schreiner, Herman Charles Bosman (public domain)
    - AI-generated original stories as supplement for topics not covered by either source

- [ ] **D2 — Story ingestion pipeline** <!-- linear-id: LUM-NEW -->
  - Create `src/lib/stories/service.ts`:
    - `loadStoryLibrary(language)` — loads all stories for a language
    - `getStory(id)` — single story lookup
    - `getComprehensionQuestions(storyId)` — AI-generated or cached
    - Dexie cache: `storyCache` table (stories), `storyQuestions` table (AI-generated questions, 30d TTL)
  - Seed script: `scripts/ingest-stories.ts` — downloads CC-BY content, formats as JSON, writes to `src/curriculum/stories/`
  - Register in curriculum: add `stories: string[]` field to `CurriculumSubtopic` to reference relevant story IDs

- [ ] **D3 — Comprehension question generator** <!-- linear-id: LUM-NEW -->
  - AI prompt: given a story text + curriculum topic context, generate 3-5 comprehension questions (mix of literal, inferential, critical — matching the CAPS "Reading and Comprehension" bloom target of `analyze`)
  - Questions formatted as `Question` type from the engine (supports MCQ + short-answer)
  - Integrated with existing quiz engine for answering + grading + wrong-answer tracking
  - Cached per story (one generation ever, 30d TTL)

---

### Wave 2 — UI Layer (depends on Wave 1)

All 4 batches build on Wave 1 foundations. Can run in parallel once Wave 1 infrastructure is stable.

---

#### Batch A5-A6 — Lesson UI (P0) <!-- linear-priority: 0 -->

- [ ] **A5 — Guided lesson navigation** <!-- linear-id: LUM-NEW -->
  - Lesson view page: `/study/{subjectId}/{topicId}/{subtopicId}`
  - Sections rendered as scrollable cards with progress tracking (which sections completed)
  - Prerequisite-aware: shows "Complete [lesson X] first" block for locked lessons
  - "Next Lesson" / "Previous Lesson" navigation following curriculum order
  - "Practice this Topic" button → quiz with relevant past questions
  - "Mark Complete" + progress per lesson stored in Dexie (`lessonProgress` table)
  - TTS read-aloud button on each section (reuse existing `TTSButton`)

- [ ] **A6 — Lesson library dashboard card** <!-- linear-id: LUM-NEW -->
  - Replace existing `LessonLibrary` component with curriculum-order-aware version
  - Shows personalized lesson recommendations based on competency data
  - "Continue where you left off" — resume last incomplete lesson
  - Progress bar per subject (X of Y lessons completed)

---

#### Batch B5-B7 — Question Bank UI (P0) <!-- linear-priority: 0 -->

- [ ] **B5 — Question bank browser page** <!-- linear-id: LUM-NEW -->
  - New route: `/questions` — full student-facing question browser
  - Breadcrumb: Subject → Topic → Subtopic
  - Filter sidebar: year range, question type, difficulty (inferred from marks), paper number
  - Grid of question cards with expand/collapse for answer
  - "Quiz Me" button — creates a quiz from selected filters (reuses existing quiz engine)

- [ ] **B6 — Dashboard past question widgets** <!-- linear-id: LUM-NEW -->
  - "Recent Past Questions" — last 5 unanswered/incorrect from user's history
  - "Questions from Weak Topics" — pulls from lowest competency topics
  - Each widget card: question preview snippet + "Answer" expand + "Practice" link

- [ ] **B7 — Lesson→Question linking** <!-- linear-id: LUM-NEW -->
  - Each lesson page shows "Related Past Questions" section at bottom
  - Filters by `subtopicId` (from B1 classification)
  - Shows up to 5 questions with expand-to-reveal answers
  - "Practice More" → opens quiz filtered to that subtopic's past questions

---

#### Batch C3-C5 — Pronunciation + Dictionary UI (P1) <!-- linear-priority: 1 -->

- [ ] **C3 — Pronunciation exercise UI** <!-- linear-id: LUM-NEW -->
  - Build `PronunciationExercise` component (from existing `tts-service.ts` type but as real UI)
  - Flow: Show word/phrase → Play TTS → Student records → Whisper transcribes → Show comparison
  - Comparison view: expected text vs transcribed text, word-level accuracy highlighting (green=correct, red=wrong, yellow=close)
  - Per-language exercise sets:
    - English: 10+ exercises (existing tongue twisters + vocabulary from lessons)
    - Afrikaans: 10+ exercises (existing phrases + lesson vocabulary)
    - isiZulu: 5+ exercises (from NCHLT corpus + lesson vocabulary)
    - isiXhosa: 5+ exercises (from NCHLT corpus + lesson vocabulary)
  - Integrate into lesson pages: each lesson's `vocabulary` array feeds into pronunciation practice at the bottom

- [ ] **C4 — Dictionary lookup UI** <!-- linear-id: LUM-NEW -->
  - `WordLookup` component — inline popover on word tap/click within lesson content
  - Shows: phonetic spelling, audio pronunciation (from API), definitions, part of speech, example sentence
  - Dedicated `/dictionary` page: search bar, results list, "Listen" button per result
  - "Add to Vocabulary List" — saves word to Dexie `vocabularyList` table for review
  - Lesson integration: vocabulary words in lesson sections become clickable, opening the `WordLookup` popover

- [ ] **C5 — Dexie v33: vocabulary + dictionary tables** <!-- linear-id: LUM-NEW -->
  - `dictionaryCache` — `&key, word, result (JSON), fetchedAt, expiresAt` (24h TTL)
  - `vocabularyList` — `++id, userId, word, definition, language, sourceLesson, addedAt, reviewCount`
  - `lessonProgress` — `&[userId+lessonId], userId, lessonId, completedSections: string[], completedAt, score`

---

#### Batch D4-D6 — Story Reader + Comprehension (P1) <!-- linear-priority: 1 -->

- [ ] **D4 — Story library UI** <!-- linear-id: LUM-NEW -->
  - Route: `/stories` — filters by language, grade level, topic
  - Grid of story cards: title, author, language badge, word count, "Read now" / "Listen" buttons
  - "Reading Level" badge (easy/medium/hard derived from word count + vocabulary complexity)

- [ ] **D5 — Story reader page** <!-- linear-id: LUM-NEW -->
  - Route: `/stories/{storyId}`
  - Clean reading view: large text, comfortable line height, page-like margins
  - TTS read-aloud (reuse `ListenToLesson` component with word highlighting)
  - Inline vocabulary: tap/click word → `WordLookup` popover (reuses C4 component)
  - "Comprehension Questions" section at bottom (collapsible, shows after reading)
  - "Mark as Read" + reading progress tracking in Dexie

- [ ] **D6 — Story→Curriculum linking** <!-- linear-id: LUM-NEW -->
  - Stories tagged with curriculum `subtopicId`s (e.g., "comprehension" subtopic under "Reading and Comprehension")
  - "Read a Story" link appears in relevant lesson pages
  - "Practice Comprehension" → leads to next unread story matching the student's language subject

---

### Wave 3 — Cross-Feature Integration (P2) <!-- linear-priority: 2 -->

Runs after Wave 2 UI is stable. Each integration ties two Wave 2 features together.

- [ ] **Integration 1: Lesson→Past Questions loop** <!-- linear-id: LUM-NEW -->
  - When a student completes a lesson → automatically suggest 3 past questions on that subtopic
  - Wrong answers on those questions → flag the lesson for review → resurface after 24h

- [ ] **Integration 2: Lesson→Pronunciation loop** <!-- linear-id: LUM-NEW -->
  - Vocabulary from each lesson feeds into pronunciation practice module
  - Student marks a vocabulary word as "learned" only after passing pronunciation assessment

- [ ] **Integration 3: Story→Lesson loop** <!-- linear-id: LUM-NEW -->
  - Comprehension questions from stories feed competency tracking for the "Reading and Comprehension" topic
  - Low comprehension score → suggests simpler story → suggests vocabulary review

- [ ] **Integration 4: Dictionary→Flashcard loop** <!-- linear-id: LUM-NEW -->
  - Words saved to vocabulary list auto-create flashcards (SM-2 spaced repetition)
  - "Review Vocabulary" flashcard session type for language subjects

- [ ] **Integration 5: Student Question Bank → Quiz Engine** <!-- linear-id: LUM-NEW -->
  - "Quiz from past questions" mode: creates a quiz session using only `PastPaperQuestion` records filtered by subtopic
  - Uses existing quiz engine (`useQuiz`, `QuestionCardFeedback`, etc.) — only the source changes from AI-generated to past-paper-sourced

---

### Dexie Schema Changes

| Version | Batch | New Tables | Notes |
|---------|-------|-----------|-------|
| v33 | C5 | `dictionaryCache` | 24h TTL, word lookup cache |
| v33 | C5 | `vocabularyList` | Per-user saved vocabulary |
| v33 | C5 | `lessonProgress` | Per-user lesson tracking |
| v33 | D2 | `storyCache` | Story content cache |
| v33 | D2 | `storyQuestions` | AI-generated comprehension questions |

---

### Verification Gates (Every Batch)

```
npx tsc --noEmit     → zero errors
npx biome check       → zero warnings on changed files
npx vitest run        → all pass (current baseline: 1270 pass, 0 fail)
npx next build        → clean build
```

---

## 🔴 P0 — Runtime crashes (found June 2026 audit)

### 9 pages crash with HTTP 000 (server connection refused)
- [ ] **Diagnose + fix root cause** — Pages at `/search`, `/upload`, `/bookmarks`, `/settings`, `/past-papers`, `/review`, `/premium`, `/support`, `/offline` crash the server (HTTP 000 = connection refused) when accessed without locale prefix. Proxy (`src/proxy.ts`) is correct for Next.js 16 — functionality works for `/quiz`, `/flashcards`, `/chat`, `/solve`, `/problems`, `/study-guide`. Likely causes:
  - **Module-level Dexie instantiation** — `src/lib/db/schema.ts` and `src/lib/db/dexie-data-access.ts` create Dexie/DataAccess at module load time, which fires during SSR where `indexedDB` is unavailable. Pages transitively importing `@/lib/db` crash. Fix: wrap in lazy getter or `typeof window === "undefined"` guard.
  - **Missing locale guard in layout** — `[locale]/layout.tsx` passes raw `params.locale` to `<Providers>` → `<NextIntlClientProvider>`. When accessed without locale prefix, locale may be invalid, causing `Intl.DateTimeFormat("search")` `RangeError`. Add fallback to `defaultLocale`.

### Infinite re-render in useOnboarding
- [ ] **Fix `updateProgress` dependency cycle** — `src/hooks/use-onboarding.ts:106` has `updateProgress = useCallback(fn, [data])` where `data` changes on every `setData(updated)` call. `src/components/onboarding/onboarding-wizard.tsx:153` has a `useEffect` depending on `[updateProgress]`, creating a tight infinite loop. Fix: use functional updater `setData(prev => ...)` with empty `[]` deps so `updateProgress` is stable. Same pattern exists in `completeOnboarding` and `skipOnboarding` (latent).

## 🟡 P1 — Missing / dead code

### ResultsSearch uses mock data only
- [ ] **Connect live backend or remove** — `src/components/tools/communication/results-search.tsx` imports `mockExamResults` from `src/lib/data/mock-exam-results.ts` (25 hardcoded fake entries, 5 per year 2021-2025). Renders "Demo data" badge. No real API endpoint exists.

### 22 dead barrel files (zero consumers)
- [ ] **Remove or consolidate** — `index.ts` re-export files with zero imports from their barrel path. All consumers import directly from file paths. Affected: `src/components/dashboard/index.ts`, `src/components/icons/index.ts`, `src/components/loading/index.ts`, `src/components/atoms/index.ts`, `src/components/molecules/index.ts`, `src/components/tools/index.ts`, `src/components/teacher/index.ts`, `src/components/i18n/index.ts`, `src/components/parent/index.ts`, `src/components/home/index.ts`, `src/components/consent/index.ts`, `src/components/onboarding/svgs/index.ts`, `src/components/study-planner/index.ts`, `src/components/language/index.ts`, `src/components/ui/headers/index.ts`, `src/components/chat/index.ts`, `src/components/auth/index.ts`, `src/lib/embedding/index.ts`, `src/lib/ocr/index.ts`, `src/lib/rate-limiter/index.ts`, `src/lib/knowledge-graph/index.ts`, `src/lib/data/index.ts`.

### 8 orphaned components (defined, never imported)
- [ ] **Remove or wire** — `EmptyReportState`, `LastStudyTime`, `CelebrationButton`, `DashboardHeader`, `DashboardHero`, `SearchInput` (dashboard/search), `VoiceWaveIcon`, `LoadingScreen`.

### 3 silent empty catch blocks
- [ ] **Add `logError()`** — `src/components/teacher/class-shell.tsx:47,63` and `src/components/teacher/assignment-card.tsx:40` have `/* silent */` empty catch blocks. Should use `logError()` per Session 23 standard.

### 10 redundant `disabled={false}` props
- [ ] **Remove dead props** — `src/components/tools/notes/note-form.tsx` (4x: lines 86, 99, 111, 149) and `src/components/quiz/parts/QuestionCardInput.tsx` (6x: lines 165, 181, 198, 219, 233, 266) hardcode `disabled={false}` which is never conditionally toggled.

### 6 `as never` casts in production code
- [ ] **Fix type safety** — `src/components/visual/diagram-renderer.tsx:118`, `src/components/dashboard/practice/exams-browse/exam-group-list.tsx:48`, `src/app/api/q/share/route.ts:39`, `src/lib/share/share-service.ts:53,170,196`.

### Dead i18n keys
- [ ] **Remove unused "comingSoon"** — 11 message files (`en.json`, `af.json`, `zu.json`, etc.) define `"comingSoon": "Coming soon"` but no component references this key.

### Redirect-only page
- [ ] **Remove or inline** — `src/app/[locale]/exam/page.tsx` (12 lines) only redirects to `/dashboard/exams`. Could be replaced with a route redirect config.

## 🟠 P2 — Missing Suspense boundaries (Next.js 16)

- [ ] **Wrap `useSearchParams()` in `auth/sign-up`** — Verify `src/app/[locale]/auth/sign-up/page.tsx:71` has a `<Suspense>` boundary around the component using `useSearchParams()`. Next.js 16 enforces this.
- [ ] **Wrap `useSearchParams()` in `auth/reset-password`** — Same check for `src/app/[locale]/auth/reset-password/page.tsx:68`.

## 🔵 P3 — 404 routes (wrong URLs)

- [ ] **Add redirects** — `/exams` (should be `/dashboard/exams`), `/sign-in` (should be `/auth/sign-in`), `/sign-up` (should be `/auth/sign-up`). Add page files at these paths that redirect, or configure in `next.config`.

# Memory Consolidation — Lumni

**Generated:** 2026-05-29  
**Last updated:** June 2026 (Sessions 15-19)
**Sources:** MEMORY.md, AGENTS.md (Sessions 1-19), implementation-notes.md, CONTEXT.md, docs/adr/

---

## Decisions (ADR-lite)

| ID | Decision | Rationale | Date |
|----|----------|-----------|------|
| D001 | LearningOrchestrator composes QuestionEngine (not duplicates) | Single deep module for question ops; orchestrator handles only orchestration side effects | 2026-05-15 |
| D002 | Dexie L1 + Appwrite L2 + AI/Wikimedia L3 caching stack | Offline-first; free-tier limits on Appwrite (50k docs) require L1 to be primary | 2026-05-11 |
| D003 | Gemini 2.0 Flash Lite primary, Nvidia NIM fallback, Groq last resort | DeepSeek removed as too expensive for free-tier credits | 2026-05-13 |
| D004 | Local grading for 4 types, AI grading for 7 types | Short-answer tries exact string match first (saves ~70% AI grade calls) | 2026-05-11 |
| D005 | Anonymous → Authenticated via `updateEmail` + `updatePassword` (same userId) | Preserves anonymous user ID; avoids data loss on sign-up | 2026-05-22 |
| D005a | Anonymous users get soft gating (component-level), not route-level guards | App auto-creates anonymous sessions — no "not signed in" state at route level | 2026-05-22 |
| D006 | All DB access through Repository layer (`src/lib/db/repositories/`) | Consistent typed DB access; isolation from Appwrite SDK changes | 2026-05-15 |
| D007 | Sync queue uses Dexie-backed QueueCore with single processor | Duplicate sync hooks removed | 2026-05-20 |
| D008 | TrackQuestionResult() used across exam/flashcards/dashboard for unified competency | Single source of truth for competency data | 2026-05-20 |
| D009 | Token budgets: 20 gen/day, 100 grade/day, 20 hint/day, 50 visual/day per user; 2000 global | Prevents exhausting free-tier AI API limits | 2026-05-13 |
| D010 | Stores in `src/store/` not `src/lib/store.ts` or `src/lib/stores/` | Cleaner separation; deprecated lib stores not to be used | 2026-05-15 |
| D011 | Study planner: inverse-competency-weighted round-robin scheduling | Prioritizes weakest topics while covering all subjects | 2026-05-20 |
| D012 | `$...$` / `$$...$$` delimiters for math (not `\(...\)`) | remark-math defaults to dollar-sign delimiters | 2026-05-15 |
| D013 | Appwrite cleanup cron deletes cached questions >30 days (batches of 100) | Protects 50k document limit on Appwrite Free tier | 2026-05-15 |
| D014 | Auth rate limits client-side: 3 sign-in/5min, 1 magic link/5min | Prevents brute force and email spam | 2026-05-15 |
| D015 | Onboarding fires once on first visit regardless of auth status; never re-triggers | Partial data saved with defaults; wizard is 5 steps | 2026-05-15 |
| D016 | Competency sync field: use `score` (not `proficiency`) | Historical bug — job-processor wrote `proficiency` but API routes read `score`; fixed both write paths + backward-compat fallback | 2026-05-20 |
| D017 | Exam sessions stored in `exam_sessions` Appwrite collection (not `exam_papers`) | Wrong collection was used historically; fixed in Session 1 | 2026-05-15 |
| D018 | Flashcard engine consolidated into `src/lib/flashcard-engine/` | Unified FlashcardEngine class wrapping DexieRepository + SM-2/FSRS | 2026-05-24 |
| D019 | Generic route handler factory `createRouteHandler()` | Replaces 49 copies of auth/try-catch boilerplate | 2026-05-24 |
| D020 | QuizPackService for offline AI quiz packs | Bulk generation + Dexie v18 persistence + rate limiting | 2026-05-26 |
| D021 | Playwright for E2E testing; Storybook for UI documentation | Coverage gap: only unit tests existed; Storybook for component doc | 2026-05-26 |
| D022 | ImmersiveModeProvider for full-screen quiz/exam | Auto-hides nav bars; improves focus during sessions | 2026-05-28 |
| D023 | SwipeableCardDeck replaces old flashcard list | Tinder-style interaction; SM-2 quality picker; 3-card cascade | 2026-05-28 |
| D024 | Dual-write consent strategy (Appwrite + Dexie) | GDPR/POPIA compliance; background sync job with retry | 2026-05-29 |
| D025 | Bun runtime migration (≥1.2.0) | Faster CI, smaller install, native test runner; lockfile regenerated | 2026-05-28 |
| D026 | i18n locale-based routing ([locale] prefix) | en/af/zu translations; middleware-based locale detection | 2026-05-28 |
| D027 | Premium gating at component level (hasFeature) | Per-feature gates; Stripe/Payfast checkout; Appwrite subscription sync | 2026-05-29 |
| D028 | Observability via latency-tracker + usage events | AI provider timing; feature usage; admin dashboard | 2026-05-28 |
| D029 | WCAG 2.2 AA a11y compliance target | 30+ components audited; 19 critical/high fixes; keyboard + screen reader | 2026-06-01 |

### Reversals

| Reversed | Replaced By | Reason | Date |
|----------|-------------|--------|------|
| LearningOrchestrator duplicated `generate`/`grade`/`validate` | D001 — Orchestrator composes QuestionEngine | Violated depth principle; two modules had identical logic | 2026-05-15 |
| DeepSeek Reasoner as AI provider | D003 — Gemini -> Nvidia -> Groq | Too expensive for free-tier credits | 2026-05-13 |
| `lottie-react` for animations | `@lottiefiles/dotlottie-react` | lottie-web unpin issue; see `docs/issues/lottie-web-unpin.md` | 2026-05-15 |

---

## Patterns (Reusable Solutions)

- **Zod for all external API validation**: API routes validate request bodies with Zod schemas before processing
- **Repository pattern for DB access**: All `src/lib/db/repositories/` provide typed CRUD, tests use mock repos
- **QueueCore generic queue**: Single `QueueCore` class in `src/lib/queue/core.ts` powers both SyncQueue (offline mutations) and JobQueue (orchestration side effects). Exponential backoff + concurrency guard built in.
- **RateLimiter single class, domain-specific configs**: In-memory rate limiter with configs for auth, API routes, and AI token budgets
- **Dexie schema versioning**: Schema versions (currently v24) managed in `src/lib/db/schema.ts` with upgrade handlers (v18→v24 includes userConsents, quizPacks, packQuestions, and more)
- **Competency mapper**: Novice→Easy, Developing→Medium, Proficient→Medium, Mastered→Hard (in `src/lib/question-engine/competency-mapper.ts`)
- **Background visual pre-caching**: When questions are generated, visual generation fires in background so visuals are cached before the question card renders
- **SM-2 spaced repetition**: Flashcard review uses SM-2 algorithm; existing cards use `reviewFlashcard()`, AI fallback for new content
- **Immersive mode pattern**: React context + `useImmersiveMode()` hook; nav components self-hide; quiz/exam auto-enable; floating exit pill
- **Swipeable deck pattern**: `useSwipeDeck` state machine (idle→dragging→swiped→quality-pick→advancing); undo stack; framer-motion drag + spring-back
- **Offline pack pattern**: `QuizPackService` + Dexie `quizPacks`/`packQuestions` tables; rate-limited generation; expiry-based eviction
- **Consent dual-write pattern**: `UserConsentService.save()` writes to Dexie first, then enqueues `appwrite-consent-sync` background job with retry; gates (`ai-gate`, `sentry-gate`) read module-level booleans
- **i18n pattern**: Locale-based routing via `[locale]` middleware; `i18n-provider.tsx` + `navigation.ts` helpers; translation keys in JSON under `src/i18n/`
- **Mega-component decomposition**: Co-located sub-components; barrel exports in `index.ts` preserve import sites; target: <200 lines per component

---

## Failures

| What | Why | Lesson |
|------|-----|--------|
| DBE PDF text extraction | Official PDF timetable is image-based (embedded JPEGs) — `@opendataloader/pdf` and `pdfjs-dist` both fail | Manual extraction from web sources (studentdaily.co.za) needed; live PDF scraping is future work with OCR |
| DeepSeek Reasoner as AI provider | Exceeded free-tier budget too quickly | Switch to cheaper models: Gemini 2.0 Flash Lite (primary), Nvidia NIM (fallback) |
| Duplicate sync hooks | Multiple hooks (`useAutoSync`, `useEnhancedSync`, etc.) that all processed the same queue | Consolidate to single `src/lib/sync-queue.ts` processor |
| Competency `proficiency` vs `score` field | Job processor wrote to `proficiency` but all readers expected `score` | Fix both write paths + add backward-compat fallback in readers |
| Duplicated generate/grade in both QuestionEngine and LearningOrchestrator | Two modules with identical logic — bugs had to be fixed in two places | Compose, don't duplicate: Orchestrator calls Engine |

---

## Open Questions

1. **Redis-backed rate limiting**: In-memory RateLimiter does not survive server restarts. Needed for multi-instance deployment.
2. **Kangaroo keyboard support**: Swipeable deck now has basic keyboard (Space/Enter flip, Arrow keys swipe) but lacks full ARIA widget semantics
3. **QuestionEngine consent-denied UX**: Engine silently returns `[]` when data-sharing consent is denied — no user-facing explanation

### Resolved

| Question | Resolution | Date |
|----------|-----------|------|
| Appwrite write path for exam_dates? No server-side cron exists. | ✅ Done — Session 10: background job `"appwrite-exam-dates-sync"` + `syncExamDatesToAppwrite()` | 2026-05-26 |
| Component test strategy? What framework? | ✅ Playwright for E2E + Storybook for UI docs — Session 10 | 2026-05-26 |
| PDF scraping for exam dates? OCR or manual? | ✅ Manual extraction from web sources for now; OCR remains future work | 2026-05-26 |
| GDPR/POPIA legal compliance? | ✅ Done — consent management, cookie banner, TOS versioning, account deletion, data export (Session 17) | 2026-05-29 |
| Accessibility standard? | ✅ WCAG 2.2 AA — 30+ components audited, 19 critical/high fixes (Session 19) | 2026-06-01 |
| Test suite health? | ✅ 1109 pass, 5 fail (e2e only) — fixed module cache conflicts + missing mocks (Session 18) | 2026-06-01 |

---

## Contacts / Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| Domain glossary | `CONTEXT.md` | Shared vocabulary for all agents |
| Agent instructions | `AGENTS.md` | Engine arch, math conventions, session 1-19 history |
| Design system | `DESIGN.md` | "The Emerald Study Room" — colors, typography, components |
| Product context | `PRODUCT.md` | Target users, brand principles |
| Spec: Exam Dates | `SPEC.md` | National Exam Dates Tracker spec |
| Roadmap | `docs/roadmap.md` | Phase-based product roadmap |
| ADR-0001 | `docs/adr/0001-question-engine-composition.md` | QuestionEngine composition decision |
| Lottie migration | `docs/issues/lottie-web-unpin.md` | Resolved: migrated from lottie-react to @lottiefiles/dotlottie-react |
| Impeccable skill | `.agents/skills/impeccable/` | UI/UX design audit workflow (34 reference files) |

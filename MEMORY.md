# Memory Consolidation — Lumni

**Generated:** 2026-05-22  
**Sources:** MEMORY.md, AGENTS.md (Session 1-6), implementation-notes.md, CONTEXT.md, docs/adr/0001

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
| D007 | Sync queue uses Dexie-backed QueueCore with single processor | Duplicate sync hooks (`useAutoSync`, `useEnhancedSync`, `useSyncAll`, `useSyncSingleSubject`) removed | 2026-05-20 |
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
- **Dexie schema versioning**: Schema versions (currently v12) managed in `src/lib/db/schema.ts` with upgrade handlers
- **Competency mapper**: Novice→Easy, Developing→Medium, Proficient→Medium, Mastered→Hard (in `src/lib/question-engine/competency-mapper.ts`)
- **Background visual pre-caching**: When questions are generated, visual generation fires in background so visuals are cached before the question card renders
- **SM-2 spaced repetition**: Flashcard review uses SM-2 algorithm; existing cards use `reviewFlashcard()`, AI fallback for new content

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

1. **Appwrite write path for exam_dates**: No server-side cron or Appwrite collection exists yet for exam date data. Current implementation is Dexie L1 + seed data L2 only. When to build?
2. **Component test strategy**: TODO.md lists E2E and component tests as outstanding. Current tests are unit-only. What framework? Playwright for E2E?
3. **PDF scraping for exam dates**: Official DBE PDF is image-based. OCR (Tesseract?) or manual data entry each session?
4. **Shared subject color/abbreviation maps**: Duplicated between old `exam-calendar.tsx` and new `exam-dates/service.ts`. Extract to shared location?
5. **Old `ExamCalendar` component**: Preserved but unused. When to delete?
6. **Comparative analytics**: Depends on other users' data in Appwrite; currently falls back to estimates. Production-ready path unclear.

---

## Contacts / Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| Domain glossary | `CONTEXT.md` | Shared vocabulary for all agents |
| Agent instructions | `AGENTS.md` | Engine arch, math conventions, session history |
| Design system | `DESIGN.md` | "The Emerald Study Room" — colors, typography, components |
| Product context | `PRODUCT.md` | Target users, brand principles |
| Spec: Exam Dates | `SPEC.md` | National Exam Dates Tracker spec |
| Roadmap | `docs/roadmap.md` | 4-phase product roadmap |
| ADR-0001 | `docs/adr/0001-question-engine-composition.md` | QuestionEngine composition decision |
| Lottie migration | `docs/issues/lottie-web-unpin.md` | Resolved: migrated from lottie-react to @lottiefiles/dotlottie-react |
| Impeccable skill | `.agents/skills/impeccable/` | UI/UX design audit workflow (34 reference files) |

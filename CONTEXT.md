# Context Manifest — 2026-05-24

## Identity

Lumni is an offline-capable, mobile-first SA Matric exam prep platform using Next.js 16, Appwrite backend, and a Gemini→Nvidia→Groq AI chain for question generation + grading + visual diagram creation. This file is the compressed working memory for AI agents — paste it first to maximize relevance.

## Current Mission

Architecture consolidation: flashcard engine unified into `src/lib/flashcard-engine/`, generic route handler factory in `src/lib/api/create-route-handler.ts` replacing 49 copies of auth/try-catch boilerplate, services barrel exporting all 10 services, tools directory reorganized into domain subdirs. Next push: test coverage (unit + E2E) and exam_dates Appwrite write path.

## System at a Glance

```
Browser (React 19 + Next.js 16)
  ├── Dexie IndexedDB   ← L1 cache (questions 24h, visuals 7d)
  ├── Zustand stores     ← client state (quiz, exam, sync, search)
  └── React Query        ← server state cache
        │
Next.js API Routes (~35 groups, most via createRouteHandler factory)
  ├── QuestionEngine     → Gemini → Nvidia NIM → Groq (AI chain)
  ├── VisualEngine       → Konva (STEM) or Wikimedia (non-STEM)
  ├── LearningOrchestrator → composes Engine + queued side effects
  ├── QueueCore          → Dexie-backed job queue (retry + backoff)
  ├── RateLimiter+TokenTracker → auth limits + AI budget caps
  └── createRouteHandler → generic factory (auth guard + body parse + validation + error wrap)
        │
Appwrite Cloud
  ├── Auth (anonymous → email/password)
  ├── DB (questions, visuals, exam_sessions, exam_papers)
  └── Storage (exam PDFs, avatars)
```

## Key Constraints

1. **Free-tier budgets**: 2000 AI calls/day global; per-user: 20 gen, 100 grade, 20 hint, 50 visual. Soft block (429 with headers), resets midnight.
2. **50k Appwrite doc limit**: Cleanup cron deletes cached questions >30 days (batches of 100).
3. **Offline-first**: All reads hit Dexie first. Write queue flushes via `sync-queue.ts` on reconnect.
4. **Math delimiters**: `$...$` / `$$...$$` only (no `\(...\)`). KaTeX via `remark-math` + `rehype-katex`.
5. **Anonymous→authenticated**: Same userId preserved via `updateEmail()` + `updatePassword()`. Soft gating at component level, not route level.

## Active Surface

| File/Dir | What I'm touching |
|----------|-------------------|
| `src/lib/flashcard-engine/` | Unified FlashcardEngine: types, engine singleton, barrel |
| `src/lib/api/create-route-handler.ts` | Generic route handler factory (auth guard + HttpError + validation) |
| `src/lib/services/index.ts` | Services barrel: all 10 services + ServiceResult<T> |
| `src/components/tools/core/` | Timer, pomodoro, voice recorder tools |
| `src/components/tools/math/` | Scientific calculator, unit converter |
| `src/components/tools/science/` | Periodic table, physics tools |
| `src/components/tools/scheduling/` | National exam calendar, study schedule |
| `src/components/tools/communication/` | Exam detail dialog |
| `src/app/api/analytics/comparative/route.ts` | Migrated to createRouteHandler |
| `src/app/api/analytics/trends/route.ts` | Migrated to createRouteHandler |
| `src/app/api/admin/exams/route.ts` | Migrated to createRouteHandler |
| `src/app/api/exam-sessions/route.ts` | Migrated to createRouteHandler |
| `src/app/api/jobs/process/route.ts` | Migrated to createRouteHandler |
| `src/hooks/use-spaced-repetition.ts` | Uses flashcardEngine singleton |
| `src/hooks/use-sr-settings.ts` | Uses flashcardEngine singleton |

## Background Knowledge

- **Question types (11)**: multiple-choice, matching, short-answer, long-answer, essay, calculation, diagram, programming, source-based, data-response, mixed. Local grade for 4 types (MC, matching, calculation, short-answer with exact-match fallback), AI grade for 7 types.
- **Flashcard engine**: `src/lib/flashcard-engine/` — single `FlashcardEngine` class wrapping DexieRepository + SM-2/FSRS + daily limits + learning steps + ease-hell + leech + settings. Used via `flashcardEngine` singleton.
- **Route handler factory**: `src/lib/api/create-route-handler.ts` — `createRouteHandler()` with `AuthMode`, `HttpError`, auto auth guard, body parsing, validation, error wrapping, optional rate limiting. Reduces ~49 boilerplate copies to declarative config.
- **AI provider chain**: Gemini 2.0 Flash Lite (primary) → Nvidia NIM meta/llama-3.3-70b-instruct → Groq llama-3.3-70b-versatile. Defined in `src/lib/ai/client.ts`. DeepSeek was removed.
- **Competency levels**: novice→Easy/remember, developing→Medium/understand/apply, proficient→Medium/apply/analyze/evaluate, mastered→Hard/evaluate/create. Mapped in `src/lib/question-engine/competency-mapper.ts`.
- **Caching tiers**: Dexie L1 (fastest, per-device) → Appwrite L2 (cross-session) → AI/Wikimedia L3 (on-demand fallback). Visual pre-caching fires on question generation automatically.
- **Diagrams**: STEM subjects (30) → Konva renderers (geometry, chart, chemistry, graph, force-vector, circuit, wave, motion, node-flow, custom-svg). Non-STEM → Wikimedia Commons images. Fallback: Mermaid.js.
- **Design**: "The Emerald Study Room" — Study Green accent (`oklch(52% 0.18 146)`), Warm Paper neutrals, Outfit 800 / Geist 400 fonts, 20px card radius, 44px touch targets, stacked lightness over shadows.
- **Auth**: Anonymous users auto-created; sign-up upgrades anonymous session. Admin uses separate magic-link + OTP. Rate limits: 3 sign-in/5min, 1 magic link/5min.
- **Onboarding**: 5-step wizard (Welcome→Subjects→Goals→Schedule→Notifications) with Three.js particle background + inline SVG illustrations. Fires once only. Re-enter via Settings > Data tab.

## Avoid

- ❌ Do NOT use `\(...\)` or `\[...\]` for math — only `$...$` / `$$...$$`
- ❌ Do NOT create new stores in `src/lib/store.ts` or `src/lib/stores/` — use `src/store/`
- ❌ Do NOT duplicate QuestionEngine logic in LearningOrchestrator — compose, don't duplicate
- ❌ Do NOT use `lottie-react` — already migrated to `@lottiefiles/dotlottie-react`
- ❌ Do NOT add route-level auth guards — anonymous users exist at every route; use component-level `isAnonymous` checks
- ❌ Do NOT use arbitrary pixel values (`w-[200px]`, `text-[13px]`) — use design tokens (`--space-*`, `--fs-*`)
- ❌ Do NOT hardcode shadows (`shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]`) — use `shadow-level-1/2/3`
- ❌ Do NOT use `space-y-*` or manual `mt-* mb-*` pairs — use `gap-*` on the parent container
- ❌ Do NOT write magic z-index numbers (`z-50`, `z-[100]`) — use `--z-*` semantic tokens
- ❌ Do NOT declare `max-w-*` or `px-*` at the page level — wrap pages in `<PageContainer>`

## Memory References

| File | What's inside | Priority |
|------|---------------|----------|
| `repo-index.md` | Full directory tree, entry points, data flow, conventions, recent changes, TODOs | Reference |
| `prompt-catalog.md` | Catalog of all discoverable prompt contexts (agents, specs, plans) | Reference |
| `memory.md` | All decisions (ADR-lite), patterns, failures, open questions, resources | High |
| `system-design.md` | Mermaid architecture diagram, data model ERD, component dictionary, API list, NFRs, roadmap | High |
| `AGENTS.md` | Engine architecture, math conventions, session 1-8 history, AI provider chain | High |
| `CONTEXT.md` | Domain glossary — prepend to any agent prompt | High |
| `DESIGN.md` | "The Emerald Study Room" design system (300 lines) | Medium |
| `TODO.md` | Outstanding tasks: custom domain, test coverage, exam dates items | Medium |

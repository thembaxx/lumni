# Context Manifest — 2026-05-22

## Identity

Lumni is an offline-capable, mobile-first SA Matric exam prep platform using Next.js 16, Appwrite backend, and a Gemini→Nvidia→Groq AI chain for question generation + grading + visual diagram creation. This file is the compressed working memory for AI agents — paste it first to maximize relevance.

## Current Mission

Polish and production-hardening: error handling standardization, anonymous user gating, Sentry integration, exam session resume/auto-save, sync queue consolidation, and Bloom's Taxonomy widget on dashboard. Next push: test coverage (unit + E2E) and exam_dates Appwrite write path.

## System at a Glance

```
Browser (React 19 + Next.js 16)
  ├── Dexie IndexedDB   ← L1 cache (questions 24h, visuals 7d)
  ├── Zustand stores     ← client state (quiz, exam, sync, search)
  └── React Query        ← server state cache
        │
Next.js API Routes (30+ groups)
  ├── QuestionEngine     → Gemini → Nvidia NIM → Groq (AI chain)
  ├── VisualEngine       → Konva (STEM) or Wikimedia (non-STEM)
  ├── LearningOrchestrator → composes Engine + queued side effects
  ├── QueueCore          → Dexie-backed job queue (retry + backoff)
  └── RateLimiter+TokenTracker → auth limits + AI budget caps
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
| `src/app/error.tsx`, `src/app/global-error.tsx` | Error boundary standardization |
| `src/components/navigation/bottom-nav.tsx` | Fixed transparent bg + border |
| `src/components/quiz/parts/` | QuestionCardControls, QuestionCardFeedback |
| `src/lib/server/exam-paper-actions.ts` | Exam paper server actions |
| `src/lib/server/quiz-actions.ts` | Quiz server actions |
| `src/lib/utils/flashcard-import-export.ts` | Flashcard bulk import/export |
| `src/lib/utils/spaced-repetition.ts` | SM-2 algorithm tweaks |
| `src/lib/queue/core.ts` | QueueCore job processing |
| `src/lib/competency-engine/path-engine.ts` | PathEngine competency calculations |
| `src/lib/appwrite.ts` | Appwrite client config |
| `src/hooks/use-wrong-answer-journal.ts` | Wrong answer journal hook |
| `src/curriculum/index.ts` | Curriculum definitions |
| `src/components/tools/exam-detail-dialog.tsx` | Exam detail dialog |
| `src/components/settings/tabs/profile-tab.tsx` | Profile settings for anonymous |
| `src/components/home/home-content.tsx` | Home page content |

## Background Knowledge

- **Question types (11)**: multiple-choice, matching, short-answer, long-answer, essay, calculation, diagram, programming, source-based, data-response, mixed. Local grade for 4 types (MC, matching, calculation, short-answer with exact-match fallback), AI grade for 7 types.
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

## Memory References

| File | What's inside | Priority |
|------|---------------|----------|
| `repo-index.md` | Full directory tree, entry points, data flow, conventions, recent changes, TODOs | Reference |
| `prompt-catalog.md` | Catalog of all discoverable prompt contexts (agents, specs, plans) | Reference |
| `memory.md` | All decisions (ADR-lite), patterns, failures, open questions, resources | High |
| `system-design.md` | Mermaid architecture diagram, data model ERD, component dictionary, API list, NFRs, roadmap | High |
| `AGENTS.md` | Engine architecture, math conventions, session 1-6 history, AI provider chain | High |
| `CONTEXT.md` | Domain glossary (163 lines) — prepend to any agent prompt | High |
| `DESIGN.md` | "The Emerald Study Room" design system (300 lines) | Medium |
| `TODO.md` | Outstanding tasks: custom domain, test coverage, exam dates items | Medium |

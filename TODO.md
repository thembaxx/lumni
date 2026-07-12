# TODO

> **Full session history is in `AGENTS.md`.** This file tracks only pending work, active audits, and reference tables.

---

## 🔴 Pending (unchecked)

### VoiceEngine API Keys (GitHub issue [#72](https://github.com/thembaxx/lumni/issues/72))

- [ ] **Set `ELEVENLABS_API_KEY` in production** — Required for primary ElevenLabs TTS provider. Obtain from https://elevenlabs.io/app/settings/api-keys. Add to Vercel env vars.
- [ ] **Set `GOOGLE_TTS_API_KEY` in production** — Required for Google Cloud TTS fallback (supports af-ZA, zu-ZA, en-ZA). Obtain from GCP Console → APIs & Services → Credentials. Enable "Cloud Text-to-Speech API". Add to Vercel env vars.
- [ ] **Set both keys in `.env.local` for development** — Engine degrades gracefully to FreeTTS if absent.

### Branch Protection + Admin (GitHub)

- [x] **Set up branch protection rules** ([#84](https://github.com/thembaxx/lumni/issues/84))
  - `dev`: required status checks (quality, unit-tests, build — strict), required PR review (1), admin enforcement
  - `master`: same + required linear history
- [ ] **Verify Sentry→Linear integration** — Trigger test error, confirm Linear issue auto-created with correct labels

### DataAccess Domain Split — Phase 2 Tables

- [x] **CachedAIGenerator generic** — Added `TDb` param, narrowed 4 consumers to `StudyDataAccess`/`StoryDataAccess`/`CacheDataAccess`
- [x] **search-service types** — Replaced `Pick<DataAccess, ...>` with intersection of 9 sub-interfaces
- [ ] **Remaining full DataAccess consumers** — ~20 files still on full `DataAccess` (flashcard engine, bookmark, sync, services, etc.)

---

## ✅ Completed — Noteworthy Deliverables

| Area                         | Session   | Key outcome                                                                       |
| ---------------------------- | --------- | --------------------------------------------------------------------------------- |
| RAG engine                   | S19-21    | TinyFish web-grounded AI for solve + quiz gen; hybrid AI-cited source attribution |
| Swipeable flashcards         | S13       | Tinder-style deck with SM-2 quality picker, undo stack                            |
| Full-screen quiz             | S14       | ImmersiveModeProvider hides nav on quiz/exam, exit pill                           |
| Ably live sessions           | S45       | Real-time presence migrated from Appwrite 15s polling                             |
| Quiz engine lib              | S28       | `useQuiz()` hook wrapping engine + session + auto-flashcards                      |
| Knowledge graph              | S25       | AI topic dependency graph with inline + dashboard views                           |
| CI/CD                        | S49+      | Production hardening, instant navigations, two-branch flow                        |
| Premium gating removed       | S36       | All features free; login banners on auth-required pages                           |
| Theme chrome                 | S31       | Dynamic `theme-color` meta sync, accent-tinted nav glass                          |
| Konva dark mode              | S44       | 8 renderers + diagram-theme.ts with WCAG AA colours                               |
| Gamification quality         | S40       | 7 new achievements: mistake review, flashcard focus, etc.                         |
| Cross-device sync            | S50       | `src/lib/sync/` — types, outbox queue, service, Dexie v41                         |
| Unified STT                  | S50       | Provider chain: Deepgram → Browser → Whisper WASM                                 |
| Hook factories               | S39       | `createApiQuery`/`createInvalidatingMutation` — 8 hooks refactored                |
| Service extractions          | S37-38    | 14 services extracted, 500+ lines dead code removed                               |
| Architecture deepening       | S37-40    | AI singleton collapsed, lastRagContext → structured return, CachedAIGenerator     |
| Mega-component decomposition | S12+15+39 | ~2000 lines extracted across 25+ new component files                              |

### Test baseline: 2047 pass, 0 fail (222 files)

---

## 🔍 Impeccable Audit — Findings (iteration 1 complete)

### Pending follow-up

- **P2 — `text-white` on `bg-system-accent` in dark mode** (13 sites): Flagged WCAG AA fail (~2:1). Status: `--system-accent-foreground` token exists in both themes but 23 call sites still use `text-white`. Need to sweep and migrate.
- **P3 — Bounce-easing keyframes** in `globals.css`: Design-system pop language, needs file-level `<!-- impeccable-disable -->` annotation.
- **P3 — Arbitrary px in `switch.tsx` + `tab-switcher.tsx`**: Control-spec sizing, needs dedicated tokens or disable annotations.

### Verification

`pnpm run todo:sync` is BLOCKED — `LINEAR_API_KEY` not authenticated. Run from an environment with a valid key to push audit entries to Linear.

---

## 📚 Dexie Schema Reference

| Version | Tables                                                                 |
| ------- | ---------------------------------------------------------------------- |
| v25     | `tinyfishCache`, `tinyfishUsage`                                       |
| v26     | `Question.webSources` (lazy, no new index)                             |
| v27     | `analyticsEvents`                                                      |
| v28     | `sharedQuestions`                                                      |
| v29     | `knowledgeGraph`                                                       |
| v30     | `teacherObservations`, `assignmentMessages`                            |
| v31     | `studyPlans`, `onboardingState`, `srDailyBudget`, `flashcardSyncState` |
| v32     | `studyGuides`                                                          |
| v41     | `syncOutbox`, `syncCheckpoints`, `sttCache`, `sttUsage`                |

Current schema: v41 (Dexie 4.x, 38+ tables)

---

## ✅ Verification Gates

```
pnpm run typecheck       → zero errors
pnpm exec biome check    → zero warnings on changed files
pnpm run test            → all pass
pnpm run build           → clean build
```

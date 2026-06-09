# Platform Integration Sweep — Design

**Date:** 2026-06-09
**Status:** Draft
**Batches:** 0-5 (13 items, fully parallelizable)

---

## Overview

A sweep of 13 integration, edge-case, and bug-fix items identified during a deep codebase exploration (June 2026). Each batch is independent; items within each batch are also independent unless noted. The goal is to close the highest-leverage gaps in the learning loop without new engine or service creation.

---

## Batch 0 — Foundation Fixes (Fully Parallel)

### 0.1 — SSR Crash on 9 Pages

**Problem:** Pages at `/search`, `/upload`, `/bookmarks`, `/settings`, `/past-papers`, `/review`, `/premium`, `/support`, `/offline` crash with HTTP 000 when accessed without locale prefix. Root cause: module-level Dexie instantiation in `dexie-data-access.ts` / `schema.ts` fires during SSR where `indexedDB` is unavailable.

**Fix:**
- `src/lib/db/dexie-data-access.ts`: Wrap `DexieDataAccess` constructor in `typeof window === "undefined"` guard with a lazy singleton.
- `src/app/[locale]/layout.tsx`: Add `SUPPORTED_LOCALES` check and fallback to `defaultLocale` for `params.locale`.

**Files:** `dexie-data-access.ts`, `[locale]/layout.tsx`
**Risk:** None — guarded paths return null; consumers already have null checks in their active-guard patterns.

### 0.2 — Calculation Grading Type Mismatch

**Problem:** `QuestionCardInput.tsx:232` sends `{ type: "numeric", value: calcValue }` where `calcValue` is a string. Grader at `processors/graders/calculation.ts:6` casts `a.value as { value: number; unit?: string }` — evaluates `"42".value = undefined`, producing `NaN` on every comparison. Every answer grades as incorrect. Unit partial credit path (30%) is also silently broken.

**Fix (two-sided):**
- **Sender** (`QuestionCardInput.tsx`): Add `unitValue` state, wire `onUnitChange` from `CalculationInput`, send `{ type: "numeric", value: { value: parseFloat(calcValue), unit: unitValue } }`.
- **Grader** (`calculation.ts`): Add defensive parse — if `a.value` is string or number, wrap as `{ value: Number(a.value) }`.
- Mirror fix in `exam/part-renderer.tsx` if it has the same pattern.

**Files:** `QuestionCardInput.tsx`, `calculation.ts` grader, `part-renderer.tsx`

### 0.3 — Pool Question Type Loss

**Problem:** `question-engine.ts:121,177` hardcodes `type: "short-answer"` for all pool questions, ignoring `pq.questionType` from `question-extractor.ts`. An MCQ becomes a short-answer text input with no options.

**Fix:** Map `pq.questionType` to the correct `Question.type` with the matching body shape. A switch in `question-engine.ts` maps:
- `"multiple-choice"` → type `"multiple-choice"` with `body: { options, correctOption }` (extract options from `pq.questionText` if available, otherwise fall back to short-answer)
- `"calculation"` → type `"calculation"` with `body: { correctValue, unit?, tolerance }`
- `"essay"` → type `"essay"` with `body: { modelAnswer, minWords, maxWords }`
- `"matching"` → type `"matching"` with `body: { pairs }`
- All others → `short-answer` (preserves existing behavior for types without clean mappings)

The `PastPaperQuestion.questionType` field already carries the correct type — only the engine ignores it.

**Files:** `question-engine.ts`

### 0.4 — STEM Subject List Alignment

**Problem:** `STEM_SUBJECTS` (visual-engine/types.ts, 21 subjects) ≠ `ALLOWED_SUBJECTS` (tinyfish/allowlist.ts, 24 subjects). History, languages, business get RAG but no diagrams. CAT gets diagrams but no RAG.

**Fix:** Align `STEM_SUBJECTS` to match `ALLOWED_SUBJECTS`. The visual engine's cross-fallback (Konva → Wikimedia → Mermaid → null) makes this safe — added subjects simply fall through to Wikimedia if Konva can't produce a diagram.

**Files:** `visual-engine/types.ts`

---

## Batch 1 — Retention Loop

### 1.1 — retentionRecurrence in resolveNextAction()

**Problem:** `next-action.ts` never queries `retentionRecurrence`. Wrong answers scheduled for review via RetentionService are invisible to the "what should I do next" decision.

**Fix:** Add a new tier at priority #2 in `resolveNextAction()`:
> 2a. Due retention recurrences → `/quiz?subject=X&topic=Y&count=3&reviewMode=true`

Check `retentionRecurrence` table for entries where `scheduledAt <= now && !completed`. If ≥1 found, suggest review. If <3 found, supplement with weakest-topic questions to make a full quiz session.

The `retentionRecurrence` DataAccess table already exists at `_deps.db.retentionRecurrence`.

**Files:** `next-action.ts`

### 1.2 — Error Type → AI Remediation

**Problem:** Error types (`concept-misunderstanding`, `calculation-error`, etc.) stored on `WrongAnswerEntry` but never consumed by the question engine or prompts.

**Fix:** Add optional `remediationFocus?: string` to `GenerationParams`. When present, `PromptManager` adjusts the system prompt:
- `"calculation-error"` → "Emphasize step-by-step working and unit checking"
- `"concept-misunderstanding"` → "Reinforce foundational principles at a lower Bloom level"
- `"misread-question"` → "Include 'what is the question asking' cues"
- `"careless-mistake"` → "Flag common pitfalls and check-your-answer steps"
- `"time-pressure"` → "Include timing guidance alongside each question"

The `remediationFocus` follows the same injection pattern as `topicCompetencyLevel` — it's passed through `useQuiz()` → `useQuestionEngine()` → `POST /api/engine/generate` → `PromptManager.getPrompt()`.

**Files:** `types.ts` (GenerationParams), `prompt-manager.ts`, `prompts/generate.ts`, `use-quiz.ts`, `use-question-engine.ts`

### 1.3 — QuizEngine Competency Pass-Through

**Problem:** `QuizEngine.tsx:45-48` calls `useQuiz` with only `{ subject, count, questionType }` — no competency data. Embedded quizzes get generic questions without personalized difficulty/Bloom level.

**Fix:** Add optional `competencyProps` prop to `QuizEngine`:
```ts
interface QuizCompetencyProps {
  topicCompetencyLevel?: CompetencyLevel;
  topicCompetencyScore?: number;
  suggestedBloomLevel?: BloomLevel;
  suggestedDifficulty?: Difficulty;
}
```

Pass through to `useQuiz()`. Default stays as-is (no competency) for backward compat.

**Files:** `quiz-engine.tsx`, `use-quiz.ts`

---

## Batch 2 — Teacher→Student Loop

### 2.1 — Assignment Submission API

**Problem:** Student clicks "Practice" on an assignment, takes the quiz, but no submission record is created. The teacher sees no completion data. Competency is not updated.

**Fix:**
1. Create `POST /api/student/assignments/[id]/submit` — accepts `{ score, maxScore, totalQuestions, correctCount }`, upserts into `ASSIGNMENT_SUBMISSIONS` Appwrite collection.
2. Wire quiz completion (`quiz-view.tsx` state machine's complete handler) to call the submit API when `assignmentId` URL param is present.
3. After submission, upsert `CompetencyRecord` for each assignment topic with the quiz score.

**Files:** New route `api/student/assignments/[id]/submit/route.ts`, `quiz-view.tsx`

### 2.2 — Push Notification on Graded Assignment

**Problem:** Teacher adds a comment/grade via `AssignmentThread`, but student only sees it when they open the dashboard.

**Fix:** When `AssignmentThread` sends a message (Dexie `assignmentMessages` table), also call the existing `notification-service.ts` to fire a push notification to the student. Uses existing `subscribeToPush()` / `sendPushNotification()` infrastructure.

**Files:** `assignment-thread.tsx` (or its parent `class-shell.tsx`), `notification-service.ts`

---

## Batch 3 — Content Unification

### 3.1 — "Ask in Chat" Bridge

**Problem:** Chat and quiz are separate silos. When a student doesn't understand a graded quiz question, there's no way to escalate to chat with context.

**Fix:** Add a "Ask in Chat" button on `QuestionCardFeedback` (shown after grading). Navigates to `/chat?questionId=X&subject=Y&questionText=Z`. The chat page reads these search params and auto-seeds with: "I'm working on this question: {questionText}. Can you explain it?"

Minimal change — the chat page already has `useSearchParams()` access and a working message flow.

**Files:** `QuestionCardFeedback.tsx`, chat `page.tsx`

### 3.2 — Study Guide Action Buttons

**Problem:** Study guides render as read-only content. No way to practice or create flashcards from the guide.

**Fix:** Add buttons at the bottom of each generated guide:
- "Practice this topic" → `/quiz?subject=X&topic=Y&count=10`
- "Generate flashcards" → calls `flashcardEngine.createFromKeyPoints()` with section key points

**Files:** `study-guide/page.tsx`, `use-study-guide.ts`

### 3.3 — Past Papers Browser Page

**Problem:** Nav link to `/past-papers` at `src/lib/navigation/config.ts:72` has no corresponding page — 404 error.

**Fix:** Create `src/app/[locale]/past-papers/page.tsx` with:
- Subject selector (reuses `SubjectSelect` component)
- Year grid (filtered by available extracted papers)
- Paper list with metadata (year, paper number, question count)
- "Practice" button → `/quiz?subject=X&pastPaperMode=true&year=Y&paperNumber=N`

The extraction pipeline (`exam-paper-ingestion/`) and `pastPaperMode` in the engine already exist — only the UI page is missing.

**Files:** New `[locale]/past-papers/page.tsx`, `[locale]/past-papers/past-papers-client.tsx`

---

## Batch 4 — Study Planner Depth

### 4.1 — Knowledge Graph Prerequisite Ordering

**Problem:** `algorithms.ts` sorts topics by mastery only (weakest first). Knowledge graph `prerequisite` edges are never consulted, so a student might be scheduled for an advanced topic before its prerequisite.

**Fix:** Within the constraint-based scheduler (`algorithms.ts`), add a prerequisite-check pass:
1. Before assigning a topic candidate to a date, query the cached knowledge graph edges for that topic.
2. If any prerequisite topics are unscheduled, either:
   - Schedule the prerequisite first (shift within the same day if capacity allows)
   - Or skip the dependent topic until the prerequisite is placed
3. Uses the cached `knowledgeGraph` Dexie table (7d TTL) — no new API calls.

This slots between candidate sort (line 146) and study date assignment (line 201).

**Files:** `algorithms.ts`, `study-planner-service.ts` (add `knowledgeGraph` DataAccess dependency)

### 4.2 — Per-Session Push Reminders

**Problem:** `schedulePlanAwareReminder()` fires once on plan creation. Individual study sessions don't trigger notifications.

**Fix:** On plan generation, iterate over the next 7 days of sessions and register push notifications via `notification-service.ts`:
- If session is today: fire at 08:00
- If session is in the future: fire 15 minutes before scheduled time

Uses existing push subscription infrastructure.

**Files:** `notification-service.ts`, `use-study-planner.ts`

---

## Batch 5 — Edge Cases

### 5.1 — Sequential AI Retry

**Problem:** `question-engine.ts:158-162` launches `MAX_RETRIES+1 = 3` parallel batches and keeps the longest result. Wastes 2/3 of AI calls.

**Fix:** Change to sequential retry:
1. Run batch 1. If returned count ≥ `remainingCount`, return immediately.
2. Only if batch 1 returns fewer than needed, run batch 2 with a different seed/temperature.
3. Same for batch 3 (rare — only if first 2 both underperform).

Target: fill `remainingCount`, not maximize. Same retry budget, ~3× cost efficiency.

**Files:** `question-engine.ts`

### 5.2 — Interactive Diagram Input

**Problem:** Diagram questions show instructions text only. No drawing canvas or upload mechanism.

**Fix:** Add a canvas/drawing area + upload button to `QuestionCardInput`'s `diagram` case:
- Uses existing `useUpload()` infrastructure for image upload
- The uploaded image is sent as part of the answer for AI grading
- The grading path already supports image-based answers

**Files:** `QuestionCardInput.tsx`, diagram input component (new or existing path)

---

## Dependency Graph

```
Batch 0 ────────────────────── (parallel)
  ├── 0.1 SSR crash
  ├── 0.2 Calculation grading
  ├── 0.3 Pool types
  └── 0.4 STEM alignment

Batch 1 ────────────────────── (parallel)
  ├── 1.1 retentionRecurrence in next-action.ts
  ├── 1.2 remediationFocus in GenerationParams
  └── 1.3 QuizEngine competency

Batch 2 ────────────────────── (parallel)
  ├── 2.1 Assignment submission API
  └── 2.2 Push notification on grade

Batch 3 ────────────────────── (parallel)
  ├── 3.1 "Ask in Chat" bridge
  ├── 3.2 Study guide actions
  └── 3.3 Past papers browser page

Batch 4 ────────────────────── (parallel)
  ├── 4.1 Knowledge graph prerequisites
  └── 4.2 Per-session reminders

Batch 5 ────────────────────── (parallel)
  ├── 5.1 Sequential AI retry
  └── 5.2 Diagram input
```

All batches are independent. All items within each batch are independent. Maximum parallelization: all 13 items can be implemented concurrently.

---

## Verification

- `npx tsc --noEmit`: 0 errors
- `npx biome check`: 0 warnings on changed files
- `bun test`: 1271 pass, 0 fail (no regressions from any batch)
- For 0.1: manual smoke test of all 9 previously-crashing pages
- For 0.2: verify calculation grading with a known correct answer produces `{ correct: true, score: points }`
- For 1.1: verify `resolveNextAction()` returns a retention-recurrence action when due entries exist
- For 1.2: verify `GenerationParams.remediationFocus` appears in the AI prompt
- For 2.1: verify `POST /api/student/assignments/:id/submit` creates submission + updates competency

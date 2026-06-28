# Plan 057: Mock Exam Mode — Dedicated Exam-Hall Surface

> **Executor instructions**: This is a design/spike plan. Follow each step to
> investigate, prototype, and verify. Do not attempt to build the full feature
> end-to-end — the goal is a working prototype with defined APIs and open
> questions documented. Run every verification command and confirm expected
> results before moving on. If anything in STOP conditions occurs, stop and
> report.
>
> **Drift check (run first)**: `git diff --stat 169d3704..HEAD -- src/app/[locale]/exam/ src/app/[locale]/quiz/ src/components/exam/ src/lib/exam/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against live code before proceeding; on a mismatch,
> treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M (2-3 days)
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `169d3704`, 2026-06-28

## Why this matters

The exam-dates page already has a "Mock Exam" button (`src/app/[locale]/exam-dates/`) that navigates to `/quiz?subject=X&count=30&time=<duration>`. But this uses the general quiz surface — no exam-hall restrictions (locked navigation, no back-track, no hints), no realistic timer UI, no exam-branded results. A dedicated Mock Exam mode raises perceived exam prep value significantly. The `exam/[id]` page at `src/app/[locale]/exam/[id]/page.tsx` already has a `mode` resolver that supports `"mock"` — but the mock mode is functionally identical to `"timed"`. This plan turns `mode="mock"` into a distinct experience.

## Current state

- `src/app/[locale]/exam/[id]/page.tsx` — resolves three `mode` values: `"timed"`, `"mock"`, or `"practice"` (default). Currently `"mock"` has no unique behavior — it's a code-path placeholder.
- `src/app/[locale]/quiz/quiz-client.tsx` — parses `mode`, `time`, `count`, `subject`, `topic` from searchParams. Renders `<QuizView>` for normal mode, `<BoltQuiz>` for `mode=bolt`.
- `src/components/exam/exam-session-client.tsx` — the full exam session player. Has timer, part navigation, answer input, results view.
- The exam-dates page's "Mock Exam" button (in `NationalExamCalendar`) navigates to `/quiz?subject=X&count=30&time=<duration>`.
- Immersive mode (`ImmersiveModeProvider`) already auto-hides nav during active sessions — reusable for mock exam.

## Commands you will need

| Purpose   | Command                      | Expected on success |
| --------- | ---------------------------- | ------------------- |
| Install   | `pnpm install`               | exit 0              |
| Typecheck | `pnpm run typecheck`         | exit 0, no errors   |
| Tests     | `pnpm run test -- mock-exam` | all pass            |
| Lint      | `pnpm exec oxlint`           | exit 0              |
| Build     | `pnpm run build`             | exit 0              |

## Scope

**In scope** (design/spike — investigate + prototype):

- `src/app/[locale]/exam-dates/` — update the Mock Exam button to navigate to a dedicated mock exam route
- `src/app/[locale]/quiz/mock/` or `src/app/[locale]/mock-exam/` — new route for mock exam surface (or reuse exam session with mode=mock)
- `src/components/exam/exam-mock-session.tsx` (create) — mock-exam-specific wrapper over `exam-session-client` with exam-hall restrictions
- `src/components/exam/exam-hall-header.tsx` (create) — dedicated timer + progress header for mock mode
- `src/lib/exam/mock-exam-config.ts` (create) — configuration constants (default duration, question count, restriction rules)
- Tests under `src/lib/exam/__tests__/` or `src/components/exam/__tests__/`

**Out of scope**:

- OCR-based PDF scraping for DBE timetables (separate plan)
- AI-generated mock exam papers from past papers (separate plan)
- Changing the `exam-session-client.tsx` core rendering logic

## Steps

### Step 1: Define mock exam configuration and restrictions

Create `src/lib/exam/mock-exam-config.ts`:

```typescript
export const MOCK_EXAM_DEFAULTS = {
  durationMinutes: 180, // 3 hours (standard NSC paper)
  questionCount: 30,
  allowBackNavigation: false,
  allowHints: false,
  allowPause: false,
  showResultsImmediately: true,
  autoSubmitOnTimeUp: true,
};

export type MockExamConfig = typeof MOCK_EXAM_DEFAULTS;
```

**Verify**: `pnpm run typecheck` → exit 0

### Step 2: Create the mock exam wrapper component

Create `src/components/exam/exam-mock-session.tsx`. This component:

1. Accepts `subject`, `topic`, `duration`, `questionCount` as props
2. Renders a full-screen `<ImmersiveModeProvider>` wrapper
3. Uses `useQuestionEngine` to generate questions for the mock
4. Shows a "Starting in 3... 2... 1..." countdown overlay before beginning
5. During the exam: renders questions with restricted navigation (forward-only), a prominent countdown timer (not the subtle quiz timer), and exam-hall branding ("Mock Exam — Mathematics P1")
6. Auto-submits on time expiry using the existing `maxTime` mechanism from `quiz-client.tsx`
7. On completion: shows a dedicated `MockExamResults` overlay with APS projection, time spent, per-section scores

Follow the existing pattern in `exam-session-client.tsx` for the session lifecycle.

**Verify**: `pnpm run typecheck` → exit 0

### Step 3: Update the exam-dates page to use the mock exam route

In `NationalExamCalendar`, change the Mock Exam button navigation from:

```
/quiz?subject=X&count=30&time=<duration>
```

to:

```
/mock-exam?subject=X&topic=<paperTopic>&count=30&duration=<duration>
```

The button already exists in `src/app/[locale]/exam-dates/` — only the href changes.

**Verify**: `grep -rn "/quiz.*mock\|/mock-exam" src/app/[locale]/exam-dates/` shows the new route

### Step 4: Wire the route at `/quiz?mode=mock`

The simplest integration point: update `quiz-client.tsx` to detect `mode=mock` and render `<ExamMockSession>` instead of `<QuizView>`. This reuses the existing search-param-based routing without creating a new route directory.

In `quiz-client.tsx`, add a branch after the `mode=bolt` check:

```tsx
if (mode === "mock") {
  return (
    <ExamMockSession
      subject={initialSubject}
      topic={topic || undefined}
      duration={maxTime}
      questionCount={questionCount}
      onFinish={handleFinish}
    />
  );
}
```

**Verify**: Navigate to `/quiz?mode=mock&subject=mathematics&count=10&time=30` — the mock exam wrapper renders with exam-hall restrictions

### Step 5: Add mock exam results overlay

Create the results overlay as part of `ExamMockSession` (or a separate `MockExamResults.tsx` if it exceeds ~150 lines). It should show:

- Total score / max score
- APS projection (using `calculateAPS()` from `src/lib/shared/aps.ts`)
- Per-section breakdown if sections are identified
- Time taken vs allocated time
- "Review Answers" button (reuses existing exam review pattern)
- "Practice Weak Topics" button → navigates to `/quiz?subject=X&topic=<weakest>`

**Verify**: Complete a mock exam → results overlay appears with APS projection

### Step 6: Write tests

Create `src/components/exam/__tests__/exam-mock-session.test.tsx`:

- Renders countdown overlay when starting
- Renders questions after countdown
- Auto-submits when timer reaches zero
- Shows results overlay after submission
- Respects no-back-navigation restriction

Model after existing exam tests in `src/components/exam/`.

**Verify**: `pnpm run test -- mock-exam` → all tests pass

### Step 7: Verify end-to-end

1. `pnpm run typecheck` → exit 0
2. `pnpm exec oxlint` → exit 0
3. `pnpm run test -- mock-exam` → all pass
4. Manual: Navigate to exam-dates page, click "Mock Exam" button → mock session starts with countdown, timer, restricted navigation

## Test plan

- `src/components/exam/__tests__/exam-mock-session.test.tsx` — 4-6 tests covering: countdown phase, question rendering, auto-submit on expiry, results overlay, no-back restriction
- Model test structure after existing `src/components/exam/__tests__/session-question-navigator.test.tsx`

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` passes; new mock exam tests exist and pass
- [ ] Navigating to `/quiz?mode=mock&subject=mathematics&count=10&time=30` shows the mock exam wrapper with countdown, restricted nav, and timer
- [ ] Completing a mock exam shows results overlay with APS projection
- [ ] `git status` shows only in-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `quiz-client.tsx` already has a `mode=mock` branch that renders something different — verify the code at Location 1 still matches, then adapt
- If `<ImmersiveModeProvider>` behaviour has changed — check the Drift check output first
- If `calculateAPS()` is not available from `@/lib/shared/aps`

## Maintenance notes

- This plan adds a new mode branch to `quiz-client.tsx`. If more modes are added later (e.g., `mode=tutorial`, `mode=quickfire`), consider extracting mode routing into a `QuizModeRouter` component.
- The `mock-exam-config.ts` defaults are reasonable but should eventually be per-subject (Math P1 = 3h, English P2 = 2.5h, etc.). Future work.
- APS projection accuracy depends on question count — for <10 questions the projection is unreliable; consider adding a disclaimer.

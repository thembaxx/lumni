# Plan 190: Unify past paper question browser implementations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 690ee57f..HEAD -- src/app/[locale]/practice/ src/components/practice/ src/hooks/use-past-questions.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `690ee57f`, 2026-07-17
- **Issue**: (none)

## Why this matters

The past paper question browser has two parallel implementations in the same page tree. `practice-questions-client.tsx` uses a direct `useQuery` call with local state, while `past-question-browser.tsx` uses the `usePastQuestions` hook with URL search-param-based state. Both render `PastQuestionFilters` + `PastQuestionList`. Only `practice-questions-client.tsx` is mounted by the page. The `past-question-browser.tsx` is dead code. This plan deletes the unused implementation, tightens the live one, and adds the browse/practice mode toggle at the list level.

## Current state

- `src/app/[locale]/practice/questions/page.tsx` — renders `<PracticeQuestionsClient />`
- `src/app/[locale]/practice/questions/practice-questions-client.tsx` — uses `useQuery` directly with local `useState` for subject/topic/year. Does NOT use `usePastQuestions` hook. No `loadMore`/`hasMore` (hardcoded to `false`/noop). No URL sync.
- `src/app/[locale]/practice/questions/past-question-browser.tsx` — uses `usePastQuestions` hook with URL search params. Has `loadMore`, `hasMore`, URL sync. But it is NOT used by `page.tsx`. It also wraps itself in an extra `PageContainer` (redundant — the page already provides one).
- `src/hooks/use-past-questions.ts` — full hook with URL search param sync, pagination, all filter setters. Calls `GET /api/exam-papers/questions`.
- `src/components/practice/past-question-card.tsx` — full card component with browse/practice mode toggle (local state, works correctly).
- `src/components/practice/past-question-list.tsx` — renders cards, has empty/loading states, `loadMore` button.
- `src/components/practice/past-question-filters.tsx` — subject/topic/year `<select>` controls.

The design spec at `docs/superpowers/specs/2026-07-03-past-paper-question-browser-design.md` specifies browse mode (answers visible) and practice mode (hidden, reveal on click). The card already has this toggle per-question, but the list-level UX should default to practice mode when the user clicks "Practice All" or enters practice mode globally.

## Commands you will need

| Purpose   | Command                 | Expected on success |
| --------- | ----------------------- | ------------------- |
| Typecheck | `pnpm typecheck`        | exit 0, no errors   |
| Tests     | `pnpm test`             | all pass            |
| Lint      | `pnpm exec biome check` | exit 0              |

## Scope

**In scope**:

- `src/app/[locale]/practice/questions/page.tsx` — minor edit
- `src/app/[locale]/practice/questions/practice-questions-client.tsx` — refactor to use `usePastQuestions` hook
- `src/app/[locale]/practice/questions/past-question-browser.tsx` — remove (dead code)
- `src/app/[locale]/practice/questions/loading.tsx` — keep as-is
- `src/components/practice/past-question-list.tsx` — add global practice mode toggle

**Out of scope**:

- `src/hooks/use-past-questions.ts` — not modifying the hook itself
- `src/components/practice/past-question-card.tsx` — not modifying the card (it works)
- `src/components/practice/past-question-filters.tsx` — not modifying filters
- `src/app/api/exam-papers/questions/route.ts` — not modifying the API

## Git workflow

- Branch: `advisor/190-unify-past-question-browser`
- Commit style: conventional commits
- Do NOT push or open PR unless instructed

## Steps

### Step 1: Refactor `practice-questions-client.tsx` to use `usePastQuestions`

Replace the local `useState` + direct `useQuery` with `usePastQuestions`. The hook provides URL-based filter syncing, pagination, and a cleaner API surface. The refactored component should:

1. Import and call `usePastQuestions()` (no options — uses URL search params)
2. Destructure `questions`, `isLoading`, `isFetching`, `subject`, `topic`, `year`, `hasMore`, `loadMore`, `setSubject`, `setTopic`, `setYear`, `clearFilters`
3. Keep the same layout (heading, filters sidebar, list main area)
4. Remove the `h-full` and redundant container divs (the page provides `PageContainer`)

Follow the pattern from `past-question-browser.tsx` (which will be deleted — do NOT copy its duplicate `PageContainer` wrapper).

The result should look like this (code outline, not literal — match the repo's actual style):

```tsx
"use client";

import { Suspense } from "react";
import { usePastQuestions } from "@/hooks/use-past-questions";
import { PastQuestionFilters } from "@/components/practice/past-question-filters";
import { PastQuestionList } from "@/components/practice/past-question-list";
import { HugeiconsIcon } from "@hugeicons/react";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";

function PracticeQuestionsContent() {
  const {
    questions,
    isLoading,
    isFetching,
    subject,
    topic,
    year,
    hasMore,
    loadMore,
    setSubject,
    setTopic,
    setYear,
    clearFilters,
  } = usePastQuestions();

  const [practiceMode, setPracticeMode] = useState(false);

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ios-title-1 font-bold text-foreground tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground text-sm">
            Browse past paper questions by subject and topic
          </p>
        </div>
        {!!subject && (
          <button
            onClick={() => setPracticeMode(!practiceMode)}
            className="rounded-lg bg-system-accent px-4 py-1.5 text-xs font-medium text-system-accent-foreground"
          >
            {practiceMode ? "Browse Mode" : "Practice Mode"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="w-full shrink-0 lg:w-64">
          <div className="sticky top-24 rounded-xl border border-border/60 bg-card p-4">
            <PastQuestionFilters
              subject={subject}
              topic={topic}
              year={year?.toString()}
              onSubjectChange={setSubject}
              onTopicChange={setTopic}
              onYearChange={setYear}
              onClear={clearFilters}
            />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {!!subject && (
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
              <span>
                {questions.length} question{questions.length !== 1 ? "s" : ""} found
              </span>
              {isFetching && <span className="ml-auto text-xs italic">Updating...</span>}
            </div>
          )}
          <PastQuestionList
            questions={questions}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            hasSubject={!!subject}
          />
        </main>
      </div>
    </div>
  );
}

export function PracticeQuestionsClient() {
  return (
    <Suspense fallback={null}>
      <PracticeQuestionsContent />
    </Suspense>
  );
}
```

Key changes from the current `practice-questions-client.tsx`:

- Uses `usePastQuestions()` instead of local `useState` + `useQuery`
- Wraps in `Suspense` (because `usePastQuestions` uses `useSearchParams`)
- Adds practice mode toggle button (when a subject is selected)
- Uses `sticky` sidebar matching the `past-question-browser.tsx` layout
- Cleaner heading section

**Verify**: `pnpm typecheck` exits 0.

### Step 2: Add global practice mode toggle to `PastQuestionList`

Add a `practiceMode` prop to `PastQuestionListProps` interface. When `true`, the list passes `practiceMode` down to each `PastQuestionCard`.

Update `PastQuestionCardProps` to accept an optional `practiceMode?: boolean`. When `practiceMode` is true, the card should start with the answer hidden (like clicking "Practice" button) rather than showing it by default.

The current card already has this behavior — it has a `practiceMode` local state. The change is to accept an external `practiceMode` prop that overrides the local state. When the prop is `true`, the card renders in practice mode (answer hidden with "Reveal Answer" button). When `false`, it renders in browse mode (answer visible with "Practice" button). When `undefined` (legacy callers), it defaults to the current behavior.

**Verify**: `pnpm typecheck` exits 0.

### Step 3: Wire `practiceMode` through `PastQuestionList` → `PastQuestionCard`

Update `PracticeQuestionsClient` to pass `practiceMode={practiceMode}` to `PastQuestionList`, which passes it down to each `PastQuestionCard`.

**Verify**: `pnpm typecheck` exits 0.

### Step 4: Delete `past-question-browser.tsx`

Delete the file `src/app/[locale]/practice/questions/past-question-browser.tsx`. Verify there are no remaining imports of it anywhere in the codebase:

```bash
rg "past-question-browser" src/
```

Should return no results.

**Verify**: `pnpm typecheck` exits 0.

### Step 5: Run full verification

```bash
pnpm typecheck && pnpm exec biome check && pnpm test
```

All should pass.

## Test plan

- No new tests required (exercising existing test suite)
- The `PastQuestionCard` already has its own browse/practice state managed locally — verify by checking that `src/components/practice/__tests__/` exists and tests pass
- Manual verification: navigate to `/practice/questions?subject=mathematics` and confirm:
  - Filters update the URL
  - Practice mode toggle switches the card display mode
  - Load more button works (if > 20 results)

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] `past-question-browser.tsx` is deleted and no imports reference it
- [ ] `practice-questions-client.tsx` uses `usePastQuestions` hook
- [ ] Global practice mode toggle works at the list level
- [ ] Only files in scope are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `usePastQuestions` doesn't work inside `Suspense` boundaries (it uses `useSearchParams` which requires it — this is a known Next.js pattern)
- The practice mode prop threading introduces a regression in the card's existing browse/practice toggle
- There are other callers of `past-question-browser.tsx` beyond the page file

## Maintenance notes

- The design spec also describes difficulty tier filtering from `marks` and `bloomLevel` — that's deferred, but the `PastQuestionCard` already renders a difficulty label. When ready, add it as a filter option in `PastQuestionFilters`.
- If pagination is expanded beyond the current 20-per-page, the `loadMore` button may need to be replaced with infinite scroll or a page selector.

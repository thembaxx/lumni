# Plan 178: Fix Wrong-Answer "Practice These Topics" Button Logic

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/app/[locale]/review/review-client.tsx`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

The wrong-answer journal's "Practice these topics" button only renders when a subject filter is active. When viewing the full unfiltered list, there's no way to generate a practice quiz from all wrong answers. The empty state also lacks a "Practice all subjects" button when no filter is set. This is a trivial UI fix that significantly improves the review-to-practice flow.

## Current state

In `src/app/[locale]/review/review-client.tsx`, lines ~118-124:

```tsx
{
  filterSubject && (
    <Link href={`/quiz?subject=${filterSubject}&topic=${filterTopic || ""}&count=10`}>
      Practice these topics
    </Link>
  );
}
```

The button only renders when `filterSubject` is truthy. No equivalent button for the unfiltered state or the empty state.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/app/[locale]/review/review-client.tsx`

## Steps

### Step 1: Add unconditional "Generate practice quiz" button

Above or below the filtered practice link, add a conditional button that shows when `entries.length > 0` (regardless of filter state):

```tsx
{
  entries.length > 0 && !filterSubject && (
    <Link href="/quiz?count=10">Generate practice quiz from all mistakes</Link>
  );
}
```

### Step 2: Add "Practice all subjects" to empty state

In the empty state section (shown when no wrong answers exist), add:

```tsx
{
  !filterSubject && <Link href="/quiz?count=5">Start a practice quiz</Link>;
}
```

### Step 3: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

No new tests needed. This is a pure UI change. Existing tests should pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] "Generate practice quiz from all mistakes" appears when entries exist (no filter)
- [ ] Existing filtered button still works when filter is active
- [ ] Empty state has a practice button when no filter is active
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The component structure differs from the excerpt
- The `filterSubject`/`filterTopic` variables don't exist or have different names

## Maintenance notes

Match the styling of the existing `Link` button in the file. Use the same button component or Tailwind classes.

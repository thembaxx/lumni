# Plan 071: Surface quiz-start errors instead of silent catch

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug / observability
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

When `handleStartWithSubject` fails (e.g., network error, AI timeout, invalid subject), the error is swallowed by an empty `catch {}` block. The user sees nothing — no toast, no error state. The quiz simply never starts, and the user has no indication of why.

## Current state

`src/components/quiz/hooks/use-quiz-view.ts:276-278`:

```typescript
async function handleStartWithSubject(subject: string, topic?: string) {
  // ... setup ...
  try {
    await generate({ subject, topic, count: 10 });
  } catch {
    // empty — silent failure
  }
}
```

The `generate` call from `useQuestionEngine` may already throw or return an error. In either case, the catch block discards it.

## Scope

**In scope**:

- `src/components/quiz/hooks/use-quiz-view.ts` — lines 276-278 (the catch block)
- Optionally: the calling UI component that renders the error message

**Out of scope**:

- Other `catch {}` blocks elsewhere (already covered by Session 23 sweep)
- Changing `useQuestionEngine` return shape

## Steps

### Step 1: Replace empty catch with error handling

In `src/components/quiz/hooks/use-quiz-view.ts:276-278`, replace:

```typescript
try {
  await generate({ subject, topic, count: 10 });
} catch {
  // empty
}
```

With:

```typescript
try {
  await generate({ subject, topic, count: 10 });
} catch (error) {
  logError("useQuizView.handleStartWithSubject", error);
  setError(error instanceof Error ? error.message : "Failed to start quiz. Please try again.");
}
```

If the hook doesn't have access to `setError`, check if there's an existing error state. If not, either:

- Add a local `error` state via `useState`
- Or re-throw and let the caller handle it (if the caller already has error handling)

### Step 2: Surface error to the UI

If the component that calls `handleStartWithSubject` has a `setError` or can read an `error` state from the hook, ensure the error message is displayed to the user — either as a toast notification or an inline error message.

Check the parent component that invokes the hook — it likely already has an error display pattern for other error states.

### Step 3: Verify

**Verify**:

- `pnpm run typecheck` → exit 0
- `pnpm exec oxlint --fix` → exit 0

## Done criteria

- [ ] Empty `catch {}` block at `use-quiz-view.ts:276-278` is replaced with error logging + user-visible error state
- [ ] Error is both logged via `logError` (visible in Sentry) and surfaced in the UI
- [ ] `pnpm run typecheck` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If the exact line numbers don't match — read the file and adjust. The bug description is: "empty catch in handleStartWithSubject." If the function name or structure differs, adapt accordingly.
- If `logError` is not imported in the file — add the import (still in scope). Confirm the import path with the existing logger.

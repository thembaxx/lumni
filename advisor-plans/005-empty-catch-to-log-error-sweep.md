# Plan 005: Sweep empty catch blocks to add structured error logging

> **Executor instructions**: Follow this plan step-by-step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat be3a4dfb..HEAD -- src/`
> If a significant number of files in scope changed, the error logging pattern
> may need adapting. Check each file individually.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: quality
- **Planned at**: commit `be3a4dfb`, 2026-07-09

## Why this matters

Empty or comment-only catch blocks silently swallow errors. When something goes wrong (IndexedDB corruption, network failure, quota exceeded, CSP violation, malformed request), the error is invisible to both the user and observability. Over time, these silent failures erode reliability without anyone noticing until a user reports it — and even then the error is gone. This plan wires `logError()` into 9+ sites with existing empty or near-empty catch blocks.

## Current state

### Sites to fix (exact current code follows each location):

**1. `src/store/bookmarks.ts:58-60`**

```typescript
.catch(() => {
  set({ bookmarks: prev });
})
```

**2. `src/store/bookmarks.ts:66-68`**

```typescript
.catch(() => {
  set({ bookmarks: prev });
})
```

**3. `src/hooks/use-lesson-progress.ts:40-42`**

```typescript
.catch(() => {
  if (!cancelled) setLoaded(true);
})
```

**4. `src/app/api/csp-violation/route.ts:27-28`**

```typescript
catch {
  return new Response(null, { status: 204 });
}
```

**5. `src/app/api/referral/info/route.ts:28-29`**

```typescript
catch {}
```

**6. `src/app/[locale]/dictionary/dictionary-client.tsx:68`**

```typescript
.catch(() => {
  // background pre-cache failure is non-critical
})
```

**7. `src/app/[locale]/exam/[id]/exam-session/timer-logic.ts:42-54`**
The `useTimeExpiryHandler` runs side effects in render (finding CORRECTNESS-02). This plan only adds the error logging to any `catch {}` blocks in that file — the render-in-render fix is a separate plan.

### The `logError` function

Exists at `src/lib/shared/logger.ts`. Import pattern:

```typescript
import { logError } from "@/lib/shared/logger";
```

Usage:

```typescript
logError("ContextLabel", error); // context label is always a string, PascalCase
```

The logger sends to Sentry in production and `console.error` in dev.

**Repo conventions to match:**

- `logError` takes a context tag (string, PascalCase) and an error
- Context tags follow `ModuleName.Domain` pattern: e.g., `BookmarkService.add`, `LessonProgress.load`, `CSPViolation.parse`
- The import is always at the top of the file
- Do NOT import `logError` inside catch blocks — use a top-level import

## Commands needed

| Purpose   | Command            | Expected on success |
| --------- | ------------------ | ------------------- |
| Typecheck | `pnpm typecheck`   | exit 0              |
| Tests     | `pnpm run test`    | all pass            |
| Lint      | `pnpm exec oxlint` | exit 0              |

## Scope

**In scope** (7 files):

- `src/store/bookmarks.ts`
- `src/hooks/use-lesson-progress.ts`
- `src/app/api/csp-violation/route.ts`
- `src/app/api/referral/info/route.ts`
- `src/app/[locale]/dictionary/dictionary-client.tsx`
- `src/app/[locale]/exam/[id]/exam-session/timer-logic.ts` (if any `catch {}` exists)

**Out of scope:**

- Files that already have `logError` in their catch blocks
- Changing any business logic — only add logging
- The `logger.ts` file itself
- Empty catch blocks in test files (deliberate — test expectations)

## Steps

### Step 1: Read and fix each file

For each file in scope:

1. Read the file to find the exact catch block and existing imports
2. Add `import { logError } from "@/lib/shared/logger"` at the top if not already present
3. Replace the empty/comment catch with a call to `logError`

Format for each fix:

```typescript
// Before:
.catch(() => { set({ bookmarks: prev }); })

// After:
.catch((err) => { logError("BookmarkService.add", err); set({ bookmarks: prev }); })
```

For the CSP violation route (no existing `err` variable):

```typescript
catch (err) {
  logError("CSPViolation.parse", err);
  return new Response(null, { status: 204 });
}
```

For each file, verify the context tag is descriptive:

- `bookmarks.ts:58` → `"BookmarkService.add"`
- `bookmarks.ts:66` → `"BookmarkService.remove"`
- `use-lesson-progress.ts` → `"LessonProgress.load"`
- `csp-violation/route.ts` → `"CSPViolation.parse"`
- `referral/info/route.ts` → `"ReferralCode.create"`
- `dictionary-client.tsx` → `"DictionaryCachePreload"`
- `timer-logic.ts` → `"TimerLogic.check"` (if applicable)

**Verify after each file**: `pnpm typecheck` → exit 0

### Step 2: Run tests

**Verify**:

- `pnpm run test` → all pass

## Test plan

No new tests needed. This change adds observability with zero behavioral change. Verify with typecheck + existing tests.

## Done criteria

- [ ] Every empty catch block in the 6 scoped files now calls `logError()`
- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm run test` — all pass
- [ ] `pnpm exec oxlint` — no warnings on changed files
- [ ] Each context tag follows `ModuleName.action` convention
- [ ] `advisor-plans/README.md` status row updated
- [ ] `grep -n "catch\s*{}" src/store/bookmarks.ts` — no matches remaining

## STOP conditions

Stop and report if:

- A file has `logError` already imported but unused — verify it's a correct addition, not a duplicate
- The `logError` function signature differs from described (read `src/lib/shared/logger.ts` to confirm)
- A catch block has `any`-typed variable that needs explicit `unknown` handling (safe to use `(err: unknown)` or just `err`)

## Maintenance notes

- This plan is a sweep, not a policy. Future PRs should enforce `logError` usage via code review.
- The CSP violation route is the most important: losing CSP reports means missing XSS attempts.

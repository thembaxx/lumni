# Plan 233: Remove dead branches behind always-off feature flags

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / dead-code
- **Generated at**: 2026-07-17

## Why this matters

`src/components/quiz/bolt-quiz.tsx` has a `useFeatureFlag("daily-bolt-v2")` check with a dead branch. The flag exists in the registry (`src/lib/shared/flags/registry.ts`) with `defaultEnabled: false` and `experimentRatio: 0.5`, but is never toggled — always defaults to `false`. The dead branch wastes a render and adds cognitive load. The file also has an empty `catch {}` block that silently swallows errors.

## Current state

`src/components/quiz/bolt-quiz.tsx:47`:

```ts
const { enabled: useDailyBoltV2 } = useFeatureFlag("daily-bolt-v2", user?.$id);
```

The flag is never used anywhere else in the component. The `useFeatureFlag` call is an unused destructured binding.

`src/components/quiz/bolt-quiz.tsx:115`:

```ts
} catch {
  // Non-critical; user still navigates
}
```

## Target state

- Remove the `useFeatureFlag` call and all related dead conditional branches
- Replace empty `catch {}` with `catch { logError("bolt-quiz:process-result", err) }`
- Remove the flag from the registry if no other consumers reference it

## Scope

- `src/components/quiz/bolt-quiz.tsx`
- `src/lib/shared/flags/registry.ts` (conditional — only if flag is unused elsewhere)

## Steps

### 1. Remove feature flag

- In `bolt-quiz.tsx`: remove line 47 (`const { enabled: useDailyBoltV2 } = ...`)
- Grep for `useDailyBoltV2` references in the same file — verify it's unused elsewhere
- Remove the `import { useFeatureFlag } from "@/hooks/use-feature-flag"` if it's the only use

### 2. Fill empty catch block

- Replace `catch {` with `catch { logError("bolt-quiz:process-result", err) }`
- Add `import { logError } from "@/lib/shared/logger"` if missing

### 3. Check if flag registry entry can be removed

- Grep for `"daily-bolt-v2"` across the codebase
- If the only references are in `registry.ts` (and `bolt-quiz.tsx` after removal), delete the entry from `registry.ts`

### 4. Verify

- `pnpm run typecheck` — 0 errors
- `pnpm exec oxlint` — 0 warnings

Verification: `pnpm run typecheck ; pnpm exec oxlint ; pnpm run test`

## Stop conditions

- The `daily-bolt-v2` flag is referenced by an experiment dashboard or admin UI — leave the registry entry but remove the dead component code

## Estimated time

15 minutes

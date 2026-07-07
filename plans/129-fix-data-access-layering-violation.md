# Plan 129: Fix data-access.ts layering violation — move WrongAnswerEntry to schema

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/lib/db/data-access.ts src/lib/db/schema.ts src/hooks/use-wrong-answer-journal.ts`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

The DataAccess interface (bottom layer of the DI system) imports `WrongAnswerEntry` from a React hook (top layer). This creates a circular conceptual dependency where the DB schema depends on UI types.

## Current state

`src/lib/db/data-access.ts:1`:

```ts
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
```

`WrongAnswerEntry` should live in `src/lib/db/schema.ts` alongside all other record types.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |

## Steps

### Step 1: Move WrongAnswerEntry to schema.ts

Add the `WrongAnswerEntry` type to `src/lib/db/schema.ts`. Remove it from `src/hooks/use-wrong-answer-journal.ts` and re-export from there for backward compatibility.

### Step 2: Update data-access.ts import

Change the import in `src/lib/db/data-access.ts` from:

```ts
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
```

to:

```ts
import type { WrongAnswerEntry } from "@/lib/db/schema";
```

### Step 3: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] `WrongAnswerEntry` defined in `src/lib/db/schema.ts`
- [ ] `data-access.ts` imports from `@/lib/db/schema`, not from a hook
- [ ] `pnpm run typecheck` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `WrongAnswerEntry` uses hook-specific types that can't live in the schema layer

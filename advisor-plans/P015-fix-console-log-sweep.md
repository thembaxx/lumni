# Plan P015: Replace Remaining `console.error`/`console.warn` with `logError`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: No drift check needed. Use grep to find the current locations.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 065 covered some instances; this covers the remaining)
- **Category**: tech-debt
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

6 `console.error`/`console.warn` calls in non-script source files bypass the centralized `logError()` which wires to `Sentry.captureException()` in production. Critical-path failures (auth verification, service worker registration, study plan sync) stay invisible in production monitoring.

## Current state

The remaining locations (excluding seed scripts, exam-parser CLI, and the logger itself):

| File                                                           | Line     | Context                      |
| -------------------------------------------------------------- | -------- | ---------------------------- |
| `src/app/[locale]/admin/questions/admin-questions-content.tsx` | ~2 calls | Fetch/generation failure     |
| `src/hooks/use-service-worker.ts`                              | ~1 call  | SW registration catch        |
| `src/lib/services/study-planner-service.ts`                    | ~1 call  | Fire-and-forget sync promise |
| `src/app/api/lessons/[subjectId]/[subtopicId]/route.ts`        | ~1 call  | Route handler catch          |
| `src/app/api/auth/verify/route.ts`                             | ~1 call  | Email verification catch     |

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Lint      | `pnpm exec oxlint`   | exit 0              |
| Tests     | `pnpm run test`      | all pass            |

## Scope

**In scope**: The 6 `console.error`/`console.warn` sites listed above.

**Out of scope**:

- Seed scripts, CLI tools, and the logger itself
- Any `console.log` calls used for development debugging (these should have been removed)
- Plan 065's scope (already covered locations)

## Git workflow

- Branch: `advisor/P015-console-log-sweep`
- Commit message: `fix: replace console.error/warn with logError in production source files`
- Do NOT push or open a PR

## Steps

### Step 1: Find the exact locations

```bash
grep -rn "console\.error\|console\.warn" --include="*.ts" --include="*.tsx" src/ | grep -v node_modules | grep -v "__tests__" | grep -v "\.test\."
```

Filter to the 5 files listed above. For each:

1. Ensure `logError` is imported
2. Replace `console.error("message", err)` or `console.warn("message")` with `logError("ContextLabel", err)` or `logError("ContextLabel", message)` respectively

### Step 2: Fix each file

**`admin-questions-content.tsx`** — `console.error` on fetch/generation failure:

```typescript
// Before:
console.error("Failed to fetch questions", err);
// After:
logError("AdminQuestions.fetch", err);
```

**`use-service-worker.ts`** — `console.error` on SW registration catch:

```typescript
// Before:
console.error("SW registration failed", err);
// After:
logError("ServiceWorker.register", err);
```

**`study-planner-service.ts`** — `console.warn` on sync:

```typescript
// Before:
console.warn("Study plan sync failed", err);
// After:
logError("StudyPlanner.sync", err);
```

**`routes.ts`** — `console.error` in catch blocks:

```typescript
// Before:
console.error("Route error", err);
// After:
logError("LessonsRoute.fetch", err);
```

### Step 3: Verify

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0.

## Test plan

No new tests. Mechanical replacement — no behavioral change.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] None of the 5 targeted files contain `console.error` or `console.warn` (outside of seed scripts and CLI tools)
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any of the targeted `console.error` calls are inside a hot render path where logging on every render would hurt performance — wrap in a dev-only guard
- The `logError` import path doesn't resolve in any file

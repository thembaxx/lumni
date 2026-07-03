# Plan P012: Sweep Empty `catch {}` Blocks and Add `logError`

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: No drift check needed — this is a sweeping plan. Just verify
> at the relevant locations before editing.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: LOW
- **Depends on**: none (but P008 independently covers the `.catch(() => {})` pattern)
- **Category**: tech-debt
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

~90+ empty `catch { }` and `catch(e) { }` blocks across `src/lib/` and `src/app/api/` swallow errors silently. The centralized `logError()` at `@/lib/shared/logger.ts` wires to `Sentry.captureException()` in production, but these empty catches prevent any error visibility. Session 23 addressed 148 instances — the remaining ones were missed in that sweep.

## Current state

Empty catch blocks exist in these files (representative list — use Step 1 to get the exact list):

**`src/lib/`** (59 matches):

- `src/lib/api/create-route-handler.ts` (3 blocks)
- `src/lib/chat/stream-adapter.ts`
- `src/lib/assignments/submission-service.ts`
- `src/lib/audio-engine/whisper-service.ts`
- `src/lib/ai/latency-tracker.ts`
- `src/lib/ai/client.ts`
- `src/lib/knowledge-graph/service.ts`
- `src/lib/exams/sync-exam-papers.ts`
- `src/lib/vocabulary/service.ts`
- `src/lib/study-planner/algorithms.ts`
- `src/lib/dictionary/service.ts` (6 blocks)
- `src/lib/stories/` (multiple blocks)
- `src/lib/sync/service.ts`
- `src/lib/solver/math-solver.ts`
- `src/lib/rate-limiter/redis-store.ts`
- `src/lib/seed/seed-exam-papers.ts`
- `src/lib/server/` (multiple blocks)
- `src/lib/retention-loop/next-action.ts` (4 blocks)
- `src/lib/shared/json.ts` (2 blocks)
- And more...

**`src/app/api/`** (31 matches):

- `src/app/api/chat/route.ts` (6 blocks)
- `src/app/api/cron/weekly-digest/route.ts`
- `src/app/api/csp-violation/route.ts`
- `src/app/api/exam-papers/` (multiple blocks)
- `src/app/api/gamification/route.ts` (3 blocks)
- `src/app/api/telemetry/route.ts`
- `src/app/api/user/export/route.ts`
- `src/app/api/uploadthing/core.ts`
- `src/app/api/user/account/route.ts`
- `src/app/api/q/share/route.ts`
- `src/app/api/referral/` (2 blocks)
- `src/app/api/search/appwrite/route.ts` (3 blocks)
- `src/app/api/study-groups/` (1 block)
- `src/app/api/student/assignments/route.ts`
- `src/app/api/teacher/assignments/` (3 blocks)

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**: All files in `src/lib/` and `src/app/api/` with empty catch blocks (no error logging).

**Out of scope**:

- Files in `src/components/`, `src/app/[locale]/`, `src/hooks/` (these are covered by P008 or should be done in a separate sweep)
- Catch blocks that already have `logError()` calls or meaningful error handling
- Catch blocks that are intentionally empty for expected/benign failures AND have a comment explaining why (e.g., `/* localStorage unavailable */`)

## Git workflow

- Branch: `advisor/P012-empty-catch-sweep`
- Commit message: `fix: add logError to empty catch blocks across lib and api routes`
- Do NOT push or open a PR

## Steps

### Step 1: Get the exact list

Run:

```bash
grep -rn 'catch\s*{' --include="*.ts" src/lib/ src/app/api/
grep -rn 'catch\s*(\s*\w+\s*)\s*{' --include="*.ts" src/lib/ src/app/api/
```

Manually inspect each match. Skip:

- Blocks that already contain `logError(` or any error handling code
- Blocks that have a comment explaining why the error is benign (e.g., `/* expected */`, `/* network blip */`)
- Test files (`*.test.ts`, `__tests__/`)

For the remaining blocks, add `logError("ModuleOrFile.method", err)` inside the catch block.

### Step 2: Fix per file

For each empty catch, follow these rules:

1. If the file doesn't already import `logError`, add: `import { logError } from "@/lib/shared/logger";`
2. Add `logError("ContextLabel", err)` inside the catch block
3. For `catch { }` without an error variable, change to `catch (err) { logError("ContextLabel", err); }` where err is typed as `unknown`

Context labels should follow the convention: `"FileName.method"` or `"Domain.Action"`. Examples:

- `create-route-handler.ts` → `logError("RouteHandler.execute", err)`
- `chat/route.ts` → `logError("Chat.POST.models", err)` or `logError("Chat.POST.parse", err)`
- `dictionary/service.ts` → `logError("DictionaryService.fetch", err)`

### Step 3: Verify

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

## Test plan

No new tests. This is a mechanical logging sweep — no behavioral changes.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] The majority of empty catch blocks in `src/lib/` and `src/app/api/` now have `logError()` calls
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- A catch block catches a very hot path (e.g., inside a loop rendering 1000 items) where even a log call would be expensive — skip those and note them
- A file has its own error handling pattern that should be preserved — match the file's existing convention

## Maintenance notes

- Future PRs should enforce a lint rule or PR checklist item: no empty catch without a comment explaining why
- The Session 23 sweep (148 instances) showed this pattern recurs — a biome lint rule `no-empty-catch` would prevent regressions

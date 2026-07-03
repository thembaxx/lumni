# Plan P008: Replace `.catch(() => {})` with `logError` in 10 Locations

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/app/[locale]/ src/components/ src/lib/sync/`
> If the scope changes significantly, compare excerpts.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

10 locations use `.catch(() => {})` to swallow promise rejections entirely. These cover Dexie retention writes, sync triggers, audio playback, telemetry flushing, and session operations. Any failure in these paths is completely invisible — no Sentry breadcrumb, no console output, no user-visible error. Silent data loss (retention items not saved), sync silently stopping, and audio failures all go unmonitored.

## Current state

The 10 locations (verified by grep):

| File                                                      | Line     | Context                       |
| --------------------------------------------------------- | -------- | ----------------------------- |
| `src/app/[locale]/flashcards/flashcards-client.tsx`       | 172, 444 | Flashcard session operations  |
| `src/app/[locale]/exam/[id]/exam-session-client.tsx`      | 197      | Exam session persistence      |
| `src/components/dashboard/dashboard-client.tsx`           | 80       | Dashboard data loading        |
| `src/lib/sync/service.ts`                                 | 160      | Initial sync trigger on start |
| `src/components/dashboard/word-of-day.tsx`                | 34       | Word-of-day fetch             |
| `src/components/exam/exam-mock-session.tsx`               | 136      | Mock exam session             |
| `src/components/study-groups/live-session-bar.tsx`        | 132      | Live session presence         |
| `src/lib/telemetry/exporter.ts`                           | 45       | Telemetry batch flush         |
| `src/app/[locale]/pronunciation/pronunciation-client.tsx` | 189      | Pronunciation audio           |

The pattern in all cases is:

```typescript
somePromise.catch(() => {});
```

The repo's centralized error logging utility is `logError` from `@/lib/shared/logger`:

```typescript
import { logError } from "@/lib/shared/logger";
logError("ContextLabel", err);
```

Existing pattern to follow (from `src/lib/sync/service.ts:163-165`):

```typescript
trigger().catch((err) => logError("Sync.interval", err));
```

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- The 10 files listed above — each `.catch(() => {})` becomes `.catch((err) => logError("ContextLabel", err))`

**Out of scope**:

- Any other `.catch()` patterns or empty `catch {}` blocks (those are covered by P012)
- Any changes to the logging infrastructure
- Adding test files

## Git workflow

- Branch: `advisor/P008-catch-swallow`
- Commit message: `fix: replace silent .catch(() => {}) with logError in 10 locations`
- Do NOT push or open a PR

## Steps

### Step 1: Fix each occurrence

For each of the 10 files, at the specific line:

1. Ensure `logError` is imported. If not, add: `import { logError } from "@/lib/shared/logger";`
2. Replace `.catch(() => {})` with `.catch((err) => logError("FileOrContext.method", err))`

Use meaningful context labels. Examples:

- `flashcards-client.tsx:172` → `logError("FlashcardsClient.action", err)`
- `exam-session-client.tsx:197` → `logError("ExamSessionClient.persist", err)`
- `dashboard-client.tsx:80` → `logError("DashboardClient.load", err)`
- `sync/service.ts:160` → `logError("Sync.start", err)`
- `word-of-day.tsx:34` → `logError("WordOfDay.fetch", err)`
- `exam-mock-session.tsx:136` → `logError("ExamMockSession.action", err)`
- `live-session-bar.tsx:132` → `logError("LiveSessionBar.presence", err)`
- `telemetry/exporter.ts:45` → `logError("TelemetryExporter.flush", err)`
- `pronunciation-client.tsx:189` → `logError("PronunciationClient.audio", err)`

### Step 2: Verify

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

## Test plan

No new tests. Each change is a mechanical replacement. Run the existing test suite to confirm no regressions.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -rn '\.catch(()\s*=>\s*{\s*})' --include="*.ts" --include="*.tsx" src/` returns no matches among the 10 targeted files
- [ ] No files outside the in-scope list are modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any of the targeted `.catch(() => {})` calls are on promises where the error is EXPECTED and BENIGN (e.g., a network request that is known to fail). These should keep their silent catch but add a comment explaining why.
- The `logError` import path doesn't resolve in any file

## Maintenance notes

- Plan P012 will handle the remaining ~118 empty `catch {}` blocks across the codebase
- Future PRs should enforce a lint rule: no empty catch blocks without a comment explaining the benign failure

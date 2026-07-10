# Plan 157: Move services out of src/lib/utils into a proper domain directory

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/services/ src/lib/utils/`
> If files moved between these directories since this plan was written, treat
> it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

`src/lib/services/` already exists as the canonical directory for service
modules (7 files: `push-delivery`, `quiz-result-processor`, etc.). But
`src/lib/utils/` still contains 2 service-like files —
`src/lib/utils/export-service.ts` and `src/lib/utils/analytics-service.ts` —
that have business logic and side effects (Appwrite reads, DOM downloads).
The codebase convention is clear (services in `src/lib/services/`), so these 2
misplaced files create confusion about where to put new services.

## Current state

`src/lib/utils/` contains:

- `analytics-service.ts` — reads/writes Appwrite analytics data
- `export-service.ts` — generates ICS/CSV/PDF and triggers browser download
- Plus legitimate utility files (color helpers, backoff, logger, etc.)

`src/lib/services/` contains: `push-delivery`, `quiz-result-processor`,
`study-planner-service`, etc.

Migration pattern from existing Session 37 precedent: when `exam-download`
moved during service extractions, the route handler import was updated and
the old file remained only after confirming no remaining imports.

## Scope

**In scope**:

- `src/lib/utils/analytics-service.ts` → `src/lib/services/analytics-service.ts`
- `src/lib/utils/export-service.ts` → `src/lib/services/export-service.ts`

**Out of scope**:

- Do NOT touch legitimate utility files in `src/lib/utils/` (color-helpers,
  backoff, logger, constants, etc.)
- Do NOT reorganise the service directory structure
- Do NOT rename or refactor the classes/functions — pure file move

## Git workflow

- Branch: `advisor/157-move-services-out-of-utils`
- Commit message: `refactor: move analytics and export services into src/lib/services/`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Find all import sites

```bash
rg "from [\"']@/lib/utils/(analytics-service|export-service)[\"']" src/
rg "require\([\"']@/lib/utils/(analytics-service|export-service)[\"']\)" src/
```

Save the list of files that need import path updates.

### Step 2: Move the files

```bash
mv src/lib/utils/analytics-service.ts src/lib/services/analytics-service.ts
mv src/lib/utils/export-service.ts src/lib/services/export-service.ts
```

**Verify**: `pnpm run typecheck` → should fail with ~N import errors.

### Step 3: Update all import paths

For each file found in Step 1, update:

- `@/lib/utils/analytics-service` → `@/lib/services/analytics-service`
- `@/lib/utils/export-service` → `@/lib/services/export-service`

Use a single sed (PowerShell) to do all replacements:

```powershell
Get-ChildItem -Recurse -Filter "*.{ts,tsx}" src/ | Select-String -Pattern '@/lib/utils/analytics-service|@/lib/utils/export-service' | ForEach-Object { $_.Path } | Select-Object -Unique | ForEach-Object {
    (Get-Content $_) -replace '@/lib/utils/(analytics-service|export-service)', '@/lib/services/`$1' | Set-Content $_
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Update barrel exports

Check if either file is exported from `src/lib/utils/index.ts`:

```bash
grep -n 'analytics-service\|export-service' src/lib/utils/index.ts
```

If found, remove the export line so the old path is no longer available from
the barrel.

Also check `src/lib/services/index.ts`:

```bash
grep -c 'export' src/lib/services/index.ts
```

If the services barrel exists, re-export the new files from it. If there's no
barrel in `src/lib/services/`, consider adding one (or skip — not in scope).

**Verify**: `pnpm run typecheck` → exit 0.

## Test plan

- `pnpm run test` — verify all existing tests still pass (the move should be
  transparent since only import paths changed)
- `pnpm exec knip` — confirm no dead imports after the move

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on all changed files
- [ ] `Test-Path "src/lib/utils/analytics-service.ts"` returns `False`
- [ ] `Test-Path "src/lib/utils/export-service.ts"` returns `False`
- [ ] `Test-Path "src/lib/services/analytics-service.ts"` returns `True`
- [ ] `Test-Path "src/lib/services/export-service.ts"` returns `True`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any non-test file imports from the OLD path — the `sed` didn't catch it.
  Check by running `rg "utils/analytics-service" src/` and
  `rg "utils/export-service" src/` after the sed.
- A test file imports the OLD path but uses a wildcard mock that depends on
  the path — update the mock import path too.

## Maintenance notes

- Services belong in `src/lib/services/`. If a new service file is needed,
  put it there.
- The `color-helpers`, `backoff`, `logger`, and similar files in
  `src/lib/utils/` are genuine utilities — they are stateless, have no side
  effects, and don't import from external APIs (Appwrite, Stripe). The
  line between `utils/` and `services/` is: services have business logic
  and side effects; utils are pure(ish) helpers.

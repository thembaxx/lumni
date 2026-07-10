# Plan 154: Remove dead image-preprocess.ts

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/utils/image-preprocess.ts`
> If the file changed since this plan was written, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

`src/lib/utils/image-preprocess.ts` (52 lines) exports `ProcessedImage` type
and image-processing utilities. Zero files import from it. Removing dead code
reduces maintenance surface and knip warnings.

## Current state

`src/lib/utils/image-preprocess.ts` exports:

- `ProcessedImage` interface
- `resizeImage(dataUrl, maxDimension, quality)` function
- `compressImage(dataUrl, quality)` function

Confirmed: zero import sites in `src/`.

## Scope

**In scope**:

- `src/lib/utils/image-preprocess.ts` — delete the file

**Out of scope**:

- Do NOT delete any other files in `src/lib/utils/` (all others have active consumers)
- Do NOT check for callers outside `src/` (e.g., `scripts/`, `e2e/`)

## Git workflow

- Branch: `advisor/154-remove-image-preprocess`
- Commit message: `chore: remove dead image-preprocess.ts`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete the file

```bash
rm src/lib/utils/image-preprocess.ts
```

**Verify**: `pnpm run typecheck` → exit 0, no errors. (If any import
existed, typecheck would fail.)

### Step 2: Update barrel if necessary

Check if `src/lib/utils/index.ts` exports from the deleted file:

```bash
grep 'image-preprocess' src/lib/utils/index.ts
```

If found, remove that export line.

**Verify**: `pnpm run typecheck` → exit 0, no errors.

## Test plan

No tests to update — the file had no tests and no consumers.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `Test-Path "src/lib/utils/image-preprocess.ts"` returns `False`
- [ ] `grep -r 'image-preprocess' src/` returns no matches
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if typecheck or tests fail after deletion — but this is
effectively impossible since zero import sites were confirmed.

## Maintenance notes

- The image preprocessing functionality can be revived from git history if
  ever needed.

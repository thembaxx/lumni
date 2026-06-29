# Plan 062: Fix CI branch target for todo-sync + sentry-release

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

The CI workflow has two jobs (`todo-sync` and `sentry-release`) that trigger only on pushes to `refs/heads/main`. The repo default branch is `master`. These jobs silently never fire — TODO→Linear synchronization is dead, and Sentry releases are never created from CI. Two lines, fixable in five minutes.

## Current state

The jobs at `.github/workflows/ci.yml:141` and `:156`:

```yaml
todo-sync:
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'

sentry-release:
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

## Scope

**In scope**: `.github/workflows/ci.yml` — two `if:` conditions.

**Out of scope**: Any other CI changes (parallelism, worker counts — those are separate concerns). The `bundle-size` job doesn't have a branch filter — leave it as-is.

## Commands

| Purpose | Command                                           | Expected on success |
| ------- | ------------------------------------------------- | ------------------- |
| Lint    | `pnpm exec oxlint --fix .github/workflows/ci.yml` | exit 0              |
| Format  | `pnpm exec oxfmt .github/workflows/ci.yml`        | exit 0              |

## Steps

### Step 1: Change `refs/heads/main` to `refs/heads/master` in both jobs

In `.github/workflows/ci.yml`, replace both instances of `refs/heads/main` with `refs/heads/master` — one at line 141 (`todo-sync`) and one at line 156 (`sentry-release`). Use two separate edits or one replaceAll.

**Verify**: `rg 'refs/heads/main' .github/workflows/ci.yml` → no matches. `rg 'refs/heads/master' .github/workflows/ci.yml` → exactly 2 matches.

## Done criteria

- [ ] `rg 'refs/heads/main' .github/workflows/ci.yml` returns no matches
- [ ] `rg 'refs/heads/master' .github/workflows/ci.yml` returns exactly 2 matches
- [ ] No other files modified (`git diff --stat` shows only `.github/workflows/ci.yml`)

## STOP conditions

- The CI file structure has changed significantly from what's described (e.g., `todo-sync` or `sentry-release` jobs have been removed or renamed) — stop and report.

## Maintenance notes

Session 49 (June 2026) also found this issue and fixed it in the `e2e-dast` job name but missed `todo-sync` and `sentry-release`. If the default branch ever changes again, search `ci.yml` for `refs/heads/` to catch all three instances.

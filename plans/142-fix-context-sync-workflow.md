# Plan 142: Fix context-sync.yml no-op CI workflow

> **Executor instructions**: Follow this plan step by step.
>
> **Drift check**: `git diff --stat 6c00cdcd..HEAD -- .github/workflows/context-sync.yml scripts/sync-context.sh`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

`.github/workflows/context-sync.yml` runs daily on CI but only prints "Skipped" and exits. Referenced `scripts/sync-context.sh` doesn't exist. Wastes CI runner minutes and misleads developers into thinking context is being synced.

## Steps

### Step 1: Change workflow trigger to manual only or disable it

Update `context-sync.yml`. Either:

- **Option A**: Change `on.schedule` to `on.workflow_dispatch` (manual trigger only)
- **Option B**: Remove the workflow file entirely if the sync is never happening

### Step 2: If keeping the workflow, remove the dead reference

Remove the reference to `scripts/sync-context.sh` and either implement the actual sync or add a clear comment about what it should do when implemented.

## Done criteria

- [ ] Workflow no longer runs on daily schedule without doing work
- [ ] No broken references to non-existent scripts

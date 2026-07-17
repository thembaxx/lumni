# Plan 237: Upgrade Next.js from preview to stable and remove patch

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: tech-debt / dependencies
- **Generated at**: 2026-07-17

## Why this matters

The project uses `"next": "16.3.0-preview.5"` with a custom patch in `patches/next+16.3.0-preview.5.patch`. Preview releases can have breaking changes between preview versions, lack long-term support guarantees, and may have unfixed bugs that the patch tries to work around. Running on a stable release removes the patch maintenance burden and ensures compatibility with the broader ecosystem (Sentry SDK, bundle analyzer, Playwright). The `@next/bundle-analyzer` and `@next/playwright` packages are also pinned to preview versions.

## Current state

- `package.json`: `"next": "16.3.0-preview.5"`, `"@next/bundle-analyzer": "16.3.0-preview.5"`, `"@next/playwright": "16.3.0-preview.5"`
- `patches/next+16.3.0-preview.5.patch` exists
- `pnpm-workspace.yaml` has `minimumReleaseAgeExclude` entries for `16.2.9` packages

## Target state

- All Next.js packages upgraded to latest stable 16.x (e.g., `16.2.9` or newer stable)
- Patch file removed if the patch is no longer needed
- `minimumReleaseAgeExclude` entries updated for the new version
- TypeCheck, lint, test, build all pass

## Scope

- `package.json` — update `next`, `@next/bundle-analyzer`, `@next/playwright` versions
- `patches/` — delete `next+16.3.0-preview.5.patch`
- `pnpm-workspace.yaml` — update `minimumReleaseAgeExclude` entries

## Steps

### 1. Determine latest stable Next.js 16

Run `npm view next versions --json` or check `pnpm view next versions` for all stable 16.x releases. Choose the latest stable (not preview).

### 2. Update package.json

Update:

```json
"next": "16.2.9",
"@next/bundle-analyzer": "16.2.9",
"@next/playwright": "16.2.9",
```

### 3. Remove patch file

Delete `patches/next+16.3.0-preview.5.patch`.

### 4. Examine patch contents first

Read the patch to understand what it fixes. If the stable release includes the fix, the patch is dead weight. If not, file an issue and note as a known limitation.

### 5. Install

```bash
pnpm install
```

### 6. Verify

- `pnpm run typecheck` — 0 errors
- `pnpm run build` — succeeds (this is the critical check — Next.js build catches runtime config issues)
- `pnpm run test` — no regressions

### 7. Update pnpm-workspace.yaml

Update `minimumReleaseAgeExclude` entries from `16.2.9` to the new stable version.

Verification: `pnpm install ; pnpm run typecheck ; pnpm run build ; pnpm run test`

## Stop conditions

- `pnpm run build` fails with errors related to an API change in the new Next.js version — stop and evaluate the migration cost. If high, revert to preview and note the blocking issue
- The patch addresses a bug that still exists in the latest stable — keep the patch, re-target it to the stable version, and file an upstream issue

## Estimated time

1-2 hours (including build verification)

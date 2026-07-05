# Plan 093: Diagnose and fix `pnpm run build` hang with Turbopack

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d4ba0811..HEAD -- next.config.ts package.json tsconfig.json`
> If any build config file changed, verify the environment still matches
> what's described below.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (diagnose only; fixing may be MED risk if it involves config changes)
- **Depends on**: none
- **Planned at**: commit `d4ba0811`, 2026-07-05

## Why this matters

`pnpm run build` hangs indefinitely (observed timeout at 120+ seconds with no output past the initial Turbopack header). If this reproduces consistently, it blocks CI build/e2e/a11y-contrast jobs and makes local deployment verification impossible. Even if it's an intermittent local issue, documenting the cause prevents future time-wasting.

## Current state

- `package.json`: build script is `next build`
- `next.config.ts`: Uses Turbopack (`experiments.optimizePackageImports`), Sentry tunnel, security headers, and other production config
- CI (`ci.yml`): runs `pnpm run build` with `NEXT_PUBLIC_SENTRY_DSN` env var, no Appwrite keys (intentional for build-only)
- Dev server runs Next.js 16.2.9; build uses 16.3.0-preview.5 — version mismatch between dev and build
- Known issue: Turbopack in Next.js 16 preview branches can hang on large `node_modules` or complex `tsconfig` paths

## STOP conditions

- Build completes successfully during diagnosis — in that case document "intermittent, not reproducible, likely environment-specific" and stop
- Build fails with a clear error (not a hang) — fix the error instead

## Commands you will need

| Purpose                 | Command                                              | Expected on success        |
| ----------------------- | ---------------------------------------------------- | -------------------------- |
| Check Next.js version   | `pnpm ls next --depth 0`                             | Shows version installed    |
| Check lockfile version  | `head -3 pnpm-lock.yaml`                             | Shows lockfile version 9.x |
| Build without Turbopack | `pnpm next build --no-turbopack`                     | Completes within 120s      |
| Turbo trace             | `NEXT_TURBOTRACE=1 pnpm next build 2>&1 \| tail -20` | Shows traced modules       |
| Typecheck               | `pnpm run typecheck`                                 | exit 0, no errors          |

## Scope

**In scope**:

- `next.config.ts` — possible diagnostic config changes (e.g. `experimental.turbo.rules` overrides) or workaround (disabling Turbopack for build)
- Any diagnostic output files produced during investigation

**Out of scope**:

- Upgrading Next.js version
- Changing the CI pipeline
- Modifying any application source code

## Steps

### Step 1: Determine whether the hang is reproducible

Run `pnpm run build` with a 180s timeout. If it completes, document the elapsed time and call the plan done as "intermittent". If it hangs, proceed.

### Step 2: Check Next.js version consistency

Run `pnpm ls next --depth 0`. Compare the installed version against `dev` output (which shows 16.2.9 vs 16.3.0-preview.5 in the build). If versions differ, this is likely the root cause: the lockfile has both versions and Turbopack preview has a bug.

### Step 3: Try build without Turbopack

Run `pnpm next build --no-turbopack` with a 180s timeout. If it completes, the hang is specific to Turbopack in the preview version. Document this as the fix path (set `experimental.turbo` to `false` or similar).

### Step 4: Check for Sentry tunnel issue during build

The Sentry tunnel route at `src/app/api/telemetry/route.ts` might be compiled during build and trying to reach Sentry. Check if setting `NEXT_PUBLIC_SENTRY_DSN=""` unblocks the build. Run with `NEXT_PUBLIC_SENTRY_DSN="" pnpm next build --no-turbopack`.

### Step 5: If root cause found, apply the minimal fix

- If Turbopack preview bug: add `--no-turbopack` to the build script in `package.json` (or disable in `next.config.ts`)
- If version mismatch: pin the version in `package.json`
- If Sentry: add `NEXT_PUBLIC_SENTRY_DSN` to `.env.example` instructions

### Step 6: Final verification

Run the fixed build command and confirm it finishes under 120s. Run `pnpm run typecheck` — 0 errors.

## Verification

1. `pnpm run build` completes in under 120s (or the diagnosis is documented clearly)
2. If a fix was applied (e.g. `--no-turbopack`), CI still passes
3. Root cause is documented in this plan or a NOTES file

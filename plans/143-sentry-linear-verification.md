# Plan 143: Verify Sentry→Linear integration end-to-end

> **Executor instructions**: Follow this plan step by step. Do NOT trigger a real production error — use a safe test.
>
> **Drift check**: `git diff --stat 6c00cdcd..HEAD -- src/instrumentation.ts sentry.server.config.ts .env.example`

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

Full Sentry setup exists (instrumentation.ts, tunnel route, CSP reporting, session replay) but the Sentry→Linear auto-issue integration has never been tested end-to-end. When the app crashes in production, the engineering team won't automatically get a tracked issue. Crashes are invisible until users complain.

## Steps

### Step 1: Check Sentry integration config

Read `sentry.server.config.ts` and `sentry.client.config.ts` for Linear integration settings. Look for `integrations` array entries related to Linear/issue tracking.

### Step 2: Test with a safe sentry error

If Sentry→Linear is configured via `sentry-issues` or similar, trigger a test error via one of:

- The Sentry dashboard "Test" button for the project
- A manual `Sentry.captureException(new Error("test-linear-integration"))` via a dev-only API route

### Step 3: Verify Linear issue was created

Check the Linear project backlog for the auto-created issue. Document the expected issue format.

### Step 4: Document in AGENTS.md

Add a note about the verified Sentry→Linear integration and what to expect.

## Done criteria

- [ ] Sentry→Linear integration verified with test error
- [ ] Format of auto-created Linear issues documented
- [ ] Any wiring gaps fixed

# Plan 149: Add webhook handler tests (Appwrite + Sentry)

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/app/api/webhooks/`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW | **Depends on**: none | **Category**: test
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The Twilio SendGrid event webhook (`src/app/api/webhooks/sendgrid/route.ts`) and Sentry feedback webhook routes have zero tests. These handle incoming external POSTs with error recovery logic that is fragile and hard to debug in production. The SendGrid webhook in particular processes event arrays and has try/catch-per-event handling that should be verified.

## Current state

- `src/app/api/webhooks/sendgrid/route.ts` — processes SendGrid event arrays, no tests
- Sentry feedback webhook routes — process incoming Sentry feedback, no tests
- No webhook test utilities

## Steps

### Step 1: Create webhook test helpers

Create `src/lib/webhooks/__tests__/helpers.ts` with:

- A mock `NextRequest` factory that accepts a JSON body and method
- A mock signature verification helper (if webhooks use HMAC verification)

### Step 2: Write SendGrid webhook tests

Create `src/app/api/webhooks/sendgrid/__tests__/route.test.ts`:

1. **Valid event array** — POST with 5 valid events → 200, all events processed
2. **Empty event array** — POST with `[]` → 200, no crash
3. **Malformed event** — event missing required fields → 200 (not 500), individual event skipped
4. **Partial failure** — 3 valid + 1 invalid → 200, 3 processed
5. **Invalid method** — GET → 405 or 404

### Step 3: Write Sentry webhook tests

Create tests for the Sentry feedback webhook(s):

1. **Valid feedback payload** — POST with valid Sentry feedback → 200
2. **Duplicate feedback** — same payload twice → 200 (no duplicate)
3. **Invalid payload** — missing required fields → 400 or 200 with skip

### Step 4: Verify

`pnpm test` → new tests pass. `pnpm typecheck` → exit 0.

## Done criteria

- [ ] `pnpm test` passes (8+ new webhook tests)
- [ ] `pnpm typecheck` exits 0
- [ ] SendGrid webhook event processing covered (valid, empty, partial failure, invalid method)
- [ ] Sentry feedback webhook covered
- [ ] Webhook test helpers created

## STOP conditions

Stop and report if the webhook routes have been restructured (e.g., moved to a route handler factory pattern). Read the current webhook route files to verify.

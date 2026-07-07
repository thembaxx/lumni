# Plan 119: Add admin auth to magic-link and resend endpoints

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/app/api/admin/auth/`

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

The admin magic-link and resend endpoints have `auth: "none"`, enabling unauthenticated callers to create magic-link sessions for any email. This leaks whether an email is registered (via the "already exists" error) and enables email bombing.

## Current state

- `src/app/api/admin/auth/magic-link/route.ts:10` — `auth: "none"`
- `src/app/api/admin/auth/resend/route.ts:11` — `auth: "none"` (need to verify)

Both already use `createRouteHandler`.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |

## Steps

### Step 1: Change auth to admin

In both files, change `auth: "none"` to `auth: "admin"`.

**Verify**: `grep -rn 'auth: "none"' src/app/api/admin/auth/` → 0 matches

### Step 2: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] Both routes use `auth: "admin"`
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- The admin auth flow itself depends on these endpoints being unauthenticated (circular dependency)

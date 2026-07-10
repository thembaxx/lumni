# Plan 150: Replace IP-fallback budget identity with session-based auth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/ai/with-budget.ts`
> If the file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: plan 146 (lesson routes auth) — establishes pattern
- **Category**: security
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

`checkBudget()` in `with-budget.ts` uses `sessionUserId` when available, but
falls back to the client IP derived from `x-forwarded-for` / `x-real-ip`
headers. These headers are trivially spoofable by the client. An attacker can
rotate through arbitrary IP addresses to bypass per-user daily AI call quotas,
exhausting the global AI budget.

This is the remaining architectural gap after plans 110/118 added auth guards
to most AI-cost routes — the budget layer itself still trusts IP-derived
identity when session auth is absent.

## Current state

`src/lib/ai/with-budget.ts` lines 5-15:

```typescript
export async function checkBudget(
  req: NextRequest,
  type: AICallType,
  sessionUserId?: string | null,
): Promise<{ ... }> {
  const ip = getClientIp(req);
  const userId = sessionUserId || (ip !== "unknown" ? ip : "anonymous");
```

**Callers of `checkBudget`**: Search for all imports of `with-budget` or
`checkBudget` in `src/`:

```bash
git grep 'checkBudget\|with-budget' src/
```

The `checkBudget` function is called by `createRouteHandler` when a route
has a `budget` config field. It passes `sessionUserId` from the auth guard.
When the route has `auth: "required"`, `sessionUserId` is always populated.
When `auth: "optional"` or `auth: "none"`, it may be null.

**Goal**: Since plan 146 makes all AI-cost routes use `auth: "required"`,
every `checkBudget` call will have a real `sessionUserId`. We can now require
it and remove the IP fallback.

## Scope

**In scope**:

- `src/lib/ai/with-budget.ts` — require `sessionUserId`, remove IP fallback

**Out of scope**:

- Do NOT change `daily-call-tracker.ts` (the actual counter)
- Do NOT change `getClientIp` utility
- Do NOT change any route handlers

## Git workflow

- Branch: `advisor/150-budget-identity-auth`
- Commit message: `fix: require sessionUserId in checkBudget, remove IP fallback`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Verify all budget-tracked routes now use auth:required

Run:

```bash
git grep 'budget:' src/app/api/ | grep -v '.test.'
```

Every route that has a `budget` config must also have `auth: "required"`.
If any route has `budget` but `auth: "optional"` or `auth: "none"`, STOP and
report. (Plan 146 should have addressed the lessons routes; this check is a
safety net.)

### Step 2: Remove IP fallback from checkBudget

Change `checkBudget` from:

```typescript
export async function checkBudget(
  req: NextRequest,
  type: AICallType,
  sessionUserId?: string | null,
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  userId: string;
}> {
  const ip = getClientIp(req);
  const userId = sessionUserId || (ip !== "unknown" ? ip : "anonymous");
```

to:

```typescript
export async function checkBudget(
  req: NextRequest,
  type: AICallType,
  sessionUserId: string,
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  userId: string;
}> {
  const userId = sessionUserId;
```

Changes:

- Remove `getClientIp` import (verify it's only used here — if so, remove the import; if imported elsewhere in the file, keep it)
- Change `sessionUserId` parameter type from `string | null | undefined` to `string` (required)
- Remove the IP fallback logic
- Remove the `ip` variable

**Verify**: `pnpm run typecheck` → exit 0, no errors.

### Step 3: Update the caller in createRouteHandler

Find where `checkBudget` is called in `src/lib/api/create-route-handler.ts`.
The call site likely passes `userId` from the auth guard context. Ensure it
correctly passes `userId` (which will be a string when auth is required).

Search:

```bash
git grep 'checkBudget' src/lib/api/create-route-handler.ts
```

Ensure the call guarantees a non-null string. If the type signature now
requires `string` and the caller passes `string | undefined`, TypeScript
will flag it — let the typechecker guide you.

**Verify**: `pnpm run typecheck` → exit 0, no errors.

## Test plan

Check for existing tests that mock `checkBudget`:

```bash
git grep 'checkBudget\|with-budget' src/ -- '*.test.*'
```

If tests pass the wrong type for the new `sessionUserId` parameter, fix them
to pass a valid string. The change is mechanical — add `"test-user-id"` as
the argument.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on changed files
- [ ] `grep -n 'getClientIp' src/lib/ai/with-budget.ts` returns no match
- [ ] `grep -n 'ip !== "unknown"' src/lib/ai/with-budget.ts` returns no match
- [ ] `grep -n 'sessionUserId.*string' src/lib/ai/with-budget.ts` shows `sessionUserId: string` (required, not optional)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any route has `budget:` but not `auth: "required"` (from step 1 vetting). Do NOT change those routes' auth here — that's plan 146's job. Report the mismatch.
- The `createRouteHandler` caller doesn't guarantee a non-null `userId` when auth is required. If the type system says it's still `string | null`, fix the type in `create-route-handler.ts` to narrow the `userId` type when `auth: "required"` is set, OR take a different approach (keep `sessionUserId` as optional but reject budget checks when it's missing).

## Maintenance notes

- All future budget-tracked routes MUST use `auth: "required"`. Document this in AGENTS.md.
- The `getClientIp` function can remain in the codebase for other uses (rate limiting, logging) but should not be used for budget identity.

# Plan 007: Add upper bound to question generation count

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/app/api/engine/generate/route.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

The `/api/engine/generate` route validates `count >= 1` but has no upper bound. A client can send `count: 100000`, triggering massive sequential AI calls, embedding lookups, Appwrite writes, and visual generation jobs. Even with the daily budget (20 generates), each call with `count: 10000` produces 10000 questions, burning API credits and creating thousands of background jobs.

## Current state

**`src/app/api/engine/generate/route.ts:17-21`**:

```typescript
validate: (body) => {
  if (!body.subject) return "Subject is required";
  if (!body.count || body.count < 1) return "Count must be at least 1";
  return null;
},
```

No upper bound check.

**Repo convention**: The `validate` function returns `null` on success or a string error message on failure. The `createRouteHandler` factory handles the 400 response.

## Commands you will need

| Purpose   | Command                                                | Expected on success |
| --------- | ------------------------------------------------------ | ------------------- |
| Typecheck | `npx tsc --noEmit`                                     | exit 0, no errors   |
| Lint      | `npx biome check src/app/api/engine/generate/route.ts` | 0 errors            |
| Tests     | `bun run test`                                         | 1326+ pass, 0 fail  |

## Scope

**In scope**:

- `src/app/api/engine/generate/route.ts`

**Out of scope**:

- The question engine itself
- Other API routes

## Git workflow

- Branch: `advisor/007-count-cap`
- Commit: `fix: cap question generation count at 50`

## Steps

### Step 1: Add upper bound check

In `src/app/api/engine/generate/route.ts`, update the `validate` function:

```typescript
validate: (body) => {
  if (!body.subject) return "Subject is required";
  if (!body.count || body.count < 1) return "Count must be at least 1";
  if (body.count > 50) return "Count must be 50 or less";
  return null;
},
```

**Verify**: `npx biome check src/app/api/engine/generate/route.ts` → 0 errors

### Step 2: Run full verification

```bash
npx tsc --noEmit
npx biome check src/app/api/engine/generate/route.ts
bun run test
```

## Test plan

- If `src/app/api/engine/__tests__/generate.test.ts` exists, add a test case:
  - Request with `count: 100` → response contains error "Count must be 50 or less"
  - Request with `count: 50` → succeeds (or at least doesn't fail validation)

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/app/api/engine/generate/route.ts` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "count > 50" src/app/api/engine/generate/route.ts` returns a match
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The validation function is not the right place for this check (it may be in the route handler body).
- The UI already caps count at a lower value (making this redundant but still good defense-in-depth).

## Maintenance notes

- The cap of 50 is chosen because the UI typically requests 5-10 questions. 50 provides headroom for batch generation while preventing abuse.
- If the daily budget is 20 generates, a single call with count=50 can generate 50 questions — this is within budget design.

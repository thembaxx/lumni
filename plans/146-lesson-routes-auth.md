# Plan 146: Add auth guard + budget tracking to lesson routes

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/app/api/lessons/`
> If any file under `src/app/api/lessons/` changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

Two lesson-generation routes (`src/app/api/lessons/route.ts` and
`src/app/api/lessons/[subjectId]/[subtopicId]/route.ts`) use `auth: "none"`
while calling `generateLesson()` — which triggers AI generation. Plans 110/118
added auth guards to 10 other AI-cost routes but these two were missed. An
unauthenticated caller can burn AI budget (rate-limited to 10 req/min per IP,
but no per-user budget enforcement). This is an open AI spend vector.

## Current state

**File 1**: `src/app/api/lessons/route.ts` (37 lines)

```typescript
// Line 7
export const GET = withRateLimit(
  createRouteHandler({
    auth: "none",            // <-- should be "required"
    execute: async ({ req }) => {
      // ...
      const lesson = await generateLesson(subject, topic, subtopic); // AI call
```

**File 2**: `src/app/api/lessons/[subjectId]/[subtopicId]/route.ts` (39 lines)

```typescript
// Line 6
export const GET = createRouteHandler({
  auth: "none",              // <-- should be "required"
  execute: async ({ params }) => {
    // ...
    const lesson = await generateLesson(subjectId, "", subtopicId); // AI call
```

Both use `createRouteHandler()` from `src/lib/api/create-route-handler.ts`.
The `auth` field accepts `"none"`, `"optional"`, or `"required"`.

The budget field (`budget` in `createRouteHandler` config) allows:

- `"generate"` — daily generation budget
- `"grade"` — daily grading budget
- `"hint"` — daily hint budget

**Convention** (established by plans 110/118): All AI-cost routes should use
`auth: "required"` AND a `budget` field. See `src/app/api/engine/generate/route.ts`
as the exemplar:

```typescript
// From src/app/api/engine/generate/route.ts
export const POST = createRouteHandler({
  auth: "required",
  budget: "generate",
  // ...
});
```

## Scope

**In scope**:

- `src/app/api/lessons/route.ts` — change `auth: "none"` to `auth: "required"`, add `budget: "generate"`
- `src/app/api/lessons/[subjectId]/[subtopicId]/route.ts` — change `auth: "none"` to `auth: "required"`, add `budget: "generate"`

**Out of scope**:

- Do NOT change the rate-limit config on either route
- Do NOT change any other API route files
- Do NOT change the lesson service logic

## Git workflow

- Branch: `advisor/146-lesson-routes-auth`
- Commit message style (match repo): `fix: add auth guard to lesson routes`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Edit `src/app/api/lessons/route.ts`

Change line 7 from:

```typescript
    auth: "none",
```

to:

```typescript
    auth: "required",
    budget: "generate",
```

The `createRouteHandler` already handles the auth guard + budget check
orchestration. No additional code needed.

**Verify**: `pnpm run typecheck` → exit 0, no errors.

### Step 2: Edit `src/app/api/lessons/[subjectId]/[subtopicId]/route.ts`

Change line 6 from:

```typescript
  auth: "none",
```

to:

```typescript
  auth: "required",
  budget: "generate",
```

**Verify**: `pnpm run typecheck` → exit 0, no errors.

## Test plan

No new tests needed — the `createRouteHandler` factory already has its own
test coverage for auth guards. The route handlers are too thin (1 function
call each) to benefit from separate route-level tests at this point.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on changed files
- [ ] `grep -n 'auth: "none"' src/app/api/lessons/route.ts` returns no match
- [ ] `grep -n 'auth: "none"' "src/app/api/lessons/[subjectId]/[subtopicId]/route.ts"` returns no match
- [ ] `grep -n 'budget: "generate"' src/app/api/lessons/route.ts` returns match
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `createRouteHandler` config schema changed and `budget` is no longer accepted. Check `src/lib/api/create-route-handler.ts` types.
- Any file in `src/app/api/lessons/` changed significantly since `82a850d3`.

## Maintenance notes

- If new lesson routes are added, they should follow the same pattern: `auth: "required"`, `budget: "generate"`.
- This fix is consistent with plans 110/118 which applied the same change to 10 other AI-cost routes.

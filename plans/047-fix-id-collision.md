# Plan 047: Fix ID collision from Date.now() + Math.random() in loops

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/lib/flashcard-engine/engine.ts src/lib/services/study-planner-service.ts`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

Two ID generation sites use `Date.now()` + `Math.random().toString(36)` inside synchronous or parallel loops. When consecutive IDs are generated in the same millisecond (loops) or simultaneously (`Promise.all`), `Date.now()` returns the same value, making collision probability non-trivial. Duplicate IDs cause Dexie `add()` to throw (primary key collision) or `put()` to overwrite records, resulting in silent data loss.

## Current state

`src/lib/flashcard-engine/engine.ts:39-41`:

```typescript
function generateId(): string {
  return `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

`src/lib/services/study-planner-service.ts:255`:

```typescript
id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
```

Both run in loops. The flashcard `convertQuizToFlashcards` calls `this.create()` in `Promise.all`, where all cards get the same `Date.now()` timestamp.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/lib/flashcard-engine/engine.ts` — `generateId()` function
- `src/lib/services/study-planner-service.ts` — inline ID generation

**Out of scope**:

- Any other ID generation sites (search for `Date.now` + `random` in the codebase and verify they're different patterns)
- Changes to the Dexie schema or key structure

## Steps

### Step 1: Replace flashcard engine's generateId

Replace the `generateId()` function in `engine.ts`:

```typescript
function generateId(): string {
  return `fc_${crypto.randomUUID()}`;
}
```

`crypto.randomUUID()` is available in all modern browsers and Node.js 19+. The existing prefix `fc_` makes it human-readable in Dexie DevTools.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Replace study-planner-service ID generation

In `study-planner-service.ts:255`, replace the inline ID:

```typescript
// Before:
id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

// After:
id: `plan_${crypto.randomUUID()}`,
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Run test suite

**Verify**: `pnpm run test` → all pass.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `generateId()` in `engine.ts` uses `crypto.randomUUID()`
- [ ] Study plan session IDs use `crypto.randomUUID()`
- [ ] `plans/README.md` status row updated

## Maintenance notes

- `crypto.randomUUID()` produces version 4 UUIDs (122 random bits) — effectively zero collision probability.
- If any test mocks `Math.random()` or `Date.now()` and now fails, update the mock to handle `crypto.randomUUID()` instead.

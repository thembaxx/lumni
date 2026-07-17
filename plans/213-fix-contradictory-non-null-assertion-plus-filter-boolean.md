# Plan 213: Remove contradictory non-null assertion + filter(Boolean) in adaptive-planner

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug

## Why this matters

A `.map().filter(Boolean)` pipeline with a non-null assertion (`!`) inside the `map` is contradictory and dangerous. The `!` tells TypeScript "this value is definitely not undefined", but the subsequent `.filter(Boolean)` reveals the developer knew it could be undefined. If the `Map.get()` returns `undefined` at runtime (because of a stale topic reference, incorrect subject filter, or data race), the `!` suppresses the type error but the code throws `TypeError: Cannot read properties of undefined` before `.filter(Boolean)` ever runs.

## Current state

`src/lib/study-planner/adaptive-planner.ts:423`:

```ts
const lookup = new Map(subjectTopics.map((t) => [t.topicId, t]));
const ordered = sortedTopics.map((id) => lookup.get(id)!).filter(Boolean);
```

`lookup.get(id)!` asserts non-null, then `.filter(Boolean)` removes falsy values — contradictory. If `id` is not in `lookup`, the `!` lets it pass the type checker, `lookup.get(id)` returns `undefined`, then accessing `.filter(Boolean)` is never reached because `.map()` throws on the first missing key.

## Target state

Replace with `flatMap` that skips missing entries gracefully:

```ts
const ordered = sortedTopics.flatMap((id) => {
  const topic = lookup.get(id);
  return topic ? [topic] : [];
});
```

This is the idiomatic "map-and-filter" pattern: `flatMap` returns an empty array for missing entries, so they're excluded without ever throwing.

## Scope

- `src/lib/study-planner/adaptive-planner.ts` only, line 423
- No other files
- No behavioural change for working data paths — only fixes the crash-on-missing-key behaviour

## Steps

### 1. Read the line in context

Read `src/lib/study-planner/adaptive-planner.ts:415-430` to verify the surrounding logic.

### 2. Replace the line

Change line 423:

```ts
const ordered = sortedTopics.map((id) => lookup.get(id)!).filter(Boolean);
```

To:

```ts
const ordered = sortedTopics.flatMap((id) => {
  const topic = lookup.get(id);
  return topic ? [topic] : [];
});
```

### 3. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Expected: zero errors. All tests pass.

## Stop conditions

- Any file outside `src/lib/study-planner/adaptive-planner.ts` is modified — stop and revert
- `pnpm run typecheck` fails
- Any test regresses

## Estimated time

15-20 minutes

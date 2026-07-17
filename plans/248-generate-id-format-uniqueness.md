# Plan 248: Add tests for generateId format and uniqueness

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

`generateId()` in `engine-helpers.ts` uses `Date.now() + Math.random().toString(36).slice(2, 11)` to produce flashcard IDs like `fc_1712345678_a1b2c3d4e`. This format is relied upon by Dexie key lookups, sync outbox deduplication, and UI card identity. If the format changes silently (e.g., `Math.random()` produces `0` and `slice(2, 11)` returns empty string), IDs would collide or fail to match the expected `fc_` prefix regex. The function currently passes only a truthiness check in tests — its format and uniqueness constraints are untested.

## Current state

- `src/lib/flashcard-engine/engine-helpers.ts:4-6`:

```ts
export function generateId(): string {
  return `fc_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
```

- Only checked for truthiness in tests (no format assertion, no uniqueness test)
- `Math.random().toString(36).slice(2, 11)` can produce strings shorter than 9 chars when the random value is very small (e.g., `Math.random() = 0.0000001` → `"3.5e"` → `slice(2)` = `"5e"` — only 2 chars)
- No test ensures the `fc_` prefix or the overall format

## Target state

`engine-helpers.test.ts` with 3-4 tests covering:

- Format matches `/^fc_\d+_[a-z0-9]{9}$/`
- Uniqueness across 1000 concurrent calls (no collisions)
- Non-empty after `Math.random()` edge case

## Scope

- `src/lib/flashcard-engine/__tests__/engine-helpers.test.ts` (new)
- If a potential bug is confirmed (short random string), fix `generateId` in the same plan

## Steps

### 1. Create test file

Create `src/lib/flashcard-engine/__tests__/engine-helpers.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { generateId } from "../engine-helpers";

describe("generateId", () => {
  it("matches expected format fc_<timestamp>_<random>", () => {
    const id = generateId();
    expect(id).toMatch(/^fc_\d+_[a-z0-9]{9}$/);
  });

  it("starts with fc_ prefix", () => {
    const id = generateId();
    expect(id.startsWith("fc_")).toBe(true);
  });

  it("produces unique IDs across multiple calls", () => {
    const count = 1000;
    const ids = new Set<string>();
    for (let i = 0; i < count; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(count);
  });

  it("ends with a 9-character alphanumeric suffix", () => {
    const id = generateId();
    const suffix = id.split("_").pop()!;
    expect(suffix.length).toBe(9);
    expect(suffix).toMatch(/^[a-z0-9]+$/);
  });
});
```

### 2. (Conditional) Fix generateId if short suffix bug exists

If the test `matches expected format` fails due to short suffix (when `Math.random()` returns a very small value), fix the implementation:

```ts
export function generateId(): string {
  const random = Math.random().toString(36).slice(2, 11);
  return `fc_${Date.now()}_${random.padEnd(9, "0")}`;
}
```

### 3. Verify

```bash
pnpm test -- src/lib/flashcard-engine/__tests__/engine-helpers.test.ts
pnpm run typecheck
pnpm exec biome check src/lib/flashcard-engine/__tests__/engine-helpers.test.ts
```

## Test plan

| Test          | Assertion                               |
| ------------- | --------------------------------------- |
| Format regex  | `/^fc_\d+_[a-z0-9]{9}$/`                |
| Prefix        | starts with `fc_`                       |
| Uniqueness    | 1000 concurrent calls, Set size == 1000 |
| Suffix length | Last segment `.length === 9`            |

## Done criteria

- [ ] `pnpm test -- src/lib/flashcard-engine/__tests__/engine-helpers.test.ts` passes
- [ ] Format regex, prefix, uniqueness, and suffix length all verified
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec biome check` passes on the new file
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `generateId` is found to be an alias or re-export of a function from another module, test the canonical source instead
- If the suffix length test fails due to the `Math.random().slice(2, 11)` producing fewer than 9 chars, fix the bug (simple `padEnd`) — do not loosen the test

## Estimated time

30-45 minutes

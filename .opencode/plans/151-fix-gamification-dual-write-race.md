# Plan 151: Fix gamification dual-write race — sequential read-then-write in service.ts

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/gamification-engine/service.ts`

## Status

- **Priority**: P1 | **Effort**: M | **Risk**: LOW | **Depends on**: none | **Category**: bug
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

`GamificationService.updateCounter()` reads current state, mutates in-memory, then writes back. If two tabs or two concurrent calls update the same counter simultaneously, one write overwrites the other's increment. This is a classic read-modify-write race condition on the Dexie document.

## Current state

In `src/lib/gamification-engine/service.ts`, `updateCounter` likely does:

```typescript
async updateCounter(key: string, value: number) {
  const state = await this.loadOrCreateState();
  state.data[key] = (state.data[key] ?? 0) + value;
  await this.saveGamification(state);
}
```

If two calls to `updateCounter("wrongAnswersReviewed", 1)` happen concurrently, both `loadOrCreateState()` return the same base value, both add 1, and the second save overwrites the first — losing one increment.

## Steps

### Step 1: Convert to Dexie atomic update

Instead of read-then-write, use Dexie's atomic `modify` operation which locks the record:

```typescript
async updateCounter(key: string, value: number) {
  await this.db.gamification.where("userId").equals(this.userId).modify((state) => {
    state.data[key] = (state.data[key] ?? 0) + value;
  });
}
```

If `loadOrCreateState()` is still needed (for first-time creation), handle the "not found" case separately:

```typescript
async updateCounter(key: string, value: number) {
  const modified = await this.db.gamification.where("userId").equals(this.userId)
    .modify((state) => {
      state.data[key] = (state.data[key] ?? 0) + value;
    });
  if (modified === 0) {
    // First-time initialization — create with defaults
    await this.createDefaultState();
    await this.updateCounter(key, value); // Retry
  }
}
```

### Step 2: Apply same fix to setCounter

```typescript
async setCounter(key: string, value: number) {
  await this.db.gamification.where("userId").equals(this.userId)
    .modify((state) => {
      state.data[key] = value;
    });
}
```

### Step 3: Verify

Write a test that calls `updateCounter` concurrently 100 times and verifies the final value is 100 (not less due to races):

```typescript
const promises = Array.from({ length: 100 }, () => service.updateCounter("test", 1));
await Promise.all(promises);
const state = await service.loadOrCreateState();
expect(state.data.test).toBe(100);
```

## Test plan

Add the concurrent increment test to `src/lib/gamification-engine/__tests__/service.test.ts`. This test will fail before the fix and pass after, serving as regression protection.

## Done criteria

- [ ] `pnpm test` passes (concurrent increment test included)
- [ ] `pnpm typecheck` exits 0
- [ ] `updateCounter` and `setCounter` use Dexie's atomic `.modify()`
- [ ] First-time initialization path handled when no record exists

## STOP conditions

Stop and report if the `modify` method is not available on the gamification DataAccess table (it may use a different persistence pattern). Read the DataAccess interface and the gamification table definition.

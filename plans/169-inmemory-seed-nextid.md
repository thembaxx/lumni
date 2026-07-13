---
status: TODO
priority: P2
effort: S
risk: LOW
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 169 — `InMemoryTable.seed` never advances `nextId` (test id collisions)

## Context

`InMemoryDataAccess` is the test double for `DataAccess` (used with `fake-indexeddb` in unit tests). Its `seed(data)` inserts records by their explicit `id` but never updates `nextId`. Any subsequent `add()` returns id `1`, then `2`, … colliding with seeded rows (e.g. a seeded record with `id: 5` is overwritten at the 5th `add`). This silently corrupts test fixtures and causes cross-test contamination.

## Current state (verified)

`src/lib/db/in-memory-data-access.ts:201-220`

```ts
seed(data: T[]): void {
  for (const item of data) {
    const rec = item as Record<string, unknown>;
    if (rec.id != null) {
      this.items.set(rec.id as TId, item);
    } else {
      const autoId = this.nextId++ as TId;
      this.items.set(autoId, { ...item, id: autoId } as T);
    }
  }
}
async add(item: Omit<T, "id">): Promise<TId> {
  const id = this.nextId++ as TId;
  this.items.set(id, { ...item, id } as unknown as T);
  return id;
}
```

## Goal

After `seed`, set `nextId` past the maximum seeded numeric id so later `add()` calls don't collide.

## Steps

1. In `seed`, track the max numeric id seen and advance `nextId`:
   ```ts
   seed(data: T[]): void {
     let maxId = this.nextId;
     for (const item of data) {
       const rec = item as Record<string, unknown>;
       if (rec.id != null) {
         this.items.set(rec.id as TId, item);
         if (typeof rec.id === "number" && rec.id > maxId) maxId = rec.id;
       } else {
         const autoId = this.nextId++ as TId;
         this.items.set(autoId, { ...item, id: autoId } as T);
         maxId = Math.max(maxId, this.nextId);
       }
     }
     this.nextId = maxId + 1;
   }
   ```
2. Guard for non-numeric ids (string ids): only advance `nextId` when ids are numbers (type `TId` is `number | string`; Dexie uses numbers here). If `TId` is `string`, skip the `nextId` adjustment (no-op) to avoid type errors.
3. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/db/in-memory-data-access.ts` (`seed` only).
- Out of scope: production `DexieDataAccess` (uses real auto-increment), other `InMemoryTable` methods.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/db` → pass (add a test, below).

## Test plan

- Add/extend `src/lib/db/__tests__/in-memory-data-access.test.ts`: `seed([{id:1,...},{id:5,...}])`, then `add({...})` three times, assert returned ids are `6,7,8` and `get(5)` still returns the seeded record (not overwritten). Mirror existing in-memory data-access test style.

## Maintenance

- This is test-infra only; no production behavior change. Future tests that `seed()` + `add()` now get stable ids.

## Escape hatches

- If `TId` is `string` in some table usage and the arithmetic doesn't compile, constrain the fix to the numeric case and leave string-id `seed` behavior unchanged. Do not broaden scope.

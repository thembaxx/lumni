# Plan 245: Make daily-limits localStorage injectable for testability

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

`src/lib/flashcard-engine/daily-limits.ts` controls how many new cards a user can study per day — a hard UX limit. The `loadBudget()` and `saveBudget()` functions use `typeof window !== "undefined"` to decide whether to read/write localStorage. In the test environment (Node.js), `typeof window` is `"undefined"`, so the false path runs every time — meaning the budget always appears empty/exceeded. The code paths for "budget not yet consumed", "budget exactly at limit", and "budget reset at midnight" are never tested.

Worse, because localStorage is not available in Node.js, `consumeNewCard` can never return `true` (indicating a card was successfully consumed within the budget), so the happy path of the entire flashcard daily limit feature is untested.

## Current state

- `src/lib/flashcard-engine/daily-limits.ts:15-40` — `loadBudget()` and `saveBudget()` use `typeof window` check
- `loadBudget()` returns `{ consumed: 0, limit: DEFAULT_LIMIT }` when localStorage is unavailable — the "budget reset" path but never the "budget partially consumed" path
- `consumeNewCard()` increments consumed count — never exercisable in tests
- `resetDailyBudget()` clears localStorage — never exercisable in tests
- No existing test file for daily-limits

## Target state

Extract localStorage storage operations into injectable `readBudget`/`writeBudget` function parameters. The functions default to the real localStorage implementation. Tests inject a simple `Map`-backed mock.

```ts
export interface BudgetStorage {
  readBudget: (key: string) => { consumed: number; date: string } | null;
  writeBudget: (key: string, data: { consumed: number; date: string }) => void;
  clearBudget: (key: string) => void;
}

const localStorageStorage: BudgetStorage = {
  readBudget: (key) => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  },
  writeBudget: (key, data) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
  },
  clearBudget: (key) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};

export function consumeNewCard(
  key: string,
  storage: BudgetStorage = localStorageStorage,
): boolean { ... }

export function resetDailyBudget(
  key: string,
  storage: BudgetStorage = localStorageStorage,
): void { ... }
```

## Scope

- `src/lib/flashcard-engine/daily-limits.ts` — refactor to injectable storage
- `src/lib/flashcard-engine/__tests__/daily-limits.test.ts` (new, might already exist from Plan 241)

## Steps

### 1. Read daily-limits.ts

Read the full implementation to understand the exact function signatures and types.

```bash
cat src/lib/flashcard-engine/daily-limits.ts
```

### 2. Extract BudgetStorage interface and default implementation

Add at the top of `daily-limits.ts`:

```ts
export interface BudgetStorage {
  readBudget: (key: string) => { consumed: number; date: string } | null;
  writeBudget: (key: string, data: { consumed: number; date: string }) => void;
  clearBudget: (key: string) => void;
}

export const localStorageBudgetStorage: BudgetStorage = {
  readBudget: (key) => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  writeBudget: (key, data) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(data));
  },
  clearBudget: (key) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};
```

### 3. Update exported functions to accept storage

Add optional `storage?: BudgetStorage` parameter to `consumeNewCard`, `resetDailyBudget`, `getRemainingBudget`, and any other exported function that reads/writes budget data. Default to `localStorageBudgetStorage`.

### 4. Create test file

Create `src/lib/flashcard-engine/__tests__/daily-limits.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { consumeNewCard, resetDailyBudget, getRemainingBudget } from "../daily-limits";

describe("daily limits with injectable storage", () => {
  let storage: ReturnType<typeof createMockStorage>;

  function createMockStorage() {
    const store = new Map<string, string>();
    return {
      readBudget: (key: string) => {
        const raw = store.get(key);
        return raw ? JSON.parse(raw) : null;
      },
      writeBudget: (key: string, data: { consumed: number; date: string }) => {
        store.set(key, JSON.stringify(data));
      },
      clearBudget: (key: string) => {
        store.delete(key);
      },
    };
  }

  beforeEach(() => {
    storage = createMockStorage();
  });

  it("consumeNewCard returns true within budget", () => {
    const result = consumeNewCard("test:u1", storage);
    expect(result).toBe(true);
  });

  it("consumeNewCard returns false after limit exceeded", () => {
    // Consume up to limit
    for (let i = 0; i < 20; i++) {
      consumeNewCard("test:u1", storage);
    }
    // Next consumption should fail
    const result = consumeNewCard("test:u1", storage);
    expect(result).toBe(false);
  });

  it("resetDailyBudget clears the stored budget", () => {
    consumeNewCard("test:u1", storage);
    resetDailyBudget("test:u1", storage);
    const remaining = getRemainingBudget("test:u1", storage);
    expect(remaining).toBe(/* default limit */ 20); // or whatever the default is
  });
});
```

### 5. Update all production call sites

Find all callers of `consumeNewCard`, `resetDailyBudget`, and `getRemainingBudget`:

```bash
rg "consumeNewCard|resetDailyBudget|getRemainingBudget" src/ --include "*.ts" --include "*.tsx"
```

These call sites are unchanged — the default parameter handles them.

### 6. Verify

```bash
pnpm test -- src/lib/flashcard-engine/__tests__/daily-limits.test.ts
pnpm run typecheck
pnpm exec biome check
```

## Test plan

| Test                                | Scenario                      | Expected                   |
| ----------------------------------- | ----------------------------- | -------------------------- |
| `consumeNewCard returns true`       | First card of the day         | `true`, consumed == 1      |
| `consumeNewCard returns false`      | After exhausting daily limit  | `false`                    |
| `resetDailyBudget`                  | Clear stored budget for a key | Remaining == default limit |
| `consumeNewCard across two keys`    | Different users/keys          | Independent budgets        |
| `getRemainingBudget` on empty store | No budget entry yet           | Returns default limit      |

## Done criteria

- [ ] `BudgetStorage` interface defined and exported
- [ ] All budget functions accept optional `storage` parameter
- [ ] Existing call sites unchanged (backward compatible)
- [ ] Test file covers consume within/exceeded budget, reset, independent keys
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm test` passes with no regressions
- [ ] `plans/README.md` status row updated

## STOP conditions

- If the `BudgetStorage` approach creates circular dependencies (e.g., if `daily-limits.ts` imports something that imports daily-limits), switch to a simpler function-level DI without the interface
- If there are more than 10 call sites of these functions, batch the call-site update carefully — use `rg -l` to enumerate first
- If the daily limit logic is already behind a class/DI pattern (e.g., `FlashcardEngine` has a `dailyLimit` field), prefer that existing pattern over adding a new `BudgetStorage` interface

## Estimated time

1-2 hours

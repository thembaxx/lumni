# Plan 125: Wrap useGamification in React context to eliminate N duplicate subscriptions

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/hooks/use-gamification.ts src/components/dashboard/`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

`useGamification` is independently instantiated 14+ times across the dashboard. Each call creates its own `GamificationService` reference, 13 `useCallback` wrappers, 3 `useRef` objects, and a `useMemo`. Every mutation fans out through `notify()` to all 14+ subscribers, each triggering React re-renders across unrelated components.

## Current state

- `src/hooks/use-gamification.ts:16-21` — module-level singleton via `let _serviceInstance`
- Consumers: `dashboard-client.tsx`, `today-tab.tsx`, `streak-card.tsx`, `stats-row.tsx`, `daily-challenge-card.tsx`, `daily-progress-ring.tsx`, `achievement-showcase.tsx`, `top-nav.tsx`, `gamification-celebration.tsx`, `competition-card.tsx`, plus flashcard and exam hooks

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`            | exit 0, no errors   |
| Tests     | `pnpm run test -- gamification` | all pass            |

## Steps

### Step 1: Create GamificationProvider context

Create `src/contexts/gamification-provider.tsx`:

```tsx
"use client";
import { createContext, useContext, useMemo } from "react";
import { useGamification as useGamificationHook } from "@/hooks/use-gamification";

const GamificationContext = createContext<ReturnType<typeof useGamificationHook> | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const value = useGamificationHook();
  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamificationContext() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamificationContext must be used within GamificationProvider");
  return ctx;
}
```

### Step 2: Wrap dashboard in provider

In `src/components/dashboard/dashboard-client.tsx`, wrap the return value with `<GamificationProvider>`.

### Step 3: Update consumers

Replace `useGamification()` calls in dashboard components with `useGamificationContext()`. Start with the highest-mount components (dashboard-client, streak-card, stats-row) and work outward.

For components outside the dashboard tree (top-nav, flashcard, exam), keep the direct `useGamification()` hook — they're in different React subtrees.

**Verify**: `pnpm run typecheck` → exit 0

### Step 4: Verify

**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] `GamificationProvider` wraps the dashboard component tree
- [ ] Dashboard child components use `useGamificationContext()` instead of `useGamification()`
- [ ] Components outside dashboard keep using `useGamification()` directly
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `useGamification` returns a type that can't be provided via context (check return type)
- The context provider causes an infinite re-render loop due to the state object reference

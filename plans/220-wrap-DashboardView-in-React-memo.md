# Plan 220: Wrap DashboardView in React.memo and consolidate boltStreak into context

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: perf

## Why this matters

`DashboardView` is a 407-line component that renders 30+ cards, 15 of which are dynamically imported. It receives `boltStreak` as a prop that changes frequently (daily challenge timer). Every time `boltStreak` changes — even by 1 — the entire DashboardView function body re-executes, forcing React to reconcile all 30+ card components and re-run their hooks. The 15 `dynamic()` imports also trigger their code-split module evaluation even when the cards haven't changed.

Consolidating `boltStreak` into a dedicated context and wrapping `DashboardView` in `React.memo` isolates the re-render to only the `DailyChallengeCard` that actually consumes the value.

## Current state

- `src/components/dashboard/dashboard-view.tsx:181` — `export function DashboardView({ boltStreak, onStartQuiz })` — plain function, no memo
- `src/components/dashboard/dashboard-view.tsx:205` — `boltStreak` passed to `<DailyChallengeCard streak={boltStreak} />` — only one consumer out of 30+ cards
- `src/components/dashboard/dashboard-view.tsx:40-115` — 15 `dynamic()` imports, each evaluated on every render
- `src/components/dashboard/dashboard-content.tsx:14,42` — receives `boltStreak` from parent and passes it as prop
- `src/components/dashboard/dashboard-client.tsx:79` — `boltStreak={currentStreak}` passed from gamification hook

## Target state

- `DashboardView` is `React.memo`-wrapped — only re-renders when `onStartQuiz` changes
- `boltStreak` is provided via a lightweight React context (`BoltStreakProvider` + `useBoltStreak()`)
- `DailyChallengeCard` reads from context directly, not from props
- `DashboardView` no longer takes `boltStreak` prop

## Scope

- `src/components/dashboard/dashboard-view.tsx` — add `React.memo`, remove `boltStreak` prop
- `src/components/dashboard/dashboard-content.tsx` — remove `boltStreak` from interface and passthrough
- `src/components/dashboard/dashboard-client.tsx` — wrap `DashboardContent` subtree in `<BoltStreakProvider>`
- New file: `src/components/dashboard/bolt-streak-context.tsx` — `BoltStreakProvider` + `useBoltStreak` hook
- `src/components/dashboard/daily-challenge-card.tsx` — read `boltStreak` from context instead of props
- `src/components/dashboard/__tests__/dashboard-content.test.tsx` — update test to use provider wrapper

## Steps

### 1. Create bolt-streak context

Create `src/components/dashboard/bolt-streak-context.tsx`:

```tsx
"use client";
import { createContext, useContext } from "react";

const BoltStreakContext = createContext(0);

export function BoltStreakProvider({
  value,
  children,
}: {
  value: number;
  children: React.ReactNode;
}) {
  return <BoltStreakContext.Provider value={value}>{children}</BoltStreakContext.Provider>;
}

export function useBoltStreak() {
  return useContext(BoltStreakContext);
}
```

Minimal — no state, no memoization needed (context value is a primitive number).

### 2. Update DashboardView

- Add `React.memo` wrapper: `export const DashboardView = React.memo(function DashboardView({ onStartQuiz }: { onStartQuiz: (subject: string) => void })`
- Remove `boltStreak` from props interface and destructuring
- Remove the `boltStreak` prop from `<DailyChallengeCard streak={boltStreak} />` — it reads from context now

### 3. Update DailyChallengeCard

In `src/components/dashboard/daily-challenge-card.tsx`:

- Import `useBoltStreak`
- Replace `streak` prop with inner `streak = useBoltStreak()` call
- If the component had its own default or fallback, keep that for standalone usage

### 4. Update DashboardContent

In `src/components/dashboard/dashboard-content.tsx`:

- Remove `boltStreak` from `DashboardContentProps` interface
- Remove the prop from `DashboardView` usage
- Remove `boltStreak` from destructuring

### 5. Update DashboardClient

In `src/components/dashboard/dashboard-client.tsx`:

- Wrap the `<DashboardContent ...>` element with `<BoltStreakProvider value={currentStreak}>`

### 6. Update tests

In `src/components/dashboard/__tests__/dashboard-content.test.tsx`:

- The mock for `DashboardView` no longer receives `boltStreak` — update the mock signature
- Remove `boltStreak` from test props
- If the test checks the streak value, wrap in `<BoltStreakProvider>`

### 7. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

## Stop conditions

- `DailyChallengeCard` shows wrong streak value on dashboard
- Dashboard fails to render with "boltStreak is undefined"
- TypeScript errors in the provider wrapping chain

## Estimated time

2–3 hours

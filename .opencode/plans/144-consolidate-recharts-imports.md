# Plan 144: Consolidate recharts imports — dynamic per-page, single import per chart

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/components/admin/admin-metrics-dashboard.tsx src/app/[locale]/pronunciation/pronunciation-client/history-chart.tsx src/components/ui/charts/`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: perf
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

Two locations statically import recharts (~200KB) into the main bundle, and four chart components use per-component dynamic imports that create 5-8 separate network round-trips instead of one. Static imports: admin-metrics-dashboard and pronunciation history-chart. Per-component dynamic imports: bar-chart, line-chart, radar-chart, and pronunciation-chart-card.

## Current state

**Static imports**:

- `src/components/admin/admin-metrics-dashboard.tsx:4-14` — static `import { LineChart, BarChart, ... } from "recharts"`. Adds ~200KB to admin page JS.
- `src/app/[locale]/pronunciation/pronunciation-client/history-chart.tsx:4-13` — same pattern.

**Per-component dynamic imports** (in `src/components/ui/charts/`):

- `bar-chart.tsx:11-21` — 5 separate `dynamic()` calls for `BarChart`, `CartesianGrid`, `XAxis`, `YAxis`, `Bar`
- `line-chart.tsx:11-23` — 5 separate `dynamic()` calls
- `radar-chart.tsx:7-25` — 7 separate `dynamic()` calls
- `pronunciation-chart-card.tsx:11-22` — 6 separate `dynamic()` calls

## Steps

### Step 1: Fix static imports — admin-metrics-dashboard.tsx

Swap static import to a single dynamic import:

```typescript
import dynamic from "next/dynamic";

const Charts = dynamic(() => import("./admin-charts"), { ssr: false });
```

Extract chart rendering into a separate client component (`admin-charts.tsx`) that statically imports recharts. The dynamic import wraps the entire chart section.

### Step 2: Fix static imports — history-chart.tsx

Same pattern — wrap in `dynamic(() => import(...))` at the consumer level, or use a single dynamic import for recharts.

### Step 3: Fix per-component dynamic imports — chart files

Replace 5-8 per-component dynamic imports with a single dynamic import that destructures all needed components:

```typescript
// Before (5 dynamic imports):
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
// ...

// After (1 dynamic import):
const Recharts = dynamic(() => import("recharts"), { ssr: false });
// Then in render: <Recharts.BarChart>...</Recharts.BarChart>
```

For React components that use these in JSX, you may need to destructure after the dynamic import:

```typescript
const { BarChart, Bar, XAxis, YAxis, CartesianGrid } = await import("recharts");
```

This works inside a `useEffect` + state pattern, or inside the render of a lazy-loaded component.

### Step 4: Verify

`pnpm typecheck` → exit 0. `pnpm exec oxlint` → exit 0. Run `pnpm test` to verify no rendering regressions with the chart components.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` passes
- [ ] `pnpm exec oxlint` exits 0
- [ ] No static `import ... from "recharts"` in admin-metrics-dashboard.tsx or history-chart.tsx
- [ ] Chart files use a single dynamic import per file instead of per-component imports

## STOP conditions

Stop and report if the recharts version or API has changed in a way that breaks the dynamic import pattern.

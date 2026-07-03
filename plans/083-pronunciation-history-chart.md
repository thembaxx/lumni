# Plan 083: Add pronunciation history trend chart to dashboard

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 44169e58..HEAD -- src/components/dashboard/ src/lib/pronunciation-history/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `44169e58`, 2026-07-03

## Why this matters

The pronunciation history system (`src/lib/pronunciation-history/service.ts`) stores scores in Dexie with `overallScore`, `wordAccuracy`, `phonemeAccuracy`, and `fluencyScore` per attempt. The history popup in the pronunciation page (`/pronunciation`) shows a simple stats summary. The ROADMAP.md calls for "improvement charts" — showing score trends over time would help students see their pronunciation progress. Recharts is already in the dependency tree.

## Current state

- `src/lib/pronunciation-history/service.ts` — `getPronunciationStats(userId)` returns scores grouped by date with per-word breakdowns. The service has full CRUD and query support.

- `src/app/[locale]/pronunciation/pronunciation-client.tsx:218-227` — The pronunciation page loads stats on demand via `getPronunciationStats` but only shows a simple stats summary.

- No React component exists that visualises pronunciation trends as a line chart.

- `recharts@3.9.0` is already in `package.json` — used elsewhere in the codebase for analytics charts (see `src/components/dashboard/analytics-tab.tsx` for the existing recharts pattern).

- The dashboard's analytics tab has a recharts `LineChart` pattern you should match. See `src/components/dashboard/analytics-tab.tsx` for the chart component layout.

Relevant conventions:

- New components go in domain subdirectories (e.g. `src/components/dashboard/` is correct for a dashboard card).
- Chart components use `dynamic` import with `ssr: false` to avoid SSR issues — see the pattern in `src/components/dashboard/analytics-tab.tsx`.
- Use `Card`, `CardHeader`, `CardTitle`, `CardContent` from `@/components/ui/card`.
- Use `FadeIn` from `@/components/shared/fade-in` for entrance animation.

## Commands you will need

| Purpose   | Command          | Expected on success |
| --------- | ---------------- | ------------------- |
| Install   | `pnpm install`   | exit 0              |
| Typecheck | `pnpm typecheck` | exit 0, no errors   |
| Tests     | `pnpm test`      | all pass            |
| Lint      | `pnpm lint`      | exit 0              |

## Scope

**In scope** (the only files you should modify):

- `src/components/dashboard/pronunciation-chart-card.tsx` — new: dashboard card with trend chart (create)
- `src/components/dashboard/today-tab.tsx` — register the new card in the today tab
- `src/components/dashboard/__tests__/pronunciation-chart-card.test.tsx` — new: test the card (create)

**Out of scope** (do NOT touch):

- `src/lib/pronunciation-history/service.ts` — no changes needed
- `src/app/[locale]/pronunciation/` — no changes
- `src/components/dashboard/analytics-tab.tsx` — leave analytics tab alone
- Any existing dashboard card test files

## Git workflow

- Branch: `advisor/083-pronunciation-chart`
- Commits: one per step, conventional message style
- Do NOT push or open a PR

## Steps

### Step 1: Create the pronunciation chart card component

Create `src/components/dashboard/pronunciation-chart-card.tsx`:

The component should:

1. Use `useAuth()` to get the current `userId`
2. Load data using `useQuery` with the pronunciation stats service
3. Render a `Card` with:
   - `CardHeader` + `CardTitle` — "Pronunciation Progress"
   - `CardContent` with a recharts `LineChart` showing `overallScore` over time
4. Handle empty state (no pronunciation data yet — show a "Practice pronunciation to see your progress" message)
5. Handle loading state (skeleton while query is pending)
6. Use `recharts` components: `ResponsiveContainer`, `LineChart`, `Line`, `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`

The data shape from `getPronunciationStats(userId)` is roughly:

```ts
{
  totalAttempts: number;
  averageScore: number;
  byDate: {
    date: string;
    score: number;
    attempts: number;
  }
  [];
  recentWords: {
    word: string;
    score: number;
    language: string;
  }
  [];
}
```

Map `byDate` to recharts data points:

```tsx
const chartData = stats.byDate.map((d) => ({
  date: d.date,
  score: d.score,
}));
```

Use `dynamic` import to avoid SSR:

```tsx
import dynamic from "next/dynamic";

const LineChartComponent = dynamic(() => import("@/components/ui/charts/line-chart"), {
  ssr: false,
});
```

Or if the inline pattern from analytics-tab is simpler, use recharts directly inside a `dynamic` component.

**Verify**: `pnpm typecheck` exits 0.

### Step 2: Register the card on the dashboard today tab

In `src/components/dashboard/today-tab.tsx`:

1. Import `PronunciationChartCard` from the new file
2. Add it to the list of rendered cards (after existing cards like `WordOfDayCard`, `StoriesProgressCard`, etc.)

The card should only render when the user has at least one pronunciation attempt (the empty state handles this internally, but you can also gate it behind a flag from the stats query).

Place it after the `WordOfDayCard` and before or after the `StoriesProgressCard`, following the existing layout pattern (`FadeIn` wrapper, consistent spacing).

**Verify**: `pnpm typecheck` exits 0.

### Step 3: Write component tests

Create `src/components/dashboard/__tests__/pronunciation-chart-card.test.tsx` with:

1. **Renders card title**: Verify the "Pronunciation Progress" heading appears
2. **Empty state**: When no data exists, shows the empty state message
3. **Chart renders with data**: When data is provided (mock the query), verifies the chart container renders

Follow the test patterns from `src/components/dashboard/__tests__/bolt-celebration.test.tsx` for mock setup and assertions.

**Verify**: `pnpm test` exits 0.

## Test plan

- New test file: `src/components/dashboard/__tests__/pronunciation-chart-card.test.tsx`
- 3 tests: renders title, empty state, renders chart with data
- All existing tests must still pass

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0 (all tests pass, including the 3 new ones)
- [ ] `pnpm lint` exits 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `getPronunciationStats` returns a different shape than described above, stop and report the actual shape.
- If the today-tab rendering pattern has changed (e.g. migrated to a different card system), stop and report.
- If a step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The chart data resolution is per-day. If users practice multiple times a day, the chart averages. Consider adding per-attempt granularity if users request it.
- The `language` field is stored but not currently used in the chart — future enhancement could filter or color-code by language.
- If pronunciation history storage is migrated from Dexie to Appwrite, the `getPronunciationStats` query may need updating, but the chart component itself stays the same.

# Plan 100: Design spike — business metrics dashboard for admin

> **Executor instructions**: This is a design spike, not a full build. Investigate the existing analytics data and admin surface, then design and prototype the missing business metrics views. Produce working chart components and a data aggregation service, but do not build production-grade retention cohort analysis or funnel computation.
>
> Run every verification command. If anything in "STOP conditions" occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat a8d53ec7..HEAD -- src/app/[locale]/admin/ src/app/api/admin/ src/lib/analytics/ src/lib/observability/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M (design spike: 1 week)
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a8d53ec7`, 2026-07-05

## Why this matters

The admin section has 11 routes (`src/app/[locale]/admin/`: analytics, budget, content, embed-backfill, gamification, notifications, observability, past-papers, quality, questions, users) — all engineering/ops focused. The analytics page (`analytics-client.tsx`) shows 6 aggregate stats (total users, active users, questions, sessions, completion rate, accuracy) but zero business metrics.

Without these, the product team flies blind:

- DAU/MAU trends — is the app growing or shrinking?
- Retention cohorts — do users come back after week 1?
- Conversion funnel — what % of signups complete onboarding, take a quiz, return next week?
- Cost per active user — is the unit economy sustainable?
- Subject popularity — which subjects drive engagement?

The analytics events infrastructure exists (`analyticsEvents` Dexie v27 table via Session 25, `trackSession{Start,End}()`, `trackDayActive()`). What's missing is the aggregation, query, and visualization layer for business stakeholders.

## Current state

**Existing admin analytics** (`src/app/[locale]/admin/analytics/analytics-client.tsx:1-93`):

```typescript
interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  totalQuestions: number;
  totalStudySessions: number;
  totalExamSessions: number;
  monthlySessions: number;
  completionRate: number;
  overallAccuracy: number;
  subjectPopularity: { subject: string; code: string; sessions: number }[];
}
```

The API at `GET /api/admin/analytics` returns these aggregates. No time-series, no cohorts, no funnels.

**Analytics events infrastructure** (`analyticsEvents` Dexie v27 table):

- `trackSessionStart()` / `trackSessionEnd()` — logged in Session 25
- `trackDayActive()` — daily activity ping
- Stored client-side in IndexedDB, accessible via `dexieDataAccess.analyticsEvents`

**Observability** (`src/lib/observability/`):

- AI cost tracking per provider (via `latency-tracker.ts`)
- Error tracking via Sentry (`logError()` → `Sentry.captureException()` in production)
- No business metrics aggregation

**Existing patterns to follow**:

- Admin pages use `PageHeader` and `Card` from `@/components/ui/`
- Charts use recharts 3 (already in deps at `^3.9.0`) — see `admin/quality/` for a chart example
- API routes use `createRouteHandler` from `@/lib/api/create-route-handler`
- Recharts component pattern: use `dynamic` import with `ssr: false` for chart components, see `src/app/[locale]/admin/quality/page.tsx` for the pattern

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `pnpm install`       | exit 0              |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope** (produce designs and working prototypes for):

- **DAU/MAU time-series chart** — daily + rolling 28-day active users
- **Retention cohort view** — weekly retention curves (week 0, 1, 2, 4, 8)
- **Conversion funnel** — anonymous → signup → onboarding complete → first quiz → week-2 return
- **Cost-per-user dashboard** — AI provider costs (from `observability/`) divided by active users
- **Subject popularity ranking** — sorted bar chart of quiz/exam sessions per subject

**Out of scope** (do NOT build in this spike):

- Revenue metrics (see plan 098 — school licensing)
- Server-side aggregation pipeline (use client-side Dexie queries where possible; document what needs a server-side batch job)
- Push notification for metric thresholds
- Export to CSV/PDF
- School-level analytics (emerges from plan 098 + 099)

## Steps

### Step 1: Map available data sources

Read and document what business metrics are derivable from existing data:

- `dexieDataAccess.analyticsEvents` — session starts/ends, daily activity
- `dexieDataAccess.competencies` — per-topic scores
- `dexieDataAccess.quizAttempts` — quiz completion events
- `dexieDataAccess.examSessions` — exam session data
- `dexieDataAccess.gamification` — streak data
- `src/lib/observability/` — AI cost tracking, latency

Create a data source map at `docs/superpowers/2026-07-05-business-metrics-data-sources.md`.

**Verify**: File exists and is accurate.

### Step 2: Design the API surface

Design endpoints for business metrics. These endpoints aggregate from Dexie (client-side data) or Appwrite (server-side data):

| Endpoint                               | What it returns                              | Data source                       |
| -------------------------------------- | -------------------------------------------- | --------------------------------- |
| `GET /api/admin/metrics/dau`           | Daily active users (last 90 days)            | analyticsEvents                   |
| `GET /api/admin/metrics/mau`           | Rolling 28-day active users (last 12 months) | analyticsEvents                   |
| `GET /api/admin/metrics/retention`     | Weekly cohort retention table                | analyticsEvents + user createdAt  |
| `GET /api/admin/metrics/funnel`        | Conversion stage counts                      | analyticsEvents + onboarding data |
| `GET /api/admin/metrics/cost-per-user` | AI cost ÷ active users per day               | observability + analyticsEvents   |

For endpoints that aggregate from Dexie, the API handler queries the client-side data via a background aggregation job stored in Appwrite. For this spike, compute metrics from Dexie directly on the server side using `dexieDataAccess` — document when this becomes too slow for production.

**Create prototype**: `src/app/api/admin/metrics/dau/route.ts` — returns daily active user counts for the last 90 days.

**Verify**: `pnpm run typecheck` exits 0. `curl http://localhost:3000/api/admin/metrics/dau` returns a time-series array.

### Step 3: Create chart components

Create reusable business chart components in `src/components/admin/charts/`:

- `dau-chart.tsx` — recharts `LineChart` showing daily active users with 7-day moving average overlay
- `retention-cohort-chart.tsx` — recharts heatmap-style chart (or table, if heatmap is complex) showing weekly retention per cohort
- `funnel-chart.tsx` — recharts horizontal bar chart showing conversion funnel stages
- `subject-popularity-chart.tsx` — recharts `BarChart` showing sessions per subject, sorted descending
- `cost-per-user-chart.tsx` — dual-axis chart (cost bars + DAU line)

Follow the existing recharts pattern from `src/app/[locale]/admin/quality/page.tsx`: use `dynamic(() => import(...), { ssr: false })` for each chart component.

**Verify**: `pnpm run typecheck` exits 0. Each chart component renders in isolation without errors.

### Step 4: Build the metrics dashboard page

Create `src/app/[locale]/admin/metrics/page.tsx` and `src/app/[locale]/admin/metrics/metrics-client.tsx` — a new admin section (add to admin sidebar in `src/app/[locale]/admin/admin-page-client.tsx`).

Layout:

- Top row: 4 stat cards (DAU, MAU, Cost/User, Stickiness = DAU/MAU)
- Second row: DAU chart (full width)
- Third row: two columns — retention cohort (left), subject popularity (right)
- Bottom row: funnel chart (full width)

Use `PageHeader` with title "Business Metrics" and subtitle "Platform health & growth".
Use `Card` components for each chart section. Charts should be responsive and default to the last 30 days with a date range selector.

**Verify**: `pnpm run dev` renders the page without errors. Charts display mock data (real data if available).

## Deliverables

- [ ] `docs/superpowers/2026-07-05-business-metrics-data-sources.md` — data source audit
- [ ] `src/app/api/admin/metrics/dau/route.ts` — working DAU endpoint
- [ ] `src/components/admin/charts/` — 5 chart components
- [ ] `src/app/[locale]/admin/metrics/` — new admin page with all charts

## Done criteria

ALL must hold:

- [ ] All 5 chart components compile without errors
- [ ] The metrics admin page renders at `/admin/metrics` showing data (mock or real)
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] No pre-existing test failures (`pnpm run test`)

## STOP conditions

Stop and report back if:

- Dexie `analyticsEvents` table has too few events to produce meaningful metrics (common for new dev environments — check if data exists first)
- A chart component requires a recharts version not yet in the deps (check `package.json` for `recharts: 3.9.0`)
- The admin sidebar navigation pattern is unclear (check `src/app/[locale]/admin/admin-page-client.tsx` for how admin sections are added)
- Server-side Dexie queries are slow (>500ms for a 90-day DAU query) — this may require an Appwrite-based aggregation approach instead

## Maintenance notes

- Metrics accuracy depends on `analyticsEvents` being populated. If onboarding or active-tracking events are missed, DAU/MAU will be undercounted. Verify the event emission in `src/lib/analytics/` before relying on the dashboard.
- The cost-per-user metric depends on AI cost tracking in `src/lib/observability/`. Verify that `estimateCost` in `latency-tracker.ts` covers all three providers in the cascade chain.
- When school licensing (plan 098) launches, add a "Schools" section to this dashboard showing licensed school count, seat utilization, trial conversion rate.

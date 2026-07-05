# Plan 101: Design spike — A/B testing & feature flag framework

> **Executor instructions**: This is a design spike, not a full build. Investigate the existing infrastructure and design a lightweight feature flag and experiment framework that fits the codebase's patterns. Produce a working prototype of the core flag resolution and a single experiment, but do not build the full stats engine or admin experiment management UI.
>
> Run every verification command. If anything in "STOP conditions" occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat a8d53ec7..HEAD -- src/lib/ src/hooks/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M (design spike: 1 week)
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a8d53ec7`, 2026-07-05

## Why this matters

The codebase has zero feature flags and zero experiment infrastructure. `grep -rn "experiment\|feature.flag\|a.b.test\|split.test" src/lib/ --include "*.ts"` returns only a phoneme array and a dictionary word — no framework, no stats engine, no configuration.

This means every feature launch is an all-or-nothing bet:

- The swipeable flashcard deck replaced the tap-based UI — was retention measured? No way to know.
- The daily bolt flow was simplified — did completion rate improve? No A/B test was run.
- The personalized feed was shipped — does it actually increase quiz starts? No experiment was configured.

For a product shipping as frequently as Lumni, the inability to measure impact means product decisions are guesses. A lightweight feature flag system would enable gradual rollouts, kill switches, and measurable experiments — without the overhead of enterprise platforms like LaunchDarkly.

## Current state

**No existing experiment infrastructure**: Zero imports of any feature-flag library, no experiment configuration files, no stats utilities.

**Existing patterns to follow**:

- The project uses Zustand 5 for client state (`^5.0.14`) and TanStack Query 5 for server state (`^5.101.1`) — the flag system should integrate with both
- Context providers follow the pattern in `src/components/shared/immersive-mode.tsx` (React context + hook)
- The project has a shared utility barrel at `src/lib/shared/` — a `flags.ts` or `experiments.ts` there would be consistent
- Dexie is used for all persistence — experiment assignments could be cached in IndexedDB
- `src/lib/query-client.ts` — has `staleTime: 60 * 1000` default. Feature flag queries should match the long staleTime tier (`1000 * 60 * 60` / 60min)

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `pnpm install`       | exit 0              |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope** (produce designs and working prototype for):

- **Feature flag definitions** — typed flag config with code-level defaults
- **Flag resolution** — deterministic flag assignment per user (hash-based bucketing), server-side (API) + client-side (hook)
- **A/B experiment framework** — ability to run a 50/50 experiment on a flag, with user assignment sticky per experiment
- **Admin toggle** — simple admin UI to flip flags and check experiment status
- **Single exemplar experiment**: wrap one existing feature (e.g., the daily bolt celebration flow) behind a flag with two variants

**Out of scope** (do NOT build in this spike):

- Stats engine (p-value computation, significance testing) — document the gap and recommend a library
- Full admin experiment management UI (schedule, audience targeting, results chart)
- Multi-variant experiments (A/B/C/D) — A/B only
- Server-side flag evaluation SDK for Edge/Serverless

## Steps

### Step 1: Define the flag and experiment types

Create `src/lib/shared/flags/types.ts`:

```typescript
export interface FlagDefinition {
  key: string;
  description: string;
  defaultEnabled: boolean;
  /** If true, this flag gates an A/B experiment */
  isExperiment?: boolean;
  /** Bucketing namespace — changed when experiment restarts */
  bucketKey?: string;
  /** Allocation ratio for experiment variant (0.0–1.0) */
  experimentRatio?: number;
}

export interface FlagOverride {
  key: string;
  enabled: boolean;
  /** Optional user-level override */
  userId?: string;
  /** Optional percentage rollout (0-100) — applied via hash */
  rolloutPercentage?: number;
}
```

Design a typed registry of all feature flags. Start with 2-3:

- `daily-bolt-v2` — experiment flag for the simplified bolt celebration
- `swipeable-flashcards` — kill switch (default on, can disable globally)
- `personalized-feed` — gradual rollout flag

**Verify**: `pnpm run typecheck` exits 0.

### Step 2: Build flag resolution

Create `src/lib/shared/flags/resolver.ts`:

```typescript
export function isFlagEnabled(
  flagKey: string,
  userId?: string,
  overrides?: FlagOverride[],
  flags?: Record<string, FlagDefinition>,
): boolean;
```

Resolution order:

1. Check explicit override for this userId — return override value
2. Check global override for this flag key — return override value
3. If flag is an experiment, compute deterministic bucket from `userId + bucketKey` — return `bucketValue < experimentRatio`
4. Check `rolloutPercentage` — hash userId, compare to percentage
5. Return defaultEnabled

Use a fast, deterministic hash (FNV-1a or similar — do NOT import a heavy crypto lib; implement a 5-line hash function).

Create `src/hooks/use-feature-flag.ts`:

```typescript
export function useFeatureFlag(flagKey: string): { enabled: boolean; isLoading: boolean };
```

Reads overrides from `GET /api/admin/flags` (cached, long staleTime), resolves against defaults. Falls back to code defaults if the API is unavailable (offline-resilient).

**Verify**: `pnpm run typecheck` exits 0. Write a unit test in `src/lib/shared/flags/__tests__/resolver.test.ts` — confirm deterministic bucketing, override precedence, and offline fallback.

### Step 3: Create the admin flags API and UI

**API**:

- `GET /api/admin/flags` — returns all flag definitions + current override state (from Dexie or a JSON config)
- `POST /api/admin/flags` — update override for a flag (body: `{ key, enabled, rolloutPercentage?, userId? }`)
- `DELETE /api/admin/flags` — remove override (reset to default)

**Admin UI**: Add a "Flags" section to the admin sidebar (`src/app/[locale]/admin/admin-page-client.tsx`). Create `src/app/[locale]/admin/flags/` with a simple page showing all flags as toggle cards:

- Flag name, description, current status (ON/OFF), experiment indicator
- Toggle switch for global override
- Rollout percentage slider for gradual rollout
- "Force enable for my user" button (sets per-user override for testing)

**Verify**: `pnpm run typecheck` exits 0. Toggle a flag in the admin UI, confirm it changes the resolution for API consumers.

### Step 4: Wire a real experiment

Choose the daily bolt celebration flow (`src/components/dashboard/daily-bolt-overlay.tsx` or related files) as the exemplar. Create a flag `daily-bolt-v2` with:

- Control (variant A): current celebration flow (the simplified one from Session 32)
- Treatment (variant B): restored two-step `answered→branching` flow with the `BoltBranch` component (may need to re-introduce from git history — use `git log --all --oneline -- src/components/dashboard/bolt-branch.tsx` to find it)

Wrap the choice in `useFeatureFlag("daily-bolt-v2")`. If enabled, use variant B.

**Verify**: With flag OFF, celebration flow is unchanged. With flag ON (and user bucketed into treatment), the alternative flow renders. `pnpm run typecheck` exits 0.

## Deliverables

- [ ] `src/lib/shared/flags/types.ts` — flag definition types
- [ ] `src/lib/shared/flags/resolver.ts` — flag resolution with deterministic bucketing
- [ ] `src/hooks/use-feature-flag.ts` — React hook
- [ ] `src/lib/shared/flags/__tests__/resolver.test.ts` — unit tests for resolution
- [ ] `src/app/api/admin/flags/route.ts` — flags API
- [ ] `src/app/[locale]/admin/flags/` — admin flags page
- [ ] Wired experiment on `daily-bolt-v2` flag
- [ ] `docs/superpowers/2026-07-05-ab-testing-framework.md` — framework documentation

## Done criteria

ALL must hold:

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` passes, including the new resolver tests
- [ ] `pnpm exec oxlint` exits 0
- [ ] Flag resolution is deterministic: same userId + same flagKey + same bucketKey = same result every time (verify in test)
- [ ] Toggling a flag in admin UI changes the behavior for API consumers
- [ ] The daily-bolt-v2 experiment switches between two celebration flows based on flag state

## STOP conditions

Stop and report back if:

- The `daily-bolt-v2` experiment requires re-introducing deleted components (`BoltBranch`) that don't exist in recent git history
- Deterministic bucketing needs a crypto library not already in deps (do NOT add one — implement a lightweight hash)
- The admin flags page doesn't follow a consistent pattern (check `src/app/[locale]/admin/admin-page-client.tsx` for navigation patterns)

## Maintenance notes

- This framework is deliberately lightweight. When the number of flags exceeds ~20, consider migrating to a dedicated service (LaunchDarkly, GrowthBook, or a custom Appwrite-backed solution).
- The stats engine gap (p-value, significance, sample size) is critical for rigorous experimentation. When this becomes blocking, evaluate `@growthbook/growthbook` (GrowthBook) as a drop-in — its SDK integrates with the same bucketing approach.
- Experiment results tracking is not in scope for this spike. Plan 100's analytics infrastructure should capture experiment exposure and outcome events.

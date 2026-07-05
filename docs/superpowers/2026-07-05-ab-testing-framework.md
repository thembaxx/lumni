# A/B Testing Framework

## Data Model

### ExperimentConfig
- `id`: string
- `name`: string
- `description`: string
- `variants`: array of `{ id, name, traffic }` (traffic = percentage, sum must be 100)
- `startDate?`, `endDate?`: optional date range
- `status`: `"draft" | "running" | "paused" | "completed"`

### ExperimentAssignment
- `userId`: string
- `experimentId`: string
- `variantId`: string
- `assignedAt`: ISO timestamp

### FeatureFlag
- `flagKey`: string
- `experimentId`: string
- `variantMap`: `{ [variantId]: boolean }`

## Architecture

```
config.ts (hardcoded registry)
    |
    v
bucketing.ts (deterministic djb2 hash)
    |
    v
POST /api/experiment/evaluate (server-side eval)
    |
    v
useExperiment() hook (client-side with Dexie cache)
```

## Bucketing Algorithm

Uses djb2 hash of `userId + ":" + experimentId`, modulo 100, compared against cumulative traffic thresholds.

```ts
assignUser(userId, experiment) → variantId
```

This guarantees the same user always sees the same variant for a given experiment.

## Flag Evaluation Flow

1. Hook checks Dexie `experimentAssignments` table for cached assignment
2. If missing, calls `POST /api/experiment/evaluate`
3. Server calls `evaluateFlag()` which looks up the experiment config, calls `assignUser()`, and returns `{ variantId, flagValue }`
4. Assignment is persisted to Dexie

## Persistence

- Dexie v44: `experimentAssignments` table with compound index `[userId+experimentId]`
- 24h TTL is handled implicitly — once assigned, user stays in that variant for the experiment's lifetime

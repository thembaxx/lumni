# Plan 006: Outbound webhooks

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat c91fa0d4..HEAD -- src/lib/webhooks/ src/app/api/webhooks/ src/components/admin/ src/lib/services/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `c91fa0d4`, 2026-07-10
- **Issue**: (none)

## Why this matters

The app has a rich internal event system — quiz completions, achievement unlocks, sync events, study session starts/ends. But there is zero outbound webhook infrastructure. No way for external systems (school LMS, parent dashboards, analytics pipelines) to receive events. The `PushDeliveryService` at `src/lib/services/push-delivery.ts` shows the dispatch pattern is understood (web-push notifications), but it only sends to browser push subscribers. Outbound webhooks would unlock school LMS integration, parent notification apps, and custom analytics pipelines.

## Current state

- `PushDeliveryService` at `src/lib/services/push-delivery.ts` — sends web-push notifications to browser subscribers. Pattern: `sendToUser(userId, payload)`. Lazy VAPID init. Used by digest and submission services.
- `src/lib/observability/events.ts` — defines `EventType` enum (QUIZ_COMPLETED, ACHIEVEMENT_UNLOCKED, etc.), but no `trackEvent()` function and no call sites. This could be the event source for webhook dispatch.
- No webhook registry exists (no DB table/collection for storing webhook endpoints)
- No outbound webhook dispatch infrastructure
- `src/lib/db/schema.ts` — no webhook-related Dexie tables
- `COLLECTIONS` in `src/lib/db/constants.ts` — no Appwrite webhook collection
- `src/lib/services/push-delivery.ts` — existing dispatch pattern to follow for the webhook sender

The repo conventions: new lib modules go in `src/lib/`, services in `src/lib/services/`, admin UI in `src/app/[locale]/admin/`, API routes in `src/app/api/`. Use `createRouteHandler` for API routes. Dexie schema versions increment — check the current version in `src/lib/db/schema.ts` (v41).

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Install   | `pnpm install`            | exit 0              |
| Typecheck | `pnpm run typecheck`      | exit 0              |
| Tests     | `pnpm run test -- --run`  | all pass            |
| Lint      | `pnpm exec oxlint --fix`  | exit 0              |
| Format    | `pnpm exec oxfmt --check` | clean               |

## Scope

**In scope**:

- `src/lib/webhooks/types.ts` — `WebhookEndpoint`, `WebhookEvent`, `WebhookDelivery` types
- `src/lib/webhooks/registry.ts` — Dexie-backed webhook endpoint registry (CRUD for endpoints)
- `src/lib/webhooks/dispatcher.ts` — `dispatchWebhook(event)` function: looks up matching endpoints, POSTs payload, records delivery
- `src/lib/webhooks/retry.ts` — exponential backoff retry for failed deliveries (3 retries: 10s, 60s, 300s)
- `src/lib/db/schema.ts` — new Dexie table `webhookEndpoints` + `webhookDeliveries`
- `src/app/api/webhooks/endpoints/route.ts` — CRUD API for managing webhook endpoints
- `src/components/admin/webhook-manager.tsx` — admin UI for creating/managing webhook endpoints
- `src/lib/observability/events.ts` — wire into webhook dispatch (call `dispatchWebhook()` after event recording)

**Out of scope**:

- Do NOT add webhook-triggering to all 20+ event types — wire QUIZ_COMPLETED and ACHIEVEMENT_UNLOCKED only, as a proof of concept
- Do NOT build a webhook testing UI (send-test-event button) — just the admin CRUD
- Do NOT add secret signing (HMAC) in this plan — add a note in maintenance notes as a follow-up
- Do NOT modify existing API routes to emit webhook events — use the observability event system as the source

## Git workflow

- Branch: `advisor/006-webhooks`
- Commit per step
- Message style: conventional commits — `feat(webhooks): add endpoint registry and dispatch`

## Steps

### Step 1: Define webhook types

Create `src/lib/webhooks/types.ts`:

```typescript
export interface WebhookEndpoint {
  id: string;
  url: string;
  description?: string;
  events: string[]; // Event types to subscribe to (e.g. ["quiz.completed", "achievement.unlocked"])
  secret?: string; // Optional HMAC secret (placeholder — not implemented in this plan)
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WebhookDelivery {
  id?: number;
  endpointId: string;
  event: string;
  payload: string; // Serialized JSON
  status: "success" | "failed" | "retrying";
  statusCode?: number;
  attempts: number;
  nextRetryAt?: number;
  createdAt: number;
  completedAt?: number;
}

export type WebhookEventType =
  | "quiz.completed"
  | "achievement.unlocked"
  | "study-session.started"
  | "study-session.ended"
  | "sync.completed";
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Add Dexie tables

In `src/lib/db/schema.ts`, increment the schema version (from v41 to v42) and add:

```typescript
webhookEndpoints: "id, url, enabled",
webhookDeliveries: "++id, endpointId, event, status, createdAt",
```

Add the corresponding table exports to the `DataAccess` interface in `src/lib/db/data-access.ts` (add `WebhookDataAccess` sub-interface with `webhookEndpoints` and `webhookDeliveries`), and implement them in `DexieDataAccess` and `InMemoryDataAccess`.

**Verify**: `pnpm run typecheck` → exit 0. `pnpm run test -- --run` → schema tests pass.

### Step 3: Create the endpoint registry

Create `src/lib/webhooks/registry.ts`:

```typescript
import { dexieDataAccess } from "@/lib/db";
import type { WebhookEndpoint } from "./types";

export async function getEndpoints(eventType: string): Promise<WebhookEndpoint[]> {
  const all = await dexieDataAccess.webhookEndpoints.toArray();
  return all.filter((ep) => ep.enabled && ep.events.includes(eventType));
}

export async function createEndpoint(
  endpoint: Omit<WebhookEndpoint, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const now = Date.now();
  const id = crypto.randomUUID();
  await dexieDataAccess.webhookEndpoints.put({
    ...endpoint,
    id,
    createdAt: now,
    updatedAt: now,
  } satisfies WebhookEndpoint);
  return id;
}

export async function deleteEndpoint(id: string): Promise<void> {
  await dexieDataAccess.webhookEndpoints.delete(id);
}

export async function listEndpoints(): Promise<WebhookEndpoint[]> {
  return dexieDataAccess.webhookEndpoints.toArray();
}
```

Follow the repo's DI pattern — export a factory that accepts `db` so tests can use `InMemoryDataAccess`.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Create the webhook dispatcher

Create `src/lib/webhooks/dispatcher.ts`:

```typescript
import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";
import { getEndpoints } from "./registry";
import type { WebhookDelivery } from "./types";

export async function dispatchWebhook(
  event: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const endpoints = await getEndpoints(event);
  if (endpoints.length === 0) return;

  const payloadStr = JSON.stringify(payload);

  for (const endpoint of endpoints) {
    const delivery: Omit<WebhookDelivery, "id"> = {
      endpointId: endpoint.id,
      event,
      payload: payloadStr,
      status: "retrying",
      attempts: 0,
      createdAt: Date.now(),
    };

    const id = await dexieDataAccess.webhookDeliveries.add(delivery);
    await attemptDelivery(id, endpoint.url, payloadStr);
  }
}

async function attemptDelivery(
  deliveryId: number,
  url: string,
  payload: string,
  retriesLeft = 3,
): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    await dexieDataAccess.webhookDeliveries.update(deliveryId, {
      status: response.ok ? "success" : "failed",
      statusCode: response.status,
      attempts: 4 - retriesLeft,
      completedAt: Date.now(),
    });
  } catch (err) {
    if (retriesLeft > 0) {
      const backoff = [10_000, 60_000, 300_000][3 - retriesLeft];
      setTimeout(() => attemptDelivery(deliveryId, url, payload, retriesLeft - 1), backoff);
      await dexieDataAccess.webhookDeliveries.update(deliveryId, {
        status: "retrying",
        attempts: 4 - retriesLeft,
        nextRetryAt: Date.now() + backoff,
      });
    } else {
      await dexieDataAccess.webhookDeliveries.update(deliveryId, {
        status: "failed",
        attempts: 3,
        completedAt: Date.now(),
      });
    }
    logError("Webhook.delivery", err);
  }
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 5: Create the CRUD API route

Create `src/app/api/webhooks/endpoints/route.ts` using `createRouteHandler`:

- `GET` — list all endpoints (admin only)
- `POST` — create a new endpoint (admin only, Zod-validated body with `url`, `events`, `description`)
- `DELETE` — delete an endpoint by ID (admin only)

Follow the auth pattern from `src/app/api/admin/exams/route.ts` — require admin auth.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 6: Create the admin webhook manager UI

Create `src/components/admin/webhook-manager.tsx`:

- Shows a list of configured webhook endpoints with URL, events subscribed, enabled/disabled status
- "Add endpoint" form: URL input, event type multi-select checkboxes, optional description
- Delete button per endpoint (with confirmation)
- Follows the admin dashboard patterns from `src/components/admin/question-ratings-dashboard.tsx`

**Verify**: `pnpm run typecheck` → exit 0.

### Step 7: Wire webhook dispatch into events

In `src/lib/observability/events.ts`, after recording an event, call `dispatchWebhook()`:

```typescript
import { dispatchWebhook } from "@/lib/webhooks/dispatcher";

export async function trackEvent(eventType: string, payload: Record<string, unknown>) {
  // ... existing event recording logic ...

  // Fire-and-forget webhook dispatch
  dispatchWebhook(eventType, payload).catch(() => {});
}
```

This is fire-and-forget — webhook delivery failures are recorded in Dexie but not surfaced to the user.

**Verify**: `pnpm run typecheck` → exit 0.

## Test plan

- Create `src/lib/webhooks/__tests__/registry.test.ts` — test `createEndpoint`, `listEndpoints`, `getEndpoints` filtering by event type. Use `InMemoryDataAccess` with seeded data. Follow the pattern from `src/lib/services/__tests__/re-engagement-service.test.ts`.
- Create `src/lib/webhooks/__tests__/dispatcher.test.ts` — test `dispatchWebhook` with mock fetch (use `vi.fn()`). Verify delivery records are created with correct status.
- Create `src/app/api/webhooks/endpoints/__tests__/route.test.ts` — test POST/GET/DELETE with mock auth. Follow the pattern from `src/app/api/exam-papers/classify/__tests__/route.test.ts`.

**Verify**: `pnpm run test -- --run` → all tests pass, including new ones.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run` exits 0; new tests exist
- [ ] Webhook endpoints can be created, listed, and deleted via API
- [ ] `dispatchWebhook()` sends POST to matching endpoints with event payload
- [ ] Failed deliveries retry with exponential backoff (10s, 60s, 300s)
- [ ] Admin UI at `/admin/webhooks` shows endpoint list and add/delete controls
- [ ] At least 2 event types (quiz.completed, achievement.unlocked) trigger webhooks
- [ ] Dexie schema at v42 with `webhookEndpoints` and `webhookDeliveries` tables
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The current Dexie schema version isn't v41 (read `src/lib/db/schema.ts` — the version number at the top of the file)
- Dexie schema migration from v41→v42 conflicts with an existing v42 (check for any v42 increment already in progress on a branch)
- `src/lib/observability/events.ts` is truly dead code (exported but never called) — if so, wire `dispatchWebhook` into the actual call sites instead (find where quiz completions are recorded)

## Maintenance notes

- HMAC signing should be added before production use — each endpoint's `secret` field is already in the type as a placeholder.
- The retry backoff uses `setTimeout` — for production, replace with a persistent job queue so retries survive page refreshes.
- When adding new event types, add them to the `WebhookEventType` union and the admin UI's event selectors.
- The `DataAccess` sub-interface `WebhookDataAccess` should be added to the composite `DataAccess` interface in `src/lib/db/data-access.ts` — don't forget the barrel export at `src/lib/db/index.ts`.

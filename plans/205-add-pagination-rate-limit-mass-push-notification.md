# Plan 205: Add pagination and rate limiting to mass push notification endpoint

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: 204 (rate-limit enablement)
- **Category**: security
- **Generated at**: 2026-07-17

## Why this matters

The admin mass push notification endpoint at `src/app/api/admin/notifications/send/route.ts` fetches ALL push subscriptions from the database with no pagination, limit, or rate limiting. If the user base grows to thousands of push subscribers, an unbounded query could cause a memory or timeout failure. Additionally, without rate limiting, a single admin click (or a buggy retry) could send thousands of push notifications in seconds, exhausting the push service quota (Firebase/Web Push has rate limits) and potentially spamming all users.

## Current state

`src/app/api/admin/notifications/send/route.ts:21-65`:

```typescript
const subscriptions = await databases.listDocuments(
  DATABASE_ID,
  PUSH_SUBSCRIPTIONS_COLLECTION_ID,
  // No limit, no offset, no pagination
);
// Sends push to ALL subscriptions at once
```

No `useRateLimit`, no pagination, no batch processing, no confirmation step.

## Target state

- Subscriptions are fetched in chunks of 500
- Route has `useRateLimit: true` with a tight cap (3 requests per minute)
- Admin UI has a confirmation dialog before sending
- Each chunk is sent with error handling so one bad subscription doesn't abort the batch

## Scope

- `src/app/api/admin/notifications/send/route.ts` — add pagination, rate limiting, chunked sending

**Out of scope**:

- The admin UI confirmation dialog (frontend work, separate plan)
- The push delivery implementation itself (already in `push-delivery.ts`)

## Steps

### 1. Read the route file

Read `src/app/api/admin/notifications/send/route.ts` to understand its current structure, DB schema, and push delivery pattern.

### 2. Add paginated subscription fetching

Replace the unbounded `listDocuments` call with a paginated loop:

```typescript
const allSubscriptions = [];
let cursor: string | undefined;
do {
  const queries = [Query.limit(500)];
  if (cursor) queries.push(Query.cursorAfter(cursor));
  const page = await databases.listDocuments(
    DATABASE_ID,
    PUSH_SUBSCRIPTIONS_COLLECTION_ID,
    queries,
  );
  allSubscriptions.push(...page.documents);
  cursor =
    page.documents.length === 500 ? page.documents[page.documents.length - 1].$id : undefined;
} while (cursor);
```

### 3. Add chunked sending with error isolation

Send notifications in batches of 50 with `Promise.allSettled` so a single invalid subscription doesn't abort the batch:

```typescript
for (let i = 0; i < subscriptions.length; i += 50) {
  const chunk = subscriptions.slice(i, i + 50);
  const results = await Promise.allSettled(
    chunk.map((sub) => sendPushNotification(sub, title, body, data)),
  );
  // Log failures but don't stop
  results.forEach((r, idx) => {
    if (r.status === "rejected") {
      logError(`Push send failed for subscription ${i + idx}`, { error: r.reason });
    }
  });
}
```

### 4. Add rate limiting

Add `useRateLimit: true` to the route handler config with a tight cap of 3 requests per minute (mass push should be rare and deliberate).

### 5. Add secondary confirmation check

Add a check that requires a `confirmed: true` field in the request body to prevent accidental sends:

```typescript
const { confirmed, title, body } = await req.json();
if (!confirmed) {
  return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
}
```

### 6. Verify

```bash
pnpm run typecheck
pnpm exec oxlint --fix
pnpm run test
```

## Stop conditions

- If the `PUSH_SUBSCRIPTIONS_COLLECTION_ID` collection has fewer than 500 records today and no growth expected — pagination can be deferred but still added for correctness.
- If the push delivery already handles chunking internally — stop and report; only add pagination and rate limit.

## Estimated time

1–1.5 hours

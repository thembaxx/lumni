# Admin Business Metrics — Data Model

**Date**: 2026-07-05
**Status**: Design spike
**Planned at**: commit `a8d53ec7`

## Data Source

### Primary: `analyticsEvents` (Dexie v27, client-side IndexedDB)

Table is defined in `src/lib/db/schema.ts`:

```typescript
interface AnalyticsEvent {
  id?: number;
  eventType: "session_start" | "session_end" | "day_active" | "week_active";
  userId: string;
  sessionId?: string;
  metadata?: string; // JSON stringified
  timestamp: number;
}
```

Dexie indexes: `++id, eventType, userId, timestamp`

### Ingestion callsites

- `trackSessionStart(userId, sessionId)`: called from quiz/exam start flows
- `trackSessionEnd(userId, sessionId)`: called from quiz/exam complete flows
- `trackDayActive(userId)`: called once per user per day (deduplicated per calendar day)
- `trackSessionStart` and `trackDayActive` each emit `{ eventType, userId, timestamp }`

All ingestion is in `src/lib/observability/events.ts`. The module accepts DI via `__setDepsForTesting`.

### Limitation: client-side only

`analyticsEvents` lives in Dexie (IndexedDB), which is browser-only. Server-side API routes cannot query it directly. Two paths forward:

1. **Sync pipeline** (`src/lib/sync/` exists, Phase A shipped in Session 50): Extend the sync layer to push analytics events to Appwrite, then query Appwrite server-side.
2. **Client-side admin queries**: Have the admin page query Dexie directly on the client and render results without a server roundtrip.

**Design choice for prototype**: API routes serve as the contract specification. Actual data resolution happens either client-side (Dexie direct) or via sync-to-Appwrite for server-side access.

## Query Patterns

### DAU (Daily Active Users)

```
eventType in ["session_start", "day_active"]
  AND timestamp >= 30 days ago
→ group by day, count distinct userId
```

### MAU (Monthly Active Users)

```
eventType in ["session_start", "day_active"]
  AND timestamp >= 12 months ago
→ group by month, count distinct userId
```

### Sticky Ratio

```
DAU / MAU for current period
```

### Weekly Retention Cohorts

```
For each week N (starting weekly):
  Users who had session_start in week N
  For weeks N+1 through N+4:
    Count who had ANY event in that week
→ week-0: 100% (definitional)
```

### Live Users

```
eventType = "session_start"
  AND timestamp >= 15 minutes ago
→ count distinct userId
```

### Subject Usage

```
eventType in ["session_start", "session_end"]
  AND timestamp >= current month
→ group by subject (from metadata), count sessions
```

**Note**: Subject metadata is currently stored as `metadata?.subject` on session events. The `session_start` event stores `{ subject?: string }` in its metadata field. Subject usage requires parsing the JSON `metadata` string.

## Aggregation Strategy

For the MVP prototype:

| Metric        | Window         | Granularity    | Aggregation                         |
| ------------- | -------------- | -------------- | ----------------------------------- |
| DAU           | trailing 30d   | daily          | distinct userId per day             |
| MAU           | trailing 12mo  | monthly        | distinct userId per month           |
| Stickiness    | current        | point          | DAU/MAU                             |
| Retention     | rolling 4wk    | weekly cohorts | % retained per week                 |
| Live users    | trailing 15min | point          | distinct session count              |
| Subject usage | current month  | per subject    | session count with subject metadata |

## Future Considerations

- Once sync pipeline is active, move all queries to Appwrite for cross-device accuracy
- Add `$metadata { subject, topic }` standardization to all session events
- Consider pre-aggregated daily snapshots (materialised view) for sub-second dashboard loads
- DAU queries can be heavy if `analyticsEvents` grows unbounded — add Dexie TTL pruning

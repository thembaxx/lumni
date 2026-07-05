# Admin Business Metrics — API Specification

**Date**: 2026-07-05
**Status**: Design spike
**Planned at**: commit `a8d53ec7`

## Overview

4 read-only API endpoints under `/api/admin/metrics/`. All use `createRouteHandler` with `auth: "admin"` mode. All return JSON responses.

Common pattern:

```typescript
import { createRouteHandler } from "@/lib/api/create-route-handler";

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "Metrics[Name]",
  execute: async () => {
    // ...
  },
});
```

---

## 1. DAU/MAU

**`GET /api/admin/metrics/dau-mau`**

### Response

```typescript
{
  daily: { date: string; dau: number }[];       // trailing 30 days
  monthly: { month: string; mau: number }[];    // trailing 12 months
  stickiness: number;                            // DAU/MAU ratio (0–1)
}
```

### Query

```
analyticsEvents
  .where("eventType")
  .anyOf(["session_start", "day_active"])
  .filter(e => e.timestamp >= 30d ago)
  .toArray()
```

Group results by `YYYY-MM-DD` (daily) and `YYYY-MM` (monthly), counting distinct `userId`.

### Errors

- 401: Unauthenticated
- 403: Not an admin

---

## 2. Weekly Retention

**`GET /api/admin/metrics/retention`**

### Response

```typescript
{
  cohorts: {
    weekStart: string;   // ISO date string (Monday)
    week0: number;       // always 100 (percentage)
    week1: number;       // % retained in week +1
    week2: number;
    week3: number;
    week4: number;
  }[];
}
```

### Query

Find all weeks in the trailing 8 weeks. For each cohort week N, find users who had a `session_start` in that week. For retention weeks N+1 through N+4, count how many of those users had any event type.

### Retention curve shape

Each cohort row represents a group of users who were active in `weekStart` week. Columns `week1`–`week4` show what percentage of that cohort was still active in subsequent weeks. `week0` is always 100.

### Errors

- 401: Unauthenticated
- 403: Not an admin

---

## 3. Live Users

**`GET /api/admin/metrics/live`**

### Response

```typescript
{
  liveUsers: number;  // count of distinct users active in last 15 min
}
```

### Query

```
analyticsEvents
  .where("eventType")
  .equals("session_start")
  .filter(e => e.timestamp >= now - 15min)
```

Count distinct `userId` values.

### Errors

- 401: Unauthenticated
- 403: Not an admin

---

## 4. Subject Usage

**`GET /api/admin/metrics/subjects`**

### Response

```typescript
{
  subjects: {
    name: string;   // subject name from metadata
    count: number;  // session count this month
  }[];
}
```

### Query

```
analyticsEvents
  .where("eventType")
  .anyOf(["session_start", "session_end"])
  .filter(e => e.timestamp >= current month start)
  .toArray()
```

Parse `metadata` (JSON string) for `subject` field. Group by subject name.

### Errors

- 401: Unauthenticated
- 403: Not an admin

---

## Authentication

All endpoints use `auth: "admin"` mode which calls `requireAdmin()` from `@/lib/server/auth`. This checks:

1. User is authenticated (valid Appwrite session cookie)
2. User ID is in `ADMIN_USER_IDS` environment variable

## Route files

| Endpoint | File |
|----------|------|
| DAU/MAU | `src/app/api/admin/metrics/dau-mau/route.ts` |
| Retention | `src/app/api/admin/metrics/retention/route.ts` |
| Live | `src/app/api/admin/metrics/live/route.ts` |
| Subjects | `src/app/api/admin/metrics/subjects/route.ts` |

All follow the existing pattern from `src/app/api/admin/subjects/route.ts` and `src/app/api/admin/analytics/route.ts`.

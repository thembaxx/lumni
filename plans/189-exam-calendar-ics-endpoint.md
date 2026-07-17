# Plan 189: Add server-side ICS calendar download endpoint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 690ee57f..HEAD -- src/app/api/exam-dates/ src/lib/exam-dates/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `690ee57f`, 2026-07-17
- **Issue**: (none)

## Why this matters

The `NationalExamCalendar` component already has an "Export Calendar" button that calls `generateIcal()` + `downloadIcal()` client-side, which works today. But there is no server-side API endpoint that returns raw ICS content. A server endpoint enables: (1) direct link sharing ("Add to Calendar"), (2) a future subscribable calendar URL with auto-refresh, (3) integration with the exam dates service for programmatic access.

## Current state

- `src/lib/exam-dates/calendar-export.ts` — `generateIcal()`, `downloadIcal()`, `buildGoogleCalendarUrl()`, `buildExportFilename()` — all fully implemented and tested.
- `src/app/api/exam-dates/` directory has `route.ts` (list), `ingest/`, `scrape/` — no `calendar/` subdirectory.
- The export button in `src/components/tools/scheduling/national-exam-calendar.tsx:81-86` calls the library functions directly in the browser:

```tsx
const handleExportIcal = useCallback(() => {
  if (allSlots.length === 0) return;
  const ical = generateIcal(allSlots, sessionLabel);
  const filename = buildExportFilename(session.session, session.year);
  downloadIcal(ical, filename);
}, [allSlots, sessionLabel, session.session, session.year]);
```

- The existing `GET /api/exam-dates` route returns `ExamSlot[]` as JSON:

```ts
// src/app/api/exam-dates/route.ts (inferred shape)
GET /api/exam-dates?session=may-june&year=2026 → ExamSlot[]
```

- Repo conventions: All API routes use `createRouteHandler` from `@/lib/api/create-route-handler`. Route files are `route.ts` inside a directory named after the path segment. See `src/app/api/exam-dates/route.ts` as exemplar.

## Commands you will need

| Purpose   | Command                 | Expected on success |
| --------- | ----------------------- | ------------------- |
| Typecheck | `pnpm typecheck`        | exit 0, no errors   |
| Tests     | `pnpm test`             | all pass            |
| Lint      | `pnpm exec biome check` | exit 0              |

## Scope

**In scope**:

- `src/app/api/exam-dates/calendar/route.ts` — new file
- `src/app/api/exam-dates/__tests__/calendar-route.test.ts` — new test file (optional, for test coverage)

**Out of scope**:

- Changes to `calendar-export.ts` — the library is already complete
- Changes to the existing `GET /api/exam-dates` route
- Changes to the `NationalExamCalendar` component's export button (it already works client-side)
- Subscribable calendar URL with cache headers (future work)

## Git workflow

- Branch: `advisor/189-exam-calendar-ics`
- Commit style: conventional commits matching repo (`git log --oneline -5`)
- Do NOT push or open PR unless instructed

## Steps

### Step 1: Create the calendar API route

Create `src/app/api/exam-dates/calendar/route.ts` that:

1. Parses `session` and `year` from search params (default to current session if not provided)
2. Fetches exam slots from the existing `getExamDates()` service function from `@/lib/exam-dates/service`
3. Calls `generateIcal()` to produce the ICS string
4. Returns a `Response` with `Content-Type: text/calendar; charset=utf-8` and `Content-Disposition: attachment; filename="...ics"`

Use the existing `createRouteHandler` factory. Since exam timetables are public data, use `auth: "optional"` (returns data when authenticated but also works for anonymous/public access).

The route should follow this pattern:

```ts
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { generateIcal, buildExportFilename } from "@/lib/exam-dates/calendar-export";
import { getExamDates } from "@/lib/exam-dates/service";
import { getCurrentSession } from "@/lib/exam-dates";

export const GET = createRouteHandler({
  auth: "optional",
  errorLabel: "ExamCalendarExport",
  execute: async ({ req }) => {
    const { searchParams } = new URL(req.url);
    const session = searchParams.get("session") ?? getCurrentSession().session;
    const year = parseInt(searchParams.get("year") ?? String(getCurrentSession().year), 10);
    const sessionLabel = `${session === "may-june" ? "May-June" : "Oct-Nov"} ${year}`;

    const slots = await getExamDates(session, year);
    const ical = generateIcal(slots, sessionLabel);
    const filename = buildExportFilename(session, year);

    return new Response(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  },
});
```

Note: `createRouteHandler` normally returns JSON. To return a raw `Response` (for ICS content), check if the factory supports overriding the response serialization. If it doesn't support `Response` return types (it expects an object to JSON-serialize), write the handler as a plain `export async function GET(req: NextRequest)` instead — check by looking at the return type of `execute` in the factory at `src/lib/api/create-route-handler.ts:1-20`. If `execute` return type is `Promise<Record<string, unknown>>`, use a plain handler:

```ts
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // ... same logic as above
    return new Response(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return Response.json({ error: "Failed to generate calendar" }, { status: 500 });
  }
}
```

**Verify**: The route exists at `src/app/api/exam-dates/calendar/route.ts` and the exported function is named `GET`.

**Verify**: `pnpm typecheck` exits 0.

### Step 2: Test the endpoint

Run the test suite to confirm no regressions:

```bash
pnpm test
```

Optionally write a unit test at `src/app/api/exam-dates/__tests__/calendar-route.test.ts` following the pattern of existing exam-date tests. The test should:

- Mock `getExamDates` to return a known `ExamSlot[]`
- Call the handler with `?session=oct-nov&year=2025`
- Assert the response is `200`
- Assert `Content-Type` starts with `text/calendar`
- Assert the body contains `BEGIN:VCALENDAR` and `END:VCALENDAR`

**Verify**: `pnpm test` exits 0.

## Test plan

- One integration test (optional): `src/app/api/exam-dates/__tests__/calendar-route.test.ts`
  - Happy path: valid session + year → 200 + ICS content
  - Default params: no query params → uses current session → 200
  - Error path: `getExamDates` throws → 500

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] `curl "http://localhost:3000/api/exam-dates/calendar?session=oct-nov&year=2025"` returns `Content-Type: text/calendar` with valid ICS content
- [ ] Only files in scope are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `createRouteHandler` does not support returning a raw `Response` — adapt by using a plain handler function
- `getExamDates` or `getCurrentSession` imports don't resolve — check the exact export names in `src/lib/exam-dates/index.ts`
- The code has drifted significantly from the excerpts above

## Maintenance notes

- If pagination or filtering is added to exam dates, the calendar endpoint should mirror the same filters.
- A future subscribable calendar URL should add `Cache-Control` headers and possibly a version query param.
- The ICS format is deliberately minimal (no alarms, no recurrence). If the DBE changes exam date format, the parser may need updates.

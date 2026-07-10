# Plan 156: Deduplicate calendar export utilities

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/lib/calendar/`
> If any files changed since this plan was written, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

Two separate calendar export implementations exist: one in
`src/lib/export/export-service.ts` that generates `.ics` files inline, and one
in `src/lib/calendar/` that generates `.ics` files. Each uses different helper
utilities for ICAL generation, RFC 5545 date formatting, and file download
logic. This duplicates ~80 lines of calendar-specific code and means any bug
fix or feature addition to the export format must be made in two places.

## Current state

Find all `.ics` or calendar-related utility functions across both locations:

```bash
grep -rn 'BEGIN:VCALENDAR\|DTSTART\|DTEND\|SUMMARY\|ical\|\.ics' src/lib/export/ src/lib/calendar/
```

The duplication likely manifests as:

- Two `generateICS` or `createICS` functions
- Two ISO date-to-ICS date format converters
- Two download-trigger functions (blob URL + `<a>` click)

## Scope

**In scope**:

- `src/lib/calendar/calendar-export.ts` (create — shared ICS generation)
- `src/lib/export/export-service.ts` (edit — import from shared module)
- `src/lib/calendar/` (edit — import from shared module)

**Out of scope**:

- Do NOT deduplicate the export-service's CSV/PDF generation (only .ics)
- Do NOT change the public API of either module
- Do NOT touch the study-planner's calendar view rendering

## Git workflow

- Branch: `advisor/156-deduplicate-calendar-exports`
- Commit message: `refactor: deduplicate calendar export into shared module`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Identify the duplication

Read both files:

```bash
cat src/lib/calendar/*.ts
cat src/lib/export/export-service.ts
```

Extract the overlapping `.ics` generation logic. The shared interface should
look like:

```typescript
// src/lib/calendar/calendar-export.ts
export interface CalendarEvent {
  title: string;
  start: Date;
  end?: Date;
  description?: string;
  location?: string;
  uid?: string;
}

export function generateICal(events: CalendarEvent[]): string;
export function downloadICal(ics: string, filename: string): void;
```

### Step 2: Create the shared module

Write `src/lib/calendar/calendar-export.ts`:

- `generateICal(events)` — builds the `BEGIN:VCALENDAR` / `VERSION:2.0` /
  `PRODID` / `BEGIN:VEVENT` / `DTSTART;VALUE=DATE` / etc. string from an
  array of event objects
- `downloadICal(ics, filename)` — creates a blob URL and triggers download
- Helper `toICalDate(date)` — converts JS `Date` to `YYYYMMDDTHHMMSSZ` format

### Step 3: Update the calendar module

Update `src/lib/calendar/index.ts` to re-export from `calendar-export.ts`.

Update the existing calendar export code (in `src/lib/calendar/`) to call
`generateICal` / `downloadICal` instead of inline generation.

### Step 4: Update the export service

Update `src/lib/export/export-service.ts` to import `generateICal` from
`@/lib/calendar/calendar-export` instead of inline generation.

**Verify**:

1. `pnpm run typecheck` → exit 0
2. `pnpm run test` → exit 0, no regressions
3. Check both export UIs work by reviewing the caller code is unchanged (if
   UI-level test exists, run it)

## Test plan

- The shared `generateICal` function produces valid ICS output. Add a test
  to `src/lib/calendar/__tests__/calendar-export.test.ts`:
  - Generates ICS from 1 event, 2 events, 0 events
  - ICS string contains `BEGIN:VCALENDAR`, `END:VCALENDAR`, `BEGIN:VEVENT`,
    `END:VEVENT`, correctly formatted `DTSTART`
  - Verify the `downloadICal` function creates a URL with the correct MIME type
- Existing tests must continue to pass (if any cover the old code paths)

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, new `calendar-export.test.ts` passes
- [ ] `pnpm exec oxlint` — zero warnings on all changed files
- [ ] `grep -n 'BEGIN:VCALENDAR' src/lib/export/ src/lib/calendar/` shows only
      the shared module (no inline generation in either consumer)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The duplication is more extensive than described (3+ copies of ICS
  generation). If so, update the plan scope and find all copies.
- One of the copies has diverged in format (different VERSION, different
  PROPID, different date formatting). If so, preserve both as separate
  exports from the shared module.

## Maintenance notes

- Future calendar export features (e.g., recurrence rules, alarms) should
  only be added to `calendar-export.ts`.
- The CSV/PDF export paths in `export-service.ts` are unrelated and should
  remain in that file.

# Plan 029: Teacher tools — live session monitoring + remaining gaps

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none

## Why this matters

Teacher tools are well-built (8 API routes, full dashboard, assignment loop, student reports) but missing two roadmap items: (1) teachers cannot view student live study sessions, and (2) no teacher settings page. The core assignment/roster/report loop is complete and working.

## Scope

**In scope**:

- `src/components/teacher/live-session-monitor.tsx` — new component
- `src/components/teacher/class-shell.tsx` — add live session monitoring tab
- `src/lib/study-groups/live-session-service.ts` — add `getSessionsByTeacher()` function
- `src/app/api/teacher/assignments/review/route.ts` — check if exists
- `src/components/i18n/locale-switcher.tsx` — look for gaps

**Out of scope**: Teacher-parent messaging, bulk CSV import, full i18n

## Steps

### Step 1: Add teacher session monitoring API

Add to `live-session-service.ts`:

```typescript
export async function getSessionsByTeacher(teacherId: string): Promise<LiveSession[]>;
```

Queries Appwrite `LIVE_SESSIONS` collection for sessions started by the teacher's students (filter by group membership).

### Step 2: Create live session monitor component

New file `src/components/teacher/live-session-monitor.tsx`:

- Shows active study sessions for the teacher's students
- Displays: subject, duration, participant count
- Color-coded: green if active > 10 min, amber if 5-10 min, gray if ending soon
- Refresh button + auto-refresh every 30s

### Step 3: Wire into teacher dashboard

In `class-shell.tsx`, add a "Live Sessions" tab alongside existing sections.

### Step 4: Verify

```bash
npx tsc --noEmit
npx biome check
bun run test
```

## Done criteria

- Teacher dashboard shows active student live sessions
- Session monitor auto-refreshes
- No regressions in existing teacher tools

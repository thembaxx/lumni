# Plan 195: Wire teacher risk alerts to real risk model

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Issue**: (none)

## Why this matters

The teacher dashboard has a fully-built `RiskModel` class (`src/lib/analytics/risk-model.ts`) with 6 factor checks (declining scores, zero-quiz days, streak loss, recency, flashcard gaps, subject imbalance) and a real `computeRiskScore()` method. But the `GET /api/teacher/risk-alerts` route returns `{ students: [] }` — the model is imported but never called. This means teachers see a blank risk panel.

## Current state

- `src/lib/analytics/risk-model.ts` — 6-factor `RiskModel` class, `computeRiskScore(studentId, deps)` works off Dexie competencies + quiz attempts
- `src/app/api/teacher/risk-alerts/route.ts` — lines 13-24 return placeholder `{ students: [], computedAt, windowDays }`
- `src/app/api/teacher/interventions/route.ts` — already real Appwrite CRUD (no change needed)
- Teacher dashboard risk panel expects `StudentRisk[]` with `{ studentId, studentName, riskScore, factors, trend, lastActive }`

## Steps

### Step 1: Add `studentId` query param to risk alerts route

In `src/app/api/teacher/risk-alerts/route.ts`:

1. Remove the placeholder return block (lines 13-24)
2. Fetch teacher's assigned students from Appwrite `teacher_students` collection (follow pattern from `POST /api/teacher/roster/import/route.ts` which already queries this)
3. For each student, call `riskModel.computeRiskScore(studentId, { db: dexieDataAccess })` with try/catch per student (fail open — skip a student on error, don't fail the batch)
4. Return `{ students: StudentRisk[], computedAt, windowDays }`

The `RiskModel.computeRiskScore()` already handles all edge cases internally. No changes needed to the model.

### Step 2: Add risk scores to teacher student list

Optional enhancement: Check if `src/app/api/teacher/students/route.ts` exists and whether it could benefit from including risk scores. Only do this if the route already fetches per-student data.

### Step 3: Verify

```bash
pnpm typecheck
pnpm exec biome check
pnpm test
```

### Step 4: Integration check

Verify the route returns real data:
```bash
curl -X GET "http://localhost:3000/api/teacher/risk-alerts?windowDays=30" -H "Cookie: session=<test-session>"
```
Expected: `{ students: [...], computedAt, windowDays }` with at least the requesting user's own student data.

## Test plan

- Update `src/app/api/teacher/risk-alerts/__tests__/route.test.ts` (if exists) or write one
- Mock Appwrite `teacher_students` query to return 2 test students
- Verify each student gets a `riskScore` number (0-100) and `factors` array
- Verify error in one student doesn't crash the whole batch

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] `GET /api/teacher/risk-alerts?windowDays=30` returns real risk scores, not `students: []`
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- Appwrite `teacher_students` collection doesn't exist or has a different name — check `src/lib/appwrite/constants.ts` for the collection ID
- `RiskModel.computeRiskScore()` signature differs from what's documented here — read `src/lib/analytics/risk-model.ts` top-level exports and adjust the call

## Maintenance notes

- The 6 risk factors in `RiskModel` are: declining scores, zero-quiz days last 7, streak loss, recency (days since last quiz), flashcard gap (days since last review), subject imbalance (stdev of topic scores > threshold)
- Teachers see the risk panel on their dashboard — no UI change needed, the route feeds the existing component
- Interventions route is already live — no changes needed there

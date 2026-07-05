# Plan 099: Design spike — teacher classroom infrastructure

> **Executor instructions**: This is a design spike, not a full build. Investigate, design, and prototype the three missing classroom infrastructure pieces. Do NOT build production-grade UI — focus on API design, data model, UX flow, and a working prototype for one flow.
>
> Run every verification command. If anything in "STOP conditions" occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat a8d53ec7..HEAD -- src/app/api/teacher/ src/components/teacher/ src/lib/server/teacher-service.ts src/app/[locale]/teacher/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L (design spike: 1-2 weeks for all three features)
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a8d53ec7`, 2026-07-05

## Why this matters

Teacher tools exist (7 API routes, assignment loop, student reports, topic mastery heatmap) but lack the operational backbone needed for real classroom adoption. Three gaps block teachers from onboarding actual classes:

1. **No CSV roster import** — A teacher with 150 students across 5 classes must manually link each student by ID (see `src/app/api/teacher/link/route.ts` — one-at-a-time linking via POST with `studentId`). This doesn't scale.
2. **No classroom join code** — Students have no way to discover and connect to their teacher. The current flow requires the teacher to know the student's Appwrite user ID.
3. **No gradebook** — Teachers can assign topics but cannot see per-assignment scores over time. The report endpoint (`GET /api/teacher/students/[id]/report`) gives a single snapshot, not a term-long grade history.

Without these, the teacher product is a demo — useful for a pilot with 5 students, unusable for a teacher with 150.

## Current state

**Teacher-student linking** (`src/app/api/teacher/link/route.ts:1-34`):

```typescript
export const POST = createRouteHandler({
  auth: "required",
  validate: (body) => {
    if (!body.studentId) return "studentId required";
    return null;
  },
  execute: async ({ userId, body }) => {
    await linkStudentToTeacher(userId as string, body.studentId, body.subjectId);
    return { success: true };
  },
});
```

Linking requires the teacher to know the student's Appwrite user ID — no student-initiated flow exists.

**Teacher-student relationships** are stored in Appwrite `TEACHER_STUDENTS` collection (`src/lib/server/teacher-service.ts:62-70`):

```typescript
const relationships = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
  Query.equal("teacherId", teacherId),
]);
```

**Assignment** (`src/app/api/teacher/assign/route.ts`): Can assign topics to students with due dates.
**Student report** (`GET /api/teacher/students/[id]/report`): Returns a single snapshot of student performance.
**Class roster** (`src/components/teacher/class-roster-table.tsx:34-127`): A table displaying linked students with name, grade, score, weak topics, last active. No CSV import, no invite flow.

**Existing patterns to follow**:

- API routes use `createRouteHandler` from `@/lib/api/create-route-handler` — see `src/app/api/teacher/link/route.ts` for the pattern
- Error handling uses `logError` from `@/lib/shared/logger`
- Teacher service uses `src/lib/server/teacher-service.ts` — match its `TeacherStudent` interface and Appwrite query patterns

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `pnpm install`       | exit 0              |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope** (produce designs and prototypes for):

- **CSV roster import flow**: Spec + API + working prototype import endpoint. CSV format design (required columns, headers). Preview-and-confirm UX.
- **Classroom join code flow**: Spec + API + working prototype. Teacher generates a 6-character alphanumeric code per class. Student enters code to auto-link.
- **Gradebook**: Spec + data model + API design. Assignment-level score tracking over time.
- All three should be consistent with the existing teacher-student data model in `src/lib/server/teacher-service.ts` and Appwrite `TEACHER_STUDENTS` collection.

**Out of scope** (do NOT implement):

- Full production UI for all three (wireframes/sketches acceptable)
- Push notification integration for gradebook updates
- Parent dashboard integration with gradebook
- Integration with school licensing (plan 098) — these work independently
- Bulk email/SMS invites
- i18n for new features (unless trivial)

## Steps

### Step 1: Design CSV roster import

Design the import flow:

1. **CSV format**: Required columns: `student_name`, `student_email` (for matching existing accounts) or a unique identifier. Optional: `grade`, `subject`. Header row expected. Provide a downloadable template.
2. **API spec**: `POST /api/teacher/roster/import` — accepts multipart CSV file. Returns `{ matched: [...], unmatched: [...], errors: [...] }` where `matched` contains successfully linked student IDs, `unmatched` contains rows where no matching account was found (teacher can invite these by email).
3. **Preview UX**: Before finalizing, show a preview table of matched rows + unmatched rows. Teacher confirms import.
4. **Invite flow**: For unmatched students, generate a unique invite link (reuse/share pattern from `src/app/api/teacher/ghost-link/` — see `src/app/api/teacher/ghost-link/route.ts` ).

**Create prototype file**: `src/app/api/teacher/roster/import/route.ts` — parse CSV, query Appwrite users by email, create `TEACHER_STUDENT` links in batch, return results.

**Verify**: `pnpm run typecheck` exits 0. `curl -v -F "file=@test-roster.csv" http://localhost:3000/api/teacher/roster/import` returns the expected response shape.

### Step 2: Design classroom join codes

Design the join flow:

1. **Data model**: Add a `classroom_codes` collection to Appwrite (or Dexie). Schema: `code` (unique 6-char alphanumeric), `teacherId`, `subjectId?`, `expiresAt`, `maxUses?`, `useCount`.
2. **API spec**:
   - `POST /api/teacher/classroom/code` — generate new code (teacher authed). Returns `{ code, expiresAt }`.
   - `GET /api/teacher/classroom/codes` — list active codes for this teacher.
   - `DELETE /api/teacher/classroom/codes/[code]` — revoke a code.
   - `POST /api/student/join` — student submits code. Auto-links to teacher. Body: `{ code }`.
3. **Code generation**: Use `nanoid` (already in deps at `^5.1.16`) with custom alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I to avoid confusion). 6 characters = ~380M combinations.
4. **Student UX**: After joining, student sees teacher name and assigned subjects. Teacher sees new student in roster.

**Create prototype files**:

- `src/app/api/teacher/classroom/code/route.ts`
- `src/app/api/student/join/route.ts`

**Verify**: `pnpm run typecheck` exits 0. Generate a code, verify it appears in the list, join with it, verify teacher-student link is created.

### Step 3: Design the gradebook

Design the gradebook:

1. **Data model**: Extend the existing assignment infrastructure. Currently `POST /api/teacher/assign` can assign topics with due dates. Gradebook tracks per-assignment scores over time.
2. **Key design questions to answer** (document your decisions):
   - How does an assignment relate to quiz sessions?
   - Where does grade data live? (Appwrite? Dexie? Both via sync?)
   - How does the student see their grades? (Separate view? In quiz results?)
   - What's the minimum viable gradebook? (Score per assignment, cumulative average, trend)
3. **API spec**:
   - `GET /api/teacher/assignments/[id]/grades` — per-assignment student scores
   - `GET /api/teacher/students/[id]/grades` — all grades for one student across assignments
4. **Implementation path**: The `exam_sessions` and `quiz_sessions` Dexie tables already capture scores per-session. Gradebook is a view over these, grouped by teacher assignment.

**Create prototype file**: `src/app/api/teacher/assignments/[id]/grades/route.ts` — returns per-student scores for a given assignment. Query Dexie `quizSessions` for sessions linked to the assignment.

**Verify**: `pnpm run typecheck` exits 0.

### Step 4: Wire gradebook into existing dashboard

Create a minimal gradebook tab in the existing `ClassShell` component (`src/components/teacher/class-shell.tsx`). This is a design exercise—create the UI skeleton. The actual grade data comes from the API in step 3.

**Verify**: The UI renders without errors. `pnpm exec oxlint` exits 0.

## Deliverables

All designs go to `docs/superpowers/`:

- [ ] `docs/superpowers/2026-07-05-classroom-csv-import.md` — CSV format, API design, invite flow
- [ ] `docs/superpowers/2026-07-05-classroom-join-codes.md` — join code data model, API, UX
- [ ] `docs/superpowers/2026-07-05-classroom-gradebook.md` — gradebook data model, API
- [ ] Working prototype endpoints (step 1-3) — source files in `src/app/api/teacher/` and `src/app/api/student/`

## Done criteria

ALL must hold:

- [ ] All 3 deliverable docs exist in `docs/superpowers/`
- [ ] At least one prototype endpoint compiles and passes typecheck
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] No pre-existing test failures (`pnpm run test` — existing failures only, no new ones)

## STOP conditions

Stop and report back if:

- The CSV import flow requires a paid UploadThing plan (check limits in `src/lib/uploadthing.ts`)
- Appwrite free tier doesn't support `classroom_codes` collection creation (check `COLLECTIONS` in `src/lib/db/client.ts`)
- Join code generation needs a rate limiter not yet created
- Any step requires modifying existing teacher API routes that are in active use (check `git log --oneline -5 -- src/app/api/teacher/` — if recently touched, pause)

## Maintenance notes

- Classroom join codes converge naturally with school licensing (plan 098): a school code and a classroom code can coexist (school enrolls teacher, teacher invites students)
- CSV import will need reconciliation when school SSO (email domain auto-join) is built
- Gradebook is the most complex piece — consider deferring full implementation until after the data model spike is reviewed

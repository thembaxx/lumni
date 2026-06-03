# B2B2C Completion Loop — Teacher Assignments, Reminders, Parent Digest

## Overview

Complete the teacher→student assignment pipeline and wire push notifications into the parent dashboard. Three interconnected features:

1. **2.1 Assignment completion loop** — student submits quiz → auto-grade → teacher comment
2. **2.6 Assignment reminders** — push 24h before due
3. **2.2 Parent weekly digest** — Sunday push with prior-week summary

## 1. Assignment Model Changes

### Appwrite `teacher_assignments` — extended schema

| Field | Type | Notes |
|---|---|---|
| `teacherId` | string (100) | existing |
| `topicIds` | string (2000) | existing, JSON stringified |
| `status` | string (20) | existing, "pending" |
| `createdAt` | datetime | existing |
| **`dueDate`** | **string (20)** | **new — ISO date, optional** |

### New Appwrite collection: `assignment_submissions`

| Field | Type | Notes |
|---|---|---|
| `$id` | auto | Appwrite document ID |
| `assignmentId` | string (100) | FK to teacher_assignments |
| `studentId` | string (100) | FK to user |
| `score` | number | total score |
| `maxScore` | number | maximum possible |
| `totalQuestions` | number | question count |
| `correctCount` | number | correct answers |
| `completedAt` | datetime | submission timestamp |
| `teacherComment` | string (2000) | nullable, set by teacher |

### Student-side type (`StudentAssignment`)

Extended from existing:
```typescript
interface StudentAssignment {
  id: string;
  teacherId: string;
  topics: string[];
  status: string;
  createdAt: string;
  dueDate?: string;
  submission?: {
    score: number;
    maxScore: number;
    totalQuestions: number;
    correctCount: number;
    completedAt: string;
    teacherComment?: string;
  };
}
```

## 2. Student Submission Flow

### API: `POST /api/assignments/[id]/submit`

- **Auth**: student (verified via JWT session)
- **Body**: `{ score, maxScore, totalQuestions, correctCount, questionResults }`
- **Action**: upsert into `assignment_submissions` (one submission per student per assignment)
- **Response**: `{ success: true }`

### Student UI: `MyAssignments` (existing, enhanced)

- Add `dueDate` display with relative time ("Due tomorrow")
- Add "Practice" button per pending assignment
- "Practice" navigates to `/quiz?subject=X&topic=Y,Z&assignmentId={id}`
- After quiz completion, if `assignmentId` was present in URL:
  - `quiz-view.tsx` reads `assignmentId` from query params
  - Calls `POST /api/assignments/[id]/submit` with quiz results
  - Shows "Assignment submitted! Score: X/Y" confirmation
- Old submissions show score + teacher comment if present
- Hidden behind `<RoleGate requiredRole="student">` (student label check)

### No quiz-view.tsx changes needed in the component itself

The quiz flow already supports `subject=X&topic=Y&count=N` query params. We add:
- URL param `assignmentId` read at quiz session end
- Single API call after the quiz result is computed
- No changes to quiz rendering or state machine

## 3. Teacher Review UI

### API: `POST /api/assignments/[id]/comment`

- **Auth**: teacher
- **Body**: `{ comment: string }`
- **Action**: updates `assignment_submissions.teacherComment` field
- **Response**: `{ success: true }`

### API: `GET /api/teacher/assignments`

- **Auth**: teacher
- **Action**: fetches all `teacher_assignments` for this teacher, enriches each with:
  - Topic names (from subject maps or curriculum)
  - Submission count
  - Average score
  - Per-student submissions array
- **Response**: `{ assignments: TeacherAssignmentView[] }`

### New component: `AssignmentReviewPanel`

- Added to teacher dashboard page below the engagement cards
- Lists assignments as expandable cards:
  - Topic chips, due date, submission count, avg score
- Expanded view shows per-student table:
  - Student name, score/percentage, completed date, time taken
- Each submission row has a "Comment" button → inline text area → saves via API
- Uses existing `TeacherStudent` type for student name resolution

## 4. Assignment Reminders (2.6)

### Notification service: `scheduleAssignmentReminders()`

- Called from `initializeNotificationSchedulers()` when `settings.assignmentDue` is true
- Fetches assignments via `GET /api/student/assignments`
- For each assignment with `dueDate` and no submission:
  - Calculates `alertTime = dueDate - 24h`
  - If `alertTime > now`, schedules `setTimeout` for web push
  - Dedup via localStorage (`lumni_assignment_alerts`)
- Web push via existing `/api/push/send` or local notification fallback
- Re-schedules on assignment list refresh

## 5. Parent Weekly Digest (2.2)

### Enhanced `scheduleWeeklyProgress()`

Existing function already queries Dexie `quizAttempts` for last 7 days. Enhance:

- Check push subscription first via `/api/push/subscriptions` → push is active
- Richer content: iterate over subjects to build breakdown string
  - "Math: 5 questions (78%), Physics: 3 weak topics"
  - Streak: "10-day streak 🔥"
- Schedule: only run on Sundays at `reminderHour` (default 18:00)
- Fallback: local notification if push not subscribed

### No new API needed

The digest uses existing data sources:
- `offlineDB.quizAttempts` for per-subject question counts and accuracy
- `offlineDB.competencies` for weak topics (score < 65%)
- localStorage gamification for streak

## Files Changed / Created

### New files
- `src/app/api/assignments/[id]/submit/route.ts` — POST submission
- `src/app/api/assignments/[id]/comment/route.ts` — POST teacher comment
- `src/app/api/teacher/assignments/route.ts` — GET teacher's assignments with submissions
- `src/components/teacher/assignment-review-panel.tsx` — teacher review UI

### Modified files
- `src/lib/db/ensure-schema.ts` — add `dueDate` to `teacher_assignments`, add `assignment_submissions` collection
- `src/components/teacher/assignment-builder.tsx` — add date picker for dueDate
- `src/components/dashboard/my-assignments.tsx` — enhanced with submission + practice button
- `src/lib/services/notification-service.ts` — enhanced `scheduleWeeklyProgress`, new `scheduleAssignmentReminders`
- `src/app/[locale]/teacher/page.tsx` — wire `AssignmentReviewPanel`
- `src/components/quiz/quiz-view.tsx` — wire assignmentId param → submission

## Verification

- `tsc --noEmit` — zero errors
- `biome check` — zero warnings
- `bun test` — no regressions

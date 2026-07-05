# Classroom Gradebook — Design

## Problem

Teachers can assign topics to students with due dates (`POST /api/teacher/assign`) and see a single snapshot per student (`GET /api/teacher/students/[id]/report`), but cannot see per-assignment scores over time.

## Key Design Decisions

### Q1: How does an assignment relate to quiz sessions?

**Decision**: An assignment is a teacher-created container (`TEACHER_ASSIGNMENTS` document) with a set of topics and a due date. Quiz sessions (`STUDY_SESSIONS` / `quiz_sessions` in Dexie) are student-initiated learning events. The bridge between them is the `assignment_submissions` table — when a student completes a quiz session that covers the assignment's topics, a submission record is created linking the session to the assignment.

The `ASSIGNMENT_SUBMISSIONS` collection already exists and stores: `assignmentId`, `studentId`, `score`, `totalQuestions`, `correctCount`, `completedAt`, `teacherComment`.

This is already wired in `src/app/api/assignments/[id]/submit/route.ts`.

### Q2: Where does grade data live?

**Decision**: Dual-write — same pattern as the rest of the app:
- **Primary**: Dexie (`quiz_sessions` table) for fast client-side queries
- **Sync target**: Appwrite (`ASSIGNMENT_SUBMISSIONS` collection and `STUDY_SESSIONS` collection)

The gradebook API queries from Appwrite (server-side authenticated). For offline fallback, the teacher dashboard can read from Dexie.

### Q3: How does the student see their grades?

**Decision**: Two views:
1. **Per-assignment**: In the assignment detail view, students see their score, the class average, and their percentile
2. **Term overview**: A cumulative grade view showing all assignments with scores over time

The per-assignment grade view already exists in the student's assignment submission review. The term overview is new and will be in the student dashboard.

### Q4: What is the minimum viable gradebook?

**Decision**: The MVP gradebook is a view over existing `ASSIGNMENT_SUBMISSIONS` data:
- **Per-assignment view**: List of students with scores, average, min/max, distribution
- **Per-student view**: All scores across all assignments, trend over time
- **No new data storage needed** — the `ASSIGNMENT_SUBMISSIONS` and `STUDY_SESSIONS` tables already capture everything

## Data Model

No new tables needed. Gradebook is a query/computation layer over:

### Existing `ASSIGNMENT_SUBMISSIONS`

```
assignmentId: string      → FK to TEACHER_ASSIGNMENTS
studentId: string         → FK to Appwrite Users
score: number             → Correct count
maxScore: number          → Total possible
totalQuestions: number
correctCount: number
completedAt: string
teacherComment?: string
```

### Existing `STUDY_SESSIONS`

```
userId: string
subjectId: string
questionsAnswered: number
correctCount: number
startedAt: string
endedAt?: string
```

## API Design

### `GET /api/teacher/assignments/[id]/grades`

Returns per-student scores for a given assignment.

**Response:**
```json
{
  "assignment": {
    "id": "assign_123",
    "topicIds": "[\"math_algebra\"]",
    "status": "active",
    "dueDate": "2026-08-01T00:00:00Z"
  },
  "grades": [
    {
      "studentId": "user_abc",
      "studentName": "John Doe",
      "score": 8,
      "maxScore": 10,
      "percentage": 80,
      "completedAt": "2026-07-20T14:30:00Z"
    }
  ],
  "stats": {
    "averagePercentage": 72,
    "highestPercentage": 95,
    "lowestPercentage": 40,
    "submissionCount": 18,
    "totalStudents": 25
  }
}
```

### `GET /api/teacher/students/[id]/grades`

Returns all grades for a specific student across assignments.

**Response:**
```json
{
  "studentId": "user_abc",
  "studentName": "John Doe",
  "grades": [
    {
      "assignmentId": "assign_123",
      "topicIds": "[\"math_algebra\"]",
      "score": 8,
      "maxScore": 10,
      "percentage": 80,
      "completedAt": "2026-07-20T14:30:00Z"
    }
  ],
  "overall": {
    "averagePercentage": 75,
    "totalAssignments": 5,
    "completedAssignments": 5,
    "trend": "improving"
  }
}
```

### `GET /api/teacher/gradebook/export`

Export full gradebook as CSV for download.

**Response:** CSV file with columns: `Student Name, Assignment, Score, Max Score, Percentage, Completed At`

## Wire View (Teacher Dashboard Tab)

A new "Gradebook" tab in the `ClassShell` component shows:
- Assignment selector (dropdown of all assignments)
- Grade table (student name, score, percentage, completion date)
- Statistics bar (average, highest, lowest)
- Export button (CSV download)

See `src/components/teacher/class-shell.tsx` — add a tab navigation with "Roster", "Assignments", "Gradebook" tabs.

## Files

- New: `src/app/api/teacher/assignments/[id]/grades/route.ts` — per-assignment grades
- New: `src/app/api/teacher/students/[id]/grades/route.ts` — per-student grades across assignments (optional, future)
- Modify: `src/components/teacher/class-shell.tsx` — add Gradebook tab

## Future Work

- **Weighted grades**: Support assignments with different point values
- **Term aggregation**: Group assignments by term for term-level averages
- **Auto-grading trigger**: When a student completes a quiz session covering assignment topics, auto-create/update the submission record
- **Parent view**: Parents can see their child's gradebook
- **Export to CSV**: Full gradebook export (separate endpoint or client-side)

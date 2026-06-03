# Batch 2 — Teacher Tools Design

## 2.3 Teacher Share Link Improvements

### Problem
Current share links (`/q/[id]`) are per-question only. Teachers need to share full assignments with a preview of what students see.

### Solution
- Extend the existing share system to support **assignment-level share links**
- `POST /api/teacher/share-assignment` creates a public share record for the assignment with an expiry (7 days)
- Returns `{ url: "/shared/assignment/[shareId]" }`
- Public page at `/shared/assignment/[shareId]` shows assignment topic, questions list (read-only), and due date
- Teacher dashboard gets "Share" button on each assignment card that copies the link
- Preview shows what students will see (topic, question count, due date)

### Files
- New: `src/app/api/teacher/share-assignment/route.ts`
- New: `src/app/shared/assignment/[shareId]/page.tsx`
- Modify: `src/components/teacher/assignment-card.tsx` — add Share button
- Modify: `src/lib/share/share-service.ts` — add assignment share helpers

---

## 2.4 Teacher Observations / Progress Reports

### Observation Notes
- Teachers can add observation notes per student on the `StudentDetailDialog`
- Notes stored in Dexie `teacherObservations` table + Appwrite `teacher_observations` collection
- Each note has: `studentId`, `teacherId`, `content`, `subject?`, `createdAt`
- Displayed as a scrollable timeline in `StudentDetailDialog`

### Progress Reports
- "Generate Report" button on teacher dashboard
- Generates a printable page at `/teacher/report/[studentId]`
- Shows: per-subject competency scores, quiz attempt history, weak topics, recent observations
- Uses existing Dexie data (competencies, quizAttempts) — no new data sources
- Printable via `window.print()` with print-specific CSS

### Files
- New: `src/components/teacher/observation-timeline.tsx`
- New: `src/app/[locale]/teacher/report/[studentId]/page.tsx`
- Modify: `src/components/teacher/student-detail-dialog.tsx` — add observations tab
- Modify: `src/lib/db/schema.ts` — Dexie v30 with `teacherObservations` table
- Modify: `src/lib/db/client.ts` — add `TEACHER_OBSERVATIONS` collection constant
- Modify: `src/lib/db/ensure-schema.ts` — add Appwrite collection schema

---

## 2.5 In-App Messaging

### Scope
Simple student-to-teacher messaging within the app. Not a full chat system — just per-assignment questions and replies.

### Design
- Each assignment gets a "Questions" section with a message thread
- Students can post questions on assignments, teachers can reply
- Messages stored in Dexie `assignmentMessages` table + Appwrite collection
- Same thread visible to both teacher and student
- Messages shown in `AssignmentReviewPanel` (teacher) and assignment detail (student)
- Uses the existing real-time pattern (no WebSocket — polling on open)

### Data model
```typescript
interface AssignmentMessage {
  id: string;
  assignmentId: string;
  senderId: string;
  senderRole: "teacher" | "student";
  content: string;
  createdAt: number;
}
```

### Files
- New: `src/components/teacher/assignment-thread.tsx` — message thread component
- New: `src/app/api/teacher/assignments/[id]/messages/route.ts` — GET + POST
- Modify: `src/components/teacher/assignment-review-panel.tsx` — add thread tab
- Modify: `src/components/dashboard/assignments/my-assignments.tsx` — add "Ask Question" button
- Modify: `src/lib/db/schema.ts` — Dexie v30 with `assignmentMessages` table
- Modify: `src/lib/db/client.ts` — add `ASSIGNMENT_MESSAGES` collection constant

## Verification
- `npx tsc --noEmit` — zero errors
- `npx biome check` — zero errors

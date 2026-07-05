# CSV Roster Import — Design

## Problem

A teacher with 150 students across 5 classes must currently link each student one-at-a-time via `POST /api/teacher/link` using the student's Appwrite user ID. This doesn't scale.

## CSV Format

### Required Columns

| Column          | Description                                       | Example           |
| --------------- | ------------------------------------------------- | ----------------- |
| `student_name`  | Student's full name (for preview/display)         | `John Doe`        |
| `student_email` | Email to match against existing Appwrite accounts | `john@school.edu` |

### Optional Columns

| Column    | Description                | Example       |
| --------- | -------------------------- | ------------- |
| `grade`   | Student's grade/year level | `12`          |
| `subject` | Default subject to assign  | `Mathematics` |

### Rules

- Header row is required and must match exactly (case-insensitive match allowed)
- CSV must be UTF-8 encoded
- Max 500 rows per import (prevents timeout)
- Rows without `student_email` are rejected with an error

### Template (downloadable)

```
student_name,student_email,grade,subject
John Doe,john@school.edu,12,Mathematics
Jane Smith,jane@school.edu,11,Physical Sciences
```

## API Design

### `POST /api/teacher/roster/import`

Accepts CSV as raw text body (`Content-Type: text/plain`). The client sends the CSV content directly — no multipart file upload needed, avoiding UploadThing dependency.

**Request:**

```
POST /api/teacher/roster/import
Content-Type: text/plain
Authorization: Bearer <session>

student_name,student_email,grade,subject
John Doe,john@school.edu,12,Mathematics
```

**Response (201):**

```json
{
  "matched": [
    {
      "row": 2,
      "studentId": "user_abc123",
      "name": "John Doe",
      "email": "john@school.edu",
      "grade": "12"
    }
  ],
  "unmatched": [
    {
      "row": 3,
      "name": "Jane Smith",
      "email": "jane@school.edu",
      "grade": "11",
      "subject": "Physical Sciences",
      "reason": "no_account"
    }
  ],
  "errors": [
    {
      "row": 4,
      "message": "Missing student_email"
    }
  ]
}
```

### Preview-and-Confirm Flow

Because the import creates database records immediately, the client **must** implement a two-step UX:

1. **Upload step**: Teacher pastes CSV or selects a file. Client calls `POST /api/teacher/roster/preview` with the CSV text. Returns the same `{ matched, unmatched, errors }` shape **without** creating any records.
2. **Confirm step**: Teacher reviews preview table. Clicks "Confirm Import". Client calls `POST /api/teacher/roster/import` with the same CSV text. Creates the records.

This can be done as a single endpoint with a `?preview=true` query param for simplicity.

### Invite Flow for Unmatched Students

For unmatched students (no existing Appwrite account with that email):

1. Reuse the ghost-link pattern (`src/app/api/teacher/ghost-link/route.ts`): generate a shareable invite link.
2. The invite link directs the student to a sign-up page that pre-fills their email.
3. After sign-up, the student is automatically linked to the teacher.
4. Invite links expire after 30 days (same as ghost links).

## Data Flow

1. Teacher uploads CSV
2. Server parses CSV, extracts emails
3. Server queries Appwrite Users by email (`GET /users` with email filter — requires Appwrite API key)
4. For matched users: batch-create `TEACHER_STUDENT` documents in Appwrite
5. For unmatched users: return in unmatched list for invite generation
6. Teacher can generate invite links for unmatched students (POST to `/api/teacher/ghost-link`)

## Files

- New: `src/app/api/teacher/roster/import/route.ts` — CSV import endpoint
- New: `src/app/api/teacher/roster/preview/route.ts` — preview-only endpoint (optional, can be `?preview=true`)
- New: Teacher dashboard UI: file upload + preview table + confirm button

## Rate Limits

- Max 10 imports per teacher per hour
- Max 500 rows per import
- Preview calls are not rate-limited

## Security

- Teacher must be authenticated (auth: "required")
- Only creates TEACHER_STUDENT links for students that actually exist in Appwrite
- No bulk enrollment without matching accounts — unmatched rows must be invited manually

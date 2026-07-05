# Classroom Join Codes — Design

## Problem

Students have no way to discover and connect to their teacher. The current flow requires the teacher to know the student's Appwrite user ID.

## Data Model

### Appwrite Collection: `classroom_codes`

| Field       | Type              | Description                                                               |
| ----------- | ----------------- | ------------------------------------------------------------------------- |
| `code`      | string (6 chars)  | Unique alphanumeric code: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (no 0/O/1/I) |
| `teacherId` | string            | Appwrite user ID of the teacher who created it                            |
| `subjectId` | string (optional) | Subject scope (null = any subject)                                        |
| `label`     | string (optional) | Human-readable label like "Gr 12 Mathematics A"                           |
| `expiresAt` | number            | Timestamp when the code expires                                           |
| `maxUses`   | number (optional) | Max number of students who can use this code (null = unlimited)           |
| `useCount`  | number            | Current number of students who've joined with this code                   |
| `createdAt` | number            | Timestamp when the code was created                                       |
| `revoked`   | boolean           | Whether the teacher has manually revoked this code                        |

### Lexicon

- `code` is unique — enforced at creation time (retry on collision)
- 6 characters with custom alphabet = ~380 million combinations
- Default expiry: 7 days from creation

## API Design

### `POST /api/teacher/classroom/code`

Generate a new classroom join code.

**Request:**

```json
{
  "subjectId": "math_grade12",
  "label": "Gr 12 Mathematics A",
  "maxUses": 40,
  "expiresInDays": 14
}
```

**Response (201):**

```json
{
  "code": "XK3M9P",
  "label": "Gr 12 Mathematics A",
  "expiresAt": 1720123456789,
  "url": "/join/XK3M9P"
}
```

### `GET /api/teacher/classroom/codes`

List active (non-expired, non-revoked) codes for the authenticated teacher.

**Response:**

```json
{
  "codes": [
    {
      "code": "XK3M9P",
      "label": "Gr 12 Mathematics A",
      "subjectId": "math_grade12",
      "expiresAt": 1720123456789,
      "useCount": 23,
      "maxUses": 40,
      "createdAt": 1719500000000
    }
  ]
}
```

### `DELETE /api/teacher/classroom/code`

Revoke a classroom code.

**Request:**

```json
{
  "code": "XK3M9P"
}
```

**Response:**

```json
{
  "success": true,
  "code": "XK3M9P",
  "revoked": true
}
```

### `POST /api/student/join`

Student submits a join code to auto-link with the teacher.

**Request:**

```json
{
  "code": "XK3M9P"
}
```

**Responses:**

- 200: `{ "success": true, "teacherId": "...", "subjectId": "math_grade12" }`
- 400: `{ "error": "Invalid or expired join code" }`
- 409: `{ "error": "Already linked to this teacher" }`

## Code Generation

Uses `nanoid` (already in deps at `^5.1.16`) with custom alphabet:

```typescript
import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const generateCode = customAlphabet(ALPHABET, CODE_LENGTH);
```

After generation, check uniqueness in the `classroom_codes` collection. Retry on collision (max 3 attempts).

## Student UX Flow

1. Teacher generates a code in the dashboard → displays large code + copy button
2. Teacher shares code verbally, on the board, or via Google Classroom/WhatsApp
3. Student navigates to `/join` or enters code in the app settings
4. Student submits code → auto-linked to teacher
5. Student sees teacher name and assigned subjects
6. Teacher sees new student appear in roster (next refresh)

## Files

- New: `src/app/api/teacher/classroom/code/route.ts` — POST (generate) + GET (list) + DELETE (revoke)
- New: `src/app/api/student/join/route.ts` — POST (join)
- New: `src/app/[locale]/join/page.tsx` — Student join code page (simple form)
- Modify: `src/lib/db/constants.ts` — add `CLASSROOM_CODES`

## Rate Limits

- Teacher: max 10 code generations per hour (prevents abuse)
- Student: max 5 join attempts per minute (prevents brute force)

## Security

- Codes are 6-character alphanumeric, case-sensitive
- Expired codes are rejected
- Revoked codes are rejected
- A student can only be linked once per teacher (duplicate check)
- Teacher auth required for code management endpoints
- Student auth required for join endpoint

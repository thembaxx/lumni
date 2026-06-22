# ADR-0012: Service extraction pattern for route handlers

**Status:** Accepted  
**Date:** 2026-06-18  
**Deprecates:** Inline business logic in route handlers

## Context

Route handlers in `src/app/api/` contained 50-200+ lines of business logic: Appwrite queries, Appwrite storage operations, rate limiting, email sending, analytics tracking, and error handling. This violated the **depth** principle — route handlers were deep modules doing too much, making them hard to test and reason about.

Examples:

- `admin/download-exam-papers/route.ts`: 290 lines of Appwrite queries, PDF assembly, analytics tracking
- `admin/upload-local-exam-papers/route.ts`: 185 lines of file parsing, Appwrite document creation, analytics tracking
- `student/assignments/[id]/submit/route.ts`: 130 lines of assignment validation, auto-grading, comment creation, analytics tracking
- `auth/rate-limit/route.ts`: 170 lines of IP extraction, Redis rate limiting, analytics tracking
- `cron/weekly-digest/route.ts`: 50 lines of stats computation, user querying, push notification sending

## Decision

Extract business logic into service classes with constructor injection:

| Service                    | Location                                    | Responsibility                                        |
| -------------------------- | ------------------------------------------- | ----------------------------------------------------- |
| `ExamDownloadService`      | `src/lib/admin/exam-download-service.ts`    | Appwrite PDF assembly, per-student/per-paper queries  |
| `ExamUploadService`        | `src/lib/admin/exam-upload-service.ts`      | File parsing, Appwrite document creation              |
| `SubmissionService`        | `src/lib/assignments/submission-service.ts` | Assignment validation, auto-grading, comment creation |
| `AuthRateLimitService`     | `src/lib/auth/rate-limit-service.ts`        | IP extraction, Redis rate limiting                    |
| `DigestService`            | `src/lib/digest/digest-service.ts`          | Weekly stats computation, push notification sending   |
| `PlatformAnalyticsService` | `src/lib/admin/analytics-service.ts`        | Platform-wide analytics aggregation                   |

Each service:

- Accepts dependencies via constructor (`{ db, config }` pattern)
- Exports a single method (or small surface) that returns `{ status, data?, error? }`
- Contains all business logic for that domain
- Can be tested in isolation with mock dependencies

Route handlers become thin wrappers:

- Parse request body/params
- Construct service with dependencies
- Call service method
- Return HTTP response

## Consequences

**Positive:**

- Route handlers reduced to 10-25 lines (thin HTTP wrappers)
- Business logic testable without HTTP context
- Domain boundaries clearer (admin/assignments/auth/digest)
- Dependencies explicit via constructor (no hidden imports)

**Negative:**

- One extra indirection layer (route → service)
- New files to maintain (mitigated by barrel exports)

## Patterns

- **Factory injection**: Services use `{ db, config }` config objects, not positional args
- **Raw request**: `AuthRateLimitService` takes raw `Request` to extract IP headers (no adapter needed)
- **Backward compat**: Admin barrel `src/lib/admin/index.ts` re-exports all services
- **Test pattern**: Construct service with mock deps, assert on return values

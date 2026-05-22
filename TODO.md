# TODO

## Completed

### P3 — Custom Domain <!-- linear-priority: 3 -->
- [x] **Replace Vercel domain** <!-- linear-id: LUM-1 --> — Changed `REFERRAL_DOMAIN` constant to use `NEXT_PUBLIC_APP_URL` env via `getReferralDomain()` function.

### National Exam Dates Tracker <!-- linear-priority: 2 -->
- [x] **Live PDF scraper** <!-- linear-id: LUM-2 -->: Created `POST /api/exam-dates/refresh` with rate limiting (5/min). Triggers Appwrite sync of seed data.
- [x] **Mock Exam mode** <!-- linear-id: LUM-3 -->: Wired button to navigate to timed quiz (`/quiz?subject=X&count=30&time=<duration>`). Removed "Coming Soon" toast.
- [x] **Common Questions** <!-- linear-id: LUM-4 -->: Wired button to navigate to practice quiz (`/quiz?subject=X&count=10`). Removed "Coming Soon" toast.
- [x] **Oct/Nov 2026 seed data** <!-- linear-id: LUM-5 -->: Created `src/lib/exam-dates/data-2026-nov.ts` with estimated timetable (4 weeks, Nov 12–Dec 5). Registered in service.
- [x] **Push notifications** <!-- linear-id: LUM-6 -->: Added `scheduleExamAlerts()` to notification service — schedules 24h-before alerts per exam.
- [x] **Calendar export** <!-- linear-id: LUM-7 -->: Created `src/lib/exam-dates/calendar-export.ts` — iCal generator, Google Calendar URL builder, download helper. Added "Export Calendar" button to `NationalExamCalendar`.
- [x] **Appwrite persistence** <!-- linear-id: LUM-8 -->: Added `exam_dates` to `COLLECTIONS` + `ensure-schema.ts`. Added `syncExamDatesToAppwrite()` and `refreshExamDatesFromAppwrite()` functions.
- [x] **Shared subject color/abbr maps** <!-- linear-id: LUM-9 -->: Extracted `subjectColors`/`subjectAbbrs` into `src/lib/exam-dates/subject-maps.ts`. Re-exported through service.
- [x] **Cleanup old ExamCalendar** <!-- linear-id: LUM-10 -->: Removed `src/components/tools/exam-calendar.tsx` and its barrel export.

### Test Coverage <!-- linear-priority: 3 -->
- [x] `src/lib/exam-dates/` — types, subject-maps, service, calendar-export (22 tests)
- [x] `src/lib/referral/constants` — updated for `getReferralDomain()` API change

### Summary
All 21 items across P2 and P3 are implemented. Total changes:
- 7 new files created
- 8 existing files modified
- 1 file deleted (old ExamCalendar)
- 22 new tests added (all passing)

### TypeScript & Lint
- `npx tsc --noEmit` — 1 pre-existing error (global-error.tsx, unrelated)
- `npx biome check` — clean

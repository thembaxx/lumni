# MEMORY — National Exam Dates Tracker (May 2026)

## Session detection logic
`getCurrentSession()` in `src/lib/exam-dates/types.ts`:
- Jan–Jun → `{ session: "may-june", year: currentYear }`
- Jul–Sep → `{ session: "oct-nov", year: currentYear }`
- Oct–Dec → `{ session: "oct-nov", year: currentYear }`

## Data source
The official DBE PDF timetable is **image-based** (embedded JPEGs). Text extraction via `@opendataloader/pdf` and `pdfjs-dist` fails. Data was manually extracted from studentdaily.co.za's published table and hard-coded as seed data in `data-2026-may.ts`. Live PDF scraping is future work.

## Icon naming
`@hugeicons/core-free-icons` uses specific icon names. Common ones used in this module:
- `Calendar01Icon` — calendar
- `Clock01Icon` — clock/time
- `TimeScheduleIcon` — timer/countdown (NOT `ClockForwardIcon` — that doesn't exist)
- `Quiz02Icon` — practice/quiz
- `BookOpen01Icon` — mock exam
- `NoteEditIcon` — common questions
- `Cancel01Icon` — close/cancel

## Toast API
The project has both `useToast()` (React hook, returns `null | ((props) => void)`) and a top-level `toast()` export from `@/hooks/use-toast`. For non-component toasts, use the direct `toast()`. The signature is `{ type: ToastType, message: string, description?: string }` where `ToastType` is `"success" | "error" | "warning" | "info"`.

## Colors & Abbreviations
Subject color and abbreviation maps live in `src/lib/exam-dates/service.ts`. These duplicate the ones in the old `exam-calendar.tsx`. If adding a new subject, update both or extract to shared.

## Caching architecture
- **L1**: Dexie `examDates` table (IndexedDB) — keyed by `{session}_{year}`
- **L2**: In-memory seed data from `data-2026-may.ts`
- **L3 (future)**: Appwrite `exam_dates` collection — needs server-side cron + client sync
- No Appwrite write path is implemented yet. Data is seed-only + Dexie cache.

## Component wiring
- `NationalExamCalendar` replaces old `ExamCalendar` in tools dialog (tab: "calendar")
- Button on exams browse page (`exams-browse.tsx`) calls `openTools("calendar")`
- `ExamDetailDialog` opens on slot click — uses shadcn/Base UI `Dialog`
- Practice navigates to `/quiz?subject=X&count=10`
- Mock Exam & Common Questions show "Coming Soon" toasts

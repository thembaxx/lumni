# National Exam Dates Tracker — Spec

## 1. Overview

A "live" exam calendar for South African NSC/SC exams that auto-detects the current session (May–June or Oct–Nov) based on the current date, shows upcoming exams in an Apple widget-style card, and an Apple Calendar-style agenda/day view. Clicking any slot opens a detail dialog with Practice / Mock Exam / View Common Questions actions.

**Live at:** `src/components/tools/national-exam-calendar.tsx`

---

## 2. Data Source & Caching

### 2.1 Tiered Cache (CachingStrategy pattern)

| Tier | Storage | Key | TTL |
|------|---------|-----|-----|
| L1 (fastest) | Dexie (`lumni-offline` → `examDates` table) | `{session}_{year}` | 24h |
| L2 (cross-session) | Appwrite (`exam_dates` collection) | `{session}_{year}` | 24h |
| L3 (live) | `GET /api/exam-dates` | `{session}_{year}` | — |

### 2.2 Data shape

```ts
interface ExamSlot {
  id: string;
  subject: string;
  subjectId: string;           // slug for routing (e.g. "mathematics")
  paperNumber: number;         // 1 | 2 | 3
  session: "may-june" | "oct-nov";
  year: number;
  date: string;                // ISO date ("2026-05-11")
  startTime: string;           // "09:00"
  endTime: string;             // "14:00"
  durationHours: number;       // 2 | 2.5 | 3
  isSC?: boolean;              // asterisk = available to SC candidates
}
```

### 2.3 API routes

- `GET /api/exam-dates?session=may-june&year=2026` → `ExamSlot[]`  
  Returns cached or live data. On cache miss, returns seed data.
- `POST /api/exam-dates/refresh` → `{ ok: true }`  
  (Future) Triggers a PDF scrape from education.gov.za. Not implemented yet — add to TODO.md.

### 2.4 Offline behaviour

The component checks Dexie first. If offline and cached data exists, it renders immediately. If offline and no cache, shows an offline empty state with a "Last seen" indicator.

---

## 3. Component Tree

```
NationalExamCalendar
├── SessionBadge          — pill showing "May/June 2026" or "Oct/Nov 2026"
├── UpcomingExamsWidget   — Apple widget-style compact card (next 2 exams)
│   ├── WidgetRow x2      — subject+paper, friendly date, time range, hours
│   └── CountdownPill     — "Starts in 3 days" or "Ongoing" or "Ended X ago"
├── SessionSelector       — seg control: "May/June" | "Oct/Nov"
├── ExamAgendaView        — Apple Calendar-style day list (grouped by date)
│   ├── DateHeader        — "Mon 11 May 2026"
│   └── AgendaItem xN     — time dot + subject + paper + duration
└── ExamDetailDialog      — Shadcn Dialog (opens on agenda item click)
    ├── Header            — subject, paper, session badge
    ├── InfoGrid          — date, time, duration, SC availability
    ├── CountdownTimer    — live countdown to exam
    ├── PracticeBtn       — navigates to /quiz?subject=X&topic=Y
    ├── MockExamBtn       — (future) timed past-paper exam — add to TODO
    └── CommonQuesBtn     — (future) DB common questions — add to TODO
```

### Layout

- **Mobile-first**: single column, full-width cards, bottom-sheet dialog
- **Desktop**: max-w-3xl centered, dialog centered
- **Spacing**: `gap-4` between sections, `p-4` container padding

---

## 4. Session Detection Logic

```ts
function getCurrentSession(): { session: "may-june" | "oct-nov"; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-indexed
  const year = now.getFullYear();

  if (month <= 6) return { session: "may-june", year };          // Jan-Jun → current year's May/June exams
  if (month >= 10) return { session: "oct-nov", year };          // Oct-Dec → current year's Oct/Nov exams
  // Jul-Sep: transition period — check if May exams have passed
  // The May exams end late June, so Jul-Sep means Oct/Nov of same year
  return { session: "oct-nov", year };
}
```

---

## 5. UpcomingExamsWidget (Apple Widget style)

- Compact card with `rounded-2xl` corners, `p-4`, subtle shadow
- Shows the **next 2 exam slots** from today forward
- Each row:
  - **Left**: coloured subject dot (using `subjectColors` from existing codebase)
  - **Middle**: `subject` + `Paper N`
  - **Right**: `Mon 11 May` + `09:00–14:00` + `(3h)`
- **Bottom**: countdown pill reading "Starts in 3 days" / "Ongoing" / "Ended 2w ago"
- Framer Motion spring animation on mount

## 6. ExamAgendaView (Apple Calendar style)

- Groups all exam slots by date
- Each date header: large bold date like "Mon 11 May 2026"
- Each item: coloured timeline dot (left edge), subject name + paper, time range
- Empty state: "No exams scheduled" with a gentle illustration

## 7. ExamDetailDialog

- Opens via `Dialog` (shadcn/Base UI)
- Top: subject name + paper + session badge
- Date/time info in a compact 2-column grid
- Live countdown (updates every 60s) — "2 days, 14 hours until this exam"
- **Practice** button: navigates to `/quiz?subject=<subjectId>&topic=&count=10`
- **Mock Exam** button: placeholder, navigates or shows "Coming soon" toast
- **View Common Questions**: placeholder, shows "Coming soon" toast

## 8. Integration Points

### 8.1 Tools Dialog
Replace the existing `ExamCalendar` in the `tools-dialog.tsx` with `NationalExamCalendar`. The "Exams" tab shows the new component.

### 8.2 Exams Page Button
Add a button to the `exams-browse.tsx` page that opens the tools dialog to the "calendar" tab (using the existing `useToolsStore().openTools("calendar")`).

---

## 9. Seed Data

Hard-coded timetable for 2026 May/June session (extracted from official DBE PDF). Key subjects only — languages (English, Afrikaans), Mathematics, Physical Sciences, Life Sciences, Geography, History, Accounting, Business Studies, Economics, CAT, IT, Agricultural Sciences, Tourism.

Full seed in `src/lib/exam-dates/data-2026-may.ts`.

---

## 10. Future Work (add to TODO.md)

- [ ] **Live PDF scraper**: Server-side function that downloads & parses the education.gov.za timetable PDF using OCR/AI. Runs on cron + on-demand via `POST /api/exam-dates/refresh`.
- [ ] **Mock Exam mode**: Timed exam using real past papers, emulating exam hall conditions.
- [ ] **Common Questions**: Pull frequently-tested questions from the question database based on subject + paper analysis.
- [ ] **Oct/Nov 2026 data**: Need to add once the timetable is published.
- [ ] **Push notifications**: Alert users 24h before each of their exams.
- [ ] **Calendar export**: iCal / Google Calendar export button.

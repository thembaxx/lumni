# TODO

## Remaining

### P3 — Custom Domain
- [ ] **Replace Vercel domain** — Change `https://lumni-psi.vercel.app` to custom domain in referral links.

### National Exam Dates Tracker
- [ ] **Live PDF scraper**: Server-side function (`POST /api/exam-dates/refresh`) that downloads & parses the education.gov.za timetable PDF using OCR/AI. Runs on cron + on-demand.
- [ ] **Mock Exam mode**: Timed exam using real past papers, emulating exam hall conditions. Button exists in `ExamDetailDialog` with a "Coming Soon" toast.
- [ ] **Common Questions**: Pull frequently-tested questions from the question database based on subject + paper analysis. Button exists in `ExamDetailDialog` with a "Coming Soon" toast.
- [ ] **Oct/Nov 2026 seed data**: Add timetable once published by DBE.
- [ ] **Push notifications**: Alert users 24h before each of their enrolled subjects' exams.
- [ ] **Calendar export**: iCal / Google Calendar export button in `NationalExamCalendar`.
- [ ] **Appwrite persistence**: Write the `exam_dates` collection + sync so data is available across sessions without depending on seed data.
- [ ] **Shared subject color/abbr maps**: Extract `subjectColors`/`subjectAbbrs` from `src/lib/exam-dates/service.ts` into a shared location.
- [ ] **Cleanup old ExamCalendar**: Remove `src/components/tools/exam-calendar.tsx` once `NationalExamCalendar` is verified in production.

### Test Coverage
- [ ] `src/lib/db/` (15 files) — persistence layer
- [ ] `src/lib/sync/` — offline/online sync handler
- [ ] `src/lib/exams/` — marker client, exam paper sync
- [ ] `src/lib/referral/` — client, service, types
- [ ] `src/lib/server/` (7 files) — server actions
- [ ] `src/lib/ai/` — index.ts, types.ts, with-budget.ts, providers
- [ ] `src/lib/visual-engine/` — prompts, resolvers, renderers
- [ ] Integration tests (orchestrator ↔ engine pipelines)
- [ ] E2E tests (Playwright/Cypress)
- [ ] Component tests (`src/components/`)

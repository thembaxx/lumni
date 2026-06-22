# Plan 036: Content expansion — exam papers + question banks

## Scope

- Add more CAPS exam papers (2024 + 2025 papers across Mathematics, Physics, Accounting, Geography, History, Life Sciences)
- Expand seed data for all 24 TinyFish subjects
- Add missing exam dates for upcoming exam cycles
- Expand question bank capacity

## Approach

- Exam paper seeding infrastructure already exists at `src/lib/seed/seed-exam-papers.ts`
- Pattern: add paper metadata + question count per paper
- Add seed data for 2024 Nov + 2025 May/June exams
- Update exam dates for 2026 Oct/Nov cycle

## Done criteria

- 2024 November papers added for all major subjects
- 2025 May/June papers added
- 2026 Oct/Nov exam dates populated
- Total exam papers count increased significantly

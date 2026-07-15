## Description
Competency-weighted study planner that reads live competency data, applies inverse-weight round-robin scheduling, generates adaptive daily sessions, and syncs bidirectionally with quiz/flashcard outcomes.

## Acceptance Criteria
- [ ] `GET /api/engine/adaptive-plan` -- input: target APS, daily minutes, horizon days, weakTopicsOnly flag
- [ ] Algorithm: inverse-competency-weighted round-robin (novice topics 3x, developing 2x, proficient 1x, mastered 0.5x)
- [ ] Per-topic competency from `CompetencyEngine` (avg score, trend, session count) -- reads via `DataAccess.competencies`
- [ ] Output: `StudySession[]` with subject, topic, subtopic, duration, questionCount, bloomLevel, difficulty
- [ ] Bidirectional sync: quiz completion → competency update → plan regeneration (debounced 6h)
- [ ] Dashboard: `<AdaptivePlanCard>` -- progress ring, today's sessions, "Regenerate" button, adherence streak
- [ ] Parent/Teacher visibility: weekly digest includes plan adherence % and competency gap closure
- [ ] Calendar export: iCal + Google Calendar link (weekly recurring events)

## Technical Details
- Extends `StudyPlannerService` (S38) + `CompetencyEngine` (S5/6) + `QuizResultProcessor` (S37)
- `generateDeterministicSchedule()` in `schedule-generator.ts` (S39) -- pure function, testable
- Event-driven: `quiz.completed` → `competency.updated` → `plan.regenerate` (Event Bus, NEW)
- Dexie: `studyPlans` (v31) + new `planSessions` table for granular tracking
- `CachedAIGenerator<StudyPlan>` for AI-enhanced plan variants (optional)

## Dependencies
- Event Bus implementation (Zustand + BroadcastChannel)
- CompetencyEngine per-paper (P1/P2) competency split (S5)
- QuizResultProcessor discriminated union (bolt|quiz|exam|flashcard)

## Effort
2-3 sprints (1-2 engineers)

## Risks
- Cold start: new users have no competency data -- fallback to curriculum sequence
- Over-scheduling: daily minutes > available time -- cap at 80% of input
- Plan drift: competency changes faster than plan regenerates -- 6h debounce + manual trigger
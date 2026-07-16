## Description

Predictive risk alerts for teachers/parents based on student quiz/flashcard/exam performance trends. Early intervention nudges for students showing competency decay, streak breaks, or topic avoidance.

## Acceptance Criteria

- [ ] Risk model: `AnalyticsEngine.computeRiskScore(userId, windowDays=14)` → `{score: 0-1, factors: RiskFactor[], recommendation: string}`
- [ ] Risk factors: quiz streak break (>3 days), competency decay (topic score -15% vs 30d avg), flashcard ease-hell (interval > 30d, ease < 1.3), exam practice gap (no past paper > 14d), session duration drop (>30%)
- [ ] Teacher dashboard: `/teacher/students/[id]/risk` -- risk score trend line, factor breakdown, "Intervene" button (creates observation + notification)
- [ ] Parent digest: weekly push + email -- "Thando's Mathematics competency dropped 18% this week. Suggested: 15min daily Algebra practice."
- [ ] Student nudge: in-app banner "You've missed 3 days of flashcards. 5min review now?" -- dismissible, max 1/day
- [ ] Alert precision/recall tracking: `AnalyticsEvents.riskAlertFired`, `riskAlertActioned` (click/intervene), `riskAlertDismissed`
- [ ] Privacy: student opt-in for parent sharing (default off); teacher sees all assigned students; POPIA-compliant data handling

## Technical Details

- Extends `AnalyticsService` (S37) + `RetentionService` (S26) + `DigestService` (S34)
- `PlatformAnalyticsService` (S37) -- comparative cohort baselines for "normal" decay rates
- Risk model: lightweight logistic regression (scikit-learn via Python microservice or ONNX runtime in Node) -- features from Dexie `analyticsEvents`, `competencies`, `flashcards`, `examSessions`
- Inference endpoint: `POST /api/analytics/risk-score` -- called by cron (daily 06:00 SAST) + on-demand from teacher dashboard
- `DigestService` -- `generateRiskDigest(userId)` uses risk model output + template
- `PushDeliveryService` (S38) -- sends to student/parent/teacher tokens
- Teacher observation: `POST /api/teacher/observations` -- links to risk alert ID

## Dependencies

- AnalyticsEngine trends (S37) -- DONE
- WeeklyDigest cron (S34) -- DONE
- PushDeliveryService (S38) -- DONE
- Teacher observations (S34) -- DONE
- POPIA consent flow -- NEEDS REVIEW

## Effort

2-3 sprints (1 backend/ML, 1 frontend, 0.5 privacy/legal)

## Risks

- Alert fatigue -- tune threshold, max 1 alert/user/week, user preference controls
- False positives -- A/B test threshold, track precision/recall, human-in-the-loop teacher confirmation
- Parent data access -- explicit student consent required (POPIA); default opt-out

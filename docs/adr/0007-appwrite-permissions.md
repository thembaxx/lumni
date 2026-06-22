# ADR-06: Appwrite Permission Model — User vs. Team vs. Admin Access Patterns

**Status:** Accepted  
**Date:** 2026-05-23  
**Author:** Senior Frontend Architect

## Context

Lumni serves three access tiers: students (users), parents/guardians (read-only on child data), and teachers/admins (class-level analytics). Appwrite permissions must be granular and POPIA-compliant.

## Decision

| Role           | Read Access                    | Write Access         | Collections                                |
| -------------- | ------------------------------ | -------------------- | ------------------------------------------ |
| Student (user) | Own data only                  | Own data only        | users, progress, exam_sessions, flashcards |
| Parent (team)  | Linked child data              | Consent records only | parent_consents, child_progress (read)     |
| Teacher (team) | Class-aggregated (≥5 students) | Assignments only     | class_analytics (read), assignments        |
| Admin (role)   | All data                       | All data             | questions, exam_papers, question_ratings   |

Rules:

1. Individual student data is never exposed to teachers unless aggregated to ≥5 students.
2. Parent access requires explicit child consent stored in `parent_consents` collection.
3. Admin writes use server-side SDK (`node-appwrite`) with API key; no admin actions from browser client.
4. All collection access goes through typed SDK wrappers in `src/lib/appwrite.ts`.

## Consequences

- **Positive:** POPIA compliance; clear data boundaries; safe multi-tenancy
- **Negative:** Complex permission matrix; requires regular audits

## Related

- `src/lib/appwrite.ts`
- `src/components/parent/parent-shell.tsx`

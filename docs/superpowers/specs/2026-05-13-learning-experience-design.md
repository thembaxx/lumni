# Phase 2: Learning Experience System

## Overview

Build a unified learning experience layer on top of the Phase 1 Orchestrator + Job Queue. Three subsystems that work together: Curriculum Engine (topic trees), Competency System (Bloom's-level mastery tracking), and PathEngine (personalized study recommendations).

## Architecture

```
Question answered
       │
       ▼
LearningOrchestrator.gradeAndTrack()   ← Phase 1
       │
       ├── JobQueue: competency-update  ★ NEW
       │       │
       │       ▼
       │   CompetencyService.update()
       │     → Dexie: upsert competency record
       │     → Sync queue: Appwrite sync
       │
       ▼
  PathEngine (reads competencies)
       │
       ├── getNextTopics()      → "Study Algebra next"
       ├── generateStudyPlan()   → "Week 3: Calculus"
       └── getNextAction()       → "Practice Algebra expressions"
```

## Components

### 1. Curriculum Schema (`src/curriculum/`)

Each subject gets a JSON file defining its topic hierarchy (2 levels: topics + subtopics) with prerequisites and a Bloom's target ceiling.

```typescript
// src/curriculum/types.ts
interface CurriculumTopic {
  id: string;
  name: string;
  order: number;
  prerequisites: string[];
  bloomTarget: BloomLevel;
  subtopics: CurriculumSubtopic[];
}

interface CurriculumSubtopic {
  id: string;
  name: string;
  order: number;
}

interface SubjectCurriculum {
  subjectId: string;
  subjectName: string;
  topics: CurriculumTopic[];
}
```

**CurriculumRegistry** — loads all curriculum JSON files, provides lookups:
- `getSubject(subjectId)` → `SubjectCurriculum | null`
- `getTopic(subjectId, topicId)` → `CurriculumTopic | null`
- `getAvailableTopics(subjectId, masteredTopics)` → topics whose prerequisites are met
- `getPrerequisiteChain(subjectId, topicId)` → linearized prerequisite path

Initial curriculum files: mathematics, physical-sciences, life-sciences, accounting, business-studies, economics, geography, history, english-home-language, afrikaans-home-language, information-technology (11 core NSC subjects). Others default to flat model (no prerequisites, bloomTarget = "remember").

### 2. Competency System (`src/lib/competency-engine/`)

**Dexie Schema** (v5 migration, new `competencies` table):

```typescript
interface CompetencyRecord {
  id?: number;
  subjectId: string;
  topicId: string;
  bloomLevel: BloomLevel;
  score: number;            // 0-100, weighted rolling average
  attempts: number;
  lastAssessed: number;
  level: CompetencyLevel;
}

type CompetencyLevel = "novice" | "developing" | "proficient" | "mastered";
```

Thresholds: `novice < 40 < developing < 65 < proficient < 85 < mastered`

**Scoring formula** (weighted rolling average):
```
newScore = (existingScore * existingAttempts + questionScore * weight) / (existingAttempts + weight)
weight = 1.0 if question.bloomLevel <= topic.bloomTarget, else 0.5
```

**CompetencyService**:
- `update(subjectId, topicId, bloomLevel, score)` — upserts Dexie record, enqueues Appwrite sync
- `getCompetencies(subjectId)` — returns all records for a subject
- `getCompetency(subjectId, topicId)` — single record
- `getMasterySummary(subjectId)` — aggregate stats per subject

### 3. PathEngine (`src/lib/competency-engine/path-engine.ts`)

Read-only recommendation engine that consumes competencies and curriculum.

```typescript
class PathEngine {
  getNextTopics(
    subjectId: string,
    competencies: Map<string, CompetencyRecord>,
  ): TopicRecommendation[];

  generateStudyPlan(
    subjectId: string,
    competencies: Map<string, CompetencyRecord>,
    examDates?: { date: number; daysUntil: number }[],
    dailyGoalMinutes?: number,
  ): StudyPlanDay[];

  getNextAction(
    subjects: string[],
    competencies: Map<string, CompetencyRecord>,
  ): NextAction;
}

interface TopicRecommendation {
  topicId: string;
  name: string;
  level: CompetencyLevel;
  reason: "prerequisite-not-met" | "ready-to-start" | "needs-practice" | "needs-review" | "mastered";
  action: "study" | "practice" | "review" | "skip";
  estimatedMinutes: number;
}
```

**Recommendation Algorithm:**
1. Get topics sorted by curriculum order
2. Filter to available (prerequisites met)
3. For each: check competency level → assign reason/action
4. Priority: exam date boost → recency decay → prerequisite ordering
5. Return sorted list of recommendations

### 4. Integration with Phase 1

**New job type** added to existing orchestrator:
```
"competency-update"  priority: 60,  retries: 2  → CompetencyService.update()
```

**LearningOrchestrator.gradeAndTrack()** adds one line:
```typescript
const competencyJobId = await jobQueue.enqueue("competency-update", {
  subject: question.subject,
  topic: question.topic,
  bloomLevel: question.bloomTaxonomy,
  score: (result.score / result.maxScore) * 100,
});
```

## New Files

| File | Purpose |
|------|---------|
| `src/curriculum/types.ts` | CurriculumTopic, SubjectCurriculum |
| `src/curriculum/index.ts` | CurriculumRegistry class |
| `src/curriculum/*.json` | Per-subject topic trees (11 core) |
| `src/lib/competency-engine/types.ts` | CompetencyRecord, CompetencyLevel |
| `src/lib/competency-engine/competency-service.ts` | CRUD + scoring |
| `src/lib/competency-engine/path-engine.ts` | Recommendation engine |
| `src/lib/competency-engine/index.ts` | Barrel |
| `src/hooks/use-competencies.ts` | React Query hook |
| `src/hooks/use-next-topics.ts` | PathEngine recommendation hook |
| `src/hooks/use-study-plan.ts` | Study plan generation hook |
| `src/app/api/engine/next-topics/route.ts` | Next topics endpoint |
| `src/app/api/engine/study-plan/route.ts` | Study plan endpoint |

## Modified Files

| File | Change |
|------|--------|
| `src/lib/db/offline.ts` | v5 migration: add `competencies` table |
| `src/lib/orchestrator/learning-orchestrator.ts` | Enqueue competency-update job |
| `src/lib/orchestrator/job-processor.ts` | Add competency-update handler |
| `src/lib/orchestrator/types.ts` | Add "competency-update" job type |
| `src/lib/db/client.ts` | Add `COMPETENCIES` to COLLECTIONS |

## Implementation Order

1. Curriculum types + CurriculumRegistry + core JSON files
2. Competency types + Dexie v5 migration
3. CompetencyService
4. PathEngine
5. Integration: job type + orchestrator line + job processor handler
6. API routes: next-topics + study-plan
7. Client hooks: use-competencies, use-next-topics, use-study-plan

## Self-Review Checklist

- [x] No placeholders or TODOs
- [x] All sections internally consistent
- [x] Scoped correctly for a single implementation plan (builds on Phase 1)
- [x] No ambiguity in schema, interfaces, or algorithms

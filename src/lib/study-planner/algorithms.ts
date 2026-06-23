import { getCachedGraph } from "@/lib/knowledge-graph/service";
import type { ExamDateInfo } from "@/lib/utils/study-planner";
import type { StudyPlan, StudyPlanSettings, SubjectCompetency, TopicPlan } from "./types";

/**
 * Calculate the weight of each subject based on the target APS and the current competency.
 * This is a simplified algorithm. In a real-world scenario, this would be more complex.
 * For now, we'll assume that the weight is inversely proportional to the current competency
 * (i.e., the weaker the subject, the higher the weight) and then normalize so that the
 * weights sum to 1.
 */
export function calculateSubjectWeights(
  subjects: SubjectCompetency[],
  _targetAps: number,
): number[] {
  // We'll use the inverse of the current competency level (with a minimum of 0.1 to avoid division by zero)
  const inverseLevels = subjects.map((sub) => 1 / Math.max(sub.level, 0.1));

  // Normalize the inverse levels so they sum to 1
  const sumInverse = inverseLevels.reduce((sum, inv) => sum + inv, 0);
  const weights = inverseLevels.map((inv) => inv / sumInverse);

  return weights;
}

/**
 * Distribute the daily study minutes among the subjects based on their weights.
 * Returns an array of minutes allocated to each subject.
 */
export function allocateDailyMinutes(
  settings: StudyPlanSettings,
  subjectWeights: number[],
): number[] {
  const totalMinutes = settings.dailyStudyMinutes;
  return subjectWeights.map((weight) => totalMinutes * weight);
}

/**
 * Generate a study plan using a constraint-based scheduling approach.
 *
 * Algorithm:
 * 1. Sort topics by mastery ascending (weakest subjects first).
 * 2. For each day in the horizon, assign topics weighted by:
 *    - Inverse competency (lower mastery = more sessions)
 *    - Time until exam (endDate within 7 days gets priority)
 * 3. Enforce max 3 different subjects per day.
 * 4. Enforce at least 1 rest day per week (no sessions on that day).
 *
 * Bloom level progression (remember → apply → analyze → create) can be layered
 * in once per-topic Bloom levels are stored in SubjectCompetency.
 */
export async function generateStudyPlan(
  settings: StudyPlanSettings,
  subjects: SubjectCompetency[],
  examDates: ExamDateInfo[] = [],
): Promise<StudyPlan> {
  const startDate = new Date(settings.startDate);
  let endDate = new Date(settings.endDate);
  const studyDays = settings.studyDays;
  const studyDaySet = new Set(studyDays);
  const dailyMinutes = settings.dailyStudyMinutes;
  const msPerDay = 86400000;

  // Build exam date map: subjectId → Set of date strings
  const examMap = new Map<string, Set<string>>();
  let earliestExamDate: Date | null = null;
  for (const ed of examDates) {
    if (!examMap.has(ed.subjectId)) examMap.set(ed.subjectId, new Set());
    examMap.get(ed.subjectId)?.add(ed.date);
    const d = new Date(ed.date);
    if (!earliestExamDate || d < earliestExamDate) earliestExamDate = d;
  }

  // Adjust endDate to day before earliest exam
  if (earliestExamDate && earliestExamDate < endDate) {
    const dayBefore = new Date(earliestExamDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    endDate = dayBefore;
  }

  // Days until end for exam-proximal weighting
  const daysUntilEnd = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
  const isExamSoon = daysUntilEnd <= 7;

  // 1. Calculate subject weights from inverse competency
  let subjectWeights = calculateSubjectWeights(subjects, settings.targetAps);

  // Boost weight for subjects with exams within 14 days
  const now = new Date();
  for (const [idx, subject] of subjects.entries()) {
    const subjExams = examMap.get(subject.subjectId);
    if (!subjExams) continue;
    for (const dateStr of subjExams) {
      const examDate = new Date(dateStr);
      const daysUntil = Math.ceil((examDate.getTime() - now.getTime()) / msPerDay);
      if (daysUntil >= 0 && daysUntil <= 14) {
        subjectWeights[idx] *= 1.2;
        break;
      }
    }
  }
  // Renormalize
  const weightSum = subjectWeights.reduce((a, b) => a + b, 0);
  if (weightSum > 0) subjectWeights = subjectWeights.map((w) => w / weightSum);

  // 2. Build topic candidates
  interface TopicCandidate {
    topic: TopicPlan;
    subjectLevel: number;
    subjectWeight: number;
  }

  const candidates: TopicCandidate[] = [];
  for (const [subjectIdx, subject] of subjects.entries()) {
    const topicCount = subject.topics.length;
    const minutesPerTopic =
      topicCount > 0 ? (dailyMinutes * subjectWeights[subjectIdx]) / topicCount : 0;

    const completedSet = new Set(subject.completedTopics ?? []);
    for (const topicId of subject.topics) {
      candidates.push({
        topic: {
          topicId,
          subjectId: subject.subjectId,
          estimatedMinutes: completedSet.has(topicId) ? 0 : minutesPerTopic,
          priority: Math.round((100 - subject.level) / 10) + 1,
          scheduledDate: undefined,
          actualMinutesSpent: 0,
          isCompleted: completedSet.has(topicId),
        },
        subjectLevel: subject.level,
        subjectWeight: subject.weight,
      });
    }
  }

  // 2.5 Prerequisite check using cached knowledge graph
  const graphResults = await Promise.all(
    candidates.map(async (cand) => {
      try {
        const graph = await getCachedGraph(cand.topic.subjectId, cand.topic.topicId);
        return { topicId: cand.topic.topicId, graph };
      } catch {
        return { topicId: cand.topic.topicId, graph: null };
      }
    }),
  );
  const graphMap = new Map(graphResults.map((r) => [r.topicId, r.graph]));

  for (const cand of candidates) {
    const graph = graphMap.get(cand.topic.topicId);
    if (!graph) continue;

    const prereqTopicIds = new Set<string>();
    for (const n of graph.nodes) {
      if (n.type === "prerequisite") {
        prereqTopicIds.add(n.id);
      }
    }

    if (prereqTopicIds.size === 0) continue;

    const candidatesByTopic = new Map(candidates.map((c) => [c.topic.topicId.toLowerCase(), c]));
    let hasUnsatisfiedPrereq = false;
    for (const prereqId of prereqTopicIds) {
      const prereqTopic = candidatesByTopic.get(prereqId);
      if (
        prereqTopic &&
        prereqTopic.topic.topicId !== cand.topic.topicId &&
        !prereqTopic.topic.isCompleted
      ) {
        hasUnsatisfiedPrereq = true;
        break;
      }
    }

    if (hasUnsatisfiedPrereq) {
      cand.topic.priority = Math.max(1, cand.topic.priority - 2);
    }
  }

  // Sort: weakest subjects first (ascending level = lower mastery)
  candidates.sort((a, b) => {
    const levelDiff = a.subjectLevel - b.subjectLevel;
    if (levelDiff !== 0) return levelDiff;
    return b.topic.priority - a.topic.priority;
  });

  // 3. Generate study dates with at least 1 rest day per week
  const studyDates: Date[] = [];
  const cursor = new Date(startDate);
  let daysSinceRest = 0;

  // oxlint-disable-next-line no-unmodified-loop-condition — cursor is modified via setDate() inside
  while (cursor <= endDate) {
    if (studyDaySet.has(cursor.getDay())) {
      if (daysSinceRest >= 6) {
        daysSinceRest = 0;
        cursor.setDate(cursor.getDate() + 1);
        continue;
      }
      studyDates.push(new Date(cursor));
      daysSinceRest++;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (studyDates.length === 0) {
    return {
      settings,
      subjects,
      topics: candidates.map((c) => c.topic),
      totalEstimatedMinutes: 0,
      totalActualMinutesSpent: 0,
      progress: 0,
    };
  }

  // Helper: check if a subject has an exam on a given date
  function isExamDay(subjectId: string, dateStr: string): boolean {
    return examMap.get(subjectId)?.has(dateStr) ?? false;
  }

  // Helper: check if a subject has an exam the next day (rest day before exam)
  function isDayBeforeExam(subjectId: string, dateObj: Date): boolean {
    const next = new Date(dateObj);
    next.setDate(next.getDate() + 1);
    const nextStr = next.toISOString().split("T")[0];
    return isExamDay(subjectId, nextStr);
  }

  // Filter out completed topics from scheduling (keep in candidates for prerequisite checking)
  const uncompletedCandidates = candidates.filter(
    (c) => c.topic.isCompleted !== true || c.topic.estimatedMinutes > 0,
  );

  // 4. Constraint-based assignment
  const assigned: TopicPlan[] = [];
  const unassigned = [...uncompletedCandidates];
  const dayRemaining = new Map<string, number>();
  const daySubjects = new Map<string, Set<string>>();

  for (const d of studyDates) {
    const key = d.toISOString().split("T")[0];
    dayRemaining.set(key, dailyMinutes);
    daySubjects.set(key, new Set());
  }

  // First pass: assign respecting 3-subject-per-day constraint
  // Exam-proximal weighting: when exam is soon, pack more aggressively
  const maxSubjectsPerDay = isExamSoon ? 4 : 3;

  for (const d of studyDates) {
    const key = d.toISOString().split("T")[0];
    let remaining = dayRemaining.get(key) ?? 0;
    const todaySubjects = daySubjects.get(key) ?? new Set<string>();

    for (let i = unassigned.length - 1; i >= 0; i--) {
      if (remaining <= 0) break;
      const cand = unassigned[i];
      const candSubjectId = cand.topic.subjectId;

      // Skip if subject has an exam today
      if (isExamDay(candSubjectId, key)) continue;
      // Skip day before exam (rest day for that subject)
      if (isDayBeforeExam(candSubjectId, d)) continue;

      if (cand.topic.estimatedMinutes > remaining) continue;
      if (!todaySubjects.has(candSubjectId) && todaySubjects.size >= maxSubjectsPerDay) {
        continue;
      }

      cand.topic.scheduledDate = key;
      assigned.push(cand.topic);
      todaySubjects.add(cand.topic.subjectId);
      remaining -= cand.topic.estimatedMinutes;
      dayRemaining.set(key, remaining);
      unassigned.splice(i, 1);
    }
  }

  // Second pass: spillover into remaining daily capacity (subject limit relaxed)
  for (const d of studyDates) {
    const key = d.toISOString().split("T")[0];
    let remaining = dayRemaining.get(key) ?? 0;

    for (let i = unassigned.length - 1; i >= 0; i--) {
      if (remaining <= 0) break;
      const cand = unassigned[i];

      if (isExamDay(cand.topic.subjectId, key)) continue;
      if (isDayBeforeExam(cand.topic.subjectId, d)) continue;
      if (cand.topic.estimatedMinutes > remaining) continue;

      cand.topic.scheduledDate = key;
      assigned.push(cand.topic);
      remaining -= cand.topic.estimatedMinutes;
      unassigned.splice(i, 1);
    }
  }

  // Third pass: overflow onto the end date
  while (unassigned.length > 0) {
    const cand = unassigned.shift();
    if (!cand) break;
    cand.topic.scheduledDate = endDate.toISOString().split("T")[0];
    assigned.push(cand.topic);
  }

  const totalEstimatedMinutes = assigned.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  return {
    settings,
    subjects,
    topics: assigned,
    totalEstimatedMinutes,
    totalActualMinutesSpent: 0,
    progress: 0,
  };
}

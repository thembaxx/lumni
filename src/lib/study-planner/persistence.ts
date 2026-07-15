import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";
import type { PersistenceStudyPlan, StudySession, ExamDate } from "./types";

const STUDY_PLAN_DEXIE_KEY = "default";

let _cachedPlan: PersistenceStudyPlan | null = null;

function defaultStudyPlan(): PersistenceStudyPlan {
  return {
    sessions: [],
    examDates: [],
    generatedAt: 0,
    stale: false,
    lastCompetencyRefresh: 0,
    progress: 0,
    totalActualMinutes: 0,
  };
}

export function loadStudyPlan(): PersistenceStudyPlan {
  if (!_cachedPlan) _cachedPlan = defaultStudyPlan();
  return _cachedPlan;
}

export async function loadStudyPlanFromDexie(): Promise<PersistenceStudyPlan> {
  try {
    const record = await dexieDataAccess.studyPlans.get(STUDY_PLAN_DEXIE_KEY);
    if (record) {
      const plan = JSON.parse(record.plan) as PersistenceStudyPlan;
      _cachedPlan = plan;
      return plan;
    }
  } catch {
    // fall through
  }
  return loadStudyPlan();
}

export function saveStudyPlan(plan: PersistenceStudyPlan): void {
  _cachedPlan = plan;
  dexieDataAccess.studyPlans
    .put({
      id: STUDY_PLAN_DEXIE_KEY,
      plan: JSON.stringify(plan),
      updatedAt: Date.now(),
    })
    .catch((err) => logError("SaveStudyPlan", err));
}

export function markPlanStale(): void {
  const plan = loadStudyPlan();
  if (!plan.stale) {
    plan.stale = true;
    saveStudyPlan(plan);
  }
}

export function clearPlanStale(): void {
  const plan = loadStudyPlan();
  plan.stale = false;
  plan.lastCompetencyRefresh = Date.now();
  saveStudyPlan(plan);
}

export function getWeekOldThreshold(): number {
  return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

function generateRecurringSessions(session: Omit<StudySession, "id">): Omit<StudySession, "id">[] {
  if (!session.repeat || session.repeat === "none") return [session];

  const results: Omit<StudySession, "id">[] = [session];
  const interval = session.repeat === "daily" ? 1 : 7;

  for (let i = 1; i <= 4; i++) {
    results.push({
      ...session,
      scheduledAt: session.scheduledAt + i * interval * 24 * 60 * 60 * 1000,
    });
  }

  return results;
}

export function addStudySession(session: Omit<StudySession, "id">): PersistenceStudyPlan {
  const plan = loadStudyPlan();
  const sessions = generateRecurringSessions(session);

  for (const s of sessions) {
    const newSession: StudySession = {
      ...s,
      repeat: "none",
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    plan.sessions.push(newSession);
  }

  plan.generatedAt = Date.now();
  saveStudyPlan(plan);
  return plan;
}

function recalculateProgress(plan: PersistenceStudyPlan): void {
  const planned = plan.sessions.filter((s) => s.duration > 0);
  const completed = planned.filter((s) => s.completed);
  const totalPlanned = planned.reduce((sum, s) => sum + s.duration, 0);
  const totalCompleted = completed.reduce((sum, s) => sum + (s.actualDuration ?? s.duration), 0);
  plan.progress = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  plan.totalActualMinutes = completed.reduce((sum, s) => sum + (s.actualDuration ?? s.duration), 0);
}

export function updateStudySession(
  id: string,
  updates: Partial<StudySession>,
): PersistenceStudyPlan {
  const plan = loadStudyPlan();
  const index = plan.sessions.findIndex((s) => s.id === id);
  if (index >= 0) {
    plan.sessions[index] = { ...plan.sessions[index], ...updates };
    recalculateProgress(plan);
    plan.generatedAt = Date.now();
    saveStudyPlan(plan);
  }
  return plan;
}

export function deleteStudySession(id: string): PersistenceStudyPlan {
  const plan = loadStudyPlan();
  plan.sessions = plan.sessions.filter((s) => s.id !== id);
  plan.generatedAt = Date.now();
  saveStudyPlan(plan);
  return plan;
}

export function addExamDate(exam: Omit<ExamDate, "id" | "daysUntil">): PersistenceStudyPlan {
  const plan = loadStudyPlan();
  const daysUntil = Math.ceil((exam.date - Date.now()) / (1000 * 60 * 60 * 24));
  const newExam: ExamDate = {
    ...exam,
    id: `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    daysUntil: Math.max(0, daysUntil),
  };
  plan.examDates.push(newExam);
  plan.generatedAt = Date.now();
  saveStudyPlan(plan);
  return plan;
}

export function deleteExamDate(id: string): PersistenceStudyPlan {
  const plan = loadStudyPlan();
  plan.examDates = plan.examDates.filter((e) => e.id !== id);
  plan.generatedAt = Date.now();
  saveStudyPlan(plan);
  return plan;
}

export function getUpcomingSessions(days: number = 7): StudySession[] {
  const plan = loadStudyPlan();
  const cutoff = Date.now() + days * 24 * 60 * 60 * 1000;
  return plan.sessions
    .filter((s) => s.scheduledAt <= cutoff && !s.completed)
    .toSorted((a, b) => a.scheduledAt - b.scheduledAt);
}

export function getUpcomingExams(): ExamDate[] {
  const plan = loadStudyPlan();
  return plan.examDates.filter((e) => e.daysUntil >= 0).toSorted((a, b) => a.date - b.date);
}

export function getTodaySessions(): StudySession[] {
  const plan = loadStudyPlan();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

  return plan.sessions.filter((s) => s.scheduledAt >= startOfDay && s.scheduledAt < endOfDay);
}

export function autoScheduleSessions(
  subjects: string[],
  weakTopics: Record<string, string[]>,
  dailyGoalMinutes: number = 30,
): PersistenceStudyPlan {
  const plan = loadStudyPlan();
  const now = Date.now();
  const sessions: StudySession[] = [];

  subjects.forEach((subject) => {
    const topics = weakTopics[subject] || [];
    if (topics.length === 0) return;

    const sessionDuration = Math.min(dailyGoalMinutes / subjects.length, 45);
    let dayOffset = 0;

    topics.slice(0, 3).forEach((topic) => {
      const scheduledAt = now + dayOffset * 24 * 60 * 60 * 1000;
      sessions.push({
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        subject,
        topic,
        type: "quiz",
        scheduledAt,
        duration: Math.round(sessionDuration),
        completed: false,
      });
      dayOffset++;
    });
  });

  plan.sessions = [...plan.sessions, ...sessions];
  plan.generatedAt = Date.now();
  saveStudyPlan(plan);

  return plan;
}

export function getStudyStats(): {
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  studyTimeMinutes: number;
  examCount: number;
  daysUntilNextExam: number | null;
  progress: number;
  totalActualMinutes: number;
  totalPlannedMinutes: number;
} {
  const plan = loadStudyPlan();
  const now = Date.now();
  const upcomingExams = plan.examDates
    .filter((e) => e.daysUntil > 0)
    .toSorted((a, b) => a.date - b.date);

  let completedSessions = 0;
  let upcomingSessions = 0;
  let totalPlannedMinutes = 0;
  let totalActualMinutes = 0;

  for (const s of plan.sessions) {
    if (s.completed) {
      completedSessions++;
      totalActualMinutes += s.actualDuration ?? s.duration;
    } else if (s.scheduledAt >= now) {
      upcomingSessions++;
    }
    if (s.duration > 0) {
      totalPlannedMinutes += s.duration;
    }
  }

  const progress =
    totalPlannedMinutes > 0
      ? Math.round((totalActualMinutes / totalPlannedMinutes) * 100)
      : (plan.progress ?? 0);

  return {
    totalSessions: plan.sessions.length,
    completedSessions,
    upcomingSessions,
    studyTimeMinutes: totalActualMinutes,
    examCount: plan.examDates.length,
    daysUntilNextExam: upcomingExams[0]?.daysUntil || null,
    progress,
    totalActualMinutes,
    totalPlannedMinutes,
  };
}

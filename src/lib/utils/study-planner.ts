import type { StudyDataAccess } from "@/lib/db/data-access";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { logError } from "@/lib/shared/logger";
import { loadFromStorage, saveToStorage } from "./storage";

let _deps: { db: StudyDataAccess } = Object.freeze({ db: dexieDataAccess });
export function __setDepsForTesting(deps: { db: StudyDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export interface StudySession {
  id: string;
  subject: string;
  topic?: string;
  type: "quiz" | "flashcard" | "exam" | "review";
  scheduledAt: number;
  duration: number;
  completed: boolean;
  completedAt?: number;
  actualDuration?: number;
  notes?: string;
  repeat?: "daily" | "weekly" | "none";
}

export interface ExamDate {
  id: string;
  subject: string;
  paper: string;
  date: number;
  daysUntil: number;
  notes?: string;
}

export interface StudyPlan {
  sessions: StudySession[];
  examDates: ExamDate[];
  generatedAt: number;
  stale: boolean;
  lastCompetencyRefresh: number;
  progress?: number;
  totalActualMinutes?: number;
}

const STUDY_PLAN_KEY = "lumni_study_plan";
const STUDY_PLAN_DEXIE_KEY = "default";

function defaultStudyPlan(): StudyPlan {
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

export function loadStudyPlan(): StudyPlan {
  return loadFromStorage<StudyPlan>(STUDY_PLAN_KEY, defaultStudyPlan());
}

export async function loadStudyPlanFromDexie(): Promise<StudyPlan> {
  try {
    const record = await _deps.db.studyPlans.get(STUDY_PLAN_DEXIE_KEY);
    if (record) return JSON.parse(record.plan) as StudyPlan;
  } catch {
    // fall through
  }
  return loadStudyPlan();
}

export function saveStudyPlan(plan: StudyPlan): void {
  saveToStorage(STUDY_PLAN_KEY, plan);
  _deps.db.studyPlans
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
    saveToStorage(STUDY_PLAN_KEY, plan);
  }
}

export function clearPlanStale(): void {
  const plan = loadStudyPlan();
  plan.stale = false;
  plan.lastCompetencyRefresh = Date.now();
  saveToStorage(STUDY_PLAN_KEY, plan);
}

export function getWeekOldThreshold(): number {
  return Date.now() - 7 * 24 * 60 * 60 * 1000;
}

export interface ExamDateInfo {
  subjectId: string;
  date: string;
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

export function addStudySession(session: Omit<StudySession, "id">): StudyPlan {
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

function recalculateProgress(plan: StudyPlan): void {
  const planned = plan.sessions.filter((s) => s.duration > 0);
  const completed = planned.filter((s) => s.completed);
  const totalPlanned = planned.reduce((sum, s) => sum + s.duration, 0);
  const totalCompleted = completed.reduce((sum, s) => sum + (s.actualDuration ?? s.duration), 0);
  plan.progress = totalPlanned > 0 ? Math.round((totalCompleted / totalPlanned) * 100) : 0;
  plan.totalActualMinutes = completed.reduce((sum, s) => sum + (s.actualDuration ?? s.duration), 0);
}

export function updateStudySession(id: string, updates: Partial<StudySession>): StudyPlan {
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

export function deleteStudySession(id: string): StudyPlan {
  const plan = loadStudyPlan();
  plan.sessions = plan.sessions.filter((s) => s.id !== id);
  plan.generatedAt = Date.now();
  saveStudyPlan(plan);
  return plan;
}

export function addExamDate(exam: Omit<ExamDate, "id" | "daysUntil">): StudyPlan {
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

export function deleteExamDate(id: string): StudyPlan {
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
): StudyPlan {
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

async function syncStudyPlanToAppwrite(userId: string): Promise<void> {
  const plan = loadStudyPlan();
  await enqueue("appwrite-study-plan-sync", {
    userId,
    sessions: plan.sessions,
    examDates: plan.examDates,
    generatedAt: plan.generatedAt,
  });
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
    completedSessions: completedSessions,
    upcomingSessions: upcomingSessions,
    studyTimeMinutes: totalActualMinutes,
    examCount: plan.examDates.length,
    daysUntilNextExam: upcomingExams[0]?.daysUntil || null,
    progress,
    totalActualMinutes,
    totalPlannedMinutes,
  };
}

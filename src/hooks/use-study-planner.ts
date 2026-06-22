"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { type PlannerSnapshot, StudyPlannerService } from "@/lib/services/study-planner-service";
import { logError } from "@/lib/shared/logger";
import type { ExamDate, StudyPlan, StudySession } from "@/lib/utils/study-planner";

export interface GeneratePlanSettings {
  targetAps?: number;
  dailyStudyMinutes?: number;
  includeWeekends?: boolean;
  horizonDays?: number;
}

export interface UseStudyPlannerReturn {
  plan: StudyPlan;
  todaySessions: StudySession[];
  upcomingSessions: StudySession[];
  upcomingExams: ExamDate[];
  stats: PlannerSnapshot["stats"];
  stale: boolean;
  addSession: (session: Omit<StudySession, "id">) => void;
  updateSession: (id: string, updates: Partial<StudySession>) => void;
  removeSession: (id: string) => void;
  markComplete: (id: string) => void;
  addExam: (exam: Omit<ExamDate, "id" | "daysUntil">) => void;
  removeExam: (id: string) => void;
  autoSchedule: (subjects: string[], weakTopics: Record<string, string[]>) => void;
  generatePlan: (settings?: GeneratePlanSettings) => Promise<void>;
  isGenerating: boolean;
  refresh: () => void;
}

let _serviceInstance: StudyPlannerService | null = null;
function getService(): StudyPlannerService {
  if (!_serviceInstance) {
    _serviceInstance = new StudyPlannerService();
  }
  return _serviceInstance;
}

export function useStudyPlanner(): UseStudyPlannerReturn {
  const { user } = useAuth();
  const service = useMemo(() => getService(), []);

  const [snapshot, setSnapshot] = useState<PlannerSnapshot>(() => service.getSnapshot());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    service.setUserId(user?.$id ?? null);
  }, [service, user?.$id]);

  useEffect(() => {
    const unsub = service.subscribe(() => {
      setSnapshot(service.getSnapshot());
    });
    return unsub;
  }, [service]);

  useEffect(() => {
    service.loadFromDexie().catch((err) => logError("useStudyPlannerLoadDexie", err));
  }, [service]);

  useEffect(() => {
    const interval = setInterval(() => service.refresh(), 60000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") service.refresh();
    };
    const onFocus = () => service.refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, [service]);

  const addSession = useCallback(
    (session: Omit<StudySession, "id">) => service.addSession(session),
    [service],
  );

  const updateSession = useCallback(
    (id: string, updates: Partial<StudySession>) => service.updateSession(id, updates),
    [service],
  );

  const removeSession = useCallback((id: string) => service.removeSession(id), [service]);

  const markComplete = useCallback((id: string) => service.markComplete(id), [service]);

  const addExam = useCallback(
    (exam: Omit<ExamDate, "id" | "daysUntil">) => service.addExam(exam),
    [service],
  );

  const removeExam = useCallback((id: string) => service.removeExam(id), [service]);

  const autoSchedule = useCallback(
    (subjects: string[], weakTopics: Record<string, string[]>) =>
      service.autoSchedule(subjects, weakTopics),
    [service],
  );

  const generatePlan = useCallback(
    async (settings?: GeneratePlanSettings) => {
      setIsGenerating(true);
      try {
        await service.generatePlan(settings);
      } finally {
        setIsGenerating(false);
      }
    },
    [service],
  );

  const refresh = useCallback(() => service.refresh(), [service]);

  return {
    plan: snapshot.plan,
    todaySessions: snapshot.todaySessions,
    upcomingSessions: snapshot.upcomingSessions,
    upcomingExams: snapshot.upcomingExams,
    stats: snapshot.stats,
    stale: snapshot.plan.stale,
    addSession,
    updateSession,
    removeSession,
    markComplete,
    addExam,
    removeExam,
    autoSchedule,
    generatePlan,
    isGenerating,
    refresh,
  };
}

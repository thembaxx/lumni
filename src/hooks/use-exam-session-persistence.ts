"use client";

import { useCallback, useEffect, useRef } from "react";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import type { ExamSessionSnapshot } from "@/lib/db/types";
import { safeJsonStringify } from "@/lib/shared/json";
import { useExamSessionStore } from "@/store/exam-session";

const STALE_AGE_MS = 4 * 60 * 60 * 1000;

async function saveExamSession(
  paperId: string,
  data: {
    answers: Record<string, unknown> | string;
    flags: unknown[] | string;
    currentPartId: string | null;
    timeRemaining: number;
    startedAt: number;
    completed: boolean;
  },
): Promise<void> {
  const existing = await dexieDataAccess.examSessions.where("paperId").equals(paperId).first();
  const record: ExamSessionSnapshot = {
    paperId,
    answers: typeof data.answers === "string" ? data.answers : safeJsonStringify(data.answers),
    flags: typeof data.flags === "string" ? data.flags : safeJsonStringify(data.flags),
    currentPartId: data.currentPartId,
    timeRemaining: data.timeRemaining,
    startedAt: data.startedAt,
    completed: data.completed,
    lastSavedAt: Date.now(),
  };
  if (existing?.id != null) {
    await dexieDataAccess.examSessions.update(existing.id, record);
  } else {
    await dexieDataAccess.examSessions.add(record);
  }
}

async function getExamSession(paperId: string): Promise<ExamSessionSnapshot | undefined> {
  return dexieDataAccess.examSessions.where("paperId").equals(paperId).first();
}

async function clearExamSession(paperId: string): Promise<void> {
  await dexieDataAccess.examSessions.where("paperId").equals(paperId).delete();
}

export function useExamSessionAutoSave(paperId: string | null) {
  const persist = useCallback(() => {
    const state = useExamSessionStore.getState();
    if (!paperId || !state.paperId) return;

    saveExamSession(paperId, {
      answers: state.answers,
      flags: state.flags,
      currentPartId: state.currentPartId,
      timeRemaining: state.timeRemaining,
      startedAt: state.startedAt ?? Date.now(),
      completed: state.completed,
    });
  }, [paperId]);

  const persistRef = useRef(persist);

  useEffect(() => {
    persistRef.current = persist;
  }, [persist]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        persistRef.current();
      }
    };
    const handlePageHide = () => persistRef.current();

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    const interval = setInterval(() => {
      persistRef.current();
    }, 30_000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      clearInterval(interval);
    };
  }, []);

  return {
    saveNow: persist,
  };
}

export async function hasSavedSession(paperId: string): Promise<ExamSessionSnapshot | null> {
  const session = await getExamSession(paperId);
  if (!session) return null;
  if (session.completed) return null;
  if (Date.now() - session.lastSavedAt > STALE_AGE_MS) {
    await clearExamSession(paperId);
    return null;
  }
  return session;
}

export async function clearSavedSession(paperId: string): Promise<void> {
  await clearExamSession(paperId);
}

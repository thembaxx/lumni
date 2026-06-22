"use client";

import { useCallback } from "react";
import { dexieDataAccess, type SyncDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

let _deps: { db: SyncDataAccess } = { db: dexieDataAccess };
function __setDepsForTesting(deps: { db: SyncDataAccess }) {
  _deps = deps;
}

export type ErrorType =
  | "concept-misunderstanding"
  | "calculation-error"
  | "misread-question"
  | "careless-mistake"
  | "time-pressure"
  | "unknown";

export interface WrongAnswerEntry {
  id?: number;
  questionId: string;
  questionText: string;
  subject: string;
  topic: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  createdAt: number;
  reviewed: boolean;
  errorType?: ErrorType;
}

export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  "concept-misunderstanding": "Concept Misunderstanding",
  "calculation-error": "Calculation Error",
  "misread-question": "Misread Question",
  "careless-mistake": "Careless Mistake",
  "time-pressure": "Time Pressure",
  unknown: "Unknown",
};

export function useWrongAnswerJournal() {
  const addWrongAnswer = useCallback(
    async (
      entry: Omit<WrongAnswerEntry, "id" | "createdAt" | "reviewed"> & {
        errorType?: ErrorType;
      },
    ) => {
      try {
        await _deps.db.wrongAnswers.add({
          ...entry,
          createdAt: Date.now(),
          reviewed: false,
        });
      } catch (err) {
        logError("AddWrongAnswer", err);
      }
    },
    [],
  );

  const getWrongAnswers = useCallback(
    async (subject?: string, topic?: string, limit = 50): Promise<WrongAnswerEntry[]> => {
      try {
        let collection = _deps.db.wrongAnswers.orderBy("createdAt");
        if (subject) {
          collection = collection.filter((e) => e.subject === subject);
        }
        if (topic) {
          collection = collection.filter((e) => e.topic === topic);
        }
        return collection.reverse().limit(limit).toArray();
      } catch (err) {
        logError("GetWrongAnswers", err);
        return [];
      }
    },
    [],
  );

  const markReviewed = useCallback(async (id: number) => {
    try {
      await _deps.db.wrongAnswers.update(id, { reviewed: true });
    } catch (err) {
      logError("MarkReviewed", err);
    }
  }, []);

  const updateErrorType = useCallback(async (id: number, errorType: ErrorType) => {
    try {
      await _deps.db.wrongAnswers.update(id, { errorType });
    } catch (err) {
      logError("UpdateErrorType", err);
    }
  }, []);

  const clearReviewed = useCallback(async () => {
    try {
      const entries = await _deps.db.wrongAnswers.where("reviewed").equals(true).toArray();
      await Promise.all(entries.flatMap((e) => (e.id ? [_deps.db.wrongAnswers.delete(e.id)] : [])));
    } catch (err) {
      logError("ClearReviewed", err);
    }
  }, []);

  return {
    addWrongAnswer,
    getWrongAnswers,
    markReviewed,
    clearReviewed,
    updateErrorType,
  };
}

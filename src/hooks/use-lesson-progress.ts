"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dexieDataAccess, type VocabularyDataAccess } from "@/lib/db";
import type { LessonProgress } from "@/lib/db/types";
import { logError } from "@/lib/shared/logger";

let _deps: { db: VocabularyDataAccess } = Object.freeze({ db: dexieDataAccess });
export function __setDepsForTesting(deps: { db: VocabularyDataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export function useRecentLessonProgress(userId: string) {
  return useQuery({
    queryKey: ["lesson-progress-dashboard", userId],
    queryFn: async () => {
      try {
        const records = await _deps.db.lessonProgress.where("userId").equals(userId).toArray();
        return records
          .toSorted((a: LessonProgress, b: LessonProgress) => {
            const aId = `${a.lessonId}`;
            const bId = `${b.lessonId}`;
            return aId.localeCompare(bId);
          })
          .slice(-5)
          .toReversed();
      } catch {
        return [];
      }
    },
    enabled: userId !== "anonymous",
  });
}

function buildLessonKey(userId: string, lessonId: string): string {
  return `${userId}::${lessonId}`;
}

export function useLessonProgress(userId: string, lessonId: string) {
  const [completedSectionIds, setCompletedSectionIds] = useState<Set<string>>(new Set());
  const [totalSections, setTotalSections] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const key = buildLessonKey(userId, lessonId);

  // react-doctor/no-cascading-set-state — React 18 batches these into 1 redraw
  useEffect(() => {
    let cancelled = false;
    _deps.db.lessonProgress
      .get(key as string)
      .then((record) => {
        if (cancelled) return;
        if (record) {
          const ids = JSON.parse(record.completedSectionIds) as string[];
          setCompletedSectionIds(new Set(ids));
          setTotalSections(record.totalSections);
          setIsComplete(!!record.completedAt);
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const toggleSection = useCallback(
    async (sectionId: string, total: number) => {
      setTotalSections(total);
      setCompletedSectionIds((prev) => {
        const next = new Set(prev);
        if (next.has(sectionId)) next.delete(sectionId);
        else next.add(sectionId);
        return next;
      });
      const currentSet = new Set(completedSectionIds);
      if (currentSet.has(sectionId)) currentSet.delete(sectionId);
      else currentSet.add(sectionId);
      const score = total > 0 ? Math.round((currentSet.size / total) * 100) : 0;
      const record: LessonProgress = {
        id: key,
        userId,
        lessonId,
        completedSections: currentSet.size,
        completedSectionIds: JSON.stringify([...currentSet]),
        totalSections: total,
        completedAt: currentSet.size >= total ? Date.now() : 0,
        score,
      };
      _deps.db.lessonProgress.put(record).catch((err) => {
        logError("LessonProgress.put", err);
      });
      setIsComplete(currentSet.size >= total);
    },
    [userId, lessonId, key, completedSectionIds],
  );

  const progress =
    totalSections > 0 ? Math.round((completedSectionIds.size / totalSections) * 100) : 0;

  return {
    completedSections: completedSectionIds,
    totalSections,
    isComplete,
    progress,
    loaded,
    toggleSection,
  };
}

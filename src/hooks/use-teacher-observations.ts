"use client";

import { useCallback, useEffect, useState } from "react";
import { dexieDataAccess } from "@/lib/db";
import type { TeacherObservation } from "@/lib/db/types";
import { logError } from "@/lib/shared/logger";

interface ObservationDisplay {
  id?: number;
  studentId: string;
  teacherId: string;
  content: string;
  subject?: string;
  createdAt: number;
}

export function useTeacherObservations(studentId: string) {
  const [observations, setObservations] = useState<ObservationDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadObservations = useCallback(() => {
    let cancelled = false;
    dexieDataAccess.teacherObservations
      .where("studentId")
      .equals(studentId)
      .toArray()
      .then((all) => {
        if (cancelled) return;
        all.sort((a, b) => b.createdAt - a.createdAt);
        setObservations(all);
      })
      .catch((err) => logError("useTeacherObservations.load", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  useEffect(() => {
    const cancel = loadObservations();
    return cancel;
  }, [loadObservations]);

  const addObservation = useCallback(
    async (content: string) => {
      if (!content.trim()) return;
      await dexieDataAccess.teacherObservations.add({
        studentId,
        teacherId: "current",
        content: content.trim(),
        createdAt: Date.now(),
      } as TeacherObservation);
      const all = await dexieDataAccess.teacherObservations
        .where("studentId")
        .equals(studentId)
        .toArray();
      all.sort((a, b) => b.createdAt - a.createdAt);
      setObservations(all);
    },
    [studentId],
  );

  return { observations, loading, addObservation };
}

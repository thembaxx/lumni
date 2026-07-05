"use client";

import { useCallback, useEffect, useState } from "react";
import { clearSavedSession, hasSavedSession } from "@/hooks/use-exam-session-persistence";
import { useExamSessionStore } from "@/store/exam-session";

type ResumeState = Awaited<ReturnType<typeof hasSavedSession>>;

export function useResumeSession(id: string) {
  const [resumeData, setResumeData] = useState<ResumeState>(null);
  const [resumeChecked, setResumeChecked] = useState(false);

  useEffect(() => {
    hasSavedSession(id).then((data) => {
      setResumeData(data);
      setResumeChecked(true);
    });
  }, [id]);

  const handleResume = useCallback(() => {
    if (!resumeData) return;
    const parsedAnswers = JSON.parse(resumeData.answers as string);
    useExamSessionStore.setState({
      answers: parsedAnswers,
      flags: JSON.parse(resumeData.flags as string),
      currentPartId: resumeData.currentPartId,
      timeRemaining: resumeData.timeRemaining,
      startedAt: resumeData.startedAt,
      completed: false,
      isSubmitting: false,
      paperId: id,
    });
    setResumeData(null);
  }, [resumeData, id]);

  const handleStartNew = useCallback(async () => {
    await clearSavedSession(id);
    setResumeData(null);
  }, [id]);

  return { resumeData, resumeChecked, handleResume, handleStartNew };
}

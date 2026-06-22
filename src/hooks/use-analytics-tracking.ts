import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  trackDayActive,
  trackEvent,
  trackSessionEnd,
  trackSessionStart,
} from "@/lib/observability/events";

export function useAnalyticsTracking() {
  const { user, isAnonymous } = useAuth();
  const userId = user?.$id;
  const sessionStarted = useRef(false);

  useEffect(() => {
    if (!userId || isAnonymous) return;

    trackDayActive(userId);

    if (!sessionStarted.current) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      trackSessionStart(userId, sessionId);
      sessionStarted.current = true;

      return () => {
        trackSessionEnd(userId, sessionId);
      };
    }
  }, [userId, isAnonymous]);
}

export function useTrackQuizEvents() {
  const trackStart = useCallback((subject: string, count: number) => {
    trackEvent("quiz_start", subject, { count });
  }, []);

  const trackComplete = useCallback((subject: string, score: number, total: number) => {
    trackEvent("quiz_complete", subject, { score, total });
  }, []);

  return { trackQuizStart: trackStart, trackQuizComplete: trackComplete };
}

export function useTrackFlashcardEvents() {
  const trackReview = useCallback((subject: string, quality: number) => {
    trackEvent("flashcard_review", subject, { quality });
  }, []);

  return { trackFlashcardReview: trackReview };
}

export function useTrackExamEvents() {
  const trackStart = useCallback((subject: string, paperId?: string) => {
    trackEvent("exam_start", subject, { paperId: paperId ?? "" });
  }, []);

  const trackComplete = useCallback((subject: string, score: number, total: number) => {
    trackEvent("exam_complete", subject, { score, total });
  }, []);

  return { trackExamStart: trackStart, trackExamComplete: trackComplete };
}

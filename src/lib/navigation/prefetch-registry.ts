import type { QueryClient } from "@tanstack/react-query";

type PrefetchFn = (qc: QueryClient, opts: { userId?: string }) => void;

export const routePrefetchMap: Record<string, PrefetchFn | undefined> = {
  "/dashboard": (qc, { userId }) => {
    qc.prefetchQuery({ queryKey: ["subjects"], staleTime: 60000 * 5 });
    qc.prefetchQuery({ queryKey: ["analytics"], staleTime: 60000 * 5 });
    qc.prefetchQuery({ queryKey: ["competition-leaderboard"], staleTime: 60000 * 5 });
    qc.prefetchQuery({ queryKey: ["weak-topics"], staleTime: 60000 * 5 });
    qc.prefetchQuery({ queryKey: ["recent-questions"], staleTime: 60000 * 5 });
    qc.prefetchQuery({ queryKey: ["competency-overview"], staleTime: 60000 * 5 });
    qc.prefetchQuery({ queryKey: ["bloom-taxonomy-widget"], staleTime: 60000 * 5 });
    if (userId) {
      qc.prefetchQuery({ queryKey: ["next-best-action", userId], staleTime: 60000 * 2 });
      qc.prefetchQuery({ queryKey: ["lesson-progress-dashboard", userId], staleTime: 60000 * 5 });
    }
  },
  "/quiz": (qc) => {
    qc.prefetchQuery({ queryKey: ["subjects"], staleTime: 60000 * 5 });
  },
  "/flashcards": (qc) => {
    qc.prefetchQuery({ queryKey: ["subjects"], staleTime: 60000 * 5 });
  },
  "/exams": (qc) => {
    qc.prefetchQuery({ queryKey: ["admin-exams"], staleTime: 60000 * 5 });
  },
  "/past-papers": (qc) => {
    qc.prefetchQuery({ queryKey: ["admin-exams"], staleTime: 60000 * 5 });
  },
  "/study-groups": (qc) => {
    qc.prefetchQuery({ queryKey: ["study-groups"], staleTime: 60000 * 5 });
  },
  "/settings": (qc) => {
    qc.prefetchQuery({ queryKey: ["referral-info"], staleTime: 60000 * 5 });
  },
  "/exam-dates": () => {},
  "/review": () => {},
  "/search": () => {},
  "/learn": () => {},
  "/practice": () => {},
  "/progress": () => {},
  "/problems": () => {},
  "/stories": () => {},
  "/bookmarks": () => {},
  "/dictionary": () => {},
  "/pronunciation": () => {},
  "/study-plan": () => {},
  "/study-guide": () => {},
  "/chat": () => {},
  "/tools": () => {},
  "/upload": () => {},
  "/leaderboard": () => {},
  "/support": () => {},
};

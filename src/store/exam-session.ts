import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExamPaper, QuestionPart } from "@/types/exam-paper";
import type { ExamAnswer } from "@/types/exam-session";

interface ExamSessionState {
  paper: ExamPaper | null;
  paperId: string | null;
  sessionId: string | null;
  answers: Record<string, ExamAnswer>;
  flags: string[];
  currentPartId: string | null;
  timeRemaining: number;
  startedAt: number | null;
  completed: boolean;
  isSubmitting: boolean;

  initSession: (
    paper: ExamPaper,
    paperId: string,
    durationMinutes: number,
  ) => void;
  setAnswer: (partId: string, value: string | string[]) => void;
  toggleFlag: (partId: string) => void;
  setCurrentPart: (partId: string) => void;
  tick: () => void;
  setSubmitting: (v: boolean) => void;
  completeSession: () => void;
  resetSession: () => void;

  getFlatParts: () => { sectionId: string; questionId: string; part: QuestionPart }[];
  getAnsweredCount: () => number;
  getTotalPartsCount: () => number;
  getAnswer: (partId: string) => string | string[] | undefined;
  isFlagged: (partId: string) => boolean;
}

export const useExamSessionStore = create<ExamSessionState>()(
  persist(
    (set, get) => ({
      paper: null,
      paperId: null,
      sessionId: null,
      answers: {},
      flags: [],
      currentPartId: null,
      timeRemaining: 0,
      startedAt: null,
      completed: false,
      isSubmitting: false,

      initSession: (paper, paperId, durationMinutes) => {
        const firstPart = getFirstPart(paper);
        set({
          paper,
          paperId,
          sessionId: crypto.randomUUID(),
          answers: {},
          flags: [],
          currentPartId: firstPart,
          timeRemaining: durationMinutes * 60,
          startedAt: Date.now(),
          completed: false,
          isSubmitting: false,
        });
      },

      setAnswer: (partId, value) => {
        const { answers } = get();
        set({
          answers: {
            ...answers,
            [partId]: {
              value,
              answeredAt: new Date().toISOString(),
            },
          },
        });
      },

      toggleFlag: (partId) => {
        const { flags } = get();
        set({
          flags: flags.includes(partId)
            ? flags.filter((f) => f !== partId)
            : [...flags, partId],
        });
      },

      setCurrentPart: (partId) => {
        set({ currentPartId: partId });
      },

      tick: () => {
        const { timeRemaining, completed } = get();
        if (!completed && timeRemaining > 0) {
          set({ timeRemaining: timeRemaining - 1 });
        }
      },

      setSubmitting: (v) => set({ isSubmitting: v }),

      completeSession: () => {
        set({ completed: true, isSubmitting: false });
      },

      resetSession: () => {
        set({
          paper: null,
          paperId: null,
          sessionId: null,
          answers: {},
          flags: [],
          currentPartId: null,
          timeRemaining: 0,
          startedAt: null,
          completed: false,
          isSubmitting: false,
        });
      },

      getFlatParts: () => {
        const { paper } = get();
        if (!paper) return [];
        const result: {
          sectionId: string;
          questionId: string;
          part: QuestionPart;
        }[] = [];
        for (const section of paper.sections) {
          for (const question of section.questions) {
            for (const part of question.parts) {
              result.push({
                sectionId: section.id,
                questionId: question.id,
                part,
              });
            }
          }
        }
        return result;
      },

      getAnsweredCount: () => {
        return Object.keys(get().answers).length;
      },

      getTotalPartsCount: () => {
        return get().getFlatParts().length;
      },

      getAnswer: (partId) => {
        return get().answers[partId]?.value;
      },

      isFlagged: (partId) => {
        return get().flags.includes(partId);
      },
    }),
    {
      name: "exam-session-storage",
      partialize: (state) => ({
        answers: state.answers,
        flags: state.flags,
        timeRemaining: state.timeRemaining,
        currentPartId: state.currentPartId,
        paperId: state.paperId,
        sessionId: state.sessionId,
        startedAt: state.startedAt,
        completed: state.completed,
      }),
    },
  ),
);

function getFirstPart(paper: ExamPaper): string | null {
  for (const section of paper.sections) {
    for (const question of section.questions) {
      if (question.parts.length > 0) {
        return `${section.id}-${question.id}-${question.parts[0].id}`;
      }
    }
  }
  return null;
}

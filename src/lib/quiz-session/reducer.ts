import type { UserAnswer } from "@/lib/question-engine/types";

export interface QuizState {
  currentIndex: number;
  correctAnswers: number;
  correctness: boolean[];
  userAnswers: UserAnswer[];
  elapsedTime: number;
  isComplete: boolean;
  isActive: boolean;
}

export type QuizAction =
  | { type: "RESET" }
  | { type: "SET_INDEX"; index: number }
  | { type: "RECORD_ANSWER"; correct: boolean; answer?: UserAnswer }
  | { type: "TICK" }
  | { type: "FINISH" }
  | { type: "START" }
  | { type: "SET_ACTIVE"; active: boolean };

export const INITIAL_QUIZ_STATE: QuizState = {
  currentIndex: 0,
  correctAnswers: 0,
  correctness: [],
  userAnswers: [],
  elapsedTime: 0,
  isComplete: false,
  isActive: false,
};

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "RESET":
      return { ...INITIAL_QUIZ_STATE };
    case "SET_INDEX":
      return { ...state, currentIndex: action.index };
    case "RECORD_ANSWER":
      if (state.isComplete) return state;
      return {
        ...state,
        correctness: [...state.correctness, action.correct],
        correctAnswers: state.correctAnswers + (action.correct ? 1 : 0),
        userAnswers: action.answer ? [...state.userAnswers, action.answer] : state.userAnswers,
      };
    case "TICK":
      return { ...state, elapsedTime: state.elapsedTime + 1 };
    case "FINISH":
      return { ...state, isComplete: true, isActive: false };
    case "START":
      if (state.isActive && !state.isComplete) {
        return state;
      }
      return { ...INITIAL_QUIZ_STATE, isActive: true };
    case "SET_ACTIVE":
      return { ...state, isActive: action.active };
  }
}

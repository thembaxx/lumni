import { describe, it, expect } from "vitest";
import { quizReducer, INITIAL_QUIZ_STATE } from "../reducer";
import type { UserAnswer } from "@/lib/question-engine/types";

describe("quizReducer", () => {
  it("handles START and sets isActive", () => {
    const state = quizReducer(INITIAL_QUIZ_STATE, { type: "START" });
    expect(state.isActive).toBe(true);
    expect(state.isComplete).toBe(false);
    expect(state.currentIndex).toBe(0);
  });

  it("handles RECORD_ANSWER and appends correctness", () => {
    const started = quizReducer(INITIAL_QUIZ_STATE, { type: "START" });
    const state = quizReducer(started, {
      type: "RECORD_ANSWER",
      correct: true,
      answer: { type: "option-ids", value: ["A"] } as UserAnswer,
    });
    expect(state.correctness).toEqual([true]);
    expect(state.correctAnswers).toBe(1);
    expect(state.userAnswers).toHaveLength(1);
  });

  it("guards RECORD_ANSWER after FINISH — returns same state", () => {
    const started = quizReducer(INITIAL_QUIZ_STATE, { type: "START" });
    const answered = quizReducer(started, {
      type: "RECORD_ANSWER",
      correct: true,
      answer: { type: "option-ids", value: ["A"] } as UserAnswer,
    });
    const finished = quizReducer(answered, { type: "FINISH" });
    const again = quizReducer(finished, {
      type: "RECORD_ANSWER",
      correct: true,
      answer: { type: "option-ids", value: ["B"] } as UserAnswer,
    });
    expect(again).toBe(finished);
  });

  it("handles FINISH and sets isComplete", () => {
    const started = quizReducer(INITIAL_QUIZ_STATE, { type: "START" });
    const state = quizReducer(started, { type: "FINISH" });
    expect(state.isComplete).toBe(true);
    expect(state.isActive).toBe(false);
  });

  it("handles SET_INDEX", () => {
    const started = quizReducer(INITIAL_QUIZ_STATE, { type: "START" });
    const state = quizReducer(started, { type: "SET_INDEX", index: 2 });
    expect(state.currentIndex).toBe(2);
  });

  it("handles TICK_TIMER", () => {
    const started = quizReducer(INITIAL_QUIZ_STATE, { type: "START" });
    const ticked = quizReducer(started, { type: "TICK" });
    expect(ticked.elapsedTime).toBe(INITIAL_QUIZ_STATE.elapsedTime + 1);
  });

  it("handles RESET to initial state", () => {
    const started = quizReducer(INITIAL_QUIZ_STATE, { type: "START" });
    const answered = quizReducer(started, {
      type: "RECORD_ANSWER",
      correct: true,
      answer: { type: "option-ids", value: ["A"] } as UserAnswer,
    });
    const reset = quizReducer(answered, { type: "RESET" });
    expect(reset).toEqual(INITIAL_QUIZ_STATE);
  });

  it("handles SET_ACTIVE", () => {
    const started = quizReducer(INITIAL_QUIZ_STATE, { type: "START" });
    const inactive = quizReducer(started, { type: "SET_ACTIVE", active: false });
    expect(inactive.isActive).toBe(false);
  });
});

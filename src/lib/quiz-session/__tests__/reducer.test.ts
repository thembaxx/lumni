import { describe, it, expect } from "vitest";
import { quizReducer, INITIAL_QUIZ_STATE } from "../reducer";

describe("quizReducer", () => {
  it("returns initial state for RESET", () => {
    const state = quizReducer(
      { ...INITIAL_QUIZ_STATE, currentIndex: 5, isComplete: true },
      { type: "RESET" },
    );
    expect(state).toEqual(INITIAL_QUIZ_STATE);
  });

  it("handles SET_INDEX", () => {
    const state = quizReducer(INITIAL_QUIZ_STATE, { type: "SET_INDEX", index: 3 });
    expect(state.currentIndex).toBe(3);
  });

  it("handles RECORD_ANSWER and appends correctness", () => {
    const state = quizReducer(INITIAL_QUIZ_STATE, {
      type: "RECORD_ANSWER",
      correct: true,
      answer: { value: "42" },
    });
    expect(state.correctness).toEqual([true]);
    expect(state.correctAnswers).toBe(1);
    expect(state.userAnswers).toHaveLength(1);
  });

  it("handles RECORD_ANSWER without answer", () => {
    const state = quizReducer(INITIAL_QUIZ_STATE, {
      type: "RECORD_ANSWER",
      correct: false,
    });
    expect(state.correctness).toEqual([false]);
    expect(state.correctAnswers).toBe(0);
    expect(state.userAnswers).toHaveLength(0);
  });

  it("guards RECORD_ANSWER after FINISH — returns same state", () => {
    const afterFinish = quizReducer({ ...INITIAL_QUIZ_STATE, isActive: true }, { type: "FINISH" });
    expect(afterFinish.isComplete).toBe(true);
    const again = quizReducer(afterFinish, {
      type: "RECORD_ANSWER",
      correct: true,
    });
    expect(again).toBe(afterFinish);
  });

  it("handles TICK", () => {
    const state = quizReducer({ ...INITIAL_QUIZ_STATE, elapsedTime: 5 }, { type: "TICK" });
    expect(state.elapsedTime).toBe(6);
  });

  it("handles FINISH", () => {
    const state = quizReducer({ ...INITIAL_QUIZ_STATE, isActive: true }, { type: "FINISH" });
    expect(state.isComplete).toBe(true);
    expect(state.isActive).toBe(false);
  });

  it("handles START", () => {
    const state = quizReducer(
      { ...INITIAL_QUIZ_STATE, currentIndex: 5, correctness: [true], isComplete: true },
      { type: "START" },
    );
    expect(state.isActive).toBe(true);
    expect(state.isComplete).toBe(false);
    expect(state.currentIndex).toBe(0);
    expect(state.correctness).toEqual([]);
  });

  it("handles SET_ACTIVE", () => {
    const state = quizReducer(INITIAL_QUIZ_STATE, { type: "SET_ACTIVE", active: true });
    expect(state.isActive).toBe(true);
  });
});

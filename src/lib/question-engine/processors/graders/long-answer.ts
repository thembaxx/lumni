import type { Question, QuestionBody, UserAnswer } from "../../types";
import type { GradeFn, HintFn } from "../types";
import { aiGradeResult } from "./shared";

export const grade: GradeFn = (q, a, prompts, ai) => {
  const student = a.value as string;
  if (!student) {
    return Promise.resolve({
      correct: false,
      score: 0,
      maxScore: q.points,
      feedback: "No answer.",
    });
  }
  const body = q.body as QuestionBody["long-answer"];
  const words = student.split(/\s+/).length;
  if (words < body.minWords) {
    return Promise.resolve({
      correct: false,
      score: 0,
      maxScore: q.points,
      feedback: `Answer too short (${words} words, minimum ${body.minWords}).`,
    });
  }
  return aiGradeResult(q, a, prompts, ai, (q: Question, _a: UserAnswer) => {
    const b = q.body as QuestionBody["long-answer"];
    return `Question: ${q.questionText}\nRubric: ${JSON.stringify(b.rubric)}\nStudent: ${_a.value as string}`;
  });
};

export const hint: HintFn = (q) => {
  const body = q.body as QuestionBody["long-answer"];
  return `Write ${body.minWords}-${body.maxWords} words covering: ${body.rubric.map((r) => r.name).join(", ")}.`;
};

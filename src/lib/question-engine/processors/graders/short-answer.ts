import type { Question, QuestionBody, UserAnswer } from "../../types";
import type { GradeFn, HintFn } from "../types";
import { aiGradeResult, aiHintFactory } from "./shared";

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export const grade: GradeFn = (q, a, prompts, ai) => {
  const student = ((a.value as string) ?? "").trim();
  if (!student) {
    return Promise.resolve({
      correct: false,
      score: 0,
      maxScore: q.points,
      feedback: "No answer provided.",
    });
  }

  const body = q.body as QuestionBody["short-answer"];
  const normed = normalize(student);

  const exactMatch = body.acceptableAnswers.some((ans: string) => normalize(ans) === normed);

  if (exactMatch) {
    return Promise.resolve({
      correct: true,
      score: q.points,
      maxScore: q.points,
      feedback: "Correct!",
    });
  }

  return aiGradeResult(q, a, prompts, ai, (q: Question, _a: UserAnswer) => {
    const body = q.body as QuestionBody["short-answer"];
    return `Question: ${q.questionText}\nModel answer: ${body.modelAnswer}\nAcceptable answers: ${body.acceptableAnswers.join(" | ")}\nStudent answer: ${_a.value as string}`;
  });
};

export const hint: HintFn = aiHintFactory();

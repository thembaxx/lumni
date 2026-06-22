import type { QuestionBody } from "../../types";
import type { GradeFn, HintFn } from "../types";

export const grade: GradeFn = (q, a) => {
  const body = q.body as QuestionBody["ordering"];
  const userOrder = a.value as string[];
  const correctOrder = body.correctOrder;

  if (!userOrder || userOrder.length !== correctOrder.length) {
    return {
      correct: false,
      score: 0,
      maxScore: q.points,
      feedback: "Incomplete ordering. Please arrange all items.",
    };
  }

  let correctCount = 0;
  for (let i = 0; i < userOrder.length; i++) {
    if (userOrder[i] === correctOrder[i]) {
      correctCount++;
    }
  }

  const isExact = correctCount === correctOrder.length;
  const score = isExact ? q.points : Math.round((correctCount / correctOrder.length) * q.points);

  return {
    correct: isExact,
    score,
    maxScore: q.points,
    feedback: isExact
      ? "Perfect order! All items are in the correct sequence."
      : `${correctCount}/${correctOrder.length} items in the correct position.`,
  };
};

export const hint: HintFn = (q) => {
  const body = q.body as QuestionBody["ordering"];
  return `Think about the logical progression of these ${body.items.length} items. Look for cause-and-effect relationships, chronological order, or step-by-step progression.`;
};

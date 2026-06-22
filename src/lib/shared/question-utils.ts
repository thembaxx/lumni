import type { Question } from "@/lib/question-engine/types";

export function extractCorrectAnswer(question: Question): string | null {
  const body = question.body;
  if ("options" in body) {
    const options = body.options as Array<{ text: string; isCorrect: boolean }>;
    const correct = options.find((o) => o.isCorrect);
    return correct?.text ?? null;
  }
  if ("correctValue" in body) {
    return String((body as { correctValue: number }).correctValue);
  }
  if ("acceptableAnswers" in body) {
    const answers = body.acceptableAnswers as string[];
    return answers[0] ?? null;
  }
  if ("modelAnswer" in body) {
    return (body as { modelAnswer: string }).modelAnswer;
  }
  return null;
}

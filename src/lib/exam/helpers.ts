import type { QuestionPart } from "@/types/exam-paper";

export function parseDuration(duration: string): number {
  const lower = duration.toLowerCase();
  const hourMatch = lower.match(/(\d+)\s*hour/);
  const minMatch = lower.match(/(\d+)\s*min/);
  let total = 0;
  if (hourMatch) total += parseInt(hourMatch[1], 10) * 60;
  if (minMatch) total += parseInt(minMatch[1], 10);
  return total || 180;
}

export function getCorrectAnswerText(part: QuestionPart): string {
  if (part.options) {
    const correct = part.options.filter((o) => o.isCorrect);
    return correct.length > 0 ? correct.map((o) => `${o.id}. ${o.text}`).join("; ") : "";
  }
  return "";
}

export function getAnswerText(
  part: QuestionPart,
  answer: { value: string | string[] } | undefined,
): string {
  if (!answer) return "";
  const value = answer.value;
  if (Array.isArray(value)) return value.join(", ");
  if (part.options) {
    const opt = part.options.find((o) => o.id === value);
    return opt ? `${opt.id}. ${opt.text}` : value;
  }
  return value;
}

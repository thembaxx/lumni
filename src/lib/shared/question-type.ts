export function serializeQuestionType(questionType?: string | string[]): string {
  if (!questionType) return "any";
  return Array.isArray(questionType) ? questionType.join(",") : questionType;
}

export const COACH_SYSTEM_PROMPT = `You are an experienced essay coach. Your job is to help students improve their writing through specific, actionable feedback. Always be encouraging but honest. Focus on: thesis clarity, argument structure, evidence quality, counterargument consideration, and conclusion strength. For each criterion, explain WHAT needs improvement and HOW to improve it.`;

export function buildCoachContext(params: {
  question: string;
  rubric: string;
  modelAnswer: string;
  currentDraft: string;
  previousFeedback?: string;
}): string {
  const parts: string[] = [
    `Question: ${params.question}`,
    `Rubric: ${params.rubric}`,
    `Model answer: ${params.modelAnswer}`,
  ];
  if (params.previousFeedback) {
    parts.push(`Previous feedback: ${params.previousFeedback}`);
  }
  parts.push(`Current draft: ${params.currentDraft}`);
  return parts.join("\n");
}

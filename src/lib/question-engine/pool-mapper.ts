import type { BloomLevel, GenerationParams, Question, QuestionBody, QuestionType } from "./types";

export function mapPoolToQuestion(
  pq: NonNullable<GenerationParams["poolQuestions"]>[number],
  subject: string,
  topic?: string,
): Question {
  const qType = (pq.type as QuestionType) ?? "short-answer";
  const bloom = (pq.bloomLevel as BloomLevel) ?? "understand";

  let body: QuestionBody[typeof qType];
  if (qType === "multiple-choice") {
    body = {
      allowMultiple: false,
      correctOptionId: "a",
      options: [
        { id: "a", text: pq.answerText, isCorrect: true },
        { id: "b", text: "None of the above", isCorrect: false },
      ],
    } as QuestionBody["multiple-choice"];
  } else if (qType === "calculation") {
    body = {
      correctValue: Number.NaN,
      formula: "",
      tolerance: 0,
      unit: "",
    } as QuestionBody["calculation"];
  } else {
    body = {
      acceptableAnswers: [pq.answerText],
      maxLength: 500,
      modelAnswer: pq.answerText,
    } as QuestionBody["short-answer"];
  }

  return {
    bloomTaxonomy: bloom,
    body,
    difficulty: "Medium" as const,
    explanation: `From ${pq.year} Paper ${pq.paperNumber}${pq.subtopicId ? `, Q${pq.subtopicId}` : ""}`,
    hint: "",
    id: pq.id,
    metadata: {
      createdAt: Date.now(),
      source: "imported",
    },
    points: pq.marks,
    questionText: pq.questionText,
    sourcePaperId: pq.id,
    sourcePastPaperQuestionId: pq.id,
    subject,
    topic: pq.topic ?? topic ?? "",
    type: qType,
    webSources: [
      {
        title: `${subject} ${pq.year} Paper ${pq.paperNumber}`,
        url: "#",
      },
    ],
    pastPaperMetadata: {
      year: pq.year,
      paperNumber: pq.paperNumber,
      questionNumber: pq.subtopicId ?? undefined,
      totalMarks: pq.marks,
    },
  };
}

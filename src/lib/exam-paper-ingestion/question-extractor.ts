import { nanoid } from "nanoid";
import type { ExamPaper } from "@/types/exam-paper";
import type { PastPaperQuestion } from "./past-paper-question-types";

function extractAnswerText(
  memoQuestion: Pick<ExamPaper["sections"][number]["questions"][number], "parts">,
): string {
  const parts = memoQuestion.parts || [];
  return parts
    .flatMap((p) => {
      const contentText =
        p.content
          ?.flatMap((c) => {
            if (c.type === "text") return c.value ? [c.value] : [];
            if (c.type === "formula") return c.value ? [c.value] : [];
            if (c.type === "table") {
              return p.table
                ? [
                    `${p.table.headers.join(" | ")}\n${p.table.rows.map((r) => r.join(" | ")).join("\n")}`,
                  ]
                : [];
            }
            return [];
          })
          .join("\n") ?? "";
      const result = [p.text, contentText].filter(Boolean).join("\n");
      return result ? [result] : [];
    })
    .join("\n\n");
}

function extractQuestionText(
  paperQuestion: Pick<ExamPaper["sections"][number]["questions"][number], "id" | "parts">,
): string {
  const parts = paperQuestion.parts || [];
  return parts
    .flatMap((p) => {
      const contentText =
        p.content
          ?.flatMap((c) => {
            if (c.type === "text") return c.value ? [c.value] : [];
            if (c.type === "formula") return c.value ? [c.value] : [];
            if (c.type === "image") return [`[Image: ${c.altText || ""}]`];
            return [];
          })
          .join("\n") ?? "";
      const optionsText = p.options?.map((o) => `${o.id}: ${o.text}`).join("\n");
      const result = [p.text, contentText, optionsText].filter(Boolean).join("\n");
      return result ? [result] : [];
    })
    .join("\n\n");
}

function inferBloomLevel(_questionType: string, marks: number, questionText: string): string {
  const text = questionText.toLowerCase();

  if (/\b(define|name|state|list|recall|identify|label)\b/.test(text)) return "remember";
  if (/\b(explain|describe|summarise|summarize|compare|contrast|interpret|paraphrase)\b/.test(text))
    return "understand";
  if (
    /\b(apply|calculate|solve|compute|demonstrate|use|perform|implement|classify|categorise|categorize)\b/.test(
      text,
    )
  )
    return "apply";
  if (
    /\b(analy[sz]e|examine|differentiate|organise|organize|distinguish|break down|investigate|compare and)\b/.test(
      text,
    )
  )
    return "analyze";
  if (
    /\b(evaluate|justify|assess|critique|judge|argue|defend|recommend|prioritise|prioritize)\b/.test(
      text,
    )
  )
    return "evaluate";
  if (/\b(create|design|construct|develop|formulate|compose|propose|generate)\b/.test(text))
    return "create";

  if (marks <= 2) return "remember";
  if (marks <= 4) return "understand";
  if (marks <= 6) return "apply";
  if (marks <= 8) return "analyze";
  return "evaluate";
}

function determineQuestionType(type: string): import("@/lib/question-engine/types").QuestionType {
  switch (type) {
    case "multiple-choice":
      return "multiple-choice";
    case "matching":
      return "matching";
    case "essay":
      return "essay";
    case "calculation":
      return "calculation";
    case "diagram":
      return "diagram";
    case "programming":
      return "programming";
    case "source-based":
    case "data-response":
      return type;
    default:
      return "short-answer";
  }
}

export function extractQuestionsFromPaper(
  paper: ExamPaper,
  memo: ExamPaper | null,
  subject: string,
  year: number,
  paperNumber: number,
): {
  questions: PastPaperQuestion[];
  stats: { total: number; withAnswer: number; withoutAnswer: number };
} {
  const questions: PastPaperQuestion[] = [];
  const now = new Date().toISOString();
  let withAnswer = 0;

  for (let si = 0; si < paper.sections.length; si++) {
    const section = paper.sections[si];
    const memoSection = memo?.sections[si] || null;
    const sectionTopic = section.title || undefined;

    for (let qi = 0; qi < section.questions.length; qi++) {
      const question = section.questions[qi];
      const memoQuestion = memoSection?.questions[qi] || null;

      for (let pi = 0; pi < question.parts.length; pi++) {
        const part = question.parts[pi];
        const memoPart = memoQuestion?.parts[pi] || null;

        const marks =
          typeof part.marks === "number"
            ? part.marks
            : parseInt(String(part.marks || "0"), 10) || 0;
        const partId = part.id || `${question.id || `q${qi}`}-p${pi}`;
        const questionText = extractQuestionText({
          ...question,
          parts: [part],
        });
        const answerText = memoPart
          ? extractAnswerText({ ...memoQuestion, parts: [memoPart] })
          : "";
        const hasAnswer = answerText.trim().length > 0;
        if (hasAnswer) withAnswer++;

        questions.push({
          id: nanoid(),
          subject,
          year,
          paperNumber,
          sectionTitle: sectionTopic,
          topic: sectionTopic,
          questionId: question.id || `q${qi}`,
          partId,
          questionText,
          answerText,
          marks,
          questionType: determineQuestionType(part.type || "short-answer"),
          bloomLevel: inferBloomLevel(part.type || "short-answer", marks, questionText),
          createdAt: now,
        });
      }
    }
  }

  return {
    questions,
    stats: {
      total: questions.length,
      withAnswer,
      withoutAnswer: questions.length - withAnswer,
    },
  };
}

import { createRouteHandler } from "@/lib/api/create-route-handler";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type { Question } from "@/lib/question-engine/types";
import { searchWithRAG } from "@/lib/tinyfish";

export const POST = createRouteHandler({
  auth: "none",
  budget: "hint",
  errorLabel: "Hint",
  useRateLimit: true,
  aiContext: { consentGranted: true },
  parseBody: async (req) => {
    const body: { question: Question } = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.question?.id) return "Question is required";
    return null;
  },
  execute: async ({ body }) => {
    const ragContext = await searchWithRAG({
      subject: body.question.subject,
      topic: body.question.topic,
    });
    const engine = await QuestionEngine.initialize();
    const hint = await engine.generateHint({
      questionId: body.question.id,
      question: body.question,
      ragXml: ragContext.xml || undefined,
    });
    return { hint };
  },
});

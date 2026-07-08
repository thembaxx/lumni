import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import type { Question } from "@/lib/question-engine/types";
import { safeJsonStringify } from "@/lib/shared/json";
import { extractCorrectAnswer } from "@/lib/shared/question-utils";

export const POST = createRouteHandler({
  auth: "required",
  useRateLimit: true,
  errorLabel: "QuizPacksGenerate",
  execute: async ({ body }) => {
    const { packId, subject, topic, count } = body as {
      packId?: string;
      subject?: string;
      topic?: string;
      count?: number;
    };

    if (!packId || !subject || !count) {
      throw new HttpError(400, "packId, subject, and count are required");
    }

    const [{ QuestionEngine }, { quizPackService }] = await Promise.all([
      import("@/lib/question-engine/question-engine"),
      import("@/lib/quiz-packs"),
    ]);

    const engine = await QuestionEngine.initialize();
    const topicParam = topic && typeof topic === "string" ? topic : undefined;

    const { questions } = await engine.generate({
      subject,
      topic: topicParam,
      count: Math.min(count, 20),
      questionType: "any",
    });

    const questionData = questions.map((q: Question, i: number) => ({
      questionIndex: i,
      questionText: q.questionText,
      options: safeJsonStringify("options" in q.body ? q.body.options : []),
      correctAnswer: extractCorrectAnswer(q) ?? "",
      explanation: q.explanation ?? null,
      difficulty: q.difficulty ?? "Medium",
      type: q.type,
    }));

    await quizPackService.storeQuestions(packId, questionData);

    const storageBytes = new TextEncoder().encode(JSON.stringify(questionData)).length;

    return { success: true, storageBytes };
  },
});

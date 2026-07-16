import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "required",
  budget: "generate",
  errorLabel: "QuizPackGenerate",
  useRateLimit: true,

  parseBody: async (req) => {
    const body = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.subject) return "Subject is required";
    if (!body.count || body.count < 1) return "Count must be at least 1";
    if (body.count > 100) return "Count must be 100 or less";
    return null;
  },
  execute: async ({ body, userId }) => {
    const {
      subject,
      topic,
      count = 50,
      generateVisuals = true,
    } = body as {
      subject: string;
      topic?: string;
      count?: number;
      generateVisuals?: boolean;
    };

    const [{ quizPackService }, { enqueue }] = await Promise.all([
      import("@/lib/quiz-packs"),
      import("@/lib/orchestrator/job-queue"),
    ]);

    // Create the pack record
    const pack = await quizPackService.generatePack(subject, topic ?? null, count);

    // Enqueue the generation job
    await enqueue("quiz-pack-generate", {
      packId: pack.id,
      subject,
      topic: topic ?? null,
      count,
      generateVisuals,
    });

    return {
      packId: pack.id,
      status: "generating",
      message: "Quiz pack generation started. Check back in a few minutes.",
    };
  },
});

import { createRouteHandler } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { GenerationParams } from "@/lib/question-engine/types";
import {
  getUserLicenseTier,
  getTodayGenerateCount,
  getSchoolTierDailyLimit,
} from "@/lib/school/license-quota";

export const POST = createRouteHandler({
  auth: "required",
  budget: "generate",
  errorLabel: "Generate",
  useRateLimit: true,

  parseBody: async (req) => {
    const body: GenerationParams = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.subject) return "Subject is required";
    if (!body.count || body.count < 1) return "Count must be at least 1";
    if (body.count > 50) return "Count must be 50 or less";
    return null;
  },
  execute: async ({ body, userId }) => {
    if (userId) {
      const tier = await getUserLicenseTier(userId);
      if (tier) {
        const allowed = await getSchoolTierDailyLimit(tier);
        const used = await getTodayGenerateCount(userId);
        if (used >= allowed) {
          return {
            questions: [],
            count: 0,
            requested: body.count,
            type: body.questionType || "any",
            partial: true,
            warning: "Daily question limit reached for your school tier",
            sources: [],
            jobIds: [],
          };
        }
      }
    }

    const orchestrator = await LearningOrchestrator.initialize();
    const result = await orchestrator.generateQuestionSet({
      ...body,
      userId: userId ?? null,
    });
    const requested = body.count;
    const delivered = result.questions.length;

    try {
      const { enqueue } = await import("@/lib/orchestrator/job-queue");
      await enqueue("prune-stale-questions", {}, { priority: 10 });
    } catch (e) {
      logError("Generate.PruneEnqueue", e);
    }

    return {
      questions: result.questions,
      count: delivered,
      requested,
      type: body.questionType || "any",
      jobIds: result.jobIds,
      partial: delivered < requested,
      warning:
        delivered < requested
          ? `Only ${delivered} of ${requested} questions could be generated.`
          : undefined,
      sources: result.sources ?? [],
    };
  },
});

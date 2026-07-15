import { createRouteHandler } from "@/lib/api/create-route-handler";
import { adaptiveStudyPlanner, type AdaptivePlanRequest } from "@/lib/study-planner/adaptive-planner";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "AdaptivePlan",
  useRateLimit: true,
  parseBody: async (req) => {
    const body = await req.json();
    return body as AdaptivePlanRequest;
  },
  validate: (body) => {
    if (!body.targetAps || body.targetAps < 20 || body.targetAps > 100) {
      return "targetAps must be between 20 and 100";
    }
    if (!body.dailyMinutes || body.dailyMinutes < 15 || body.dailyMinutes > 240) {
      return "dailyMinutes must be between 15 and 240";
    }
    if (!body.horizonDays || body.horizonDays < 7 || body.horizonDays > 90) {
      return "horizonDays must be between 7 and 90";
    }
    return null;
  },
  execute: async ({ body, userId }) => {
    const userIdStr = userId ?? null;
    const subjectIds = body.subjectIds && body.subjectIds.length > 0 ? body.subjectIds : undefined;

    const result = await adaptiveStudyPlanner.generateAdaptivePlan(
      {
        dailyMinutes: body.dailyMinutes,
        horizonDays: body.horizonDays,
        targetAps: body.targetAps,
        weakTopicsOnly: body.weakTopicsOnly ?? false,
        subjectIds,
      },
      userIdStr,
    );

    return result;
  },
});
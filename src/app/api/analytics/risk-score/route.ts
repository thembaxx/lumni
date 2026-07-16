import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { riskModel } from "@/lib/analytics/risk-model";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "RiskScore",
  useRateLimit: true,
  parseBody: async (req) => {
    const body = await req.json();
    return body;
  },
  validate: (body) => {
    if (!body.subjectId && !body.topicId) return "subjectId or topicId required";
    if (body.windowDays && (body.windowDays < 1 || body.windowDays > 90)) {
      return "windowDays must be between 1 and 90";
    }
    return null;
  },
  execute: async ({ body, userId }) => {
    const {
      subjectId,
      topicId,
      windowDays = 14,
    } = body as {
      subjectId?: string;
      topicId?: string;
      windowDays?: number;
    };

    try {
      const riskScore = await riskModel.computeRiskScore(userId!, windowDays);
      return {
        score: riskScore.score,
        factors: riskScore.factors,
        recommendation: riskScore.recommendation,
        computedAt: Date.now(),
      };
    } catch (err) {
      logError("RiskScore.Compute", err);
      throw err;
    }
  },
});

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "RiskScore",
  useRateLimit: true,
  execute: async ({ req, userId }) => {
    const { searchParams } = new URL(req.url);
    const windowDays = Math.min(Number.parseInt(searchParams.get("windowDays") || "14", 10), 90);

    try {
      const riskScore = await riskModel.computeRiskScore(userId!, windowDays);
      return {
        score: riskScore.score,
        factors: riskScore.factors,
        recommendation: riskScore.recommendation,
        computedAt: Date.now(),
      };
    } catch (err) {
      logError("RiskScore.Get", err);
      throw err;
    }
  },
});

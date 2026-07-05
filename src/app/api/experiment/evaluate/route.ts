import { createRouteHandler } from "@/lib/api/create-route-handler";
import { evaluateExperiment } from "@/lib/experiments/config";

interface EvaluateBody {
  experimentId: string;
}

function validate(body: unknown): string | null {
  const b = body as Record<string, unknown> | null;
  if (!b || typeof b.experimentId !== "string" || !b.experimentId.trim()) {
    return "experimentId is required";
  }
  return null;
}

export const POST = createRouteHandler<EvaluateBody, { variantId: string; flagValue: boolean }>({
  auth: "required",
  execute: async ({ body, userId }) => {
    const experimentId = body.experimentId;
    const result = evaluateExperiment(userId!, experimentId);
    if (!result) {
      return { variantId: "control", flagValue: false };
    }
    return result;
  },
  validate,
});

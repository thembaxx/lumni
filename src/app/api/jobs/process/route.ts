import { createRouteHandler } from "@/lib/api/create-route-handler";
import { jobProcessor } from "@/lib/orchestrator/job-processor";

export const dynamic = "force-dynamic";

export const POST = createRouteHandler({
  auth: "admin",
  errorLabel: "Jobs Process",
  validate: (body: Record<string, unknown>) => {
    if (!body || typeof body !== "object") return "Invalid request body";
    return null;
  },
  execute: async ({ body }) => {
    const raw = body as Record<string, unknown>;
    const limit = typeof raw.limit === "number" && raw.limit > 0 ? Math.min(raw.limit, 50) : 5;

    const result = await jobProcessor.processBatch(limit);
    return result;
  },
});

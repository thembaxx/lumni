import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { dexieDataAccess } from "@/lib/db";
import { ReEngagementService } from "@/lib/services/re-engagement-service";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const service = new ReEngagementService({ db: dexieDataAccess });

const handler = createRouteHandler({
  auth: "optional",
  errorLabel: "ReEngagement",
  execute: async ({ userId, body }) => {
    const targetUserId = (body as { userId?: string }).userId ?? userId;

    if (!targetUserId) {
      throw new HttpError(400, "userId is required");
    }

    const result = await service.checkAndNotify(targetUserId);

    return {
      notified: result.notified,
      message: result.message ?? null,
      deepLink: result.deepLink ?? null,
    };
  },
});

export const POST = withRateLimit(handler, { max: 1, windowMs: 60_000 });

import { getAnalyticsService } from "@/lib/analytics/analytics-service";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";

export const dynamic = "force-dynamic";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "Analytics Trends",
  execute: async ({ userId, req }) => {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const subject = searchParams.get("subject");

    if (!requestedUserId || !subject) {
      throw new HttpError(400, "userId and subject are required");
    }

    if (requestedUserId !== userId) {
      throw new HttpError(403, "Unauthorized");
    }

    const service = getAnalyticsService();
    return service.computeTrends(requestedUserId, subject);
  },
});

import { getAnalyticsService } from "@/lib/analytics/analytics-service";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "Comparative Analytics",
  execute: async ({ userId, req }) => {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    if (!requestedUserId) {
      throw new HttpError(400, "userId is required");
    }

    if (requestedUserId !== userId) {
      throw new HttpError(403, "Unauthorized");
    }

    const service = getAnalyticsService();
    return service.computeComparative(requestedUserId);
  },
});

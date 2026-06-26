import { cacheLife } from "next/cache";
import { getAnalyticsService } from "@/lib/analytics/analytics-service";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";

async function fetchTrendData(userId: string, subject: string) {
  "use cache";
  cacheLife("frequent");
  const service = getAnalyticsService();
  return service.computeTrends(userId, subject);
}

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

    return fetchTrendData(requestedUserId, subject);
  },
});

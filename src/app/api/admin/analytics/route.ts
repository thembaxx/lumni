import { PlatformAnalyticsService } from "@/lib/admin";
import { createRouteHandler } from "@/lib/api/create-route-handler";

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "Analytics",
  execute: async () => {
    const service = new PlatformAnalyticsService();
    return service.fetchAnalytics();
  },
});

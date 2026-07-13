import { dailyCallTracker } from "@/lib/ai/daily-call-tracker";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { getClientIp } from "@/lib/shared/get-client-ip";

export const GET = createRouteHandler({
  auth: "none",
  errorLabel: "Budget",
  execute: async ({ req }) => {
    const userId = getClientIp(req);

    const [usage, globalUsage] = await Promise.all([
      dailyCallTracker.getUsage(userId),
      dailyCallTracker.getGlobalUsage(),
    ]);

    return {
      user: { id: userId, usage },
      global: globalUsage,
    };
  },
});

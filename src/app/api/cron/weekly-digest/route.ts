import { createRouteHandler } from "@/lib/api/create-route-handler";
import { dexieDataAccess } from "@/lib/db";
import { DigestService } from "@/lib/digest";

export const POST = createRouteHandler({
  auth: "admin",
  errorLabel: "WeeklyDigest",
  execute: async () => {
    const service = new DigestService({ db: dexieDataAccess });
    const stats = await service.computeWeeklyStats();
    const { title, body } = service.formatDigestMessage(stats);
    const result = await service.sendPushNotifications(title, body);
    return { success: true, ...result };
  },
});

import { createRouteHandler } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const POST = withRateLimit(
  createRouteHandler({
    auth: "admin",
    validate: (body: Record<string, unknown>) => {
      if (!body.title) return "title is required";
      return null;
    },
    execute: async ({ body }) => {
      const {
        title,
        body: msgBody,
        url,
        userId,
      } = body as {
        title: string;
        body?: string;
        url?: string;
        userId?: string;
      };

      const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

      if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        logError("PushSend.VapidMissing", new Error("VAPID keys not configured"));
        return { success: false, reason: "vapid-not-configured" };
      }

      const [webpushModule, { Query }, { listDocuments }] = await Promise.all([
        import("web-push"),
        import("appwrite"),
        import("@/lib/db/client"),
      ]);

      webpushModule.default.setVapidDetails(
        "mailto:study@lumni.app",
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY,
      );

      const subscriptions = await listDocuments<Record<string, unknown>>(
        "push_subscriptions",
        userId ? [Query.equal("userId", userId)] : [],
      );

      const results = await Promise.allSettled(
        subscriptions.map((sub) => {
          const pushSub = {
            endpoint: sub.endpoint as string,
            keys: {
              auth: sub.auth as string,
              p256dh: sub.p256dh as string,
            },
          };
          return webpushModule.default.sendNotification(
            pushSub,
            JSON.stringify({
              title,
              body: msgBody || "",
              url: url || "/dashboard",
            }),
          );
        }),
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;

      return { success: true, sent, total: subscriptions.length };
    },
    errorLabel: "Push send",
  }),
  { max: 3, windowMs: 60000 },
);

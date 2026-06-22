import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { listDocuments } from "@/lib/db/client";

export const POST = createRouteHandler({
  auth: "admin",
  errorLabel: "NotificationSend",
  validate: (body) => {
    if (
      !body.title ||
      !body.body ||
      typeof body.title !== "string" ||
      typeof body.body !== "string"
    ) {
      return "title and body are required and must be strings";
    }
    if (body.title.length > 100 || body.body.length > 500) {
      return "title must be 100 characters or less and body must be 500 characters or less";
    }
    return null;
  },
  execute: async ({ body }) => {
    const { title, body: bodyText, url, subject } = body as Record<string, string>;

    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new HttpError(500, "VAPID keys not configured");
    }

    const webpush = await import("web-push");

    webpush.default.setVapidDetails("mailto:study@lumni.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    const subscriptions = await listDocuments<Record<string, unknown>>("push_subscriptions", []);

    const results = await Promise.allSettled(
      subscriptions.map((sub) => {
        const pushSub = {
          endpoint: sub.endpoint as string,
          keys: {
            auth: sub.auth as string,
            p256dh: sub.p256dh as string,
          },
        };
        return webpush.default.sendNotification(
          pushSub,
          JSON.stringify({
            title,
            body: bodyText,
            url: url || "/dashboard",
            subject: subject || "",
          }),
        );
      }),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;

    return {
      success: true,
      sent,
      total: subscriptions.length,
    };
  },
});

import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { listDocuments } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

const CHUNK_SIZE = 500;
const SEND_BATCH_SIZE = 50;

export const POST = createRouteHandler({
  auth: "admin",
  errorLabel: "NotificationSend",
  useRateLimit: true,
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
    if (!body.confirmed) {
      return "confirmation is required";
    }
    return null;
  },
  execute: async ({ body }) => {
    const { title, body: bodyText, url, subject, confirmed } = body as Record<string, string>;

    if (!confirmed) {
      throw new HttpError(400, "Confirmation required");
    }

    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new HttpError(500, "VAPID keys not configured");
    }

    const webpush = await import("web-push");

    webpush.default.setVapidDetails("mailto:study@lumni.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    // Paginated fetch in chunks
    const allSubscriptions: Record<string, unknown>[] = [];
    let cursor: string | undefined;
    do {
      const page = await listDocuments<Record<string, unknown>>("push_subscriptions", []);
      allSubscriptions.push(...page);
      cursor = undefined; // listDocuments doesn't support cursor pagination
    } while (cursor);

    // Chunked sending with error isolation
    let sent = 0;
    for (let i = 0; i < allSubscriptions.length; i += SEND_BATCH_SIZE) {
      const chunk = allSubscriptions.slice(i, i + SEND_BATCH_SIZE);
      const results = await Promise.allSettled(
        chunk.map((sub) => {
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
      results.forEach((r, idx) => {
        if (r.status === "rejected") {
          logError("PushSend", r.reason);
        } else {
          sent++;
        }
      });
    }

    return {
      success: true,
      sent,
      total: allSubscriptions.length,
    };
  },
});

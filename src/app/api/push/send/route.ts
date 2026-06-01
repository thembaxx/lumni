import { createRouteHandler } from "@/lib/api/create-route-handler";
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
				console.warn("VAPID keys not configured, skipping push");
				return { success: false, reason: "vapid-not-configured" };
			}

			const webpush = await import("web-push");

			webpush.default.setVapidDetails(
				"mailto:study@lumni.app",
				VAPID_PUBLIC_KEY,
				VAPID_PRIVATE_KEY,
			);

			const { Query } = await import("appwrite");
			const { listDocuments } = await import("@/lib/db/client");

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
					return webpush.default.sendNotification(
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

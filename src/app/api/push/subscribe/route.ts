import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, listDocuments } from "@/lib/db/client";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const PUSH_SUBSCRIPTIONS_COLLECTION = "push_subscriptions";

const subscribeHandler = createRouteHandler({
	auth: "required",
	validate: (body: Record<string, unknown>) => {
		const sub = (body as { subscription?: { endpoint?: string } }).subscription;
		if (!sub?.endpoint) return "Invalid subscription";
		return null;
	},
	execute: async ({ body, userId }) => {
		const { subscription } = body as {
			subscription: {
				endpoint: string;
				keys?: { auth?: string; p256dh?: string };
			};
		};

		const existing = await listDocuments<Record<string, unknown>>(
			PUSH_SUBSCRIPTIONS_COLLECTION,
			[Query.equal("endpoint", subscription.endpoint)],
		);

		if (existing.length > 0) {
			return { success: true };
		}

		await databases.createDocument(
			APPWRITE_DATABASE_ID,
			PUSH_SUBSCRIPTIONS_COLLECTION,
			"unique()",
			{
				userId,
				endpoint: subscription.endpoint,
				auth: subscription.keys?.auth || "",
				p256dh: subscription.keys?.p256dh || "",
				createdAt: new Date().toISOString(),
			},
		);

		return { success: true };
	},
	errorLabel: "Push subscribe",
});

const unsubscribeHandler = createRouteHandler({
	auth: "required",
	validate: (body: Record<string, unknown>) => {
		if (!body.endpoint) return "endpoint is required";
		return null;
	},
	execute: async ({ body, userId }) => {
		const { endpoint } = body as { endpoint: string };

		const existing = await listDocuments<Record<string, unknown>>(
			PUSH_SUBSCRIPTIONS_COLLECTION,
			[Query.equal("endpoint", endpoint), Query.equal("userId", userId ?? "")],
		);

		if (existing.length > 0) {
			await databases.deleteDocument(
				APPWRITE_DATABASE_ID,
				PUSH_SUBSCRIPTIONS_COLLECTION,
				existing[0].$id as string,
			);
		}

		return { success: true };
	},
	errorLabel: "Push unsubscribe",
});

export const POST = withRateLimit(subscribeHandler, {
	max: 5,
	windowMs: 60000,
});
export const DELETE = withRateLimit(unsubscribeHandler, {
	max: 5,
	windowMs: 60000,
});

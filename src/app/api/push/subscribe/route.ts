import { type NextRequest, NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const PUSH_SUBSCRIPTIONS_COLLECTION = "push_subscriptions";

async function subscribeHandler(req: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const { subscription } = await req.json();

		if (!subscription?.endpoint) {
			return NextResponse.json(
				{ error: "Invalid subscription" },
				{ status: 400 },
			);
		}

		const [{ Query }, { listDocuments }] = await Promise.all([
			import("appwrite"),
			import("@/lib/db/client"),
		]);

		const existing = await listDocuments<Record<string, unknown>>(
			PUSH_SUBSCRIPTIONS_COLLECTION,
			[Query.equal("endpoint", subscription.endpoint)],
		);

		if (existing.length > 0) {
			return NextResponse.json({ success: true });
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

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to store push subscription:", error);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}

async function unsubscribeHandler(req: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const { endpoint } = await req.json();

		if (!endpoint) {
			return NextResponse.json(
				{ error: "endpoint is required" },
				{ status: 400 },
			);
		}

		const [{ Query }, { listDocuments }] = await Promise.all([
			import("appwrite"),
			import("@/lib/db/client"),
		]);

		const existing = await listDocuments<Record<string, unknown>>(
			PUSH_SUBSCRIPTIONS_COLLECTION,
			[Query.equal("endpoint", endpoint), Query.equal("userId", userId)],
		);

		if (existing.length > 0) {
			await databases.deleteDocument(
				APPWRITE_DATABASE_ID,
				PUSH_SUBSCRIPTIONS_COLLECTION,
				existing[0].$id as string,
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to remove push subscription:", error);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}

export const POST = withRateLimit(subscribeHandler, {
	max: 5,
	windowMs: 60000,
});

export const DELETE = withRateLimit(unsubscribeHandler, {
	max: 5,
	windowMs: 60000,
});

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function pushSendHandler(req: NextRequest) {
	await requireAdmin();

	try {
		const { title, body, url, userId } = await req.json();

		if (!title) {
			return NextResponse.json({ error: "title is required" }, { status: 400 });
		}

		const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
		const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

		if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
			console.warn("VAPID keys not configured, skipping push");
			return NextResponse.json({
				success: false,
				reason: "vapid-not-configured",
			});
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
					JSON.stringify({ title, body: body || "", url: url || "/dashboard" }),
				);
			}),
		);

		const sent = results.filter((r) => r.status === "fulfilled").length;

		return NextResponse.json({
			success: true,
			sent,
			total: subscriptions.length,
		});
	} catch (error) {
		console.error("Failed to send push notification:", error);
		return NextResponse.json(
			{ success: false, error: String(error) },
			{ status: 500 },
		);
	}
}

export const POST = withRateLimit(pushSendHandler, {
	max: 3,
	windowMs: 60000,
});

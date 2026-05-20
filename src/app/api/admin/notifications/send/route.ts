import { type NextRequest, NextResponse } from "next/server";
import { listDocuments } from "@/lib/db/client";
import { requireAdmin } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
	try {
		await requireAdmin();

		const { title, body, url, subject } = await request.json();

		if (
			!title ||
			!body ||
			typeof title !== "string" ||
			typeof body !== "string"
		) {
			return NextResponse.json(
				{ error: "title and body are required and must be strings" },
				{ status: 400 },
			);
		}
		if (title.length > 100 || body.length > 500) {
			return NextResponse.json(
				{ error: "title (max 100) or body (max 500) too long" },
				{ status: 400 },
			);
		}

		const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
		const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

		if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
			return NextResponse.json(
				{ error: "VAPID keys not configured" },
				{ status: 500 },
			);
		}

		const webpush = await import("web-push");

		webpush.default.setVapidDetails(
			"mailto:study@lumni.app",
			VAPID_PUBLIC_KEY,
			VAPID_PRIVATE_KEY,
		);

		const subscriptions = await listDocuments<Record<string, unknown>>(
			"push_subscriptions",
			[],
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
						body,
						url: url || "/dashboard",
						subject: subject || "",
					}),
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
		console.error("Failed to send broadcast:", error);
		return NextResponse.json(
			{ success: false, error: String(error) },
			{ status: 500 },
		);
	}
}

import { NextRequest, NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";

const PUSH_SUBSCRIPTIONS_COLLECTION = "push_subscriptions";

export async function POST(req: NextRequest) {
	try {
		const { subscription, userId } = await req.json();

		if (!subscription || !subscription.endpoint) {
			return NextResponse.json(
				{ error: "Invalid subscription" },
				{ status: 400 },
			);
		}

		await databases.createDocument(
			APPWRITE_DATABASE_ID,
			PUSH_SUBSCRIPTIONS_COLLECTION,
			"unique()",
			{
				userId: userId || "anonymous",
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

export async function DELETE(req: NextRequest) {
	try {
		const { endpoint } = await req.json();

		if (!endpoint) {
			return NextResponse.json(
				{ error: "endpoint is required" },
				{ status: 400 },
			);
		}

		const { Query } = await import("appwrite");
		const { listDocuments } = await import("@/lib/db/client");

		const existing = await listDocuments<Record<string, unknown>>(
			PUSH_SUBSCRIPTIONS_COLLECTION,
			[Query.equal("endpoint", endpoint)],
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

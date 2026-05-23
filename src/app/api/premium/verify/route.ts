import { Client, Databases, Query } from "appwrite";
import { NextResponse } from "next/server";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export async function POST(_req: Request) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ verified: false, isPremium: false });
		}

		const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

		if (STRIPE_SECRET_KEY) {
			try {
				const stripeRes = await fetch(
					"https://api.stripe.com/v1/subscriptions",
					{
						cache: "no-store",
						headers: {
							Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
						},
					},
				);

				if (stripeRes.ok) {
					const subscriptions = await stripeRes.json();
					const activeSub = (subscriptions.data || []).find(
						(sub: Record<string, unknown>) =>
							sub.status === "active" || sub.status === "trialing",
					);
					return NextResponse.json({
						verified: true,
						isPremium: !!activeSub,
					});
				}
			} catch {
				// Fall through to Appwrite check
			}
		}

		const client = new Client()
			.setEndpoint(APPWRITE_ENDPOINT)
			.setProject(APPWRITE_PROJECT);

		const db = new Databases(client);
		try {
			const premiumDocs = await db.listDocuments(
				APPWRITE_DATABASE_ID,
				"premium_subscriptions",
				[Query.equal("userId", userId), Query.equal("status", "active")],
			);
			return NextResponse.json({
				verified: true,
				isPremium: premiumDocs.total > 0,
			});
		} catch {
			return NextResponse.json({
				verified: true,
				isPremium: false,
			});
		}
	} catch (error) {
		console.error("Verify premium error:", error);
		return NextResponse.json({ error: "Verification failed" }, { status: 500 });
	}
}

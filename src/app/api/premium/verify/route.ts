import { Client, Databases, Query } from "appwrite";
import { type NextRequest, NextResponse } from "next/server";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function verifyHandler(_req: NextRequest) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ verified: false, isPremium: false });
		}

		const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

		if (STRIPE_SECRET_KEY) {
			try {
				const stripeRes = await fetch(
					`https://api.stripe.com/v1/subscriptions?client_reference_id=${userId}`,
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
						subscriptionId: activeSub?.id as string | undefined,
						expiresAt:
							(activeSub?.current_period_end as number | undefined) != null
								? new Date(
										(activeSub.current_period_end as number) * 1000,
									).toISOString()
								: undefined,
					});
				}
			} catch (stripeErr) {
				console.error("Stripe verify error:", stripeErr);
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
			const doc = premiumDocs.documents[0] as
				| { subscriptionId?: string; expiresAt?: string }
				| undefined;
			return NextResponse.json({
				verified: true,
				isPremium: premiumDocs.total > 0,
				subscriptionId: doc?.subscriptionId,
				expiresAt: doc?.expiresAt,
			});
		} catch (dbErr) {
			console.error("Premium DB query error:", dbErr);
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

export const POST = withRateLimit(verifyHandler, {
	max: 10,
	windowMs: 60000,
});

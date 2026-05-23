import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function cancelHandler(req: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const { subscriptionId } = await req.json();

		if (!subscriptionId) {
			return NextResponse.json(
				{ error: "Missing subscriptionId" },
				{ status: 400 },
			);
		}

		const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

		if (STRIPE_SECRET_KEY) {
			const validateRes = await fetch(
				`https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
				{
					cache: "no-store",
					headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
				},
			);

			if (validateRes.ok) {
				const sub = await validateRes.json();
				if (
					sub.metadata?.client_reference_id &&
					sub.metadata.client_reference_id !== userId
				) {
					return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
				}
			}

			const stripeRes = await fetch(
				`https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
				{
					method: "DELETE",
					cache: "no-store",
					headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
				},
			);

			if (!stripeRes.ok) {
				const errBody = await stripeRes.text();
				console.error("Stripe cancel error:", errBody);
				return NextResponse.json({ success: false }, { status: 502 });
			}

			return NextResponse.json({ success: true });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Cancel subscription error:", error);
		return NextResponse.json(
			{ error: "Failed to cancel subscription" },
			{ status: 500 },
		);
	}
}

export const POST = withRateLimit(cancelHandler, {
	max: 3,
	windowMs: 60000,
});

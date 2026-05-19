import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function cancelHandler(_req: NextRequest) {
	await requireAdmin();

	try {
		const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
		const STRIPE_SUBSCRIPTION_ID = process.env.STRIPE_SUBSCRIPTION_ID;

		if (STRIPE_SECRET_KEY && STRIPE_SUBSCRIPTION_ID) {
			const stripeRes = await fetch(
				`https://api.stripe.com/v1/subscriptions/${STRIPE_SUBSCRIPTION_ID}`,
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

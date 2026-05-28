import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const PRICE_IDS: Record<string, string> = {
	monthly: "price_premium_monthly",
	yearly: "price_premium_yearly",
};

async function checkoutHandler(req: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

		if (STRIPE_SECRET_KEY) {
			const { priceId, billing } = await req.json();
			const resolvedPriceId =
				priceId || PRICE_IDS[billing as string] || "price_premium_yearly";
			const stripeRes = await fetch(
				"https://api.stripe.com/v1/checkout/sessions",
				{
					method: "POST",
					cache: "no-store",
					headers: {
						Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						mode: "subscription",
						"line_items[0][price]": resolvedPriceId,
						"line_items[0][quantity]": "1",
						client_reference_id: userId,
						"subscription_data[metadata][client_reference_id]": userId,
						success_url: `${new URL(req.url).origin}/premium?success=true`,
						cancel_url: `${new URL(req.url).origin}/premium?canceled=true`,
					}),
				},
			);

			if (!stripeRes.ok) {
				const errBody = await stripeRes.text();
				console.error("Stripe checkout error:", errBody);
				return NextResponse.json({ url: null }, { status: 502 });
			}

			const session = await stripeRes.json();
			return NextResponse.json({ url: session.url });
		}

		return NextResponse.json(
			{ error: "Payment not configured" },
			{ status: 503 },
		);
	} catch (error) {
		console.error("Checkout error:", error);
		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 },
		);
	}
}

export const POST = withRateLimit(checkoutHandler, {
	max: 5,
	windowMs: 60000,
});

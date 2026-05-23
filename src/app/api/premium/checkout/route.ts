import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function checkoutHandler(req: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

		if (STRIPE_SECRET_KEY) {
			const { priceId } = await req.json();
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
						"line_items[0][price]": priceId || "price_premium_yearly",
						"line_items[0][quantity]": "1",
						client_reference_id: userId,
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

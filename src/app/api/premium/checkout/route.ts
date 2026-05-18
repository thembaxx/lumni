import { NextResponse } from "next/server";

export async function POST(_req: Request) {
	try {
		const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

		if (STRIPE_SECRET_KEY) {
			const { priceId } = await _req.json();
			const stripeRes = await fetch(
				"https://api.stripe.com/v1/checkout/sessions",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: new URLSearchParams({
						mode: "subscription",
						"line_items[0][price]": priceId || "price_premium_yearly",
						"line_items[0][quantity]": "1",
						success_url: `${new URL(_req.url).origin}/premium?success=true`,
						cancel_url: `${new URL(_req.url).origin}/premium?canceled=true`,
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

		const body = await _req.json();
		return NextResponse.json({
			url: `/premium?checkout=${encodeURIComponent(JSON.stringify(body))}`,
		});
	} catch (error) {
		console.error("Checkout error:", error);
		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 },
		);
	}
}

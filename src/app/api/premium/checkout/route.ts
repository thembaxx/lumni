import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const PRICE_IDS: Record<string, string> = {
	monthly: "price_premium_monthly",
	yearly: "price_premium_yearly",
};

export const POST = withRateLimit(
	createRouteHandler({
		auth: "required",
		execute: async ({ userId, req, body }) => {
			const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

			if (STRIPE_SECRET_KEY) {
				const { priceId, billing } = body as {
					priceId?: string;
					billing?: string;
				};
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
							client_reference_id: userId ?? "",
							"subscription_data[metadata][client_reference_id]": userId ?? "",
							success_url: `${new URL(req.url).origin}/premium?success=true`,
							cancel_url: `${new URL(req.url).origin}/premium?canceled=true`,
						}),
					},
				);

				if (!stripeRes.ok) {
					const errBody = await stripeRes.text();
					console.error("Stripe checkout error:", errBody);
					return { url: null };
				}

				const session = await stripeRes.json();
				return { url: session.url };
			}

			throw new HttpError(503, "Payment not configured");
		},
		errorLabel: "Checkout",
	}),
	{ max: 5, windowMs: 60000 },
);

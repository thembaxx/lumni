import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const POST = withRateLimit(
  createRouteHandler({
    auth: "required",
    validate: (body: Record<string, unknown>) => {
      if (!body.subscriptionId) return "Missing subscriptionId";
      return null;
    },
    execute: async ({ userId, body }) => {
      const { subscriptionId } = body as { subscriptionId: string };
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
          if (sub.metadata?.client_reference_id && sub.metadata.client_reference_id !== userId) {
            throw new HttpError(403, "Unauthorized");
          }
        }

        const stripeRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
          method: "DELETE",
          cache: "no-store",
          headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
        });

        if (!stripeRes.ok) {
          const errBody = await stripeRes.text();
          logError("PremiumCancel", new Error(errBody));
          return { success: false };
        }

        return { success: true };
      }

      throw new HttpError(503, "Payment provider not configured");
    },
    errorLabel: "Cancel subscription",
  }),
  { max: 3, windowMs: 60000 },
);

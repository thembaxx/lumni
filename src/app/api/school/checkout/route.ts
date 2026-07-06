import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { createStripeCheckoutSession } from "@/lib/school/billing-service";
import { isUserSchoolMember } from "@/lib/school/service";
import { z } from "zod";

const schema = z.object({
  schoolId: z.string(),
  tier: z.enum(["standard", "premium"]),
  billingFrequency: z.enum(["monthly", "annual"]),
  seatCount: z.number().int().min(1).max(500),
  returnUrl: z.string().url(),
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SchoolCheckout",
  useRateLimit: true,
  execute: async ({ body, userId }) => {
    if (!userId) throw new HttpError(401, "Authentication required");

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
      );
    }

    const { schoolId, tier, billingFrequency, seatCount, returnUrl } = parsed.data;

    const membership = await isUserSchoolMember(schoolId, userId);
    if (!membership.isMember || !["admin", "billing"].includes(membership.role ?? "")) {
      throw new HttpError(403, "Not authorized to manage billing for this school");
    }

    const result = await createStripeCheckoutSession(
      schoolId,
      tier,
      billingFrequency,
      seatCount,
      returnUrl,
    );

    if (!result) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          checkoutUrl: null,
          sessionId: null,
          message: "Payment provider is not configured. Please contact support.",
        };
      }
      throw new HttpError(500, "Failed to create checkout session");
    }

    return result;
  },
});

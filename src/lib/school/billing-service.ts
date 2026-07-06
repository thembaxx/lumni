import { Query } from "appwrite";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/constants";
import { logError } from "@/lib/shared/logger";
import { calculatePrice } from "./pricing";
import type { LicenseTier } from "./pricing";
import { getSchool } from "./service";
import type { SchoolResult } from "./service";

export async function getBillingInfo(
  schoolId: string,
  page = 1,
  limit = 20,
): Promise<{
  school: SchoolResult | null;
  currentLicense: Record<string, unknown> | null;
  invoices: Record<string, unknown>[];
  totalPages: number;
}> {
  try {
    const school = await getSchool(schoolId);
    if (!school) return { school: null, currentLicense: null, invoices: [], totalPages: 0 };

    const licenseResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.LICENSES,
      [Query.equal("schoolId", schoolId), Query.orderDesc("startDate"), Query.limit(1)],
    );
    const currentLicense =
      licenseResponse.total > 0
        ? (licenseResponse.documents[0] as unknown as Record<string, unknown>)
        : null;

    const invoiceResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.INVOICES,
      [
        Query.equal("schoolId", schoolId),
        Query.orderDesc("createdAt"),
        Query.limit(limit),
        Query.offset((page - 1) * limit),
      ],
    );

    return {
      school,
      currentLicense,
      invoices: invoiceResponse.documents as unknown as Record<string, unknown>[],
      totalPages: Math.max(1, Math.ceil(invoiceResponse.total / limit)),
    };
  } catch (err) {
    logError("SchoolService.GetBillingInfo", err, { schoolId });
    return { school: null, currentLicense: null, invoices: [], totalPages: 0 };
  }
}

const PRICING_LABELS: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  premium: "Premium",
};

export async function createStripeCheckoutSession(
  schoolId: string,
  tier: LicenseTier,
  billingFrequency: "monthly" | "annual",
  seatCount: number,
  returnUrl: string,
): Promise<{ checkoutUrl: string; sessionId: string } | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null;

  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });

    const totalPrice = calculatePrice(tier, seatCount, billingFrequency);
    const priceInCents = Math.round(totalPrice);

    const price = await stripe.prices.create({
      unit_amount: priceInCents,
      currency: "zar",
      recurring: { interval: billingFrequency === "monthly" ? "month" : "year" },
      product_data: {
        name: `Lumni ${PRICING_LABELS[tier]} — ${seatCount} teachers`,
      },
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      client_reference_id: schoolId,
      metadata: {
        schoolId,
        tier,
        seatCount: String(seatCount),
        billingFrequency,
      },
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
    });

    if (!session.url) return null;

    const now = new Date().toISOString();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (billingFrequency === "annual" ? 12 : 1));

    await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.LICENSES, "unique()", {
      schoolId,
      tier,
      status: "pending",
      startDate: now,
      endDate: endDate.toISOString(),
      autoRenew: true,
      stripeSubscriptionId: session.id,
      provider: "stripe",
      seatCount,
      unitPrice: Math.round(totalPrice / seatCount),
      totalPrice,
      createdAt: now,
    });

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  } catch (err) {
    logError("BillingService.CreateStripeCheckoutSession", err, { schoolId, tier });
    return null;
  }
}

export async function cancelSubscription(
  schoolId: string,
  immediate: boolean,
): Promise<{ licenseId: string; status: string; effectiveEndDate: string } | null> {
  try {
    const licenseResponse = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.LICENSES,
      [Query.equal("schoolId", schoolId), Query.equal("status", "active"), Query.limit(1)],
    );
    if (licenseResponse.total === 0) return null;

    const license = licenseResponse.documents[0];
    const licenseId = license.$id;
    const stripeSubId = license.stripeSubscriptionId as string | undefined;

    if (stripeSubId && process.env.STRIPE_SECRET_KEY) {
      try {
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
          apiVersion: "2026-05-27.dahlia",
        });
        await stripe.subscriptions.update(stripeSubId, {
          cancel_at_period_end: !immediate,
        });
        if (immediate) {
          await stripe.subscriptions.cancel(stripeSubId);
        }
      } catch (stripeErr) {
        logError("BillingService.CancelSubscription.Stripe", stripeErr, { schoolId, stripeSubId });
      }
    }

    const now = new Date().toISOString();
    const newStatus = immediate ? "cancelled" : "cancelling";
    await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.LICENSES, licenseId, {
      status: newStatus,
      cancelledAt: now,
    });

    if (immediate) {
      await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.SCHOOLS, schoolId, {
        billingStatus: "cancelled",
        updatedAt: now,
      });
    }

    return {
      licenseId,
      status: newStatus,
      effectiveEndDate: immediate ? now : (license.endDate as string),
    };
  } catch (err) {
    logError("BillingService.CancelSubscription", err, { schoolId });
    return null;
  }
}

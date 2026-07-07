import { NextResponse } from "next/server";
import { Query } from "appwrite";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/constants";
import { logError } from "@/lib/shared/logger";

export async function POST(req: Request, deps?: StripeWebhookDeps) {
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    const d = deps ?? (await getDefaultDeps());
    event = d.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logError("StripeWebhook.SignatureVerification", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const schoolId = session.client_reference_id as string;
        const subscriptionId = session.subscription as string;

        if (!schoolId) break;

        const licenseResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.LICENSES,
          [
            Query.equal("schoolId", schoolId),
            Query.equal("status", "pending"),
            Query.orderDesc("createdAt"),
            Query.limit(1),
          ],
        );

        if (licenseResponse.total > 0) {
          const license = licenseResponse.documents[0];
          await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.LICENSES, license.$id, {
            status: "active",
            stripeSubscriptionId: subscriptionId ?? license.stripeSubscriptionId,
            activatedAt: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id as string;

        const licenseResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.LICENSES,
          [
            Query.equal("stripeSubscriptionId", subscriptionId),
            Query.equal("status", "active"),
            Query.limit(1),
          ],
        );

        if (licenseResponse.total > 0) {
          const license = licenseResponse.documents[0];
          await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.LICENSES, license.$id, {
            status: "cancelled",
            cancelledAt: new Date().toISOString(),
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const licenseResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.LICENSES,
          [Query.equal("stripeSubscriptionId", subscriptionId), Query.limit(1)],
        );

        if (licenseResponse.total > 0) {
          const license = licenseResponse.documents[0];
          await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.LICENSES, license.$id, {
            paymentStatus: "failed",
            lastPaymentError: new Date().toISOString(),
          });
        }
        break;
      }
    }
  } catch (err) {
    logError("StripeWebhook.EventHandling", err, { eventType: event.type });
  }

  return NextResponse.json({ received: true });
}

import { Client, Databases } from "appwrite";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
	apiVersion: "2026-05-27.dahlia" as const,
});

export async function POST(req: Request) {
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

	if (!webhookSecret) {
		return NextResponse.json(
			{ error: "Webhook not configured" },
			{ status: 503 },
		);
	}

	try {
		const body = await req.text();
		const sig = req.headers.get("stripe-signature");

		if (!sig) {
			return NextResponse.json({ error: "Missing signature" }, { status: 400 });
		}

		const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

		const client = new Client()
			.setEndpoint(APPWRITE_ENDPOINT)
			.setProject(APPWRITE_PROJECT);
		const db = new Databases(client);
		const dbId = APPWRITE_DATABASE_ID;

		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				const userId = session.client_reference_id;
				const subscriptionId =
					typeof session.subscription === "string" ? session.subscription : "";

				if (!userId || !subscriptionId) break;

				const expiresAt = new Date(
					Date.now() + 365 * 24 * 60 * 60 * 1000,
				).toISOString();

				try {
					await db.createDocument(dbId, "premium_subscriptions", "unique()", {
						userId,
						provider: "stripe",
						status: "active",
						subscriptionId,
						amount: "999.00",
						itemName: "Lumni Premium Yearly",
						createdAt: new Date().toISOString(),
						expiresAt,
					});
				} catch (writeErr) {
					console.error("Appwrite write error:", writeErr);
				}
				break;
			}

			case "customer.subscription.deleted": {
				const sub = event.data.object as Stripe.Subscription;
				try {
					const docs = await db.listDocuments(dbId, "premium_subscriptions", [
						`subscriptionId=${sub.id}`,
						`status=active`,
					] as unknown as string[]);
					for (const doc of docs.documents) {
						await db.updateDocument(dbId, "premium_subscriptions", doc.$id, {
							status: "cancelled",
						});
					}
				} catch (err) {
					console.error("Subscription delete handler error:", err);
				}
				break;
			}
		}

		return NextResponse.json({ received: true });
	} catch (err) {
		console.error("Stripe webhook error:", err);
		return NextResponse.json(
			{ error: "Webhook handler failed" },
			{ status: 400 },
		);
	}
}

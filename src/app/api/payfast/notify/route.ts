import { Client, Databases, ID } from "appwrite";
import { NextResponse } from "next/server";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";

const PF_SANDBOX = process.env.PAYFAST_SANDBOX === "true";
const PF_VALIDATE_HOST = PF_SANDBOX
	? "https://sandbox.payfast.co.za/eng/query/validate"
	: "https://www.payfast.co.za/eng/query/validate";

async function generateSignature(
	data: Record<string, string>,
): Promise<string> {
	const passphrase = process.env.PAYFAST_PASSPHRASE || "";
	const sortedKeys = Object.keys(data).sort();
	const paramString = sortedKeys
		.map(
			(key) => `${key}=${encodeURIComponent(data[key]).replace(/%20/g, "+")}`,
		)
		.join("&");
	const sigString = passphrase
		? `${paramString}&passphrase=${encodeURIComponent(passphrase).replace(/%20/g, "+")}`
		: paramString;
	const encoder = new TextEncoder();
	const hashBuffer = await crypto.subtle.digest(
		"MD5",
		encoder.encode(sigString),
	);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		const pfData: Record<string, string> = {};
		for (const [key, value] of formData.entries()) {
			pfData[key] = value.toString();
		}

		if (!pfData.signature) {
			return NextResponse.json({ error: "Missing signature" }, { status: 400 });
		}

		const receivedSignature = pfData.signature;
		delete pfData.signature;

		const expectedSignature = await generateSignature(pfData);
		if (receivedSignature !== expectedSignature) {
			console.error("Payfast IPN: invalid signature");
			return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
		}

		const body = new URLSearchParams(pfData);

		let pfValid = false;
		try {
			const validateRes = await fetch(PF_VALIDATE_HOST, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: body.toString(),
				cache: "no-store",
			});
			const text = await validateRes.text();
			pfValid = text === "VALID";
		} catch (e) {
			console.error("Payfast IPN validation error:", e);
		}

		if (!pfValid) {
			console.error("Payfast IPN: validation failed");
			return NextResponse.json({ error: "Invalid" }, { status: 403 });
		}

		const paymentStatus = pfData.payment_status;
		const userId = pfData.custom_str1 || pfData.m_payment_id;

		if (paymentStatus === "COMPLETE" && userId) {
			try {
				const client = new Client()
					.setEndpoint(APPWRITE_ENDPOINT)
					.setProject(APPWRITE_PROJECT);
				const db = new Databases(client);

				await db.createDocument(
					APPWRITE_DATABASE_ID,
					"premium_subscriptions",
					ID.unique(),
					{
						userId,
						provider: "payfast",
						status: "active",
						amount: pfData.amount,
						itemName: pfData.item_name,
						pfPaymentId: pfData.pf_payment_id,
						createdAt: new Date().toISOString(),
						expiresAt: new Date(
							Date.now() + 365 * 24 * 60 * 60 * 1000,
						).toISOString(),
					},
				);
			} catch (dbErr) {
				console.error("Payfast IPN DB error:", dbErr);
			}
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Payfast IPN error:", error);
		return NextResponse.json({ error: "IPN failed" }, { status: 500 });
	}
}

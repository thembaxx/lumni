import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";

const PF_HOST =
	process.env.PAYFAST_SANDBOX === "true"
		? "https://sandbox.payfast.co.za/eng/process"
		: "https://www.payfast.co.za/eng/process";

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

export async function POST(req: NextRequest) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const merchantId = process.env.PAYFAST_MERCHANT_ID;
		const merchantKey = process.env.PAYFAST_MERCHANT_KEY;

		if (!merchantId || !merchantKey) {
			return NextResponse.json(
				{ error: "Payfast not configured" },
				{ status: 503 },
			);
		}

		const origin = new URL(req.url).origin;
		const { amount, item_name } = await req.json();

		const data: Record<string, string> = {
			merchant_id: merchantId,
			merchant_key: merchantKey,
			return_url: `${origin}/premium?success=true`,
			cancel_url: `${origin}/premium?canceled=true`,
			notify_url: `${origin}/api/payfast/notify`,
			name_first: "",
			name_last: "",
			email_address: "",
			m_payment_id: userId,
			amount: amount || "99.00",
			item_name: item_name || "Lumni Premium Yearly",
			custom_str1: userId,
		};

		const signature = await generateSignature(data);

		return NextResponse.json({
			url: PF_HOST,
			data: { ...data, signature },
		});
	} catch (error) {
		console.error("Payfast checkout error:", error);
		return NextResponse.json(
			{ error: "Failed to create checkout" },
			{ status: 500 },
		);
	}
}

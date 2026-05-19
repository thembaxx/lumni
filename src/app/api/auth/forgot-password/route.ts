import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const APPWRITE_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

async function forgotPasswordHandler(request: NextRequest) {
	try {
		const { email } = await request.json();

		if (!email) {
			return NextResponse.json({ ok: true });
		}

		const res = await fetch(`${APPWRITE_ENDPOINT}/account/password/recovery`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Appwrite-Project": APPWRITE_PROJECT,
			},
			body: JSON.stringify({
				email,
				url: `${new URL(request.url).origin}/auth/reset-password`,
			}),
		});

		if (!res.ok) {
			console.warn("Password recovery request failed:", await res.text());
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("Forgot password error:", error);
		return NextResponse.json({ ok: true });
	}
}

export const POST = withRateLimit(forgotPasswordHandler, {
	max: 3,
	windowMs: 60000,
});

import { type NextRequest, NextResponse } from "next/server";
import { account } from "@/lib/appwrite";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function verifyEmailHandler(req: NextRequest) {
	try {
		const { userId, secret } = await req.json();

		if (!userId || !secret) {
			return NextResponse.json(
				{ error: "Missing userId or secret" },
				{ status: 400 },
			);
		}

		await account.updateVerification(userId, secret);

		return NextResponse.json({ verified: true });
	} catch (error) {
		console.error("Email verification error:", error);
		return NextResponse.json(
			{ error: "Failed to verify email" },
			{ status: 500 },
		);
	}
}

export const POST = withRateLimit(verifyEmailHandler, {
	max: 5,
	windowMs: 60000,
});

import { type NextRequest, NextResponse } from "next/server";
import { account } from "@/lib/appwrite";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function handler(req: NextRequest) {
	try {
		const { userId, secret, password } = await req.json();

		if (!userId || !secret || !password) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		if (password.length < 8) {
			return NextResponse.json(
				{ error: "Password must be at least 8 characters" },
				{ status: 400 },
			);
		}

		await account.updateRecovery(userId, secret, password);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Reset password error:", error);
		const message =
			error instanceof Error ? error.message : "Failed to reset password";
		return NextResponse.json({ error: message }, { status: 400 });
	}
}

export const POST = withRateLimit(handler, { max: 3, windowMs: 60000 });

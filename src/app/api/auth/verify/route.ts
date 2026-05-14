import { NextRequest, NextResponse } from "next/server";
import { account } from "@/lib/appwrite";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const secret = searchParams.get("secret");

		if (!userId || !secret) {
			return NextResponse.redirect(
				new URL("/settings?error=missing_params", request.url),
			);
		}

		await account.updateVerification(userId, secret);

		return NextResponse.redirect(
			new URL("/settings?verified=true", request.url),
		);
	} catch (error) {
		console.error("[Email Verification] Error:", error);
		return NextResponse.redirect(
			new URL("/settings?error=verification_failed", request.url),
		);
	}
}

import { NextRequest, NextResponse } from "next/server";
import { account } from "@/lib/appwrite";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("userId");
		const secret = searchParams.get("secret");

		if (!userId || !secret) {
			return NextResponse.redirect(
				new URL("/?error=missing_params", request.url),
			);
		}

		await account.createSession(userId, secret);

		return NextResponse.redirect(
			new URL("/dashboard?auth=success", request.url),
		);
	} catch (error) {
		console.error("[Auth Callback] Error:", error);
		return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
	}
}

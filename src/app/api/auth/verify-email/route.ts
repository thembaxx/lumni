import { NextResponse } from "next/server";
import { account } from "@/lib/appwrite";

export async function POST(_req: Request) {
	try {
		const { userId, secret } = await _req.json();

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

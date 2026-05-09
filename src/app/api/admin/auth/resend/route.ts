import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email } = body;

		if (!email) {
			return NextResponse.json(
				{ success: false, error: "Email is required" },
				{ status: 400 },
			);
		}

		await import("@/lib/appwrite").then(({ account }) =>
			account.createMagicSession(
				email,
				`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`,
			),
		);

		return NextResponse.json({
			success: true,
			message: "Magic link resent",
			email,
		});
	} catch (error) {
		console.error("[Resend] Error:", error);
		return NextResponse.json(
			{ success: false, error: "Failed to resend magic link" },
			{ status: 500 },
		);
	}
}

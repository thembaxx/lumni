import { type NextRequest, NextResponse } from "next/server";
import { serverAccount } from "@/lib/appwrite";

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

		await serverAccount.createMagicURLToken(
			"unique()",
			email,
			`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`,
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

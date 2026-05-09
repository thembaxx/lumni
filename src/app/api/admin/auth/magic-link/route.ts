import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { account } from "@/lib/appwrite";

const magicLinkSchema = z.object({
	email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const result = magicLinkSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{
					success: false,
					error: result.error.errors[0]?.message || "Invalid email",
				},
				{ status: 400 },
			);
		}

		const { email } = result.data;

		await account.createMagicSession(
			email,
			`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`,
		);

		return NextResponse.json({
			success: true,
			message: "Magic link sent to your email",
			email,
		});
	} catch (error) {
		console.error("[Magic Link] Error:", error);
		const appwriteError = error as { message?: string };
		if (appwriteError.message?.includes("already exists")) {
			return NextResponse.json(
				{ success: false, error: "Email already registered" },
				{ status: 400 },
			);
		}
		return NextResponse.json(
			{ success: false, error: "Failed to send magic link" },
			{ status: 500 },
		);
	}
}

import { NextRequest, NextResponse } from "next/server";
import {
	APPWRITE_ADMIN_EMAIL,
	canResend,
	createAuthAttempt,
	getAuthAttempt,
	getLockRemaining,
	getResendCountdown,
	isLocked,
	LOCK_DURATION_MS,
	magicLinkSchema,
	setAuthAttempt,
} from "@/lib/appwrite-auth";

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
		const emailLower = email.toLowerCase();

		if (isLocked(emailLower)) {
			const lockRemaining = getLockRemaining(emailLower);
			const minutes = Math.floor(lockRemaining / 60000);
			const seconds = Math.floor((lockRemaining % 60000) / 1000);
			return NextResponse.json(
				{
					success: false,
					error: `Too many failed attempts. Please try again in ${minutes}m ${seconds}s`,
					locked: true,
					lockRemaining,
				},
				{ status: 429 },
			);
		}

		const existingAttempt = getAuthAttempt(emailLower);
		if (existingAttempt && !canResend(emailLower)) {
			const countdown = getResendCountdown(emailLower);
			const minutes = Math.floor(countdown / 60000);
			const seconds = Math.floor((countdown % 60000) / 1000);
			return NextResponse.json(
				{
					success: false,
					error: `Please wait ${minutes}m ${seconds}s before resending`,
					countdown,
				},
				{ status: 429 },
			);
		}

		const attempt = createAuthAttempt(emailLower, "magic-link");
		setAuthAttempt(emailLower, attempt);

		const magicLinkUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/admin/auth/verify?token=${attempt.magicToken}&email=${encodeURIComponent(emailLower)}`;

		const isAdmin = emailLower === APPWRITE_ADMIN_EMAIL.toLowerCase();
		console.log(`[Magic Link] Sending to ${email} (admin: ${isAdmin})`);
		console.log(`[Magic Link] Link: ${magicLinkUrl}`);

		return NextResponse.json({
			success: true,
			message: "Magic link sent",
			email,
			isAdmin,
			expiryMinutes: 15,
		});
	} catch (error) {
		console.error("[Magic Link] Error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}

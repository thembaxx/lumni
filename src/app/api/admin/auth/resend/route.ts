import { NextRequest, NextResponse } from "next/server";
import {
	canResend,
	createAuthAttempt,
	getAuthAttempt,
	getLockRemaining,
	getResendCountdown,
	isAdminEmail,
	isLocked,
	resendSchema,
	setAuthAttempt,
} from "@/lib/appwrite-auth";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const result = resendSchema.safeParse(body);

		if (!result.success) {
			return NextResponse.json(
				{
					success: false,
					error: result.error.errors[0]?.message || "Invalid request",
				},
				{ status: 400 },
			);
		}

		const { type, email } = result.data;
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

		if (!canResend(emailLower)) {
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

		const attempt = createAuthAttempt(emailLower, type);
		setAuthAttempt(emailLower, attempt);

		const isAdmin = isAdminEmail(emailLower);

		if (type === "magic-link") {
			console.log(`[Resend Magic Link] Sending to ${email}`);
			return NextResponse.json({
				success: true,
				message: "Magic link resent",
				email,
				isAdmin,
				expiryMinutes: 15,
			});
		} else {
			console.log(`[Resend OTP] Sending to ${email}`);
			console.log(`[Resend OTP] Code: ${attempt.otp}`);
			return NextResponse.json({
				success: true,
				message: "OTP resent",
				otpId: emailLower,
				email,
				isAdmin,
			});
		}
	} catch (error) {
		console.error("[Resend] Error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}

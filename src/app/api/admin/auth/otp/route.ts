import { NextRequest, NextResponse } from "next/server";
import {
	APPWRITE_ADMIN_EMAIL,
	canResend,
	createAuthAttempt,
	getAuthAttempt,
	getLockRemaining,
	getResendCountdown,
	isLocked,
	otpSendSchema,
	setAuthAttempt,
} from "@/lib/appwrite-auth";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const result = otpSendSchema.safeParse(body);

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

		const attempt = createAuthAttempt(emailLower, "otp");
		setAuthAttempt(emailLower, attempt);

		const isAdmin = emailLower === APPWRITE_ADMIN_EMAIL.toLowerCase();
		console.log(`[OTP] Sending to ${email} (admin: ${isAdmin})`);
		console.log(`[OTP] Code: ${attempt.otp}`);

		return NextResponse.json({
			success: true,
			message: "OTP sent",
			otpId: emailLower,
			email,
			isAdmin,
		});
	} catch (error) {
		console.error("[OTP] Error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}

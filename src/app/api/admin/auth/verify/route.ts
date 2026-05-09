import { NextRequest, NextResponse } from "next/server";
import {
	deleteAuthAttempt,
	getAuthAttempt,
	getLockRemaining,
	getRemainingAttempts,
	incrementFailedAttempts,
	isAdminEmail,
	isLocked,
	MAX_FAILED_ATTEMPTS,
} from "@/lib/appwrite-auth";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { otpId, code } = body;

		if (!otpId || !code) {
			return NextResponse.json(
				{ success: false, error: "OTP ID and code are required" },
				{ status: 400 },
			);
		}

		const emailLower = otpId.toLowerCase();

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

		const attempt = getAuthAttempt(emailLower);
		if (!attempt) {
			return NextResponse.json(
				{ success: false, error: "No OTP found. Please request a new code." },
				{ status: 404 },
			);
		}

		if (!attempt.otp) {
			return NextResponse.json(
				{ success: false, error: "Invalid request type" },
				{ status: 400 },
			);
		}

		const now = Date.now();
		if (now > attempt.tokenExpiry) {
			deleteAuthAttempt(emailLower);
			return NextResponse.json(
				{ success: false, error: "Code expired. Please request a new one." },
				{ status: 410 },
			);
		}

		if (attempt.otp !== code) {
			const failed = incrementFailedAttempts(emailLower);
			const remaining = MAX_FAILED_ATTEMPTS - failed;

			if (remaining <= 0) {
				return NextResponse.json(
					{
						success: false,
						error: "Too many failed attempts. Account locked for 15 minutes.",
						locked: true,
						lockDuration: 15 * 60 * 1000,
					},
					{ status: 429 },
				);
			}

			return NextResponse.json(
				{
					success: false,
					error: `Invalid code. ${remaining} attempt(s) remaining`,
					remainingAttempts: remaining,
				},
				{ status: 401 },
			);
		}

		const isAdmin = isAdminEmail(emailLower);
		attempt.verified = true;
		deleteAuthAttempt(emailLower);

		return NextResponse.json({
			success: true,
			valid: true,
			isAdmin,
			isFullAccess: isAdmin,
			message: isAdmin ? "Admin access granted" : "Signed in as user",
		});
	} catch (error) {
		console.error("[Verify] Error:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
}

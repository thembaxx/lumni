import { type NextRequest, NextResponse } from "next/server";
import { serverAccount } from "@/lib/appwrite.server";
import { REFERRAL_REWARD_DAYS } from "@/lib/referral/constants";
import {
	getReferralByReferee,
	updateReferralStatus,
} from "@/lib/referral/service";

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

		await serverAccount.updateVerification(userId, secret);

		const referral = await getReferralByReferee(userId);
		if (referral && referral.status === "pending") {
			await updateReferralStatus(userId, "rewarded");

			return NextResponse.redirect(
				new URL(
					`/settings?verified=true&reward=${REFERRAL_REWARD_DAYS}&rewarded_by=${referral.referrerId}`,
					request.url,
				),
			);
		}

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

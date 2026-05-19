import { NextRequest, NextResponse } from "next/server";
import {
	buildReferralLink,
	generateReferralCode,
	REFERRAL_MONTHLY_LIMIT,
	REFERRAL_REWARD_DAYS,
} from "@/lib/referral/constants";
import {
	createReferralCode,
	getReferralCode,
	getReferralCountThisMonth,
	getReferralsByReferrer,
} from "@/lib/referral/service";
import {
	getAuthenticatedUserId,
	getAuthenticatedUserName,
} from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function referralInfoHandler(_req: NextRequest) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		let codeDoc = await getReferralCode(userId);
		if (!codeDoc) {
			const userName = await getAuthenticatedUserName();
			const code = generateReferralCode(userName || "User");
			try {
				await createReferralCode({ userId, code });
			} catch {
				// fallback with random suffix
			}
			const fresh = await getReferralCode(userId);
			if (!fresh) {
				return NextResponse.json(
					{ error: "Failed to create referral code" },
					{ status: 500 },
				);
			}
			codeDoc = fresh;
		}

		const referrals = await getReferralsByReferrer(userId);
		const monthlyCount = await getReferralCountThisMonth(userId);

		return NextResponse.json({
			code: codeDoc.code,
			link: buildReferralLink(codeDoc.code),
			monthlyCount,
			monthlyLimit: REFERRAL_MONTHLY_LIMIT,
			rewardDays: REFERRAL_REWARD_DAYS,
			referrals: referrals.map((r) => ({
				refereeId: r.refereeId,
				status: r.status,
				rewardedAt: r.rewardedAt ?? null,
				createdAt: r.createdAt,
			})),
		});
	} catch (error) {
		console.error("Referral info error:", error);
		return NextResponse.json(
			{ error: "Failed to get referral info" },
			{ status: 500 },
		);
	}
}

export const GET = withRateLimit(referralInfoHandler, {
	max: 10,
	windowMs: 60000,
});

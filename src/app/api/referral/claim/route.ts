import { NextResponse } from "next/server";
import {
	REFERRAL_MONTHLY_LIMIT,
	REFERRAL_REWARD_DAYS,
} from "@/lib/referral/constants";
import {
	createReferral,
	getReferralByCode,
	getReferralByReferee,
	getReferralCountThisMonth,
} from "@/lib/referral/service";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export async function POST(request: Request) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const body = await request.json();
		const { code, refereeId } = body;

		const existing = await getReferralByReferee(refereeId);
		if (existing) {
			return NextResponse.json({ ok: true, alreadyClaimed: true });
		}

		const codeDoc = await getReferralByCode(code);
		if (!codeDoc) {
			return NextResponse.json(
				{ error: "Invalid referral code" },
				{ status: 404 },
			);
		}

		if (codeDoc.userId === refereeId) {
			return NextResponse.json(
				{ error: "Cannot refer yourself" },
				{ status: 400 },
			);
		}

		const monthlyCount = await getReferralCountThisMonth(codeDoc.userId);
		if (monthlyCount >= REFERRAL_MONTHLY_LIMIT) {
			return NextResponse.json(
				{ error: "Referrer has reached monthly limit" },
				{ status: 429 },
			);
		}

		await createReferral({
			referrerId: codeDoc.userId,
			refereeId,
			code,
			status: "pending",
		});

		return NextResponse.json({
			ok: true,
			referrerId: codeDoc.userId,
			rewardDays: REFERRAL_REWARD_DAYS,
		});
	} catch (error) {
		console.error("Referral claim error:", error);
		return NextResponse.json(
			{ error: "Failed to claim referral" },
			{ status: 500 },
		);
	}
}

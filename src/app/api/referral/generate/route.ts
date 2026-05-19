import { NextResponse } from "next/server";
import {
	buildReferralLink,
	generateReferralCode,
} from "@/lib/referral/constants";
import { createReferralCode, getReferralCode } from "@/lib/referral/service";
import {
	getAuthenticatedUserId,
	getAuthenticatedUserName,
} from "@/lib/server/auth";

export async function POST() {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const codeDoc = await getReferralCode(userId);
		if (codeDoc) {
			return NextResponse.json({
				code: codeDoc.code,
				link: buildReferralLink(codeDoc.code),
			});
		}

		const userName = await getAuthenticatedUserName();
		const name = userName || "User";
		let code = generateReferralCode(name);
		let attempts = 0;
		while (attempts < 5) {
			try {
				await createReferralCode({ userId, code });
				break;
			} catch {
				attempts++;
				code = generateReferralCode(name);
			}
		}

		return NextResponse.json({
			code,
			link: buildReferralLink(code),
		});
	} catch (error) {
		console.error("Referral generate error:", error);
		return NextResponse.json(
			{ error: "Failed to generate code" },
			{ status: 500 },
		);
	}
}

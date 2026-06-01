import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
	buildReferralLink,
	generateReferralCode,
} from "@/lib/referral/constants";
import { createReferralCode, getReferralCode } from "@/lib/referral/service";
import { getAuthenticatedUserName } from "@/lib/server/auth";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "ReferralGenerate",
	execute: async ({ userId }) => {
		const codeDoc = await getReferralCode(userId as string);
		if (codeDoc) {
			return {
				code: codeDoc.code,
				link: buildReferralLink(codeDoc.code),
			};
		}

		const userName = await getAuthenticatedUserName();
		const name = userName || "User";
		let code = generateReferralCode(name);
		let attempts = 0;
		while (attempts < 5) {
			try {
				await createReferralCode({ userId: userId as string, code });
				break;
			} catch {
				attempts++;
				code = generateReferralCode(name);
			}
		}

		return {
			code,
			link: buildReferralLink(code),
		};
	},
});

import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { REFERRAL_MONTHLY_LIMIT, REFERRAL_REWARD_XP_REFEREE } from "@/lib/referral/constants";
import {
  createReferral,
  getReferralByCode,
  getReferralByReferee,
  getReferralCountThisMonth,
} from "@/lib/referral/service";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "ReferralClaim",
  execute: async ({ body }) => {
    const { code, refereeId } = body as { code?: string; refereeId?: string };

    if (!code || !refereeId) {
      throw new HttpError(400, "code and refereeId are required");
    }

    const existing = await getReferralByReferee(refereeId);
    if (existing) {
      return { ok: true, alreadyClaimed: true };
    }

    const codeDoc = await getReferralByCode(code);
    if (!codeDoc) {
      throw new HttpError(404, "Invalid referral code");
    }

    if (codeDoc.userId === refereeId) {
      throw new HttpError(400, "Cannot refer yourself");
    }

    const monthlyCount = await getReferralCountThisMonth(codeDoc.userId);
    if (monthlyCount >= REFERRAL_MONTHLY_LIMIT) {
      throw new HttpError(429, "Referrer has reached monthly limit");
    }

    await createReferral({
      referrerId: codeDoc.userId,
      refereeId,
      code,
      status: "pending",
    });

    return {
      ok: true,
      referrerId: codeDoc.userId,
      xpReward: REFERRAL_REWARD_XP_REFEREE,
    };
  },
});

import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import {
  buildReferralLink,
  generateReferralCode,
  REFERRAL_MONTHLY_LIMIT,
  REFERRAL_REWARD_XP_REFEREE,
} from "@/lib/referral/constants";
import {
  createReferralCode,
  getReferralCode,
  getReferralCountThisMonth,
  getReferralsByReferrer,
} from "@/lib/referral/service";
import { getAuthenticatedUserName } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const GET = withRateLimit(
  createRouteHandler({
    auth: "required",
    execute: async ({ userId }) => {
      if (!userId) throw new HttpError(401, "Not authenticated");
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
          throw new HttpError(500, "Failed to create referral code");
        }
        codeDoc = fresh;
      }

      const [referrals, monthlyCount] = await Promise.all([
        getReferralsByReferrer(userId),
        getReferralCountThisMonth(userId),
      ]);

      return {
        code: codeDoc.code,
        link: buildReferralLink(codeDoc.code),
        monthlyCount,
        monthlyLimit: REFERRAL_MONTHLY_LIMIT,
        xpReward: REFERRAL_REWARD_XP_REFEREE,
        referrals: referrals.map((r) => ({
          refereeId: r.refereeId,
          status: r.status,
          rewardedAt: r.rewardedAt ?? null,
          createdAt: r.createdAt,
        })),
      };
    },
    errorLabel: "Referral info",
  }),
  { max: 10, windowMs: 60000 },
);

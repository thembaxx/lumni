import { Query } from "appwrite";
import { type NextRequest, NextResponse } from "next/server";
import { databases, serverAccount } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { REFERRAL_REWARD_XP_REFEREE, REFERRAL_REWARD_XP_REFERRER } from "@/lib/referral/constants";
import { getReferralByReferee, updateReferralStatus } from "@/lib/referral/service";
import { logError } from "@/lib/shared/logger";

async function awardReferralXp(userId: string, amount: number): Promise<void> {
  try {
    const docs = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.USER_GAMIFICATION,
      [Query.equal("userId", userId), Query.limit(1)],
    );
    if (docs.documents.length > 0) {
      const doc = docs.documents[0];
      const currentXp = (doc.totalXp as number) || 0;
      await databases.updateDocument(APPWRITE_DATABASE_ID, COLLECTIONS.USER_GAMIFICATION, doc.$id, {
        totalXp: currentXp + amount,
      });
    }
  } catch (err) {
    logError("ReferralXpAward", err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    if (!userId || !secret) {
      return NextResponse.redirect(new URL("/settings?error=missing_params", request.url));
    }

    await serverAccount.updateVerification(userId, secret);

    const referral = await getReferralByReferee(userId);
    if (referral && referral.status === "pending") {
      await updateReferralStatus(userId, "rewarded");

      await Promise.all([
        awardReferralXp(userId, REFERRAL_REWARD_XP_REFEREE),
        awardReferralXp(referral.referrerId, REFERRAL_REWARD_XP_REFERRER),
      ]);

      return NextResponse.redirect(
        new URL(
          `/settings?verified=true&xpReward=${REFERRAL_REWARD_XP_REFEREE}&rewarded_by=${referral.referrerId}`,
          request.url,
        ),
      );
    }

    return NextResponse.redirect(new URL("/settings?verified=true", request.url));
  } catch (error) {
    logError("EmailVerification", error);
    return NextResponse.redirect(new URL("/settings?error=verification_failed", request.url));
  }
}

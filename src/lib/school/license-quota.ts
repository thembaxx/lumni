import { Query } from "appwrite";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/constants";
import { logError } from "@/lib/shared/logger";
import { dailyCallTracker } from "@/lib/ai/daily-call-tracker";
import { PRICING } from "./pricing";
import type { LicenseTier } from "./pricing";

export async function getUserLicenseTier(userId: string): Promise<LicenseTier | null> {
  try {
    const memberRes = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.SCHOOL_MEMBERS,
      [Query.equal("userId", userId), Query.equal("status", "active"), Query.limit(1)],
    );

    if (memberRes.total === 0) return null;

    const schoolId = memberRes.documents[0].schoolId as string;

    const schoolDoc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.SCHOOLS,
      schoolId,
    );

    const tier = schoolDoc.licenseTier as string;
    if (tier === "free" || tier === "standard" || tier === "premium") {
      return tier;
    }
    return null;
  } catch (err) {
    logError("LicenseQuota.getUserLicenseTier", err, { userId });
    return null;
  }
}

export async function getTodayGenerateCount(userId: string): Promise<number> {
  try {
    const usage = await dailyCallTracker.getUsage(userId);
    return usage.generate?.count ?? 0;
  } catch (err) {
    logError("LicenseQuota.getTodayGenerateCount", err, { userId });
    return 0;
  }
}

export async function getSchoolTierDailyLimit(tier: LicenseTier | null): Promise<number> {
  if (!tier) return PRICING.free.aiQuestionsPerDay;
  return PRICING[tier].aiQuestionsPerDay;
}

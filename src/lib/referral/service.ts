import { Query } from "appwrite";
import { databases } from "@/lib/appwrite";
import {
	APPWRITE_DATABASE_ID,
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import type { ReferralCodeDoc, ReferralDoc, ReferralStatus } from "./types";

export async function getReferralCode(
	userId: string,
): Promise<ReferralCodeDoc | null> {
	const docs = await listDocuments<ReferralCodeDoc>(
		COLLECTIONS.REFERRAL_CODES,
		[Query.equal("userId", userId), Query.limit(1)],
	);
	return docs[0] ?? null;
}

export async function createReferralCode(data: {
	userId: string;
	code: string;
}): Promise<string> {
	return createDocument(COLLECTIONS.REFERRAL_CODES, {
		userId: data.userId,
		code: data.code,
		createdAt: new Date().toISOString(),
	});
}

export async function getReferralByCode(
	code: string,
): Promise<ReferralCodeDoc | null> {
	const docs = await listDocuments<ReferralCodeDoc>(
		COLLECTIONS.REFERRAL_CODES,
		[Query.equal("code", code), Query.limit(1)],
	);
	return docs[0] ?? null;
}

export async function getReferralsByReferrer(
	referrerId: string,
): Promise<ReferralDoc[]> {
	return listDocuments<ReferralDoc>(COLLECTIONS.REFERRALS, [
		Query.equal("referrerId", referrerId),
		Query.orderDesc("$createdAt"),
	]);
}

export async function getReferralCountThisMonth(
	referrerId: string,
): Promise<number> {
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const docs = await listDocuments<ReferralDoc>(COLLECTIONS.REFERRALS, [
		Query.equal("referrerId", referrerId),
		Query.greaterThan("$createdAt", startOfMonth.toISOString()),
	]);
	return docs.length;
}

export async function createReferral(data: {
	referrerId: string;
	refereeId: string;
	code: string;
	status: ReferralStatus;
}): Promise<string> {
	return createDocument(COLLECTIONS.REFERRALS, {
		referrerId: data.referrerId,
		refereeId: data.refereeId,
		code: data.code,
		status: data.status,
		createdAt: new Date().toISOString(),
	});
}

export async function updateReferralStatus(
	refereeId: string,
	status: ReferralStatus,
): Promise<void> {
	const docs = await listDocuments<ReferralDoc>(COLLECTIONS.REFERRALS, [
		Query.equal("refereeId", refereeId),
		Query.limit(1),
	]);
	if (docs[0]) {
		await updateDocument(COLLECTIONS.REFERRALS, docs[0].$id, {
			status,
			rewardedAt: status === "rewarded" ? new Date().toISOString() : undefined,
		});
	}
}

export async function getReferralByReferee(
	refereeId: string,
): Promise<ReferralDoc | null> {
	const docs = await listDocuments<ReferralDoc>(COLLECTIONS.REFERRALS, [
		Query.equal("refereeId", refereeId),
		Query.limit(1),
	]);
	return docs[0] ?? null;
}

export async function getReferrerCodeForUserId(
	userId: string,
): Promise<string | null> {
	const codeDoc = await getReferralCode(userId);
	return codeDoc?.code ?? null;
}

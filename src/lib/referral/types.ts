export type ReferralStatus = "pending" | "rewarded" | "expired";

export type ReferralCodeDoc = {
	$id: string;
	userId: string;
	code: string;
	createdAt: string;
};

export type ReferralDoc = {
	$id: string;
	referrerId: string;
	refereeId: string;
	code: string;
	status: ReferralStatus;
	rewardedAt?: string;
	createdAt: string;
};

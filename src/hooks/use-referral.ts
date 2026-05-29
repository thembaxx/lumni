"use client";

import { useCallback, useEffect, useState } from "react";

export interface ReferralInfo {
	code: string;
	link: string;
	monthlyCount: number;
	monthlyLimit: number;
	rewardDays: number;
	referrals: Array<{
		refereeId: string;
		status: string;
		rewardedAt: string | null;
		createdAt: string;
	}>;
}

interface UseReferralReturn {
	info: ReferralInfo | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	share: () => Promise<void>;
}

export function useReferral(): UseReferralReturn {
	const [info, setInfo] = useState<ReferralInfo | null>(null);
	const [hasLoaded, setHasLoaded] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchInfo = useCallback(async () => {
		try {
			setHasLoaded(false);
			setError(null);
			const res = await fetch("/api/referral/info");
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to load referral info");
			}
			const data = await res.json();
			setInfo(data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setHasLoaded(true);
		}
	}, []);

	useEffect(() => {
		fetchInfo();
	}, [fetchInfo]);

	const isLoading = !hasLoaded;

	const share = useCallback(async () => {
		if (!info) return;
		if (navigator.share) {
			await navigator.share({
				title: "Join me on Lumni",
				text: `Study with me on Lumni! Use my referral code ${info.code} or sign up here:`,
				url: info.link,
			});
		} else {
			await navigator.clipboard.writeText(info.link);
		}
	}, [info]);

	return { info, isLoading, error, refetch: fetchInfo, share };
}

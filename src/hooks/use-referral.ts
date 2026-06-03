"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

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

async function fetchReferralInfo(): Promise<ReferralInfo> {
	const res = await fetch("/api/referral/info");
	if (!res.ok) {
		const data = await res.json();
		throw new Error(data.error || "Failed to load referral info");
	}
	return res.json();
}

export function useReferral(): UseReferralReturn {
	const { data, isPending, error, refetch } = useQuery({
		queryKey: ["referral-info"],
		queryFn: fetchReferralInfo,
	});

	const info = data ?? null;
	const isLoading = isPending;

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

	return {
		info,
		isLoading,
		error: error instanceof Error ? error.message : null,
		refetch: async () => {
			await refetch();
		},
		share,
	};
}

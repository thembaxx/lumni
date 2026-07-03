"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

const REFERRAL_STORAGE_KEY = "lumni_referral_source";

export interface ReferralInfo {
  code: string;
  link: string;
  monthlyCount: number;
  monthlyLimit: number;
  xpReward: number;
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
  referralSource: string | null;
}

async function fetchReferralInfo(): Promise<ReferralInfo | null> {
  const res = await fetch("/api/referral/info");
  if (res.status === 401) return null;
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to load referral info");
  }
  return res.json();
}

function readReferralFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("ref");
}

function persistReferralSource(code: string): void {
  try {
    const existing = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    }
  } catch {
    /* localStorage unavailable */
  }
}

function getStoredReferralSource(): string | null {
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function useReferral(): UseReferralReturn {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ["referral-info"],
    queryFn: fetchReferralInfo,
  });

  useEffect(() => {
    const refCode = readReferralFromUrl();
    if (refCode) {
      persistReferralSource(refCode);
    }
  }, []);

  const info = data ?? null;
  const isLoading = isPending;
  const referralSource = getStoredReferralSource();

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
    referralSource,
  };
}

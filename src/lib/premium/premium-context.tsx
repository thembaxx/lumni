"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createContext, use, useCallback, useEffect, useState } from "react";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

const PREMIUM_KEY = "lumni_premium_status";

export interface PremiumState {
	isPremium: boolean;
	expiresAt: number | null;
	features: PremiumFeature[];
}

export type PremiumFeature =
	| "ai-tutor"
	| "advanced-analytics"
	| "unlimited-flashcards"
	| "custom-study-plans"
	| "exam-simulator"
	| "priority-support";

const FREE_FEATURES: PremiumFeature[] = ["ai-tutor", "unlimited-flashcards"];

const PREMIUM_FEATURES: PremiumFeature[] = [
	"ai-tutor",
	"advanced-analytics",
	"unlimited-flashcards",
	"custom-study-plans",
	"exam-simulator",
	"priority-support",
];

const STRIPE_PRICE_ID = "price_premium_yearly";

interface PremiumContextValue {
	isPremium: boolean;
	features: PremiumFeature[];
	hasFeature: (feature: PremiumFeature) => boolean;
	upgrade: () => Promise<void>;
	downgrade: () => Promise<void>;
	createCheckoutSession: () => Promise<string | null>;
	cancelSubscription: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumContextValue>({
	isPremium: false,
	features: FREE_FEATURES,
	hasFeature: () => false,
	upgrade: async () => {},
	downgrade: async () => {},
	createCheckoutSession: async () => null,
	cancelSubscription: async () => false,
});

const CHECKOUT_API = "/api/premium/checkout";
const CANCEL_API = "/api/premium/cancel";
const VERIFY_API = "/api/premium/verify";

export function PremiumProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<PremiumState>(() => {
		const saved = loadFromStorage<PremiumState>(PREMIUM_KEY, {
			isPremium: false,
			expiresAt: null,
			features: FREE_FEATURES,
		});
		if (saved.expiresAt && Date.now() > saved.expiresAt) {
			return { isPremium: false, expiresAt: null, features: FREE_FEATURES };
		}
		return saved;
	});

	useEffect(() => {
		saveToStorage(PREMIUM_KEY, state);
	}, [state]);

	const queryClient = useQueryClient();

	const { mutate: verifyPremium } = useMutation({
		mutationFn: async () => {
			await fetch(VERIFY_API, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ isPremium: state.isPremium }),
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["premium"] });
		},
	});

	useEffect(() => {
		if (state.isPremium && state.expiresAt) {
			verifyPremium();
		}
	}, [state.isPremium, state.expiresAt, verifyPremium]);

	const hasFeature = (feature: PremiumFeature): boolean => {
		return state.features.includes(feature);
	};

	const createCheckoutSession = useCallback(async (): Promise<
		string | null
	> => {
		try {
			const res = await fetch(CHECKOUT_API, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ priceId: STRIPE_PRICE_ID }),
			});
			if (!res.ok) return null;
			const data = await res.json();
			if (data.url) {
				return data.url;
			}
			return null;
		} catch {
			return null;
		}
	}, []);

	const upgrade = useCallback(async () => {
		const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
		setState({
			isPremium: true,
			expiresAt,
			features: PREMIUM_FEATURES,
		});
	}, []);

	const cancelSubscription = useCallback(async (): Promise<boolean> => {
		try {
			const res = await fetch(CANCEL_API, { method: "POST" });
			return res.ok;
		} catch {
			return false;
		}
	}, []);

	const downgrade = useCallback(async () => {
		setState({
			isPremium: false,
			expiresAt: null,
			features: FREE_FEATURES,
		});
	}, []);

	return (
		<PremiumContext.Provider
			value={{
				isPremium: state.isPremium,
				features: state.features,
				hasFeature,
				upgrade,
				downgrade,
				createCheckoutSession,
				cancelSubscription,
			}}
		>
			{children}
		</PremiumContext.Provider>
	);
}

export function usePremium(): PremiumContextValue {
	return use(PremiumContext);
}

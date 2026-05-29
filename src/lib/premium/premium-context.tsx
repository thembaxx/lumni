"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";

const PREMIUM_KEY = "lumni_premium_status";

export interface PremiumState {
	isPremium: boolean;
	expiresAt: number | null;
	features: PremiumFeature[];
	subscriptionId?: string;
}

export type PremiumFeature =
	| "ai-tutor"
	| "advanced-analytics"
	| "unlimited-flashcards"
	| "custom-study-plans"
	| "exam-simulator"
	| "priority-support"
	| "offline-quiz-packs"
	| "problem-library"
	| "visual-engine";

const FREE_FEATURES: PremiumFeature[] = ["ai-tutor", "unlimited-flashcards"];

const PREMIUM_FEATURES: PremiumFeature[] = [
	"ai-tutor",
	"advanced-analytics",
	"unlimited-flashcards",
	"custom-study-plans",
	"exam-simulator",
	"priority-support",
	"offline-quiz-packs",
	"problem-library",
	"visual-engine",
];

const YEARLY_PRICE_ID = "price_premium_yearly";
const MONTHLY_PRICE_ID = "price_premium_monthly";

interface PremiumContextValue {
	isPremium: boolean;
	features: PremiumFeature[];
	subscriptionId?: string;
	hasFeature: (feature: PremiumFeature) => boolean;
	upgrade: () => Promise<void>;
	downgrade: () => Promise<void>;
	createCheckoutSession: (
		billing?: "monthly" | "yearly",
	) => Promise<string | null>;
	createPayfastCheckoutSession: (billing?: "monthly" | "yearly") => Promise<{
		url: string;
		data: Record<string, string>;
	} | null>;
	cancelSubscription: () => Promise<boolean>;
	syncPremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextValue>({
	isPremium: false,
	features: FREE_FEATURES,
	hasFeature: () => false,
	upgrade: async () => {},
	downgrade: async () => {},
	createCheckoutSession: async () => null,
	createPayfastCheckoutSession: async () => null,
	cancelSubscription: async () => false,
	syncPremium: async () => {},
});

const CHECKOUT_API = "/api/premium/checkout";
const CANCEL_API = "/api/premium/cancel";
const VERIFY_API = "/api/premium/verify";
const PAYFAST_CHECKOUT_API = "/api/payfast/checkout";

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
			const res = await fetch(VERIFY_API, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			if (!res.ok) return null;
			return res.json() as Promise<{
				verified: boolean;
				isPremium: boolean;
				subscriptionId?: string;
				expiresAt?: string;
			}>;
		},
		onSuccess: (data) => {
			if (!data) return;
			if (data.isPremium) {
				setState((prev) => ({
					...prev,
					isPremium: true,
					features: PREMIUM_FEATURES,
					subscriptionId: data.subscriptionId || prev.subscriptionId,
					expiresAt: data.expiresAt
						? new Date(data.expiresAt).getTime()
						: prev.expiresAt,
				}));
			} else if (state.isPremium) {
				setState({
					isPremium: false,
					expiresAt: null,
					features: FREE_FEATURES,
				});
			}
			queryClient.invalidateQueries({ queryKey: ["premium"] });
		},
	});

	useEffect(() => {
		verifyPremium();
	}, [verifyPremium]);

	const features = state.isPremium ? PREMIUM_FEATURES : FREE_FEATURES;

	const syncPremium = useCallback(async () => {
		verifyPremium();
	}, [verifyPremium]);

	const hasFeature = useCallback(
		(feature: PremiumFeature): boolean => features.includes(feature),
		[features],
	);

	const createCheckoutSession = useCallback(
		async (
			billing: "monthly" | "yearly" = "yearly",
		): Promise<string | null> => {
			try {
				const priceId =
					billing === "monthly" ? MONTHLY_PRICE_ID : YEARLY_PRICE_ID;
				const res = await fetch(CHECKOUT_API, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ priceId, billing }),
				});
				if (!res.ok) return null;
				const data = await res.json();
				return data.url ?? null;
			} catch {
				return null;
			}
		},
		[],
	);

	const createPayfastCheckoutSession = useCallback(
		async (
			billing: "monthly" | "yearly" = "yearly",
		): Promise<{
			url: string;
			data: Record<string, string>;
		} | null> => {
			try {
				const amount = billing === "monthly" ? "99.00" : "999.00";
				const itemName =
					billing === "monthly"
						? "Lumni Premium Monthly"
						: "Lumni Premium Yearly";
				const res = await fetch(PAYFAST_CHECKOUT_API, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ amount, item_name: itemName, billing }),
				});
				if (!res.ok) return null;
				return await res.json();
			} catch {
				return null;
			}
		},
		[],
	);

	const upgrade = useCallback(async () => {
		const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
		setState({
			isPremium: true,
			expiresAt,
			features: PREMIUM_FEATURES,
		});
	}, []);

	const cancelSubscription = useCallback(async (): Promise<boolean> => {
		if (!state.subscriptionId) return false;
		try {
			const res = await fetch(CANCEL_API, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subscriptionId: state.subscriptionId }),
			});
			return res.ok;
		} catch {
			return false;
		}
	}, [state.subscriptionId]);

	const downgrade = useCallback(async () => {
		setState({
			isPremium: false,
			expiresAt: null,
			features: FREE_FEATURES,
		});
	}, []);

	const contextValue = useMemo(
		() => ({
			isPremium: state.isPremium,
			features,
			subscriptionId: state.subscriptionId,
			hasFeature,
			upgrade,
			downgrade,
			createCheckoutSession,
			createPayfastCheckoutSession,
			cancelSubscription,
			syncPremium,
		}),
		[
			state.isPremium,
			features,
			state.subscriptionId,
			hasFeature,
			upgrade,
			downgrade,
			createCheckoutSession,
			createPayfastCheckoutSession,
			cancelSubscription,
			syncPremium,
		],
	);

	return (
		<PremiumContext.Provider value={contextValue}>
			{children}
		</PremiumContext.Provider>
	);
}

export function usePremium(): PremiumContextValue {
	return use(PremiumContext);
}

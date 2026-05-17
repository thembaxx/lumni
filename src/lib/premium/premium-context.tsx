"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

const FREE_FEATURES: PremiumFeature[] = [
	"ai-tutor",
	"unlimited-flashcards",
];

const PREMIUM_FEATURES: PremiumFeature[] = [
	"ai-tutor",
	"advanced-analytics",
	"unlimited-flashcards",
	"custom-study-plans",
	"exam-simulator",
	"priority-support",
];

interface PremiumContextValue {
	isPremium: boolean;
	features: PremiumFeature[];
	hasFeature: (feature: PremiumFeature) => boolean;
	upgrade: () => void;
	downgrade: () => void;
}

const PremiumContext = createContext<PremiumContextValue>({
	isPremium: false,
	features: FREE_FEATURES,
	hasFeature: () => false,
	upgrade: () => {},
	downgrade: () => {},
});

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

	const hasFeature = (feature: PremiumFeature): boolean => {
		return state.features.includes(feature);
	};

	const upgrade = () => {
		const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
		setState({
			isPremium: true,
			expiresAt,
			features: PREMIUM_FEATURES,
		});
	};

	const downgrade = () => {
		setState({
			isPremium: false,
			expiresAt: null,
			features: FREE_FEATURES,
		});
	};

	return (
		<PremiumContext.Provider
			value={{
				isPremium: state.isPremium,
				features: state.features,
				hasFeature,
				upgrade,
				downgrade,
			}}
		>
			{children}
		</PremiumContext.Provider>
	);
}

export function usePremium(): PremiumContextValue {
	return useContext(PremiumContext);
}

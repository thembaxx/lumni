"use client";

import {
	createContext,
	use,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { setDataSharingConsent } from "@/lib/consent/ai-gate";
import { setAnalyticsConsent } from "@/lib/consent/sentry-gate";
import { userConsentService } from "@/lib/services/user-consent-service";
import type { UserConsent } from "@/types/user-consent";
import { appConfig } from "../../../app.config";

export type ConsentState = {
	consent: UserConsent | null;
	isLoading: boolean;
	needsTosAcceptance: boolean;
};

export type ConsentContextValue = ConsentState & {
	updateConsent: (
		partial: Partial<
			Pick<
				UserConsent,
				| "analytics"
				| "marketing"
				| "dataSharing"
				| "tosVersion"
				| "privacyVersion"
			>
		>,
	) => Promise<void>;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();
	const [state, setState] = useState<ConsentState>({
		consent: null,
		isLoading: true,
		needsTosAcceptance: false,
	});
	const prevAnalytics = useRef<boolean | undefined>(undefined);
	const prevDataSharing = useRef<boolean | undefined>(undefined);

	const userId: string | undefined = user?.$id;

	useEffect(() => {
		if (!userId) {
			setState({ consent: null, isLoading: false, needsTosAcceptance: false });
			setAnalyticsConsent(false);
			setDataSharingConsent(false);
			prevAnalytics.current = undefined;
			prevDataSharing.current = undefined;
			return;
		}

		let cancelled = false;

		async function load() {
			const existing = await userConsentService.get(userId as string);
			if (cancelled) return;

			const currentTos = appConfig.legal.tosVersion;
			const _currentPrivacy = appConfig.legal.privacyVersion;

			const needsTosAcceptance =
				!existing?.tosVersion || existing.tosVersion !== currentTos;

			const analytics = existing?.analytics ?? false;
			if (analytics !== prevAnalytics.current) {
				setAnalyticsConsent(analytics);
				prevAnalytics.current = analytics;
			}

			const dataSharing = existing?.dataSharing ?? false;
			if (dataSharing !== prevDataSharing.current) {
				setDataSharingConsent(dataSharing);
				prevDataSharing.current = dataSharing;
			}

			setState({
				consent: existing,
				isLoading: false,
				needsTosAcceptance,
			});
		}

		load();

		return () => {
			cancelled = true;
		};
	}, [userId]);

	const updateConsent = useCallback(
		async (
			partial: Partial<
				Pick<
					UserConsent,
					| "analytics"
					| "marketing"
					| "dataSharing"
					| "tosVersion"
					| "privacyVersion"
				>
			>,
		) => {
			if (!userId) return;
			const updated = await userConsentService.save(userId, partial);

			const currentTos = appConfig.legal.tosVersion;
			const _currentPrivacy = appConfig.legal.privacyVersion;

			const needsTosAcceptance =
				!updated.tosVersion || updated.tosVersion !== currentTos;

			if (updated.analytics !== prevAnalytics.current) {
				setAnalyticsConsent(updated.analytics);
				prevAnalytics.current = updated.analytics;
			}

			if (updated.dataSharing !== prevDataSharing.current) {
				setDataSharingConsent(updated.dataSharing);
				prevDataSharing.current = updated.dataSharing;
			}

			setState({
				consent: updated,
				isLoading: false,
				needsTosAcceptance,
			});
		},
		[userId],
	);

	return (
		<ConsentContext
			value={{
				...state,
				updateConsent,
			}}
		>
			{children}
		</ConsentContext>
	);
}

export function useConsent(): ConsentContextValue {
	const ctx = use(ConsentContext);
	if (!ctx) {
		throw new Error("useConsent must be used within a ConsentProvider");
	}
	return ctx;
}

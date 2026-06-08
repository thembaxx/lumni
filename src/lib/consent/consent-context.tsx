"use client";

import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { updateDataSharingConsent } from "@/lib/consent/ai-gate";
import { updateAnalyticsConsent } from "@/lib/consent/sentry-gate";
import { userConsentService } from "@/lib/services/user-consent-service";
import type { UserConsent } from "@/types/user-consent";
import { appConfig } from "../../../app.config";

function nowISO(): string {
	return new Date().toISOString();
}

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

const anonymousConsentCache = new Map<string, UserConsent>();

export function ConsentProvider({ children }: { children: React.ReactNode }) {
	const { user } = useAuth();
	const [state, setState] = useState<ConsentState>({
		consent: null,
		isLoading: true,
		needsTosAcceptance: false,
	});
	const userId: string | undefined = user?.$id;

	useEffect(() => {
		if (!userId) {
			const cached = anonymousConsentCache.get("default");
			if (cached) {
				setState({
					consent: cached,
					isLoading: false,
					needsTosAcceptance: true,
				});
				updateAnalyticsConsent(cached.analytics);
				updateDataSharingConsent(cached.dataSharing);
			} else {
				setState({
					consent: null,
					isLoading: false,
					needsTosAcceptance: false,
				});
				updateAnalyticsConsent(false);
				updateDataSharingConsent(false);
			}
			return;
		}

		let cancelled = false;

		async function load() {
			let existing = await userConsentService.get(userId as string);
			if (cancelled) return;

			const cached = anonymousConsentCache.get("default");
			if (!existing && cached) {
				existing = await userConsentService.save(userId as string, {
					analytics: cached.analytics,
					marketing: cached.marketing,
					dataSharing: cached.dataSharing,
				});
				anonymousConsentCache.delete("default");
			}

			const currentTos = appConfig.legal.tosVersion;
			const _currentPrivacy = appConfig.legal.privacyVersion;

			const needsTosAcceptance =
				!existing?.tosVersion || existing.tosVersion !== currentTos;

			updateAnalyticsConsent(existing?.analytics ?? false);
			updateDataSharingConsent(existing?.dataSharing ?? false);

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
			const now = nowISO();

			if (userId) {
				const updated = await userConsentService.save(userId, partial);

				updateAnalyticsConsent(updated.analytics);
				updateDataSharingConsent(updated.dataSharing);

				setState({
					consent: updated,
					isLoading: false,
					needsTosAcceptance:
						!updated.tosVersion ||
						updated.tosVersion !== appConfig.legal.tosVersion,
				});
			} else {
				const local: UserConsent = {
					userId: "anonymous",
					analytics: partial.analytics ?? false,
					marketing: partial.marketing ?? false,
					dataSharing: partial.dataSharing ?? false,
					tosVersion: null,
					tosAcceptedAt: null,
					privacyVersion: null,
					privacyAcknowledgedAt: null,
					updatedAt: now,
					createdAt: now,
				};

				anonymousConsentCache.set("default", local);

				updateAnalyticsConsent(local.analytics);
				updateDataSharingConsent(local.dataSharing);

				setState({
					consent: local,
					isLoading: false,
					needsTosAcceptance: true,
				});
			}
		},
		[userId],
	);

	const value = useMemo(
		() => ({
			...state,
			updateConsent,
		}),
		[state, updateConsent],
	);

	return <ConsentContext value={value}>{children}</ConsentContext>;
}

export function useConsent(): ConsentContextValue {
	const ctx = use(ConsentContext);
	if (!ctx) {
		throw new Error("useConsent must be used within a ConsentProvider");
	}
	return ctx;
}

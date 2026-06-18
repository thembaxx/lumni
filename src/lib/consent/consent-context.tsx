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
import { logError } from "@/lib/shared/logger";
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

const ANONYMOUS_STORAGE_KEY = "lumni-consent";
const anonymousConsentCache = new Map<string, UserConsent>();

function readAnonymousConsent(): UserConsent | null {
	try {
		const raw = localStorage.getItem(ANONYMOUS_STORAGE_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as UserConsent;
	} catch {
		return null;
	}
}

function writeAnonymousConsent(consent: UserConsent): void {
	try {
		localStorage.setItem(ANONYMOUS_STORAGE_KEY, JSON.stringify(consent));
	} catch (e) {
		logError("ConsentPersist.write", e);
	}
}

function clearAnonymousConsent(): void {
	try {
		localStorage.removeItem(ANONYMOUS_STORAGE_KEY);
	} catch (e) {
		logError("ConsentPersist.clear", e);
	}
}

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
			const cached =
				anonymousConsentCache.get("default") ?? readAnonymousConsent();
			if (cached) {
				anonymousConsentCache.set("default", cached);
				setState({
					consent: cached,
					isLoading: false,
					needsTosAcceptance:
						!cached.tosVersion ||
						cached.tosVersion !== appConfig.legal.tosVersion,
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

			const cached =
				anonymousConsentCache.get("default") ?? readAnonymousConsent();
			if (!existing && cached) {
				existing = await userConsentService.save(userId as string, {
					analytics: cached.analytics,
					marketing: cached.marketing,
					dataSharing: cached.dataSharing,
				});
				anonymousConsentCache.delete("default");
				clearAnonymousConsent();
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
				const cached = anonymousConsentCache.get("default");

				const local: UserConsent = {
					userId: "anonymous",
					analytics: partial.analytics ?? cached?.analytics ?? false,
					marketing: partial.marketing ?? cached?.marketing ?? false,
					dataSharing: partial.dataSharing ?? cached?.dataSharing ?? false,
					tosVersion: partial.tosVersion ?? cached?.tosVersion ?? null,
					tosAcceptedAt:
						partial.tosVersion && partial.tosVersion !== cached?.tosVersion
							? now
							: (cached?.tosAcceptedAt ?? null),
					privacyVersion: null,
					privacyAcknowledgedAt: null,
					updatedAt: now,
					createdAt: cached?.createdAt ?? now,
				};

				anonymousConsentCache.set("default", local);
				writeAnonymousConsent(local);

				updateAnalyticsConsent(local.analytics);
				updateDataSharingConsent(local.dataSharing);

				setState({
					consent: local,
					isLoading: false,
					needsTosAcceptance:
						!local.tosVersion ||
						local.tosVersion !== appConfig.legal.tosVersion,
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

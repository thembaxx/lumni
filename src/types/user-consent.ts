export interface UserConsent {
	userId: string;
	analytics: boolean;
	marketing: boolean;
	dataSharing: boolean;
	tosVersion: string | null;
	tosAcceptedAt: string | null;
	privacyVersion: string | null;
	privacyAcknowledgedAt: string | null;
	updatedAt: string;
	createdAt: string;
}

export const DEFAULT_USER_CONSENT: Omit<
	UserConsent,
	"userId" | "createdAt" | "updatedAt"
> = {
	analytics: false,
	marketing: false,
	dataSharing: false,
	tosVersion: null,
	tosAcceptedAt: null,
	privacyVersion: null,
	privacyAcknowledgedAt: null,
};

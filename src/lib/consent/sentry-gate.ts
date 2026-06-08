import { userConsentService } from "@/lib/services/user-consent-service";

let _analyticsConsent = false;

export function getAnalyticsConsent(): boolean {
	return _analyticsConsent;
}

export function updateAnalyticsConsent(granted: boolean): void {
	_analyticsConsent = granted;
}

async function _syncAnalyticsConsentFromService(userId: string): Promise<void> {
	const record = await userConsentService.get(userId);
	_analyticsConsent = record?.analytics ?? false;
}

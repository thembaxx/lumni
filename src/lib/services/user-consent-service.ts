import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import { enqueue } from "@/lib/orchestrator/job-queue";
import type { UserConsent } from "@/types/user-consent";

function nowISO(): string {
	return new Date().toISOString();
}

export class UserConsentService {
	async get(userId: string): Promise<UserConsent | null> {
		return (await dexieDataAccess.userConsents.get(userId)) ?? null;
	}

	async save(
		userId: string,
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
	): Promise<UserConsent> {
		const existing = await dexieDataAccess.userConsents.get(userId);
		const now = nowISO();

		const record: UserConsent = {
			userId,
			analytics: partial.analytics ?? existing?.analytics ?? false,
			marketing: partial.marketing ?? existing?.marketing ?? false,
			dataSharing: partial.dataSharing ?? existing?.dataSharing ?? false,
			tosVersion: partial.tosVersion ?? existing?.tosVersion ?? null,
			tosAcceptedAt:
				partial.tosVersion && partial.tosVersion !== existing?.tosVersion
					? now
					: (existing?.tosAcceptedAt ?? null),
			privacyVersion:
				partial.privacyVersion ?? existing?.privacyVersion ?? null,
			privacyAcknowledgedAt:
				partial.privacyVersion &&
				partial.privacyVersion !== existing?.privacyVersion
					? now
					: (existing?.privacyAcknowledgedAt ?? null),
			updatedAt: now,
			createdAt: existing?.createdAt ?? now,
		};

		await dexieDataAccess.userConsents.put(record);

		await enqueue("appwrite-consent-sync", {
			userId,
			record,
		});

		return record;
	}

	async delete(userId: string): Promise<void> {
		await dexieDataAccess.userConsents.delete(userId);
	}
}

export const userConsentService = new UserConsentService();

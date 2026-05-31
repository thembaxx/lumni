import { offlineDB } from "@/lib/db/schema";
import { enqueue } from "@/lib/orchestrator/job-queue";
import type { UserConsent } from "@/types/user-consent";

function nowISO(): string {
	return new Date().toISOString();
}

export class UserConsentService {
	private get db() {
		return offlineDB;
	}

	async get(userId: string): Promise<UserConsent | null> {
		return (await this.db.userConsents.get(userId)) ?? null;
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
		const existing = await this.db.userConsents.get(userId);
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

		await this.db.userConsents.put(record);

		await enqueue("appwrite-consent-sync", {
			userId,
			record,
		});

		return record;
	}

	async delete(userId: string): Promise<void> {
		await this.db.userConsents.delete(userId);
	}
}

export const userConsentService = new UserConsentService();

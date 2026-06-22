import type { DataAccess } from "@/lib/db/data-access";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import { enqueue } from "@/lib/orchestrator/job-queue";

import type { UserConsent } from "@/types/user-consent";

export interface UserConsentDependencies {
  db: DataAccess;
  enqueue: (type: string, payload: Record<string, unknown>) => Promise<unknown>;
}

const DEFAULT_DEPS: UserConsentDependencies = {
  db: dexieDataAccess,
  enqueue: enqueue as UserConsentDependencies["enqueue"],
};

function nowISO(): string {
  return new Date().toISOString();
}

class UserConsentService {
  private db: UserConsentDependencies["db"];
  private enqueueFn: UserConsentDependencies["enqueue"];

  constructor(deps?: Partial<UserConsentDependencies>) {
    const resolved = { ...DEFAULT_DEPS, ...deps };
    this.db = resolved.db;
    this.enqueueFn = resolved.enqueue;
  }

  async get(userId: string): Promise<UserConsent | null> {
    return (await this.db.userConsents.get(userId)) ?? null;
  }

  async save(
    userId: string,
    partial: Partial<
      Pick<UserConsent, "analytics" | "marketing" | "dataSharing" | "tosVersion" | "privacyVersion">
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
      privacyVersion: partial.privacyVersion ?? existing?.privacyVersion ?? null,
      privacyAcknowledgedAt:
        partial.privacyVersion && partial.privacyVersion !== existing?.privacyVersion
          ? now
          : (existing?.privacyAcknowledgedAt ?? null),
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    };

    await this.db.userConsents.put(record);

    await this.enqueueFn("appwrite-consent-sync", {
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

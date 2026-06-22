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

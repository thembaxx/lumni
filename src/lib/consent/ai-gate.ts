import { userConsentService } from "@/lib/services";

let _dataSharingConsent = false;

export function getDataSharingConsent(): boolean {
  return _dataSharingConsent;
}

export function updateDataSharingConsent(granted: boolean): void {
  _dataSharingConsent = granted;
}

export async function syncDataSharingConsentFromService(userId: string): Promise<void> {
  const record = await userConsentService.get(userId);
  _dataSharingConsent = record?.dataSharing ?? false;
}

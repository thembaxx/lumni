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

export async function getDataSharingConsentForUser(userId: string): Promise<boolean> {
  try {
    await syncDataSharingConsentFromService(userId);
    return _dataSharingConsent;
  } catch {
    return false;
  }
}

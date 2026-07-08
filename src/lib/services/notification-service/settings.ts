import { loadFromStorage } from "@/lib/utils/storage";
import { DEFAULT_SETTINGS, NOTIF_SETTINGS_KEY } from "./types";
import type { NotificationSettings } from "./types";

export function getSettings(): NotificationSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...loadFromStorage<Partial<NotificationSettings>>(NOTIF_SETTINGS_KEY, {}),
  };
}
